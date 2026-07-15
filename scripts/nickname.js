import { createStorage } from "./storage.js";

const nicknameStorage = createStorage("flowdash-nickname");
const nicknameElement = document.querySelector(".greeting-nickname");

// 1. 성능 최적화: 텍스트 너비 측정을 위한 임시 span 요소를 단 한 번만 생성하여 재사용합니다.
const measureSpan = document.createElement("span");
measureSpan.style.visibility = "hidden";
measureSpan.style.position = "absolute";
measureSpan.style.whiteSpace = "pre";
measureSpan.style.top = "-9999px";
measureSpan.style.left = "-9999px";
document.body.append(measureSpan);

// 저장된 닉네임 가져오기 및 초기화
if (nicknameElement) {
  const savedNickname = nicknameStorage.get("nickname");
  nicknameElement.textContent = savedNickname || "Flowdash";

  // 닉네임 클릭 시 에디터 전환 이벤트 바인딩
  nicknameElement.addEventListener("click", handleNicknameClick);
}

function handleNicknameClick() {
  if (!nicknameElement) return;

  // input 요소 생성 및 스타일 주입
  const input = document.createElement("input");
  input.value = nicknameElement.textContent.trim();

  input.style.color = "var(--theme-text)";
  input.style.border = "1px solid var(--theme-text)";
  input.style.font = "inherit";
  input.style.background = "transparent";
  input.style.padding = "0 2px";
  input.style.outline = "none";
  input.style.boxSizing = "content-box";

  // 글자 길이에 맞게 input 너비를 조절하는 함수
  function resizeInput() {
    measureSpan.textContent = input.value || " ";
    measureSpan.style.font = getComputedStyle(input).font;
    input.style.width = `${measureSpan.offsetWidth + 6}px`;
  }

  // 기존 닉네임을 input으로 교체
  nicknameElement.replaceWith(input);
  input.focus();
  resizeInput();

  // 중복 실행 방지 플래그 (Enter 입력 시 blur가 연달아 발생하는 중복 호출 방지)
  let isSaving = false;

  // 닉네임 저장 및 복구 함수
  function saveNickname() {
    if (isSaving) return;
    isSaving = true;

    const newNickname = input.value.trim();
    const finalNickname = newNickname || "Flowdash";

    // 데이터 저장 및 화면 갱신
    nicknameStorage.set("nickname", finalNickname);
    nicknameElement.textContent = finalNickname;

    // 요소 원상 복구 및 이벤트 핸들러 정리(메모리 누수 방지)
    cleanupEvents();
    input.replaceWith(nicknameElement);
  }

  // 엔터 키 다운 이벤트 핸들러
  function handleKeyDown(event) {
    if (event.key === "Enter") {
      saveNickname();
    }
  }

  // 메모리 누수를 완전히 방지하기 위한 리스너 정리 함수
  function cleanupEvents() {
    input.removeEventListener("input", resizeInput);
    input.removeEventListener("keydown", handleKeyDown);
    input.removeEventListener("blur", saveNickname);
  }

  // 이벤트 리스너 등록
  input.addEventListener("input", resizeInput);
  input.addEventListener("keydown", handleKeyDown);
  input.addEventListener("blur", saveNickname);
}
