import { createStorage } from "./storage.js";

/**
 * @namespace nicknameStorage
 * @description 로컬 스토리지에 사용자 지정 닉네임을 저장하고 불러오기 위한 스토리지 인스턴스
 */
const nicknameStorage = createStorage("flowdash-nickname");

/**
 * 대시보드 환영 인사 영역에 표시될 닉네임 DOM 요소입니다.
 * @type {HTMLElement|null}
 */
const nicknameElement = document.querySelector(".greeting-nickname");

/**
 * 텍스트 입력 시 길이에 따라 입력창(Input)의 가로 크기를 동적으로 조절하기 위해
 * 보이지 않는 곳에서 실제 폰트 크기와 넓이를 연산하는 가상의 임시 컨테이너 요소입니다.
 * @type {HTMLSpanElement}
 */
const measureSpan = document.createElement("span");
measureSpan.style.visibility = "hidden";
measureSpan.style.position = "absolute";
measureSpan.style.whiteSpace = "pre";
measureSpan.style.top = "-9999px";
measureSpan.style.left = "-9999px";
document.body.append(measureSpan);

// 닉네임 요소가 존재할 경우, 스토리지 데이터를 로드하고 클릭 이벤트를 연동합니다.
if (nicknameElement) {
  const savedNickname = nicknameStorage.get("nickname");
  nicknameElement.textContent = savedNickname || "Flowdash";

  nicknameElement.addEventListener("click", handleNicknameClick);
}

/**
 * 닉네임 텍스트 영역 클릭 시, 인라인 텍스트를 즉시 편집 가능한 `<input>` 박스로 변경합니다.
 * - 입력 상자의 크기를 입력 글자 길이에 맞춰 실시간으로 반응형 리사이징 처리합니다.
 * - 포커스를 잃거나(`blur`), `Enter` 입력 시 자동으로 내용을 로컬 스토리지에 세이브하고 원래 상태로 복원합니다.
 *
 * @function handleNicknameClick
 * @returns {void}
 */
function handleNicknameClick() {
  if (!nicknameElement) return;

  // 1. 닉네임 편집을 위한 <input> 요소 동적 생성 및 스타일 복제
  const input = document.createElement("input");
  input.value = nicknameElement.textContent.trim();

  input.style.color = "var(--theme-text)";
  input.style.border = "1px solid var(--theme-text)";
  input.style.font = "inherit";
  input.style.background = "transparent";
  input.style.padding = "0 2px";
  input.style.outline = "none";
  input.style.boxSizing = "content-box";

  /**
   * 보이지 않는 측정 레이어(measureSpan)에 현재 입력 중인 값을 복제 주입하고,
   * 계산된 너비값을 기준 삼아 인풋 상자의 너비(`width`)를 실시간으로 맞춤 조절합니다.
   */
  function resizeInput() {
    measureSpan.textContent = input.value || " ";
    measureSpan.style.font = getComputedStyle(input).font;
    input.style.width = `${measureSpan.offsetWidth + 6}px`;
  }

  // 2. 텍스트 노드를 인풋 요소로 교체 및 포커싱 기동
  nicknameElement.replaceWith(input);
  input.focus();
  resizeInput();

  // 연속 저장 동작 및 이벤트 충돌을 완화하기 위한 토글 플래그
  let isSaving = false;

  /**
   * 사용자가 입력을 완료한 시점에 변경된 닉네임을 최종 검증하고 영구 보관합니다.
   * - 비어있는 값은 강제로 디폴트 이름('Flowdash')으로 수렴합니다.
   */
  function saveNickname() {
    if (isSaving) return;
    isSaving = true;

    const newNickname = input.value.trim();
    const finalNickname = newNickname || "Flowdash";

    // 데이터 저장 및 렌더링 텍스트 업데이트
    nicknameStorage.set("nickname", finalNickname);
    nicknameElement.textContent = finalNickname;

    // 이벤트 리스너 리소스를 일괄 해제하고 복귀 처리
    cleanupEvents();
    input.replaceWith(nicknameElement);
  }

  /**
   * 인풋 박스 내 키 이벤트 발생 시 작동하는 단축 핸들러입니다.
   * - 'Enter' 키 확인 시 조작을 멈추고 저장을 진행합니다.
   * @param {KeyboardEvent} event - 키보드 조작 이벤트 객체
   */
  function handleKeyDown(event) {
    if (event.key === "Enter") {
      saveNickname();
    }
  }

  /**
   * 가비지 컬렉션 유도 및 메모리 누수 방지를 위한 바인딩 해제 헬퍼 함수입니다.
   */
  function cleanupEvents() {
    input.removeEventListener("input", resizeInput);
    input.removeEventListener("keydown", handleKeyDown);
    input.removeEventListener("blur", saveNickname);
  }

  // 인풋 태그 전용 실시간 관찰 이벤트 바인딩
  input.addEventListener("input", resizeInput);
  input.addEventListener("keydown", handleKeyDown);
  input.addEventListener("blur", saveNickname);
}

export { nicknameElement };
