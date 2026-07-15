import { getTasks, renderTodos, openResetModal } from "./modal.js";

const STORAGE_KEY = "flowdash-filter-settings";
const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

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

let selectedKeyword =
  savedSettings.selectedKeyword !== undefined
    ? savedSettings.selectedKeyword
    : "";

let selectedPeriod = savedSettings.selectedPeriod || "all-days";
let selectedPriority = savedSettings.selectedPriority || "all-priority";
let isAscending =
  savedSettings.isAscending !== undefined ? savedSettings.isAscending : true;

/**
 * Persists the current filter state in localStorage.
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
 * Returns the start of the current day.
 * @returns {Date} The start-of-day timestamp.
 */
function getTodayStart() {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return today;
}

/**
 * Returns the start of the current day minus six days.
 * @returns {Date} The earliest date in the recent week range.
 */
function getSevenDaysAgo() {
  const sevenDaysAgo = getTodayStart();

  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  return sevenDaysAgo;
}
/**
 * Renders the active filter summary inside the filter info container.
 */
function updateFilterInfo() {
  filterInfoContainer
    .querySelectorAll(".search-sort-info")
    .forEach((info) => info.remove());

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

  if (selectedPeriod === "today") {
    createFilterInfo("기간", "오늘");
  } else if (selectedPeriod === "seven-days") {
    createFilterInfo("기간", "최근 7일");
  }

  if (selectedPriority === "HIGH") {
    createFilterInfo("우선순위", "HIGH (높음)");
  } else if (selectedPriority === "MID") {
    createFilterInfo("우선순위", "MID (중간)");
  } else if (selectedPriority === "LOW") {
    createFilterInfo("우선순위", "LOW (낮음)");
  }

  createFilterInfo("정렬", isAscending ? "오름차순" : "내림차순");

  if (selectedKeyword) {
    createFilterInfo("검색", `"${selectedKeyword}"`);
  }
}
/**
 * Applies the current keyword, period, priority, and sort filters to the task list.
 */
export function applyFilter() {
  let tasks = getTasks();

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

  tasks.sort((a, b) => {
    const titleA = String(a.title).trim();
    const titleB = String(b.title).trim();

    return isAscending
      ? titleA.localeCompare(titleB, "ko")
      : titleB.localeCompare(titleA, "ko");
  });

  if (selectedKeyword) {
    const keyword = selectedKeyword.toLowerCase();

    tasks = tasks.filter((task) => {
      const title = String(task.title ?? "").toLowerCase();
      const content = String(task.content ?? "").toLowerCase();

      return title.includes(keyword) || content.includes(keyword);
    });
  }

  renderTodos(tasks);
  updateFilterInfo();
}

/**
 * Updates the filter state whenever the search input changes.
 */
searchInput?.addEventListener("input", () => {
  selectedKeyword = searchInput.value.trim();
  saveSettingsToStorage();
  applyFilter();
});

/**
 * 기간 드롭다운 항목 클릭
 */
periodItems.forEach((item) => {
  item.addEventListener("click", () => {
    selectedPeriod = item.dataset.value;

    periodButton.childNodes[0].textContent = `${item.textContent.trim()} `;

    saveSettingsToStorage();

    applyFilter();
  });
});

/**
 * 우선순위 드롭다운 항목 클릭
 */
priorityItems.forEach((item) => {
  item.addEventListener("click", () => {
    selectedPriority = item.dataset.value;

    priorityButton.childNodes[0].textContent = `${item.textContent.trim()} `;

    saveSettingsToStorage();

    applyFilter();
  });
});

/**
 * 정렬 버튼 클릭
 */
sortButton?.addEventListener("click", () => {
  isAscending = !isAscending;

  const sortText = isAscending ? "오름차순" : "내림차순";

  sortButtonText.textContent = `정렬: ${sortText}`;

  sortIcon.style.transform = isAscending ? "rotate(0deg)" : "rotate(180deg)";

  saveSettingsToStorage();

  applyFilter();
});

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

resetFilterButton?.addEventListener("click", () => {
  openResetModal({
    title: "조건 초기화",
    description:
      "현재 적용된 검색, 기간, 우선순위, 정렬 조건을 초기화하시겠습니까?\n저장된 할 일 데이터는 삭제되지 않습니다.",
    confirmText: "초기화",
    onConfirm: resetFilters,
  });
});

window.addEventListener("todoUpdated", () => {
  applyFilter();
});

function syncLoadedUI() {
  if (selectedKeyword && searchInput) {
    searchInput.value = selectedKeyword;
  }

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

  if (!isAscending) {
    if (sortButtonText) sortButtonText.textContent = "정렬: 내림차순";
    if (sortIcon) sortIcon.style.transform = "rotate(180deg)";
  }

  setTimeout(() => {
    applyFilter();
  }, 50);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", syncLoadedUI);
} else {
  syncLoadedUI();
}
