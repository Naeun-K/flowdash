import { createStorage } from "./storage.js";

const themeStorage = createStorage("flowdash-theme");

// ==================== 현재 날짜 표시 ====================

// 현재 날짜 가져오기
const now = new Date();

// 연도, 월, 일 추출
const year = now.getFullYear();
const month = now.getMonth() + 1;
const date = now.getDate();

// 날짜 표시할 요소 가져오기
const dateElement = document.querySelector(".greeting-date");

// 날짜 출력
dateElement.textContent = `${year}년 ${month}월 ${date}일`;

// ==================== 시간별 인사말 ====================

// 현재 시간 가져오기
const hour = now.getHours();

// 인사말 요소 가져오기
const greetingElement = document.querySelector(".greeting-message");

// 시간대별 인사말 변경
if (hour >= 5 && hour < 11) {
  greetingElement.textContent = "좋은 아침이에요 ,  ";
} else if (hour >= 11 && hour < 17) {
  greetingElement.textContent = "좋은 오후에요 ,  ";
} else if (hour >= 17 && hour < 22) {
  greetingElement.textContent = "좋은 저녁이에요 ,  ";
} else {
  greetingElement.textContent = "안녕하세요 ,  ";
}

// ==================== 다크모드 ====================
// ==================== 다크모드 ====================

// 다크모드 버튼 가져오기
const themeButton = document.querySelector(".greeting-theme-toggle");

// 현재 테마에 맞춰 해/달 아이콘 변경
function updateThemeIcon() {
  if (document.body.classList.contains("dark")) {
    // 다크모드 상태 → 해 아이콘 표시
    themeButton.innerHTML = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M7.9948 11.9922C9.05498 11.9922 10.0717 11.571 10.8214 10.8214C11.571 10.0717 11.9922 9.05498
          11.9922 7.9948C11.9922 6.93462 11.571 5.91787 10.8214 5.16821C10.0717 4.41855 9.05498 3.9974 7.9948
          3.9974C6.93462 3.9974 5.91787 4.41855 5.16821 5.16821C4.41855 5.91787 3.9974 6.93462 3.9974 7.9948C3.9974
          9.05498 4.41855 10.0717 5.16821 10.8214C5.91787 11.571 6.93462 11.9922 7.9948 11.9922ZM7.9948 0C8.12732
          0 8.25442 0.0526442 8.34812 0.146351C8.44183 0.240059 8.49448 0.367153 8.49448 0.499675V2.49837C8.49448
          2.6309 8.44183 2.75799 8.34812 2.8517C8.25442 2.94541 8.12732 2.99805 7.9948 2.99805C7.86228 2.99805
          7.73518 2.94541 7.64148 2.8517C7.54777 2.75799 7.49513 2.6309 7.49513 2.49837V0.499675C7.49513 0.367153
          7.54777 0.240059 7.64148 0.146351C7.73518 0.0526442 7.86228 0 7.9948 0ZM7.9948 12.9916C8.12732
          12.9916 8.25442 13.0442 8.34812 13.1379C8.44183 13.2316 8.49448 13.3587 8.49448 13.4912V15.4899C8.49448
          15.6224 8.44183 15.7495 8.34812 15.8432C8.25442 15.937 8.12732 15.9896 7.9948 15.9896C7.86228 15.9896
          7.73518 15.937 7.64148 15.8432C7.54777 15.7495 7.49513 15.6224 7.49513 15.4899V13.4912C7.49513 13.3587
          7.54777 13.2316 7.64148 13.1379C7.73518 13.0442 7.86228 12.9916 7.9948 12.9916ZM15.9896 7.9948C15.9896
          8.12732 15.937 8.25442 15.8432 8.34812C15.7495 8.44183 15.6224 8.49448 15.4899 8.49448H13.4912C13.3587
          8.49448 13.2316 8.44183 13.1379 8.34812C13.0442 8.25442 12.9916 8.12732 12.9916 7.9948C12.9916 7.86228
          13.0442 7.73518 13.1379 7.64148C13.2316 7.54777 13.3587 7.49513 13.4912 7.49513H15.4899C15.6224 7.49513
          15.7495 7.54777 15.8432 7.64148C15.937 7.73518 15.9896 7.86228 15.9896 7.9948ZM2.99805 7.9948C2.99805
          8.12732 2.94541 8.25442 2.8517 8.34812C2.75799 8.44183 2.6309 8.49448 2.49837 8.49448H0.499675C0.367153
          8.49448 0.240059 8.44183 0.146351 8.34812C0.0526442 8.25442 0 8.12732 0 7.9948C0 7.86228 0.0526442
          7.73518 0.146351 7.64148C0.240059 7.54777 0.367153 7.49513 0.499675 7.49513H2.49837C2.6309 7.49513
          2.75799 7.54777 2.8517 7.64148C2.94541 7.73518 2.99805 7.86228 2.99805 7.9948ZM13.6481 2.34148C13.7418
          2.43518 13.7944 2.56225 13.7944 2.69475C13.7944 2.82724 13.7418 2.95431 13.6481 3.04802L12.235
          4.4621C12.1886 4.50849 12.1334 4.54528 12.0728 4.57036C12.0121 4.59544 11.9471 4.60833 11.8814
          4.60828C11.7488 4.60819 11.6217 4.55542 11.528 4.4616C11.4816 4.41514 11.4448 4.36 11.4197
          4.29933C11.3947 4.23865 11.3818 4.17363 11.3818 4.10797C11.3819 3.97538 11.4347 3.84825 11.5285
          3.75456L12.9416 2.34148C13.0353 2.2478 13.1624 2.19518 13.2949 2.19518C13.4273 2.19518 13.5544
          2.2478 13.6481 2.34148ZM4.4611 11.5285C4.55477 11.6222 4.6074 11.7493 4.6074 11.8818C4.6074
          12.0143 4.55477 12.1413 4.4611 12.235L3.04802 13.6481C2.95378 13.7391 2.82756 13.7895 2.69655
          13.7884C2.56553 13.7872 2.44021 13.7347 2.34756 13.642C2.25492 13.5494 2.20237 13.4241 2.20123
          13.2931C2.20009 13.162 2.25046 13.0358 2.34148 12.9416L3.75456 11.5285C3.84826 11.4348 3.97533
          11.3822 4.10783 11.3822C4.24032 11.3822 4.3674 11.4348 4.4611 11.5285ZM13.6481 13.6481C13.5544
          13.7418 13.4273 13.7944 13.2949 13.7944C13.1624 13.7944 13.0353 13.7418 12.9416 13.6481L11.5285
          12.235C11.4375 12.1408 11.3871 12.0146 11.3883 11.8836C11.3894 11.7526 11.4419 11.6272 11.5346
          11.5346C11.6272 11.4419 11.7526 11.3894 11.8836 11.3883C12.0146 11.3871 12.1408 11.4375 12.235
          11.5285L13.6481 12.9416C13.7418 13.0353 13.7944 13.1624 13.7944 13.2949C13.7944 13.4273 13.7418
          13.5544 13.6481 13.6481ZM4.4611 4.4621C4.3674 4.55577 4.24032 4.6084 4.10783 4.6084C3.97533
          4.6084 3.84826 4.55577 3.75456 4.4621L2.34148 3.04802C2.29375 3.00192 2.25569 2.94679 2.2295
          2.88583C2.20331 2.82486 2.18953 2.7593 2.18895 2.69295C2.18837 2.6266 2.20102 2.56081 2.22614
          2.4994C2.25127 2.43799 2.28837 2.3822 2.33528 2.33528C2.3822 2.28837 2.43799 2.25127 2.4994
          2.22614C2.56081 2.20102 2.6266 2.18837 2.69295 2.18895C2.7593 2.18953 2.82486 2.20331 2.88583
          2.2295C2.94679 2.25569 3.00192 2.29375 3.04802 2.34148L4.4611 3.75456C4.50763 3.80097 4.54455
          3.85611 4.56974 3.91682C4.59493 3.97752 4.6079 4.0426 4.6079 4.10833C4.6079 4.17405 4.59493
          4.23913 4.56974 4.29984C4.54455 4.36054 4.50763 4.41568 4.4611 4.4621Z"
          fill="#F1F2F4"
        />
      </svg>
    `;
  } else {
    // 라이트모드 상태 → 달 아이콘 표시
    themeButton.innerHTML = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="#1B2432"
        class="bi bi-moon-stars"
        viewBox="0 0 16 16"
      >
        <path
          d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318
          7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1
          8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6
          .278M4.858 1.311A7.27 7.27 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.32
          7.32 0 0 0 5.205-2.162q-.506.063-1.029.063c-4.61 0-8.343-3.714-8.343-8.29
          0-1.167.242-2.278.681-3.286"
        />
        <path
          d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162
          .387a.217.217 0 0 1 0 .412l-1.162.387a1.73 1.73 0 0 0-1.097 1.097l-.387
          1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.73 1.73 0 0 0 9.31
          6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.73 1.73 0 0 0
          1.097-1.097zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732
          .732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732
          .732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732
          -.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386
          .732-.732z"
        />
      </svg>
    `;
  }

  // 화면전환 애니메이션 추가
  themeButton.addEventListener("click", () => {
    // 1. body에 부드러운 전환 효과를 주는 클래스 추가
    document.body.classList.add("theme-transitioning");

    // 2. 기존 테마 변경 로직 실행 (예: 클래스 토글)
    document.body.classList.toggle("dark-theme");
    // (또는 기존에 사용하시던 테마 변경 코드를 여기에 그대로 두시면 됩니다)

    // 3. 애니메이션(0.3초)이 끝난 후, hover 애니메이션과 충돌하지 않도록 클래스 제거
    setTimeout(() => {
      document.body.classList.remove("theme-transitioning");
    }, 300); // CSS에 지정한 시간(0.3초 = 300ms)과 일치시킵니다.
  });
}

// 저장된 마지막 테마 불러오기
const savedTheme = themeStorage.get("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
} else {
  document.body.classList.remove("dark");
}

// 새로고침 직후 아이콘 맞추기
updateThemeIcon();

// 버튼 클릭 시 테마 변경
themeButton.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const currentTheme = document.body.classList.contains("dark")
    ? "dark"
    : "light";

  // 현재 테마 저장
  themeStorage.set("theme", currentTheme);

  // 변경된 테마에 맞게 아이콘 변경
  updateThemeIcon();
}); // 테마 버튼과 드롭다운 요소 가져오기
const themeSelectButton = document.querySelector(".greeting-theme-button");
const themeDropdownMenu = document.querySelector(".theme-dropdown-menu");
const themeDropdown = document.querySelector(".theme-dropdown");
const themeItems = document.querySelectorAll(".theme-dropdown-item");
const themeButtonIcon = document.querySelector(".greeting-theme-button-icon");
const themeButtonText = document.querySelector(".greeting-theme-button-text");

// 기본 테마 팔레트 아이콘
const defaultThemeIcon = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="13.5" cy="6.5" r="1.5"></circle>
    <circle cx="17.5" cy="10.5" r="1.5"></circle>
    <circle cx="8.5" cy="7.5" r="1.5"></circle>
    <circle cx="6.5" cy="12.5" r="1.5"></circle>
    <path
      d="M12 3a9 9 0 1 0 9 9c0-1.1-.9-2-2-2h-2.2a2 2 0 0 1-1.8-2.8l.5-1.1A2.2 2.2 0 0 0 13.5 3H12Z"
    ></path>
  </svg>
`;

// 계절별 아이콘
const themeIcons = {
  spring: "🌸",
  summer: "☀️",
  autumn: "🍂",
  winter: "❄️",
};

// 계절별 버튼 이름
const themeNames = {
  default: "테마",
  spring: "테마",
  summer: "테마",
  autumn: "테마",
  winter: "테마",
};
// 테마 버튼 클릭 시 드롭다운 열기/닫기
themeSelectButton?.addEventListener("click", (event) => {
  event.stopPropagation();

  if (!themeDropdownMenu) return;

  themeDropdownMenu.hidden = !themeDropdownMenu.hidden;

  themeSelectButton.setAttribute(
    "aria-expanded",
    String(!themeDropdownMenu.hidden),
  );
});

// 드롭다운 바깥 클릭 시 닫기
document.addEventListener("click", (event) => {
  if (!themeDropdownMenu || !themeDropdown) return;

  if (!themeDropdown.contains(event.target)) {
    themeDropdownMenu.hidden = true;
    themeSelectButton?.setAttribute("aria-expanded", "false");
  }
});

// 테마 선택 시 버튼 색상, 아이콘, 글자 변경
themeItems.forEach((item) => {
  item.addEventListener("click", () => {
    const selectedTheme = item.dataset.theme;

    // 기존 선택 표시 제거
    themeItems.forEach((themeItem) => {
      themeItem.classList.remove("is-selected");
    });

    // 기본 테마는 속성 제거
    if (selectedTheme === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      // 선택한 계절 테마 적용
      document.documentElement.setAttribute("data-theme", selectedTheme);
    }
    // 클릭한 항목 선택 표시
    item.classList.add("is-selected");

    // 기존 계절 클래스 제거
    themeSelectButton?.classList.remove(
      "theme-spring",
      "theme-summer",
      "theme-autumn",
      "theme-winter",
    );

    // 기본이 아니면 계절 클래스 추가
    if (selectedTheme !== "default") {
      themeSelectButton?.classList.add(`theme-${selectedTheme}`);
    }

    // 기본은 팔레트 SVG, 계절은 이모지로 변경
    if (themeButtonIcon) {
      if (selectedTheme === "default") {
        themeButtonIcon.innerHTML = defaultThemeIcon;
      } else {
        themeButtonIcon.textContent = themeIcons[selectedTheme];
      }
    }

    // 버튼 글자 변경
    if (themeButtonText) {
      themeButtonText.textContent = themeNames[selectedTheme];
    }

    // 드롭다운 닫기
    if (themeDropdownMenu) {
      themeDropdownMenu.hidden = true;
    }

    themeSelectButton?.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // 1. 드롭다운 내부의 테마 아이템 버튼들을 전부 가져옵니다.
  const themeButtons = document.querySelectorAll(".theme-dropdown-item");

  // 2. 로컬스토리지에서 저장된 테마 확인 (없으면 기본값 'default')
  const savedTheme = localStorage.getItem("selectedTheme") || "default";

  // 3. 새로고침 즉시 저장된 테마를 불러와 적용
  applyTheme(savedTheme);

  // 4. 각 테마 버튼에 클릭 이벤트 등록
  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedTheme = button.getAttribute("data-theme");

      // 로컬스토리지에 선택한 테마 문자열 저장
      localStorage.setItem("selectedTheme", selectedTheme);

      // 화면에 적용
      applyTheme(selectedTheme);
    });
  });

  // 5. 테마 실시간 적용 함수
  function applyTheme(themeName) {
    if (themeName === "default") {
      // 기본 테마일 때는 html의 data-theme 속성을 아예 제거하여 :root 스타일이 적용되게 합니다.
      document.documentElement.removeAttribute("data-theme");
    } else {
      // 봄, 여름, 가을, 겨울 테마일 때는 html에 해당 값을 넣어줍니다.
      document.documentElement.setAttribute("data-theme", themeName);
    }

    // 6. 드롭다운 메뉴 안에서 어떤 버튼이 선택되었는지 체크 표시(✓) 동기화
    themeButtons.forEach((button) => {
      const buttonTheme = button.getAttribute("data-theme");

      if (buttonTheme === themeName) {
        button.classList.add("is-selected");
      } else {
        button.classList.remove("is-selected");
      }
    });
  }
});
