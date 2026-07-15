import { createStorage } from "./storage.js"; // 안전한 로컬스토리지 래퍼
import { applyFilter } from "./filter.js";

const flowdashTodos = createStorage("flowdash-todos");

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

let currentSelectedStatus = "TODO"; // internal status: TODO, DOING, DONE
let editingTaskId = null;
let hasSubmitted = false;

// [추가] 모달을 열었을 때 어떤 버튼이 포커스를 갖고 있었는지 기억할 변수
let lastActiveElement = null;
/**
 * 보안 강화: 안전한 텍스트 출력을 위한 XSS 방어 새니타이저
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

function mapStatusLabelToInternal(text) {
  if (!text) return "TODO";
  const t = text.trim();
  if (/할\s*일|TODO/i.test(t)) return "TODO";
  if (/진행|DOING/i.test(t)) return "DOING";
  if (/완료|DONE/i.test(t)) return "DONE";
  return t;
}

function setDefaultModalState() {
  form?.reset();
  if (titleInput) titleInput.value = "";
  if (descInput) descInput.value = "";

  priorityInputs.forEach((input) => (input.checked = false));
  priorityLabels.forEach((label) => label.classList.remove("active"));

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

function openModal(task = null) {
  if (!modal) return;

  // [추가] 모달을 열기 직전, 현재 포커스된 요소를 기록해 둡니다 ("+ 새 할 일" 버튼 등)
  lastActiveElement = document.activeElement;

  modal.classList.remove("active");

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  populateModal(task);

  hasSubmitted = false;
  const titleError = document.querySelector(".error-message");
  if (titleError) titleError.style.display = "none";
  titleInput?.classList.remove("input-error");

  setTimeout(() => {
    modal.classList.add("active");
    titleInput?.focus();
  }, 10);
}

function closeModal() {
  if (!modal) return;

  modal.classList.remove("active");
  document.body.style.overflow = "";
  setDefaultModalState();

  // ★ [핵심 수정] 모달이 닫히는 즉시 포커스를 안전하게 모달 외부로 돌려보냅니다.
  // 모달 내부의 닫기 버튼에 포커스가 묶인 채 aria-hidden이 true가 되는 현상을 방지합니다.
  if (lastActiveElement && typeof lastActiveElement.focus === "function") {
    lastActiveElement.focus();
  } else {
    // 기억된 이전 포커스 요소가 없다면 안전하게 "+ 새 할 일" 버튼으로 포커스를 보냅니다.
    openButton?.focus();
  }

  setTimeout(() => {
    if (!modal.classList.contains("active")) {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    }
  }, 300);
}

export function getTasks() {
  const stored = flowdashTodos.get("tasks");
  return Array.isArray(stored) ? stored : [];
}

function saveTasks(tasks) {
  flowdashTodos.set("tasks", tasks);
}

function getPriorityValue(priorityText) {
  const normalized = sanitize(priorityText).trim().toLowerCase();
  if (normalized.includes("높음") || normalized.includes("high")) return "HIGH";
  if (normalized.includes("중간") || normalized.includes("mid")) return "MID";
  if (normalized.includes("낮음") || normalized.includes("low")) return "LOW";
  return "MID";
}

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

function deleteTaskById(taskId) {
  const storedTasks = getTasks();
  const nextTasks = storedTasks.filter(
    (task) => String(task.id) !== String(taskId),
  );
  saveTasks(nextTasks);
  renderTodos(nextTasks);
}

function saveData(e) {
  if (e) e.preventDefault();
  const title = titleInput?.value.trim();
  const content = descInput?.value.trim();

  const titleError = document.querySelector(".error-message");

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

titleInput?.addEventListener("input", function () {
  if (!hasSubmitted) return;

  const titleError = document.querySelector(".error-message");
  if (titleInput.value.trim() !== "") {
    if (titleError) titleError.style.display = "none";
    titleInput.classList.remove("input-error");
  } else {
    if (titleError) titleError.style.display = "inline";
    titleInput.classList.add("input-error");
  }
});

function handleModalSubmit(event) {
  if (event) event.preventDefault();
  const saved = saveData(event);
  if (!saved) return;

  window.dispatchEvent(new Event("todoUpdated"));
  closeModal();
}

// =========================================================================
// 안전하게 바인딩된 글로벌 모달 리스너 모음
// =========================================================================
openButton?.addEventListener("click", () => openModal());
closeButton?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

// ESC 키 글로벌 리스너 단 하나로 제한하여 결합
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal && !modal.hidden) {
    closeModal();
  }
});

form?.addEventListener("submit", handleModalSubmit);

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && modal && !modal.hidden) {
    const activeEl = document.activeElement;
    // textarea나 다른 컨트롤 내부에서의 무조건적인 전송 방지
    if (activeEl !== descInput) {
      handleModalSubmit(event);
    }
  }
});

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

// =========================================================================
// 성능 최적화: 드롭다운 제어 이벤트 위임 (Event Delegation) 적용
// =========================================================================
function closeAllDropdowns() {
  document.querySelectorAll(".dropdown").forEach((dropdown) => {
    dropdown.removeAttribute("open");
    dropdown.classList.remove("is-open", "is-close");
  });
}

// 이벤트 중복 추가 없이 전역 클릭 한 번으로 모든 드롭다운 통제
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

// Render helpers
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

      const li = document.createElement("li");
      li.className = "list-item";

      const p = document.createElement("p");
      p.className = `${specificClass} null-data`;
      p.textContent = messageText; // XSS 방어

      li.appendChild(p);
      ul.appendChild(li);
    });
}

function updateCounts(tasks) {
  if (!tasks || !Array.isArray(tasks)) return;

  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const doingCount = tasks.filter((t) => t.status === "DOING").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  document
    .querySelectorAll(".todo-count")
    .forEach((el) => (el.textContent = String(todoCount)));
  document
    .querySelectorAll(".doing-count")
    .forEach((el) => (el.textContent = String(doingCount)));
  document
    .querySelectorAll(".done-count")
    .forEach((el) => (el.textContent = String(doneCount)));

  const totalEl = document.querySelector(".card-count-total");
  if (totalEl) totalEl.textContent = String(tasks.length);
  const achieved = tasks.length
    ? Math.round((doneCount / tasks.length) * 100)
    : 0;
  const achievedEl = document.querySelector(".achieved-rate");
  if (achievedEl) achievedEl.textContent = `${achieved}%`;
}

function formatDate(ms) {
  const date = new Date(ms);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}. ${month}. ${day} ${hours}:${minutes}`;
}

function createTodoElement(todo) {
  let targetNullClass = "";
  if (todo.status === "TODO") {
    targetNullClass = ".todo-null-data";
  } else if (todo.status === "DOING") {
    targetNullClass = ".doing-null-data";
  } else if (todo.status === "DONE") {
    targetNullClass = ".done-null-data";
  }

  if (targetNullClass) {
    const nullItems = document.querySelectorAll(targetNullClass);
    nullItems.forEach((item) => {
      item.hidden = true;
    });
  }

  const li = document.createElement("li");
  li.className = "board-item";

  const hiddenCard = document.querySelector("#hidden-card");
  if (hiddenCard) {
    const cloned = hiddenCard.cloneNode(true);
    cloned.removeAttribute("id");
    cloned.hidden = false;
    cloned.style.display = "";
    cloned.dataset.id = String(todo.id);

    const prio = cloned.querySelector(".todo-priority-icon");
    if (prio) {
      prio.textContent = sanitize(todo.priority);
      prio.classList.remove("priority-high", "priority-mid", "priority-low");
      prio.classList.add(getPriorityClass(todo.priority));
    }

    const titleEl = cloned.querySelector(".todo-title");
    if (titleEl) titleEl.textContent = todo.title || "";

    const descEl = cloned.querySelector(".todo-desc");
    if (descEl) descEl.textContent = todo.content || "";

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

    cloned.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

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

      cloned.addEventListener("mouseenter", showCloseIcon);
      cloned.addEventListener("mouseleave", hideCloseIcon);
      cloned.addEventListener("focusin", showCloseIcon);
      cloned.addEventListener("focusout", (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          hideCloseIcon();
        }
      });

      closeIcon.addEventListener("click", (event) => {
        event.stopPropagation();
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

        // 메모리 누수 방지 이벤트 수거 함수 구성
        const handleClose = () => {
          closeResetModal(deleteModal);
          document.removeEventListener("keydown", handleKeyDown); // 글로벌 리스너 즉각 수거
        };

        const handleConfirm = () => {
          deleteTask();
          handleClose();
        };

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

    function deleteTask() {
      const closestCard = closeIcon.closest(".todo-container");
      const taskId = closestCard?.dataset.id;
      if (taskId) {
        deleteTaskById(taskId);
      }
    }
    cloned.addEventListener("click", (event) => {
      if (event.target.closest(".todo-close-icon")) return;
      openModal(todo);
    });

    li.appendChild(cloned);
  } else {
    li.textContent = `${todo.title} - ${todo.priority}`;
  }

  return li;
}

export function renderTodos(todoList) {
  const tasks = Array.isArray(todoList) ? todoList : getTasks();
  clearBoardLists();

  const todoUl = document.querySelector(".todo-list");
  const doingUl = document.querySelector(".doing-list");
  const doneUl = document.querySelector(".done-list");

  tasks.forEach((t) => {
    const el = createTodoElement(t);
    if (t.status === "DOING" && doingUl) doingUl.append(el);
    else if (t.status === "DONE" && doneUl) doneUl.append(el);
    else if (todoUl) todoUl.appendChild(el);
  });

  const allTasksForStats = getTasks();
  updateCounts(allTasksForStats);
}

// 전체 데이터 초기화
const resetButton = document.querySelector(
  ".reset-data-button:not(.reset-filter-button)",
);

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
  document.body.style.overflow = "hidden";

  const handleClose = () => {
    closeResetModal(resetModal);
    document.removeEventListener("keydown", handleKeyDown); // 리스너 완벽 수거
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

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

  resetModal.addEventListener("click", (event) => {
    if (event.target === resetModal) {
      handleClose();
    }
  });

  document.addEventListener("keydown", handleKeyDown);
}

function closeResetModal(resetModal) {
  if (!resetModal) return;

  resetModal.classList.add("closing");

  setTimeout(() => {
    const resetModalContent = resetModal.querySelector(".reset-modal-content");

    if (resetModalContent) {
      resetModalContent.setAttribute("hidden", "true");
      document.body.append(resetModalContent);
    }

    resetModal.remove();
    document.body.style.overflow = "";
  }, 200);
}

function resetAllTasks() {
  saveTasks([]);
  renderTodos([]);
}

// 초기 렌더 및 트리거 바인딩
renderTodos(getTasks());

resetButton?.addEventListener("click", () => {
  openResetModal();
});
