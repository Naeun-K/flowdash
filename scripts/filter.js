import { getTasks, renderTodos, openResetModal } from "./modal.js";

// 검색 input
const searchInput = document.querySelector(".search-input");

// 조건 초기화 버튼
const resetFilterButton = document.querySelector(".reset-filter-button");

// 기간 드롭다운 버튼
const periodButton = document.querySelector(".search-period-dropdown-button");

// 기간 드롭다운 항목들
const periodItems = document.querySelectorAll(".search-period-dropdown-item");

// 우선순위 드롭다운 버튼
const priorityButton = document.querySelector(
  ".search-priority-dropdown-button",
);

// 우선순위 드롭다운 항목들
const priorityItems = document.querySelectorAll(
  ".search-priority-dropdown-item",
);

// 정렬 버튼
const sortButton = document.querySelector(".search-sort-button");

// 정렬 버튼 안의 글자
const sortButtonText = document.querySelector(".search-sort-button-text");

// 필터 정보들이 들어갈 영역
const filterInfoContainer = document.querySelector(".filter-info-list");

// 정렬 화살표 아이콘
const sortIcon = document.querySelector(".search-sort-button-icon svg");

// 현재 검색어
let selectedKeyword = "";

// 현재 선택된 기간
let selectedPeriod = "all-days";

// 현재 선택된 우선순위
let selectedPriority = "all-priority";

// 현재 정렬 상태
let isAscending = true;

/**
 * 오늘 날짜의 시작 시간을 구하는 함수
 * 예: 오늘 오전 0시 0분 0초
 */
function getTodayStart() {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return today;
}

/**
 * 최근 7일의 시작 날짜를 구하는 함수
 * 오늘을 포함해서 7일이므로 6일 전부터 계산
 */
function getSevenDaysAgo() {
  const sevenDaysAgo = getTodayStart();

  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  return sevenDaysAgo;
}
/**
 * 현재 적용된 기간, 우선순위, 정렬, 검색 조건을
 * 기존 search-sort-info 스타일로 화면에 표시
 */
function updateFilterInfo() {
  // 기존에 화면에 표시된 조건 문구들을 전부 삭제
  filterInfoContainer
    .querySelectorAll(".search-sort-info")
    .forEach((info) => info.remove());

  // 조건 문구 하나를 생성하는 함수
  function createFilterInfo(title, value) {
    const info = document.createElement("p");

    // 기존 CSS를 그대로 사용하기 위해 기존 클래스 재사용
    info.className = "search-sort-info";

    const titleSpan = document.createElement("span");
    titleSpan.className = "sort-title";
    titleSpan.textContent = `${title}: `;

    const valueText = document.createTextNode(value);

    info.append(titleSpan, valueText);
    // filter-info-list 안쪽 마지막에 조건 태그 추가
    filterInfoContainer.append(info);
  }

  // 1. 기간
  if (selectedPeriod === "today") {
    createFilterInfo("기간", "오늘");
  } else if (selectedPeriod === "seven-days") {
    createFilterInfo("기간", "최근 7일");
  }

  // 우선순위
  if (selectedPriority === "HIGH") {
    createFilterInfo("우선순위", "HIGH (높음)");
  } else if (selectedPriority === "MID") {
    createFilterInfo("우선순위", "MID (중간)");
  } else if (selectedPriority === "LOW") {
    createFilterInfo("우선순위", "LOW (낮음)");
  }

  // 2. 정렬
  createFilterInfo("정렬", isAscending ? "오름차순" : "내림차순");

  // 3. 검색
  if (selectedKeyword) {
    createFilterInfo("검색", `"${selectedKeyword}"`);
  }
}
/**
 * 검색 + 기간 + 우선순위 + 정렬을
 * 한 번에 적용하는 함수
 */
function applyFilter() {
  // 로컬스토리지에 저장된 전체 할 일 가져오기

  let tasks = getTasks();

  // =========================
  // 1. 기간 필터
  // =========================

  if (selectedPeriod === "today") {
    const todayStart = getTodayStart();

    tasks = tasks.filter((task) => {
      // 현재 프로젝트에서는 id가 Date.now() 값이므로
      // id를 생성 날짜로 사용
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

  // selectedPeriod가 all-days이면
  // 기간 필터를 적용하지 않고 전체 데이터를 유지

  // =========================
  // 2. 우선순위 필터
  // =========================

  if (selectedPriority !== "all-priority") {
    tasks = tasks.filter((task) => {
      // 저장된 우선순위 값이 "높음", "중간", "낮음"이므로
      // 선택값 HIGH, MID, LOW와 비교할 수 있게 변환
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

  // =========================
  // 3. 정렬
  // =========================

  tasks.sort((a, b) => {
    const titleA = String(a.title).trim();
    const titleB = String(b.title).trim();

    return isAscending
      ? titleA.localeCompare(titleB, "ko")
      : titleB.localeCompare(titleA, "ko");
  });

  // =========================
  // 4. 검색 필터
  // =========================

  if (selectedKeyword) {
    const keyword = selectedKeyword.toLowerCase();

    tasks = tasks.filter((task) => {
      const title = String(task.title ?? "").toLowerCase();
      const content = String(task.content ?? "").toLowerCase();

      // 제목이나 내용 중 하나에 검색어가 들어 있으면 남김
      return title.includes(keyword) || content.includes(keyword);
    });
  }

  // 모든 조건을 적용한 결과를 화면에 다시 출력
  renderTodos(tasks);

  // 적용된 기간, 우선순위, 정렬, 검색 문구 갱신
  updateFilterInfo();
}

/**
 * 검색창에 입력할 때마다 실행
 */
searchInput?.addEventListener("input", () => {
  // 앞뒤 공백 제거 후 검색어 저장
  selectedKeyword = searchInput.value.trim();

  // 검색어가 바뀔 때마다 전체 필터 다시 적용
  applyFilter();
});

/**
 * 기간 드롭다운 항목 클릭
 */
periodItems.forEach((item) => {
  item.addEventListener("click", () => {
    // 클릭한 항목의 data-value 저장
    selectedPeriod = item.dataset.value;

    // 버튼 글자를 선택한 기간으로 변경
    periodButton.childNodes[0].textContent = `${item.textContent.trim()} `;

    // 기간이 바뀌면 전체 필터 다시 적용
    applyFilter();
  });
});

/**
 * 우선순위 드롭다운 항목 클릭
 */
priorityItems.forEach((item) => {
  item.addEventListener("click", () => {
    // 클릭한 항목의 data-value 저장
    selectedPriority = item.dataset.value;

    // 버튼 글자를 선택한 우선순위로 변경
    priorityButton.childNodes[0].textContent = `${item.textContent.trim()} `;

    // 우선순위가 바뀌면 전체 필터 다시 적용
    applyFilter();
  });
});

/**
 * 정렬 버튼 클릭
 */
sortButton?.addEventListener("click", () => {
  // 오름차순과 내림차순 상태 변경
  isAscending = !isAscending;

  const sortText = isAscending ? "오름차순" : "내림차순";

  // 정렬 버튼 글자 변경
  sortButtonText.textContent = `정렬: ${sortText}`;

  // 화살표 방향 변경
  sortIcon.style.transform = isAscending ? "rotate(0deg)" : "rotate(180deg)";

  // 정렬 상태가 바뀌면 전체 필터 다시 적용
  applyFilter();
});
//*        조건 초기화           * //

function resetFilters() {
  // 1. 검색 초기화
  selectedKeyword = "";
  searchInput.value = "";

  // 2. 기간 초기화
  selectedPeriod = "all-days";
  periodButton.childNodes[0].textContent = "전체 기간 ";

  // 3. 우선순위 초기화
  selectedPriority = "all-priority";
  priorityButton.childNodes[0].textContent = "전체 우선순위 ";

  // 4. 정렬 초기화
  isAscending = true;
  sortButtonText.textContent = "정렬: 오름차순";

  // 5. 정렬 화살표 초기화
  sortIcon.style.transform = "rotate(0deg)";

  // 6. 초기화된 조건으로 목록 다시 출력
  applyFilter();
}

resetFilterButton?.addEventListener("click", () => {
  openResetModal({
    title: "조건 초기화",
    description:
      "현재 적용된 검색, 기간, 우선순위, 정렬 조건을 초기화하시겠습니까?\n저장된 할 일 데이터는 삭제되지 않습니다.",
    confirmText: "초기화",
    onConfirm: resetFilters,
  });
});
