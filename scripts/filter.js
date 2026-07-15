/**
 * @fileoverview 사용자의 검색어, 기간, 우선순위, 정렬 상태에 따라 할 일(Todo) 목록을
 * 필터링하여 동적으로 렌더링하고, 설정 값을 LocalStorage에 저장하여 유지하는 모듈입니다.
 */

import { getTasks, renderTodos, openResetModal } from "./modal.js";

/**
 * 필터 및 검색 설정을 브라우저 LocalStorage에 영구 저장하기 위한 키 값입니다.
 * @type {string}
 */
const STORAGE_KEY = "flowdash-filter-settings";

/**
 * LocalStorage로부터 로드된 이전 필터 설정 객체입니다.
 * @type {Object}
 */
const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

/**
 * [필터 UI 영역] 검색, 정렬 및 드롭다운 제어를 위한 DOM 요소 참조 세트입니다.
 */
const searchInput = document.querySelector(".search-input");
const resetFilterButton = document.querySelector(".reset-filter-button");
const periodButton = document.querySelector(".search-period-dropdown-button");
const periodItems = document.querySelectorAll(".search-period-dropdown-item");
const priorityButton = document.querySelector(
  ".search-priority-dropdown-button",
);
const priorityItems = document.querySelectorAll(
  ".search-priority-dropdown-item",
);
const sortButton = document.querySelector(".search-sort-button");
const sortButtonText = document.querySelector(".search-sort-button-text");
const filterInfoContainer = document.querySelector(".filter-info-list");
const sortIcon = document.querySelector(".search-sort-button-icon svg");

/**
 * [필터 상태 변수] 현재 활성화된 검색 키워드 상태입니다.
 * @type {string}
 */
let selectedKeyword =
  savedSettings.selectedKeyword !== undefined
    ? savedSettings.selectedKeyword
    : "";

/**
 * [필터 상태 변수] 현재 활성화된 기간 필터 조건 상태입니다. ('all-days', 'today', 'seven-days')
 * @type {string}
 */
let selectedPeriod = savedSettings.selectedPeriod || "all-days";

/**
 * [필터 상태 변수] 현재 활성화된 우선순위 필터 조건 상태입니다. ('all-priority', 'HIGH', 'MID', 'LOW')
 * @type {string}
 */
let selectedPriority = savedSettings.selectedPriority || "all-priority";

/**
 * [필터 상태 변수] 제목 기준 오름차순 정렬 여부 상태입니다. (false일 경우 내림차순)
 * @type {boolean}
 */
let isAscending =
  savedSettings.isAscending !== undefined ? savedSettings.isAscending : true;

/**
 * 현재 메모리에 보관 중인 상태 변수들(키워드, 기간, 우선순위, 정렬 방향)을 LocalStorage에 문자열로 동기화합니다.
 * @function saveSettingsToStorage
 * @returns {void}
 */
function saveSettingsToStorage() {
  const settings = {
    selectedKeyword,
    selectedPeriod,
    selectedPriority,
    isAscending,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/**
 * 현재 날짜의 시작 시각(00시 00분 00초 000밀리초) 객체를 반환합니다.
 * @function getTodayStart
 * @returns {Date} 오늘 날짜의 자정 시점 Date 객체
 */
function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * 오늘 날짜를 기점으로 정확히 6일 전의 시작 시각(자정) 객체를 반환합니다. (당일 포함 최근 7일 계산용)
 * @function getSevenDaysAgo
 * @returns {Date} 6일 전 자정 시점의 Date 객체
 */
function getSevenDaysAgo() {
  const sevenDaysAgo = getTodayStart();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  return sevenDaysAgo;
}

/**
 * 현재 활성화된 필터 조건들을 요약하여 화면 하단의 필터 정보 태그 리스트(`filterInfoContainer`)에 업데이트합니다.
 * @function updateFilterInfo
 * @returns {void}
 */
function updateFilterInfo() {
  // 기존에 그려져 있던 정보 태그 노드 일괄 제거
  filterInfoContainer
    .querySelectorAll(".search-sort-info")
    .forEach((info) => info.remove());

  /**
   * 개별 필터 조건 태그 요소를 생성하여 컨테이너에 바인딩하는 헬퍼 함수입니다.
   * @param {string} title - 대분류 라벨 (예: '기간', '우선순위')
   * @param {string} value - 세부 조건 값 (예: '오늘', '높음')
   */
  function createFilterInfo(title, value) {
    const info = document.createElement("p");
    info.className = "search-sort-info";

    const titleSpan = document.createElement("span");
    titleSpan.className = "sort-title";
    titleSpan.textContent = `${title}: `;

    const valueText = document.createTextNode(value);

    info.append(titleSpan, valueText);
    filterInfoContainer.append(info);
  }

  // 기간 요약 출력
  if (selectedPeriod === "today") {
    createFilterInfo("기간", "오늘");
  } else if (selectedPeriod === "seven-days") {
    createFilterInfo("기간", "최근 7일");
  }

  // 우선순위 요약 출력
  if (selectedPriority === "HIGH") {
    createFilterInfo("우선순위", "HIGH (높음)");
  } else if (selectedPriority === "MID") {
    createFilterInfo("우선순위", "MID (중간)");
  } else if (selectedPriority === "LOW") {
    createFilterInfo("우선순위", "LOW (낮음)");
  }

  // 정렬 및 검색어 요약 출력
  createFilterInfo("정렬", isAscending ? "오름차순" : "내림차순");
  if (selectedKeyword) {
    createFilterInfo("검색", `"${selectedKeyword}"`);
  }
}

/**
 * 전체 할 일 데이터를 가져와 현재 필터 상태(기간 -> 우선순위 -> 정렬 -> 키워드) 순으로
 * 데이터를 최종 가공한 뒤, 리스트를 다시 렌더링하고 요약 정보를 갱신합니다.
 * @function applyFilter
 * @returns {void}
 */
export function applyFilter() {
  console.log("현재 period:", selectedPeriod);

  let tasks = getTasks();
  console.log(tasks);

  // 1. 기간 필터링 처리 (task.id의 타임스탬프 값을 기준으로 분류)
  if (selectedPeriod === "today") {
    const todayStart = getTodayStart();
    tasks = tasks.filter((task) => {
      const taskDate = new Date(Number(task.id));
      return taskDate >= todayStart;
    });
  }

  if (selectedPeriod === "seven-days") {
    const sevenDaysAgo = getSevenDaysAgo();
    tasks = tasks.filter((task) => {
      const taskDate = new Date(Number(task.id));
      return taskDate >= sevenDaysAgo;
    });
  }

  // 2. 우선순위 필터링 처리 (다국어 및 대소문자 매칭 지원)
  if (selectedPriority !== "all-priority") {
    tasks = tasks.filter((task) => {
      const priorityText = String(task.priority).toLowerCase();

      if (selectedPriority === "HIGH") {
        return priorityText.includes("높음") || priorityText.includes("high");
      }
      if (selectedPriority === "MID") {
        return priorityText.includes("중간") || priorityText.includes("mid");
      }
      if (selectedPriority === "LOW") {
        return priorityText.includes("낮음") || priorityText.includes("low");
      }
      return true;
    });
  }

  // 3. 텍스트 정렬 처리 (한국어 가나다 및 알파벳 순 정렬 반영)
  tasks.sort((a, b) => {
    const titleA = String(a.title).trim();
    const titleB = String(b.title).trim();

    return isAscending
      ? titleA.localeCompare(titleB, "ko")
      : titleB.localeCompare(titleA, "ko");
  });

  // 4. 검색어 필터링 처리 (제목 또는 내용에 포함 여부 검사)
  if (selectedKeyword) {
    const keyword = selectedKeyword.toLowerCase();
    tasks = tasks.filter((task) => {
      const title = String(task.title ?? "").toLowerCase();
      const content = String(task.content ?? "").toLowerCase();
      return title.includes(keyword) || content.includes(keyword);
    });
  }

  // 최종 결과 목록 렌더링 및 하단 칩 UI 업데이트
  renderTodos(tasks);
  updateFilterInfo();
}

// 검색 창에 텍스트가 입력될 때마다 실시간으로 키워드를 업데이트하고 목록을 필터링합니다.
searchInput?.addEventListener("input", () => {
  selectedKeyword = searchInput.value.trim();
  saveSettingsToStorage();
  applyFilter();
});

// 기간 드롭다운의 세부 항목 선택 시 트리거되는 클릭 이벤트 핸들러입니다.
periodItems.forEach((item) => {
  item.addEventListener("click", () => {
    selectedPeriod = item.dataset.value;
    console.log("선택된 기간:", selectedPeriod);
    periodButton.childNodes[0].textContent = `${item.textContent.trim()} `;
    saveSettingsToStorage();
    applyFilter();
  });
});

// 우선순위 드롭다운의 세부 항목 선택 시 트리거되는 클릭 이벤트 핸들러입니다.
priorityItems.forEach((item) => {
  item.addEventListener("click", () => {
    selectedPriority = item.dataset.value;
    priorityButton.childNodes[0].textContent = `${item.textContent.trim()} `;
    saveSettingsToStorage();
    applyFilter();
  });
});

// 정렬 조건(오름차순/내림차순) 버튼 클릭 시, 스위칭 및 아이콘 180도 회전 애니메이션을 제어합니다.
sortButton?.addEventListener("click", () => {
  isAscending = !isAscending;
  const sortText = isAscending ? "오름차순" : "내림차순";
  sortButtonText.textContent = `정렬: ${sortText}`;
  sortIcon.style.transform = isAscending ? "rotate(0deg)" : "rotate(180deg)";
  saveSettingsToStorage();
  applyFilter();
});

/**
 * 모든 검색 조건, 드롭다운 텍스트, 정렬 상태를 초기 상태로 리셋하고 스토리지에 재저장합니다.
 * @function resetFilters
 * @returns {void}
 */
function resetFilters() {
  selectedKeyword = "";
  searchInput.value = "";

  selectedPeriod = "all-days";
  periodButton.childNodes[0].textContent = "전체 기간 ";

  selectedPriority = "all-priority";
  priorityButton.childNodes[0].textContent = "전체 우선순위 ";

  isAscending = true;
  sortButtonText.textContent = "정렬: 오름차순";
  sortIcon.style.transform = "rotate(0deg)";

  saveSettingsToStorage();
  applyFilter();
}

// 필터 초기화 버튼 클릭 시 공통 컨펌 모달 창을 띄우고 사용자의 최종 동의 시 초기화를 진행합니다.
resetFilterButton?.addEventListener("click", () => {
  openResetModal({
    title: "조건 초기화",
    description:
      "현재 적용된 검색, 기간, 우선순위, 정렬 조건을 초기화하시겠습니까?\n저장된 할 일 데이터는 삭제되지 않습니다.",
    confirmText: "초기화",
    onConfirm: resetFilters,
  });
});

// 새로운 할 일이 등록되거나 수정/삭제되어 외부에서 전역 이벤트가 발생할 경우 필터를 재적용합니다.
window.addEventListener("todoUpdated", () => {
  applyFilter();
});

/**
 * [핵심 초기화 모듈 함수]
 * 저장된 필터 UI 복구 및 이벤트 리스너 세팅을 진행합니다.
 */
export function initFilterAndSort() {
  // 기존 검색어 복원
  if (selectedKeyword && searchInput) {
    searchInput.value = selectedKeyword;
  }

  // 기존 기간 선택 복원 및 드롭다운 버튼 텍스트 동기화
  if (
    selectedPeriod !== "all-days" &&
    periodButton &&
    periodButton.childNodes[0]
  ) {
    const savedPeriodItem = Array.from(periodItems).find(
      (item) => item.dataset.value === selectedPeriod,
    );
    if (savedPeriodItem) {
      periodButton.childNodes[0].textContent = `${savedPeriodItem.textContent.trim()} `;
    }
  }

  // 기존 우선순위 선택 복원 및 드롭다운 버튼 텍스트 동기화
  if (
    selectedPriority !== "all-priority" &&
    priorityButton &&
    priorityButton.childNodes[0]
  ) {
    const savedPriorityItem = Array.from(priorityItems).find(
      (item) => item.dataset.value === selectedPriority,
    );
    if (savedPriorityItem) {
      priorityButton.childNodes[0].textContent = `${savedPriorityItem.textContent.trim()} `;
    }
  }

  // 기존 정렬 방향 상태 복원
  if (!isAscending) {
    if (sortButtonText) sortButtonText.textContent = "정렬: 내림차순";
    if (sortIcon) sortIcon.style.transform = "rotate(180deg)";
  }

  // 외부 스크립트 로드 시차를 감안하여 미세한 타이밍 지연(디바운스성) 후 최종 목록 렌더링
  setTimeout(() => {
    applyFilter();
  }, 50);
}
