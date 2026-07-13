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

export function getTasks() {
  const stored = flowdashTodos.get("tasks");
  return Array.isArray(stored) ? stored : [];
}

function saveTasks(tasks) {
  flowdashTodos.set("tasks", tasks);
  console.log(flowdashTodos);
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
  const title = titleInput?.value.trim();
  const content = descInput?.value.trim();

  if (!title) return;

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
  // 3. [해결] 블록 외부에서 먼저 모든 타임스탬프 기본값을 선언합니다 (스코프 문제 해결).
  let createdAt = prevTask?.createdAt || null;
  let updatedAt = prevTask?.updatedAt || null;
  let completedAt = prevTask?.completedAt || null;

  const now = Date.now();

  // 4. [해결] 드롭다운 상태 값에 맞춰 해당되는 타임스탬프만 '그때그때' 갱신
  switch (currentSelectedStatus) {
    case "TODO":
      // 기존에 없었을 때만 최초 생성 시간을 기록합니다.
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

  // const tasks = getTasks();
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

// 페이지 로드 시 드롭다운 이벤트 초기화
function initDropdowns() {
  const dropdowns = document.querySelectorAll(".dropdown");

  dropdowns.forEach((dropdown) => {
    const items = dropdown.querySelectorAll(".dropdown-item");
    const button = dropdown.querySelector(".dropdown-button");

    // 1. 드롭다운 내부 아이템을 클릭했을 때
    items.forEach((item) => {
      item.addEventListener("click", (e) => {
        // 클릭 시 강제로 닫기 클래스 추가
        // dropdown.classList.remove("is-open");
        // dropdown.classList.add("is-close");
        // button?.setAttribute("aria-expanded", "false");

        // // 포커스 해제 (필요 시)
        // document.activeElement.blur();
        const details = item.closest(".dropdown");

        if (details) {
          details.removeAttribute("open"); // open 속성을 제거하여 드롭다운을 닫음
        }
      });
    });

    // 2. 마우스가 드롭다운 영역을 완전히 벗어났을 때 (상태 초기화)
    // 이 처리를 해줘야 다음에 마우스를 다시 올렸을 때 정상적으로 열립니다.
    dropdown.addEventListener("mouseleave", () => {
      dropdown.classList.remove("is-close");
      dropdown.classList.remove("is-open");
    });
  });
}

// 스크립트 실행
document.addEventListener("DOMContentLoaded", initDropdowns);

document.querySelectorAll(".dropdown").forEach((dropdown) => {
  const button = dropdown.querySelector(".dropdown-button");
  button?.addEventListener("click", (event) => {
    event.stopPropagation();
    initDropdowns(dropdown);
  });

  dropdown.querySelectorAll(".dropdown-menu .dropdown-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      initDropdowns(dropdown);
    });
  });
});

document.addEventListener("click", () => initDropdowns());

dropdownItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    event.stopPropagation();
    const statusText = item.textContent.trim();
    const statusLabel = dropdownToggle?.querySelector(".modal-status-label");
    if (statusLabel) statusLabel.textContent = statusText;
    currentSelectedStatus = mapStatusLabelToInternal(statusText);
    // closeAllDropdowns(item.closest(".dropdown"));
    initDropdowns(item.closest(".dropdown"));
  });
});

// Render helpers
function clearBoardLists() {
  document
    .querySelectorAll(".todo-list, .doing-list, .done-list")
    .forEach((ul) => {
      ul.textContent = "";

      // 2. 각 클래스에 맞는 텍스트 메시지 분기
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

      // 3. DOM 메서드를 이용해 안전하게 태그 생성 및 조립
      const li = document.createElement("li");
      li.className = "list-item";
      // 초기 상태로 화면에 보여야 하므로 hidden 속성은 넣지 않거나 false로 설정합니다.

      const p = document.createElement("p");
      // 기존 마크업의 클래스 구조 반영 (.null-data와 고유 클래스)
      p.className = `${specificClass} null-data`;
      p.textContent = messageText; // 💡 textContent를 사용하여 XSS 완벽 방어

      // 4. 구조 결합 후 ul에 추가
      li.appendChild(p);
      ul.appendChild(li);
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
function formatDate(ms) {
  const date = new Date(ms);

  const year = date.getFullYear();
  // padStart를 사용하면 1자리 수일 때 앞에 0을 붙여줄 수 있습니다 (예: 04월, 08일)
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}. ${month}. ${day} ${hours}:${minutes}`;
}

function createTodoElement(todo) {
  // 1. 상태(status)에 맞는 '데이터 없음' 안내 문구만 선택해서 숨깁니다.
  let targetNullClass = "";
  if (todo.status === "TODO") {
    targetNullClass = ".todo-null-data";
  } else if (todo.status === "DOING") {
    targetNullClass = ".doing-null-data";
  } else if (todo.status === "DONE") {
    targetNullClass = ".done-null-data";
  } else {
    console.log("data가 null일때 나오는 문구 삭제안됨 >>> 가서 버그잡아라~");
  }

  if (targetNullClass) {
    const nullItems = document.querySelectorAll(targetNullClass);
    // NodeList 내부의 각 요소에 hidden 속성을 안전하게 부여합니다.
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
    if (titleEl) titleEl.textContent = sanitize(todo.title);

    const descEl = cloned.querySelector(".todo-desc");
    if (descEl) descEl.textContent = sanitize(todo.content);

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
        //생성한 모달을 화면에 추가
        document.body.append(deleteModal);

        //모달이 열려 있는 도앙나 뒤족 화면 스크롤 방지
        document.body.style.overflow = "hidden";

        // 공통 닫기 함수 (메모리 누수 방지를 위한 이벤트 제거 포함)
        const handleClose = () => {
          closeResetModal(deleteModal); // 모달 페이드아웃 및 remove() 처리 함수
          document.removeEventListener("keydown", handleKeyDown); // 리스너 해제 필수!
        };

        // 공통 실행 함수
        const handleConfirm = () => {
          deleteTask();
          handleClose();
        };

        // ⭐ 핵심 2: 엔터/ESC 버그를 잡기 위한 키보드 핸들러 통합
        const handleKeyDown = (event) => {
          if (event.key === "Escape") {
            handleClose();
          }
          if (event.key === "Enter") {
            event.preventDefault(); // 엔터 키의 기본 브라우저 동작 막기
            handleConfirm();
          }
        };

        // 5. 이벤트 리스너 등록
        cancelDeleteBtn?.addEventListener("click", handleClose);
        doDeleteBtn?.addEventListener("click", handleConfirm);

        document.addEventListener("keydown", handleKeyDown);

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

  updateCounts(tasks);
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
  // const resetModalContent = document.querySelector(".reset-modal-content");
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
  // 공통 닫기 함수 (메모리 누수 방지를 위한 이벤트 제거 포함)
  const handleClose = () => {
    closeResetModal(resetModal); // 모달 페이드아웃 및 remove() 처리 함수
    document.removeEventListener("keydown", handleKeyDown); // 리스너 해제 필수!
  };

  // 공통 실행 함수
  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  // ⭐ 핵심 2: 엔터/ESC 버그를 잡기 위한 키보드 핸들러 통합
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      handleClose();
    }
    if (event.key === "Enter") {
      event.preventDefault(); // 엔터 키의 기본 브라우저 동작 막기
      handleConfirm();
    }
  };

  // 5. 이벤트 리스너 등록
  cancelButton?.addEventListener("click", handleClose);
  confirmResetButton?.addEventListener("click", handleConfirm);

  // //취소 버튼 클릭 시 모달 닫기
  // cancelButton?.addEventListener("click", () => {
  //   closeResetModal(resetModal);
  // });

  // //전체 삭제 버튼 클릭시 모든 할일 삭제후 모달 닫기
  // confirmResetButton?.addEventListener("click", () => {
  //   resetAllTasks();
  //   closeResetModal(resetModal);
  // });
  // //전체 삭제 버튼 클릭시 모든 할일 삭제후 모달 닫기
  // document.addEventListener("keydown", (event) => {
  //   if (event.key === "Escape" && !resetModal?.hidden) {
  //     closeResetModal(resetModal);
  //   }
  // });
  // document.addEventListener("keydown", (event) => {
  //   if (event.key === "Enter" && !resetModal?.hidden) {
  //     resetAllTasks();
  //     closeResetModal(resetModal);
  //   }
  // });
  //모달 바깥 의 어두운 배경을 클릭하면 모달 닫기
  resetModal.addEventListener("click", (event) => {
    if (event.target === resetModal) {
      handleClose();
    }
  });

  document.addEventListener("keydown", handleKeyDown);
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

// 초기 렌더
renderTodos(getTasks());

resetButton?.addEventListener("click", () => {
  openResetModal();
});
