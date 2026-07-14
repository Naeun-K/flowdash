import { createStorage } from "./storage.js";

const nicknameStorage = createStorage("flowdash-nickname");

const nicknameElement = document.querySelector(".greeting-nickname");

// 저장된 닉네임 가져오기
const savedNickname = nicknameStorage.get("nickname");

// 저장된 닉네임이 있으면 사용하고,
// 없으면 기본값 "Flowdash" 사용
nicknameElement.textContent = savedNickname || "Flowdash";

// 닉네임 클릭 시 실행
nicknameElement.addEventListener("click", function () {
  // input 요소 만들기
  const input = document.createElement("input");

  // 현재 닉네임을 input 안에 넣기
  input.value = nicknameElement.textContent.trim();

  // input 스타일 설정
  input.style.color = "var(--theme-text)";
  input.style.border = "1px solid var(--theme-text)";
  input.style.font = "inherit";
  input.style.background = "transparent";
  input.style.padding = "0 2px";
  input.style.outline = "none";
  input.style.boxSizing = "content-box";

  // 글자 길이에 맞게 input 너비 조절하는 함수
  function resizeInput() {
    // 글자 너비를 재기 위한 임시 span 만들기
    const measure = document.createElement("span");

    // 현재 input의 글자를 임시 span에 넣기
    measure.textContent = input.value || " ";

    // input과 똑같은 폰트 적용
    measure.style.font = getComputedStyle(input).font;

    // 화면에서는 안 보이게 설정
    measure.style.visibility = "hidden";
    measure.style.position = "absolute";
    measure.style.whiteSpace = "pre";

    // 너비를 재기 위해 잠깐 body에 넣기
    document.body.append(measure);

    // 측정한 글자 너비만큼 input 너비 변경
    input.style.width = `${measure.offsetWidth + 6}px`;

    // 측정 끝난 임시 span 삭제
    measure.remove();
  }

  // 기존 닉네임을 input으로 교체
  nicknameElement.replaceWith(input);

  // 바로 입력할 수 있게 포커스
  input.focus();

  // 처음 input이 나타났을 때 너비 맞추기
  resizeInput();

  // 닉네임 저장 함수
  function saveNickname() {
    // 사용자가 입력한 값 가져오기
    const newNickname = input.value.trim();

    // 빈 값이면 Flowdash 사용
    const finalNickname = newNickname || "Flowdash";

    // localStorage에 저장
    nicknameStorage.set("nickname", finalNickname);

    // 화면의 닉네임 변경
    nicknameElement.textContent = finalNickname;

    // input을 다시 닉네임 요소로 교체
    input.replaceWith(nicknameElement);
  }

  // 글자를 입력할 때마다 input 너비 다시 계산
  input.addEventListener("input", resizeInput);

  // Enter 키를 누르면 저장
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      saveNickname();
    }
  });

  // input 바깥을 클릭하면 저장
  input.addEventListener("blur", saveNickname);
});
