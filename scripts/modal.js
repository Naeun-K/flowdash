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

let currentSelectedStatus = "TODO"; // internal status: TODO, DOING, DONE

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
  currentSelectedStatus = "TODO";
}

function openModal() {
  if (!modal) return;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setDefaultModalState();
  requestAnimationFrame(() => titleInput?.focus());
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  form?.reset();
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
    // accessible alert
    window.alert("제목을 입력해주세요.");
    return;
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
    id: Date.now(),
    title,
    content,
    priority,
    status: currentSelectedStatus,
  };

  const tasks = getTasks();
  tasks.push(taskData);
  saveTasks(tasks);
  renderTodos(tasks);
}

openButton?.addEventListener("click", openModal);
closeButton?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal?.hidden) closeModal();
});

saveButton?.addEventListener("click", () => {
  saveData();
  setDefaultModalState();
  closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !modal?.hidden) {
    saveData();
    closeModal();
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

dropdownItems.forEach((item) => {
  item.addEventListener("click", () => {
    const statusText = item.textContent.trim();
    const statusLabel = dropdownToggle?.querySelector(".modal-status-label");
    if (statusLabel) statusLabel.textContent = statusText;
    currentSelectedStatus = mapStatusLabelToInternal(statusText);
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

    const deleteButtonSvg = cloned.querySelector(".bi-x");
    if (deleteButtonSvg) {
      deleteButtonSvg.addEventListener("click", (event) => {
        event.stopPropagation();
        const closestCard = deleteButtonSvg.closest(".todo-container");
        const taskId = closestCard?.dataset.id;
        if (taskId) {
          deleteTaskById(taskId);
        }
      });
    }

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

// 초기 렌더
renderTodos(getTasks());

// XSS 방지 위해 textContent 만 사용
export {};
