import { createStorage } from "./storage.js"; // 확장자 .js 필수

// 'userApp' 이라는 이름의 스토리지 생성
const flowdashTodos = createStorage("flowdash-todos");

// 1. DOM 요소 선택 (실제 HTML 구조의 id/class에 맞게 수정 필요)
const taskModal = document.querySelector(".modal-content"); // 새 할 일 모달창
const saveBtn = document.querySelector(".modal-submit-button"); // 저장하기 버튼
const cancelBtn = document.querySelector(".modal-close-button"); // 취소 버튼

const titleInput = document.querySelector(".modal-input[required]"); // 제목 입력창
const descInput = document.querySelector(".modal-textarea"); // 내용 입력창

// 상태 드롭다운
const dropdownToggle =
  document.querySelector(".dropdown-toggle") ||
  document.querySelector('.modal [class*="select"]'); // 클릭하는 버튼/영역
const dropdownMenu =
  document.querySelector(".dropdown-menu") ||
  document.querySelector(".modal ul"); // li들을 감싸는 ul
const dropdownItems = document.querySelectorAll(".modal ul li"); // 상태 옵션 리스트들

const dropdownToggle =
  document.querySelector(".dropdown-toggle") ||
  document.querySelector('.modal [class*="select"]'); // 클릭하는 버튼/영역
const dropdownMenu =
  document.querySelector(".dropdown-menu") ||
  document.querySelector(".modal ul"); // li들을 감싸는 ul
const dropdownItems = document.querySelectorAll(".modal ul li"); // 상태 옵션 리스트들

// 각 상태별 보드 리스트 영역 (할일 / 진행중 / 완료)
const todoListContainer = document.querySelector(".todo-list");
const inProgressListContainer = document.querySelector(".doing-list");
const doneListContainer = document.querySelector(".done-list");

// 통계 및 보드 숫자 카운트 요소들 (Flowdash 상단 및 보드 타이틀 옆 숫자)
const totalTasksCountEl = document.querySelector(".total-tasks-count");
const todoCountEls = document.querySelectorAll(".todo-count"); // 여러 곳에 존재할 수 있으므로 querySelectorAll 권장
const progressCountEls = document.querySelectorAll(".progress-count");
const doneCountEls = document.querySelectorAll(".done-count");

// 현재 드롭다운에서 선택된 상태값을 저장할 변수 (기본값: '할 일')
let currentSelectedStatus = "할 일";

// 2. 초기 셋업 및 커스텀 드롭다운 이벤트 리스너
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  setupDropdown();
});

// [추가] 커스텀 드롭다운 클릭 제어 함수
function setupDropdown() {
  if (!dropdownToggle || !dropdownMenu) return;

  // 드롭다운 버튼 클릭 시 메뉴 열고 닫기
  dropdownToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("show"); // CSS에서 .show 일 때 display: block 처리 필요
  });

  // 각 li(옵션) 클릭 시 값 선택 처리
  dropdownItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      currentSelectedStatus = e.target.textContent.trim(); // 클릭한 텍스트('할 일', '진행중', '완료') 저장

      // 버튼 텍스트를 선택한 값으로 변경 (화면 표시용)
      if (dropdownToggle.querySelector("span")) {
        dropdownToggle.querySelector("span").textContent =
          currentSelectedStatus;
      } else {
        dropdownToggle.textContent = currentSelectedStatus;
      }

      dropdownMenu.classList.remove("show"); // 메뉴 닫기
    });
  });

  // 화면 바깥 클릭 시 드롭다운 닫기
  document.addEventListener("click", () => {
    dropdownMenu.classList.remove("show");
  });
}

// 3. 할 일 저장 이벤트 리스너
saveBtn.addEventListener("click", function (e) {
  e.preventDefault();

  const title = titleInput.value.trim();
  const content = descInput.value.trim();

  // 숨겨진 라디오 input 체크 및 라벨 텍스트 추출
  const selectedRadio = document.querySelector(
    'input[name="priority"]:checked',
  );
  let priority = "낮음";
  if (selectedRadio) {
    const associatedLabel =
      document.querySelector(`label[for="${selectedRadio.id}"]`) ||
      selectedRadio.nextElementSibling;
    if (associatedLabel) {
      priority = associatedLabel.textContent.trim();
    }
  }

  if (!title) {
    alert("제목을 입력해주세요.");
    return;
  }

  const taskData = {
    id: Date.now(),
    title: title,
    content: content,
    priority: priority,
    status: currentSelectedStatus, // 커스텀 드롭다운에서 선택된 값 사용
  };

  saveTaskToLocalStorage(taskData);
  renderTask(taskData);
  updateCounts();

  resetAndCloseModal();
});

// 4. 데이터를 받아 보드에 카드를 추가하는 함수
function renderTask(task) {
  const taskCard = document.createElement("div");
  taskCard.className = `task-card priority-${task.priority}`;
  taskCard.setAttribute("data-id", task.id);

  taskCard.innerHTML = `
        <div class="task-header">
            <span class="badge-${task.priority}">${task.priority}</span>
            <h4>${task.title}</h4>
        </div>
        <p class="task-content">${task.content}</p>
    `;

  // 텍스트 매핑 공백 제거 후 비교
  const statusText = task.status.replace(/\s+/g, "");

  if (statusText === "할일" || statusText === "todo" || statusText === "ToDo") {
    todoListContainer.appendChild(taskCard);
  } else if (
    statusText === "진행중" ||
    statusText === "progress" ||
    statusText === "InProgress"
  ) {
    inProgressListContainer.appendChild(taskCard);
  } else if (
    statusText === "완료" ||
    statusText === "done" ||
    statusText === "Done"
  ) {
    doneListContainer.appendChild(taskCard);
  }
}

// 5. 실시간 개수(카운트) 업데이트 함수
function updateCounts() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  const todoCount = tasks.filter(
    (t) => t.status.replace(/\s+/g, "") === "할일",
  ).length;
  const progressCount = tasks.filter(
    (t) => t.status.replace(/\s+/g, "") === "진행중",
  ).length;
  const doneCount = tasks.filter(
    (t) => t.status.replace(/\s+/g, "") === "완료",
  ).length;
  const totalCount = tasks.length;

  if (totalTasksCountEl) totalTasksCountEl.textContent = totalCount;

  // 여러 곳의 카운트 일괄 업데이트 (상단 대시보드 + 보드 타이틀 옆)
  todoCountEls.forEach((el) => (el.textContent = todoCount));
  progressCountEls.forEach((el) => (el.textContent = progressCount));
  doneCountEls.forEach((el) => (el.textContent = doneCount));
}

// 6. 로컬스토리지 제어 함수들
function saveTaskToLocalStorage(task) {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  if (todoListContainer) todoListContainer.innerHTML = "";
  if (inProgressListContainer) inProgressListContainer.innerHTML = "";
  if (doneListContainer) doneListContainer.innerHTML = "";

  tasks.forEach((task) => renderTask(task));
  updateCounts();
}

// 7. 모달 초기화 및 닫기
function resetAndCloseModal() {
  titleInput.value = "";
  descInput.value = "";

  // 라디오 버튼 초기화 (첫 번째 input 체크)
  const defaultRadio = document.querySelector('input[name="priority"]');
  if (defaultRadio) defaultRadio.checked = true;

  // [수정] 커스텀 드롭다운 초기화 ('할 일'로 되돌리기)
  currentSelectedStatus = "할 일";
  if (dropdownToggle) {
    if (dropdownToggle.querySelector("span")) {
      dropdownToggle.querySelector("span").textContent = "할 일";
    } else {
      dropdownToggle.textContent = "할 일";
    }
  }

  taskModal.classList.remove("show");
}

cancelBtn.addEventListener("click", resetAndCloseModal);
