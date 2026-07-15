import { createStorage } from "./storage.js";
import { applyFilter } from "./filter.js";

/**
 * @namespace flowdashTodos
 * @description 'flowdash-todos' 키를 사용하는 로컬 스토리지 인스턴스
 */
const flowdashTodos = createStorage("flowdash-todos");

// --- DOM 요소 선택 ---
const modal = document.querySelector(".new-task-modal");
const openButton = document.querySelector(".add-task-button");
const closeButton = document.querySelector(".modal-close-button");
const form = document.querySelector(".modal-form");
const titleInput = document.querySelector('.modal-input[name="task-title"]');
const descInput = document.querySelector(".modal-textarea");
const dropdownToggle = document.querySelector(".modal-status-button");
const dropdownItems = document.querySelectorAll(".modal-status-item");
const priorityInputs = document.querySelectorAll(".task-priority");
const priorityLabels = document.querySelectorAll(".modal-radio-label");
const modalTitle = document.querySelector(".modal-title");
const modalSubmitButton = document.querySelector(".modal-submit-button");

// --- 모달 제어용 상태 변수 ---
/** @type {string} 현재 모달에서 선택된 태스크 상태 ('TODO' | 'DOING' | 'DONE') */
let currentSelectedStatus = "TODO";

/** @type {string|null} 현재 수정 중인 태스크 ID (생성 모드일 때는 null) */
let editingTaskId = null;

/** @type {boolean} 사용자가 최소 1회 이상 폼 제출을 시도했는지 여부 (실시간 유효성 검사 활성화용) */
let hasSubmitted = false;

/** @type {HTMLElement|null} 모달을 열기 직전 포커스가 머물러 있던 DOM 요소 */
let lastActiveElement = null;

/**
 * HTML 특수문자를 엔티티 코드로 변환하여 XSS(Cross-Site Scripting) 공격을 방지합니다.
 * @param {string} text - 변환할 원본 텍스트
 * @returns {string} 안전하게 에스케이프 처리된 텍스트
 */
function sanitize(text) {
  if (text == null) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return String(text).replace(/[&<>"'/]/g, (m) => map[m]);
}

/**
 * UI상의 한글/영문 상태 텍스트를 시스템 내부 표준 상태 키값으로 매핑합니다.
 * @param {string} text - 화면에 표시되는 상태 레이블 텍스트 (예: '할 일', '진행중')
 * @returns {string} 매핑된 시스템 내부 상태값 ('TODO' | 'DOING' | 'DONE')
 */
function mapStatusLabelToInternal(text) {
  if (!text) return "TODO";
  const t = text.trim();
  if (/할\s*일|TODO/i.test(t)) return "TODO";
  if (/진행|DOING/i.test(t)) return "DOING";
  if (/완료|DONE/i.test(t)) return "DONE";
  return t;
}

/**
 * 모달 UI 상태를 '새 할 일' 작성 모드(기본값)로 초기화합니다.
 * - 입력 폼 비우기 및 기본 선택값(우선순위: 중간, 상태: 할 일) 지정
 */
function setDefaultModalState() {
  form?.reset();
  if (titleInput) titleInput.value = "";
  if (descInput) descInput.value = "";

  priorityInputs.forEach((input) => (input.checked = false));
  priorityLabels.forEach((label) => label.classList.remove("active"));

  // 기본값: '중간' 우선순위 활성화
  const midInput = document.querySelector("#task-priority-mid");
  if (midInput) {
    midInput.checked = true;
    const midLabel = document.querySelector('label[for="task-priority-mid"]');
    midLabel?.classList.add("active");
  }

  const statusLabel = dropdownToggle?.querySelector(".modal-status-label");
  if (statusLabel) statusLabel.textContent = "할 일";
  if (modalTitle) modalTitle.textContent = "새 할 일";
  if (modalSubmitButton) modalSubmitButton.textContent = "저장하기";
  currentSelectedStatus = "TODO";
  editingTaskId = null;
}

/**
 * 특정 태스크 데이터를 전달받아 모달 폼에 값을 채워 넣습니다. (수정 모드 전환용)
 * @param {object|null} task - 모달에 반영할 태스크 객체. null이면 기본 폼(등록 모드)으로 초기화합니다.
 * @param {number|string} task.id - 태스크 고유 ID
 * @param {string} task.title - 태스크 제목
 * @param {string} [task.content] - 태스크 상세 설명
 * @param {string} task.priority - 태스크 우선순위
 * @param {string} task.status - 태스크 진행 상태
 */
function populateModal(task) {
  if (!task) {
    setDefaultModalState();
    return;
  }

  if (titleInput) titleInput.value = task.title || "";
  if (descInput) descInput.value = task.content || "";

  const targetPriorityValue = getPriorityValue(task.priority);

  priorityInputs.forEach((input) => {
    input.checked = input.value.toUpperCase() === targetPriorityValue;
  });
  priorityLabels.forEach((label) => label.classList.remove("active"));

  const matchedInput = Array.from(priorityInputs).find(
    (input) => input.value.toUpperCase() === targetPriorityValue,
  );
  const matchedLabel = matchedInput
    ? document.querySelector(`label[for="${matchedInput.id}"]`)
    : document.querySelector('label[for="task-priority-mid"]');
  matchedLabel?.classList.add("active");

  const statusLabel = dropdownToggle?.querySelector(".modal-status-label");
  if (statusLabel) {
    statusLabel.textContent =
      task.status === "DOING"
        ? "진행중"
        : task.status === "DONE"
          ? "완료"
          : "할 일";
  }
  currentSelectedStatus = mapStatusLabelToInternal(task.status || "TODO");
  if (modalTitle) modalTitle.textContent = "할 일 수정";
  if (modalSubmitButton) modalSubmitButton.textContent = "수정하기";
  editingTaskId = String(task.id);
}

/**
 * 태스크 작성/수정 모달을 화면에 노출합니다.
 * - 접근성을 위해 모달 오픈 전 활성화된 요소와 ARIA 속성을 제어합니다.
 * @param {object|null} [task=null] - 수정 대상인 태스크 데이터 (신규 생성이면 null)
 */
function openModal(task = null) {
  if (!modal) return;

  // 접근성(Accessibility): 모달 닫힌 후 돌아올 포커스 대상 기록
  lastActiveElement = document.activeElement;

  modal.classList.remove("active");

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden"; // 배경 스크롤 방지
  populateModal(task);

  hasSubmitted = false;
  const titleError = document.querySelector(".error-message");
  if (titleError) titleError.style.display = "none";
  titleInput?.classList.remove("input-error");

  // CSS 트랜지션 애니메이션이 정상 동작하도록 프레임 지연 실행
  setTimeout(() => {
    modal.classList.add("active");
    titleInput?.focus();
  }, 10);
}

/**
 * 태스크 모달을 닫고 상태를 초기화합니다.
 * - 모달이 닫힌 후 직전에 포커스되어 있던 요소로 포커스를 되돌려 놓습니다.
 */
function closeModal() {
  if (!modal) return;

  modal.classList.remove("active");
  document.body.style.overflow = ""; // 스크롤 잠금 해제
  setDefaultModalState();

  // 접근성: 이전 활성 요소 혹은 추가 버튼으로 포커스 복원
  if (lastActiveElement && typeof lastActiveElement.focus === "function") {
    lastActiveElement.focus();
  } else {
    openButton?.focus();
  }

  // 트랜지션이 완료되는 시점(300ms) 이후 완전히 화면에서 숨김 처리
  setTimeout(() => {
    if (!modal.classList.contains("active")) {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    }
  }, 300);
}

/**
 * 로컬 스토리지로부터 저장된 태스크 목록 전체를 읽어옵니다.
 * @returns {Array<object>} 저장되어 있는 태스크 배열 (데이터가 없을 경우 빈 배열 반환)
 */
export function getTasks() {
  const stored = flowdashTodos.get("tasks");
  return Array.isArray(stored) ? stored : [];
}

/**
 * 새로운 태스크 배열을 로컬 스토리지에 동기화하여 영구 저장합니다.
 * @param {Array<object>} tasks - 스토리지에 저장할 태스크 배열
 */
function saveTasks(tasks) {
  flowdashTodos.set("tasks", tasks);
}

/**
 * 텍스트 데이터를 기준으로 시스템 표준 우선순위 식별값('HIGH' | 'MID' | 'LOW')을 반환합니다.
 * @param {string} priorityText - 한글 혹은 영문 우선순위 텍스트 (예: '높음', 'low')
 * @returns {string} 변환된 표준 키값
 */
function getPriorityValue(priorityText) {
  const normalized = sanitize(priorityText).trim().toLowerCase();
  if (normalized.includes("높음") || normalized.includes("high")) return "HIGH";
  if (normalized.includes("중간") || normalized.includes("mid")) return "MID";
  if (normalized.includes("낮음") || normalized.includes("low")) return "LOW";
  return "MID";
}

/**
 * 태스크 우선순위에 대응하는 CSS 클래스명 접미사를 반환합니다.
 * @param {string} priority - 우선순위 값
 * @returns {string} 스타일 적용을 위한 CSS 클래스명 (예: 'priority-high')
 */
function getPriorityClass(priority) {
  const normalized = sanitize(priority).toLowerCase();
  if (normalized.includes("높음") || normalized.includes("high"))
    return "priority-high";
  if (normalized.includes("중간") || normalized.includes("mid"))
    return "priority-mid";
  if (normalized.includes("낮음") || normalized.includes("low"))
    return "priority-low";
  return "priority-mid";
}

/**
 * 특정 ID를 가진 태스크를 로컬 스토리지 및 화면 데이터에서 영구 삭제합니다.
 * @param {string|number} taskId - 삭제 대상 태스크의 고유 ID
 */
function deleteTaskById(taskId) {
  const storedTasks = getTasks();
  const nextTasks = storedTasks.filter(
    (task) => String(task.id) !== String(taskId),
  );
  saveTasks(nextTasks);
  renderTodos(nextTasks);
}

/**
 * 모달 입력값 검증 후 신규 생성 혹은 수정한 태스크 정보를 수집하여 스토리지에 반영합니다.
 * - 입력 상태(상태값 변화)에 맞춰 생성일, 수정일, 완료일 타임스탬프를 자동 제어합니다.
 * @param {Event} [e] - 폼 Submit 이벤트 객체
 * @returns {boolean} 데이터 유효성 검사 통과 및 저장 완료 여부 (성공 시 true)
 */
function saveData(e) {
  if (e) e.preventDefault();
  const title = titleInput?.value.trim();
  const content = descInput?.value.trim();

  const titleError = document.querySelector(".error-message");

  // 필수값 검증: 제목이 누락된 경우 에러를 노출하고 포커싱
  if (!title) {
    hasSubmitted = true;
    if (titleError) titleError.style.display = "inline-block";
    titleInput?.classList.add("input-error");
    titleInput?.focus();
    return false;
  } else {
    if (titleError) titleError.style.display = "none";
    titleInput?.classList.remove("input-error");
  }

  // 선택된 라디오 버튼의 우선순위 값 조회
  const selectedRadio = document.querySelector(
    'input[name="priority"]:checked',
  );
  let priority = "중간";
  if (selectedRadio) {
    const label = document.querySelector(`label[for="${selectedRadio.id}"]`);
    priority = (label?.textContent || selectedRadio.value || priority).trim();
  }
  const tasks = getTasks() || [];
  const prevTask = editingTaskId
    ? (tasks || []).find((task) => Number(task.id) === Number(editingTaskId))
    : null;

  let createdAt = prevTask?.createdAt || null;
  let updatedAt = prevTask?.updatedAt || null;
  let completedAt = prevTask?.completedAt || null;

  const now = Date.now();

  // 상태 변경에 따른 생명주기 타임스탬프 변경 로직
  switch (currentSelectedStatus) {
    case "TODO":
      if (!createdAt) createdAt = now;
      break;
    case "DOING":
      if (!createdAt) createdAt = now;
      updatedAt = now;
      break;
    case "DONE":
      if (!createdAt) createdAt = now;
      if (!updatedAt) updatedAt = now;
      completedAt = now;
      break;
  }

  const taskData = {
    id: editingTaskId ? Number(editingTaskId) : Date.now(),
    title,
    content,
    priority,
    status: currentSelectedStatus,
    createdAt,
    updatedAt,
    completedAt,
  };

  if (editingTaskId) {
    const index = tasks.findIndex(
      (task) => String(task.id) === String(editingTaskId),
    );

    if (index >= 0) {
      tasks[index] = { ...tasks[index], ...taskData };
    } else {
      tasks.push(taskData);
    }
  } else {
    tasks.push(taskData);
  }

  saveTasks(tasks);
  renderTodos(tasks);
  return true;
}

// --- 이벤트 리스너: 실시간 제목 입력 유효성 검사 ---
titleInput?.addEventListener("input", function () {
  if (!hasSubmitted) return; // 제출 시도 전에는 경고 메시지를 노출하지 않음

  const titleError = document.querySelector(".error-message");
  if (titleInput.value.trim() !== "") {
    if (titleError) titleError.style.display = "none";
    titleInput.classList.remove("input-error");
  } else {
    if (titleError) titleError.style.display = "inline";
    titleInput.classList.add("input-error");
  }
});

/**
 * 모달의 최종 저장을 핸들링하고 후속 이벤트를 트리거합니다.
 * @param {Event} [event] - submit 이벤트 객체
 */
function handleModalSubmit(event) {
  if (event) event.preventDefault();
  const saved = saveData(event);
  if (!saved) return;

  // 전체 애플리케이션 화면 갱신을 유도하는 커스텀 이벤트 발송
  window.dispatchEvent(new Event("todoUpdated"));
  closeModal();
}

// --- 모달 노출/비노출 바인딩 ---
openButton?.addEventListener("click", () => openModal());
closeButton?.addEventListener("click", closeModal);

// 백드롭(모달 바깥 영역) 클릭 시 모달이 닫히도록 바인딩
modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

// ESC 키 입력 시 모달 닫기 제어
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal && !modal.hidden) {
    closeModal();
  }
});

form?.addEventListener("submit", handleModalSubmit);

// 모달 활성화 시 'Enter'키 제출 지원 (단, 여러 줄 설명 작성창(textarea)은 제외)
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && modal && !modal.hidden) {
    const activeEl = document.activeElement;
    if (activeEl !== descInput) {
      handleModalSubmit(event);
    }
  }
});

// --- 우선순위 라디오 버튼 커스텀 스타일링 동기화 ---
priorityLabels.forEach((label) => {
  label.addEventListener("click", () => {
    const inputId = label.getAttribute("for");
    const input = document.querySelector(`#${inputId}`);
    if (input) {
      input.checked = true;
      priorityLabels.forEach((lbl) => lbl.classList.remove("active"));
      label.classList.add("active");
    }
  });
});

priorityInputs.forEach((input) => {
  input.addEventListener("change", () => {
    priorityLabels.forEach((label) => label.classList.remove("active"));
    const checkedLabel = document.querySelector(`label[for="${input.id}"]`);
    checkedLabel?.classList.add("active");
  });
});

/**
 * 현재 모달 UI 내에서 열려 있는 모든 드롭다운 요소를 닫습니다.
 */
function closeAllDropdowns() {
  document.querySelectorAll(".dropdown").forEach((dropdown) => {
    dropdown.removeAttribute("open");
    dropdown.classList.remove("is-open", "is-close");
  });
}

// 드롭다운 외부 클릭 시 드롭다운 일괄 닫기 제어
document.addEventListener("click", (event) => {
  const target = event.target;
  const isDropdownClick = target.closest(".dropdown");

  if (!isDropdownClick) {
    closeAllDropdowns();
    return;
  }

  const dropdown = target.closest(".dropdown");
  const isItemClick = target.closest(".dropdown-item");

  if (isItemClick && dropdown) {
    dropdown.removeAttribute("open");
  }
});

// 상태 변경 드롭다운 내부 아이템 선택 시 업데이트 처리
dropdownItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    event.stopPropagation();
    const statusText = item.textContent.trim();
    const statusLabel = dropdownToggle?.querySelector(".modal-status-label");
    if (statusLabel) statusLabel.textContent = statusText;
    currentSelectedStatus = mapStatusLabelToInternal(statusText);
    closeAllDropdowns();
  });
});

/**
 * 3가지 상태(TODO, DOING, DONE) 보드의 리스트 영역을 비우고,
 * 할 일이 없을 때 표시하는 플레이스홀더 메시지를 동적으로 렌더링합니다.
 */
function clearBoardLists() {
  document
    .querySelectorAll(".todo-list, .doing-list, .done-list")
    .forEach((ul) => {
      ul.textContent = "";

      let messageText = "";
      let specificClass = "";

      if (ul.classList.contains("todo-list")) {
        messageText = "할 일이 없습니다";
        specificClass = "todo-null-data";
      } else if (ul.classList.contains("doing-list")) {
        messageText = "진행 중인 일이 없습니다";
        specificClass = "doing-null-data";
      } else if (ul.classList.contains("done-list")) {
        messageText = "완료된 일이 없습니다";
        specificClass = "done-null-data";
      }

      // (이전 clearBoardLists 내부 루프의 마감 처리 영역)
      const li = document.createElement("li");
      li.className = "list-item";

      const p = document.createElement("p");
      p.className = `${specificClass} null-data`;
      p.textContent = messageText;

      li.appendChild(p);
      ul.appendChild(li);
    });
}

/**
 * 대시보드 상단 카드의 태스크 상태별 개수 및 목표 달성률(%)을 계산하여 UI에 반영합니다.
 * @param {Array<object>} tasks - 카운트 연산 대상이 되는 전체 태스크 배열
 */
function updateCounts(tasks) {
  if (!tasks || !Array.isArray(tasks)) return;

  // 상태별 개수 집계
  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const doingCount = tasks.filter((t) => t.status === "DOING").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  // 상태별 카운트 UI 동기화
  document
    .querySelectorAll(".todo-count")
    .forEach((el) => (el.textContent = String(todoCount)));
  document
    .querySelectorAll(".doing-count")
    .forEach((el) => (el.textContent = String(doingCount)));
  document
    .querySelectorAll(".done-count")
    .forEach((el) => (el.textContent = String(doneCount)));

  // 총 태스크 수 및 완료율(Achieved Rate) 반영
  const totalEl = document.querySelector(".card-count-total");
  if (totalEl) totalEl.textContent = String(tasks.length);

  const achieved = tasks.length
    ? Math.round((doneCount / tasks.length) * 100)
    : 0;
  const achievedEl = document.querySelector(".achieved-rate");
  if (achievedEl) achievedEl.textContent = `${achieved}%`;
}

/**
 * 숫자 형식의 타임스탬프를 가독성 높은 날짜/시간 포맷(YYYY. MM. DD HH:mm) 문자열로 변환합니다.
 * @param {number} ms - 변환할 밀리초(ms) 단위의 에포크 타임스탬프
 * @returns {string} 포맷팅 완료된 날짜 문자열 (예: "2026. 07. 16 01:25")
 */
function formatDate(ms) {
  const date = new Date(ms);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}. ${month}. ${day} ${hours}:${minutes}`;
}

/**
 * 개별 태스크 데이터를 기반으로 보드에 렌더링될 실제 DOM 요소를 조작 및 생성합니다.
 * - 마우스 호버 시 삭제 버튼 표출 제어, 삭제 시 2차 확인 모달 바인딩, 카드 클릭 시 수정 모달 바인딩을 포함합니다.
 * @param {object} todo - 화면에 그려낼 개별 태스크 객체
 * @returns {HTMLElement} 생성 및 바인딩이 완료된 `<li>` 요소 노드
 */
function createTodoElement(todo) {
  let targetNullClass = "";
  if (todo.status === "TODO") {
    targetNullClass = ".todo-null-data";
  } else if (todo.status === "DOING") {
    targetNullClass = ".doing-null-data";
  } else if (todo.status === "DONE") {
    targetNullClass = ".done-null-data";
  }

  // 데이터가 추가되었으므로 해당 컬럼의 '내용 없음' 플레이스홀더를 숨김 처리
  if (targetNullClass) {
    const nullItems = document.querySelectorAll(targetNullClass);
    nullItems.forEach((item) => {
      item.hidden = true;
    });
  }

  const li = document.createElement("li");
  li.className = "board-item";

  // 템플릿용 마크업 구조인 #hidden-card를 복사하여 데이터 주입 시작
  const hiddenCard = document.querySelector("#hidden-card");
  if (hiddenCard) {
    const cloned = hiddenCard.cloneNode(true);
    cloned.removeAttribute("id");
    cloned.hidden = false;
    cloned.style.display = "";
    cloned.dataset.id = String(todo.id);

    // 1. 우선순위 뱃지 설정 및 스타일 클래스 부여
    const prio = cloned.querySelector(".todo-priority-icon");
    if (prio) {
      prio.textContent = sanitize(todo.priority);
      prio.classList.remove("priority-high", "priority-mid", "priority-low");
      prio.classList.add(getPriorityClass(todo.priority));
    }

    // 2. 제목 및 상세설명 텍스트 주입
    const titleEl = cloned.querySelector(".todo-title");
    if (titleEl) titleEl.textContent = todo.title || "";

    const descEl = cloned.querySelector(".todo-desc");
    if (descEl) descEl.textContent = todo.content || "";

    // 3. 상태별 생성일, 수정일, 완료일 정보 및 UI 노출 처리
    const updateTodoTime = cloned.querySelector("#update-todo-time");
    const updateDoneTime = cloned.querySelector("#update-done-time");
    const updateUpdateTime = cloned.querySelector("#update-update-time");
    if (updateTodoTime)
      updateTodoTime.textContent = sanitize(formatDate(todo.createdAt));

    if (todo.status === "DOING") {
      cloned.classList.add("update-task");
      const updateTimeContainer = cloned.querySelector(".update-time");
      if (updateTimeContainer) {
        if (updateUpdateTime) {
          updateUpdateTime.textContent = sanitize(formatDate(todo.updatedAt));
          updateTimeContainer.removeAttribute("hidden");
        }
      }
    }
    if (todo.status === "DONE") {
      cloned.classList.add("completed-task");
      const doneTimeContainer = cloned.querySelector(".done-time");
      if (doneTimeContainer) {
        if (updateDoneTime) {
          updateDoneTime.textContent = sanitize(formatDate(todo.completedAt));
          doneTimeContainer.removeAttribute("hidden");
        }
      }
    }

    // 복사 대상에서 전파된 불필요한 ID 일괄 제거 (중복 ID 생성 방지)
    cloned.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

    // 4. 삭제(X) 아이콘 이벤트 및 동작 정의
    const closeIcon = cloned.querySelector(".todo-close-icon");
    if (closeIcon) {
      const showCloseIcon = () => {
        closeIcon.removeAttribute("hidden");
        closeIcon.setAttribute("aria-hidden", "false");
      };
      const hideCloseIcon = () => {
        closeIcon.setAttribute("hidden", "");
        closeIcon.setAttribute("aria-hidden", "true");
      };

      // 접근성 및 마우스 조작 대응 (호버/포커스 시 삭제 버튼 활성화)
      cloned.addEventListener("mouseenter", showCloseIcon);
      cloned.addEventListener("mouseleave", hideCloseIcon);
      cloned.addEventListener("focusin", showCloseIcon);
      cloned.addEventListener("focusout", (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          hideCloseIcon();
        }
      });

      // 개별 삭제 버튼 클릭 시 확인 모달(Confirm Modal) 구현 및 띄우기
      closeIcon.addEventListener("click", (event) => {
        event.stopPropagation(); // 카드 자체 클릭 이벤트(수정 모달) 전파 방지
        if (closeIcon.hasAttribute("hidden")) return;

        const existingOverlay = document.querySelector(".delete-modal-overlay");
        if (existingOverlay) existingOverlay.remove();

        const deleteModal = document.createElement("div");
        deleteModal.classList.add("reset-modal-overlay");

        const originalContent = document.querySelector(".reset-modal-content");
        if (!originalContent) return;

        const deleteModalContent = originalContent.cloneNode(true);
        const deletModalTitle =
          deleteModalContent.querySelector("#reset-modal-title");
        const deletModalDesc = deleteModalContent.querySelector(
          ".reset-modal-description",
        );
        const cancelDeleteBtn = deleteModalContent.querySelector(
          ".reset-modal-cancel",
        );
        const doDeleteBtn = deleteModalContent.querySelector(
          ".reset-modal-confirm",
        );

        if (deleteModalContent) {
          deleteModalContent.removeAttribute("hidden");
          deletModalTitle.textContent = "할 일 삭제";
          deletModalDesc.textContent =
            "이 할 일을 정말로 삭제하시겠습니까?\n삭제된 할 일은 복구할 수 없습니다.";
          doDeleteBtn.textContent = "삭제";
        }

        deleteModal.append(deleteModalContent);
        document.body.append(deleteModal);
        document.body.style.overflow = "hidden";

        // 삭제 확인 모달 해제 헬퍼 함수
        const handleClose = () => {
          closeResetModal(deleteModal);
          document.removeEventListener("keydown", handleKeyDown);
        };

        // 실제 스토리지 데이터 삭제 로직 처리
        const handleConfirm = () => {
          deleteTask();
          handleClose();
        };

        // 삭제 모달 단축키 조작 (ESC: 취소, Enter: 즉시 삭제)
        const handleKeyDown = (event) => {
          if (event.key === "Escape") {
            handleClose();
          }
          if (event.key === "Enter") {
            event.preventDefault();
            handleConfirm();
          }
        };

        cancelDeleteBtn?.addEventListener("click", handleClose);
        doDeleteBtn?.addEventListener("click", handleConfirm);
        document.addEventListener("keydown", handleKeyDown);

        deleteModal.addEventListener("click", (event) => {
          if (event.target === deleteModal) {
            handleClose();
          }
        });
      });
    }

    /**
     * DOM 탐색을 통해 소속 카드의 고유 ID를 조회하고 삭제 작업을 호출합니다.
     */
    function deleteTask() {
      const closestCard = closeIcon.closest(".todo-container");
      const taskId = closestCard?.dataset.id;
      if (taskId) {
        deleteTaskById(taskId);
      }
    }

    // 카드 영역 클릭 시 태스크 상세 수정 모달 오픈 바인딩
    cloned.addEventListener("click", (event) => {
      if (event.target.closest(".todo-close-icon")) return;
      openModal(todo);
    });

    li.appendChild(cloned);
  } else {
    // 템플릿 돔 조회 실패 시 원시 텍스트 형식으로 백업 대체 렌더링 진행
    li.textContent = `${todo.title} - ${todo.priority}`;
  }

  return li;
}

/**
 * 전달받은 태스크 목록 배열을 기준으로 전체 보드의 리스트 영역을 동적으로 다시 렌더링합니다.
 * - 전달받은 배열이 유효하지 않을 경우 스토리지의 원본을 조회하여 채워 넣습니다.
 * @param {Array<object>} [todoList] - 화면에 렌더링할 태스크 소스 배열 (옵션)
 */
export function renderTodos(todoList) {
  const tasks = Array.isArray(todoList) ? todoList : getTasks();
  clearBoardLists();

  const todoUl = document.querySelector(".todo-list");
  const doingUl = document.querySelector(".doing-list");
  const doneUl = document.querySelector(".done-list");

  // 태스크 상태에 맞춰 적절한 <ul> 컬럼 노드 내부로 카드 삽입
  tasks.forEach((t) => {
    const el = createTodoElement(t);
    if (t.status === "DOING" && doingUl) doingUl.append(el);
    else if (t.status === "DONE" && doneUl) doneUl.append(el);
    else if (todoUl) todoUl.appendChild(el);
  });

  // 데이터 변경 사항 대시보드 통계 카드에 전파 동기화
  const allTasksForStats = getTasks();
  updateCounts(allTasksForStats);
}

// 필터 버튼과 구분되는 순수 데이터 리셋 버튼 핸들러 선택
const resetButton = document.querySelector(
  ".reset-data-button:not(.reset-filter-button)",
);

/**
 * 치명적이거나 되돌릴 수 없는 영구 파괴 조작(예: 전체 초기화, 할 일 삭제) 시 사용자 동의를 구하는 모달 창을 엽니다.
 * @param {Object} [options] - 모달 설정 옵션 객체
 * @param {string} [options.title="데이터 초기화"] - 모달 제목 창 타이틀 텍스트
 * @param {string} [options.description="정말로 모든 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다."] - 모달 본문 경고 문구
 * @param {string} [options.confirmText="전체 삭제"] - 모달 동의 승인 버튼 텍스트
 * @param {Function} [options.onConfirm=resetAllTasks] - 승인 완료 시 후속 처리할 콜백 실행 함수
 */
export function openResetModal({
  title = "데이터 초기화",
  description = "정말로 모든 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.",
  confirmText = "전체 삭제",
  onConfirm = resetAllTasks,
} = {}) {
  const existingOverlay = document.querySelector(".reset-modal-overlay");

  if (existingOverlay) {
    existingOverlay.remove();
  }

  const resetModal = document.createElement("div");
  resetModal.classList.add("reset-modal-overlay");
  const originalContent = document.querySelector(".reset-modal-content");
  if (!originalContent) return;
  const resetModalContent = originalContent.cloneNode(true);
  const resetModalDesc = resetModalContent.querySelector(
    ".reset-modal-description",
  );
  const resetModalTitle = resetModalContent.querySelector("#reset-modal-title");
  const cancelButton = resetModalContent.querySelector(".reset-modal-cancel");
  const confirmResetButton = resetModalContent.querySelector(
    ".reset-modal-confirm",
  );

  if (
    !resetModalContent ||
    !resetModalDesc ||
    !resetModalTitle ||
    !cancelButton ||
    !confirmResetButton
  ) {
    return;
  }

  resetModalContent.removeAttribute("hidden");
  resetModalTitle.textContent = title;
  resetModalDesc.textContent = description;
  confirmResetButton.textContent = confirmText;

  resetModal.append(resetModalContent);
  document.body.append(resetModal);
  document.body.style.overflow = "hidden"; // 모달 뒤 본문 스크롤 방지

  // 모달 닫기 공통 액션
  const handleClose = () => {
    closeResetModal(resetModal);
    document.removeEventListener("keydown", handleKeyDown);
  };

  // 실행 의지 최종 확인 시 전달받은 콜백 함수(onConfirm)를 최종 기동
  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  // 모달 내 조작 단축키 (ESC: 닫기, Enter: 즉시 승인)
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      handleClose();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      handleConfirm();
    }
  };

  cancelButton?.addEventListener("click", handleClose);
  confirmResetButton?.addEventListener("click", handleConfirm);

  // 모달 아웃사이드(백드롭) 클릭 시 이탈 방지형 닫기 지원
  resetModal.addEventListener("click", (event) => {
    if (event.target === resetModal) {
      handleClose();
    }
  });

  document.addEventListener("keydown", handleKeyDown);
}

/**
 * 닫힘 연출용 트랜지션 애니메이션을 재생한 뒤 2차 확인용 모달 구조를 DOM에서 삭제합니다.
 * @param {HTMLElement} resetModal - 화면에서 소멸시킬 팝업 타겟 오버레이 DOM 객체
 */
function closeResetModal(resetModal) {
  if (!resetModal) return;

  resetModal.classList.add("closing");

  // 애니메이션 러닝타임(200ms)이 경과한 뒤 안전하게 제거
  setTimeout(() => {
    const resetModalContent = resetModal.querySelector(".reset-modal-content");

    if (resetModalContent) {
      resetModalContent.setAttribute("hidden", "true");
      document.body.append(resetModalContent);
    }

    resetModal.remove();
    document.body.style.overflow = ""; // 잠겼던 body 스크롤 복원
  }, 200);
}

/**
 * 로컬 스토리지 내 모든 태스크 배열을 초기화하고 화면을 깨끗하게 갱신합니다.
 */
function resetAllTasks() {
  saveTasks([]);
  renderTodos([]);
}

// --- 최초 기동 시점 실행부 ---

// 1. 페이지 로드 시 기존 저장 데이터를 불러와 보드 구성
renderTodos(getTasks());

// 2. 전체 데이터 초기화 버튼 클릭 이벤트 연동
resetButton?.addEventListener("click", () => {
  openResetModal();
});
