import { createStorage } from "./storage.js"; // 안전한 로컬스토리지 래퍼

const flowdashTodos = createStorage("flowdash-todos");

const modal = document.querySelector(".new-task-modal");
const openButton = document.querySelector(".add-task-button");
const closeButton = document.querySelector(".modal-close-button");
const saveButton = document.querySelector(".modal-submit-button");
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

  if (titleInput) titleInput.value = sanitize(task.title);
  if (descInput) descInput.value = sanitize(task.content);

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
  if (statusLabel)
    statusLabel.textContent =
      task.status === "DOING"
        ? "진행중"
        : task.status === "DONE"
          ? "완료"
          : "할 일";
  currentSelectedStatus = mapStatusLabelToInternal(task.status || "TODO");
  if (modalTitle) modalTitle.textContent = "할 일 수정";
  if (modalSubmitButton) modalSubmitButton.textContent = "수정하기";
  editingTaskId = String(task.id);
}

function openModal(task = null) {
  if (!modal) return;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  populateModal(task);
  requestAnimationFrame(() => titleInput?.focus());
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  setDefaultModalState();
}

function getTasks() {
  const stored = flowdashTodos.get("tasks");
  return Array.isArray(stored) ? stored : [];
}

function saveTasks(tasks) {
  flowdashTodos.set("tasks", tasks);
}

function sanitize(text) {
  return text == null ? "" : String(text);
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

  const title = sanitize(titleInput?.value).trim();
  const content = sanitize(descInput?.value).trim();

  if (!title) {
    window.alert("제목을 입력해주세요.");
    return false;
  }

  const selectedRadio = document.querySelector(
    'input[name="priority"]:checked',
  );
  let priority = "중간";
  if (selectedRadio) {
    const label = document.querySelector(`label[for="${selectedRadio.id}"]`);
    priority = (label?.textContent || selectedRadio.value || priority).trim();
  }

  const taskData = {
    id: editingTaskId ? Number(editingTaskId) : Date.now(),
    title,
    content,
    priority,
    status: currentSelectedStatus,
  };

  const tasks = getTasks();
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

function handleModalSubmit(event) {
  if (event) event.preventDefault();
  const saved = saveData(event);
  if (!saved) return;
  closeModal();
}

openButton?.addEventListener("click", () => openModal());
closeButton?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal?.hidden) closeModal();
});

form?.addEventListener("submit", handleModalSubmit);

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !modal?.hidden) {
    handleModalSubmit(event);
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

function closeAllDropdowns(excludingDropdown = null) {
  document.querySelectorAll(".dropdown").forEach((dropdown) => {
    if (dropdown === excludingDropdown) return;
    dropdown.classList.remove("is-open");
    const button = dropdown.querySelector(".dropdown-button");
    button?.setAttribute("aria-expanded", "false");
  });
}

function toggleDropdown(dropdown) {
  const button = dropdown.querySelector(".dropdown-button");
  const isOpen = dropdown.classList.contains("is-open");
  closeAllDropdowns(dropdown);
  if (!isOpen) {
    dropdown.classList.add("is-open");
    button?.setAttribute("aria-expanded", "true");
  } else {
    button?.setAttribute("aria-expanded", "false");
  }
}

document.querySelectorAll(".dropdown").forEach((dropdown) => {
  const button = dropdown.querySelector(".dropdown-button");
  button?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleDropdown(dropdown);
  });

  dropdown.querySelectorAll(".dropdown-menu .dropdown-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      closeAllDropdowns(dropdown);
    });
  });
});

document.addEventListener("click", () => closeAllDropdowns());

dropdownItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    event.stopPropagation();
    const statusText = item.textContent.trim();
    const statusLabel = dropdownToggle?.querySelector(".modal-status-label");
    if (statusLabel) statusLabel.textContent = statusText;
    currentSelectedStatus = mapStatusLabelToInternal(statusText);
    closeAllDropdowns(item.closest(".dropdown"));
  });
});

// Render helpers
function clearBoardLists() {
  document
    .querySelectorAll(".todo-list, .doing-list, .done-list")
    .forEach((ul) => {
      ul.textContent = "";
    });
}

function updateCounts(tasks) {
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

  // statistics totals
  const totalEl = document.querySelector(".card-count-total");
  if (totalEl) totalEl.textContent = String(tasks.length);
  const achieved = tasks.length
    ? Math.round((doneCount / tasks.length) * 100)
    : 0;
  const achievedEl = document.querySelector(".achieved-rate");
  if (achievedEl) achievedEl.textContent = `${achieved}%`;
}

function createTodoElement(todo) {
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
    if (titleEl) titleEl.textContent = sanitize(todo.title);

    const descEl = cloned.querySelector(".todo-desc");
    if (descEl) descEl.textContent = sanitize(todo.content);

    const updateTodoTime = cloned.querySelector("#update-todo-time");
    const updateDoneTime = cloned.querySelector("#update-done-time");
    const when = new Date(todo.id);
    const whenText = `${when.getFullYear()}. ${String(when.getMonth() + 1).padStart(2, "0")}. ${String(when.getDate()).padStart(2, "0")} ${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}`;
    if (updateTodoTime) updateTodoTime.textContent = whenText;
    if (updateDoneTime) updateDoneTime.textContent = whenText;

    if (todo.status === "DONE") {
      cloned.classList.add("completed-task");
      const doneTimeContainer = cloned.querySelector(".done-time");
      if (doneTimeContainer) {
        doneTimeContainer.removeAttribute("hidden");
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
        const deleteModalContent = document.querySelector(
          ".reset-modal-content",
        );
        const deletModalTitle = document.querySelector("#reset-modal-title");
        const deletModalDesc = document.querySelector(
          ".reset-modal-description",
        );
        const cancelDeleteBtn = document.querySelector(".reset-modal-cancel");
        const doDeleteBtn = document.querySelector(".reset-modal-confirm");

        if (deleteModalContent) {
          deleteModalContent.removeAttribute("hidden");
          deletModalTitle.textContent = "할 일 삭제";
          deletModalDesc.textContent =
            "이 할 일을 정말로 삭제하시겠습니까?\n삭제된 할 일은 복구할 수 없습니다.";
          doDeleteBtn.textContent = "삭제";
        }

        deleteModal.append(deleteModalContent);
        //생성한 모달을 화면에 추가
        document.body.append(deleteModal);

        //모달이 열려 있는 도앙나 뒤족 화면 스크롤 방지
        document.body.style.overflow = "hidden";

        //취소 버튼 클릭 시 모달 닫기
        cancelDeleteBtn?.addEventListener("click", () => {
          closeResetModal(deleteModal);
        });

        //전체 삭제 버튼 클릭시 모든 할일 삭제후 모달 닫기
        doDeleteBtn?.addEventListener("click", () => {
          deleteTask();
          closeResetModal(deleteModal);
        });
        document.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && !deleteModal?.hidden) {
            closeResetModal(deleteModal);
          }
        });
        document.addEventListener("keydown", (event) => {
          if (event.key === "Enter" && !deleteModal?.hidden) {
            deleteTask();
            closeResetModal(deleteModal);
          }
        });
        //모달 바깥 의 어두운 배경을 클릭하면 모달 닫기
        deleteModal.addEventListener("click", (event) => {
          if (event.target === deleteModal) {
            closeResetModal(deleteModal);
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
    // fallback simple element
    li.textContent = `${todo.title} - ${todo.priority}`;
  }

  return li;
}

function renderTodos(todoList) {
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

  updateCounts(tasks);
}
// 전체 데이터 초기화
const resetButton = document.querySelector(".reset-data-button");

function openResetModal() {
  const existingOverlay = document.querySelector(".reset-modal-overlay");
  if (existingOverlay) existingOverlay.remove();

  const resetModal = document.createElement("div");
  resetModal.classList.add("reset-modal-overlay");
  const resetModalContent = document.querySelector(".reset-modal-content");
  const resetModalDesc = document.querySelector(".reset-modal-description");
  const resetModalTitle = document.querySelector("#reset-modal-title");
  const cancelButton = document.querySelector(".reset-modal-cancel");
  const confirmResetButton = document.querySelector(".reset-modal-confirm");

  if (resetModalContent) {
    resetModalContent.removeAttribute("hidden");
    resetModalTitle.textContent = "데이터 초기화";
    resetModalDesc.textContent =
      "정말로 모든 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.";
    confirmResetButton.textContent = "전체 삭제";
  }

  resetModal.append(resetModalContent);
  //생성한 모달을 화면에 추가
  document.body.append(resetModal);

  //모달이 열려 있는 도앙나 뒤족 화면 스크롤 방지
  document.body.style.overflow = "hidden";

  //취소 버튼 클릭 시 모달 닫기
  cancelButton?.addEventListener("click", () => {
    closeResetModal(resetModal);
  });

  //전체 삭제 버튼 클릭시 모든 할일 삭제후 모달 닫기
  confirmResetButton?.addEventListener("click", () => {
    resetAllTasks();
    closeResetModal(resetModal);
  });
  //전체 삭제 버튼 클릭시 모든 할일 삭제후 모달 닫기
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !resetModal?.hidden) {
      closeResetModal(resetModal);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !resetModal?.hidden) {
      resetAllTasks();
      closeResetModal(resetModal);
    }
  });
  //모달 바깥 의 어두운 배경을 클릭하면 모달 닫기
  resetModal.addEventListener("click", (event) => {
    if (event.target === resetModal) {
      closeResetModal(resetModal);
    }
  });
}

// 전체 초기화 확인 모달 닫기 (닫기 애니메이션 적용)
function closeResetModal(resetModal) {
  if (!resetModal) return;

  // 1. 닫기 애니메이션 클래스 추가
  resetModal.classList.add("closing");

  // 2. 애니메이션 시간(0.2초 = 200ms) 뒤에 한 번에 처리
  setTimeout(() => {
    const resetModalContent = resetModal.querySelector(".reset-modal-content");

    if (resetModalContent) {
      // 콘텐츠 숨기고 body로 안전하게 대피 복구
      resetModalContent.setAttribute("hidden", "true");
      document.body.append(resetModalContent);
    }

    // 대피 시킨 후 오버레이 삭제 및 스크롤 복구
    resetModal.remove();
    document.body.style.overflow = "";
  }, 200); // 👈 사용 중인 CSS 닫기 애니메이션 시간에 맞추세요 (0.3초면 300)
}

// 저장된 모든 할 일 데이터 초기화
function resetAllTasks() {
  // 로컬스토리지의 tasks 값을 빈 배열로 변경
  saveTasks([]);
  //화면의 할 일 목록과 통계도 빈 배열 기준을 다시 렌더링
  renderTodos([]);
}
// 전체 데이터 초기화 버튼 클릭 시  확인 모달 열기;
resetButton?.addEventListener("click", openResetModal);

// 초기 렌더
renderTodos(getTasks());

// XSS 방지 위해 textContent 만 사용
export {};
