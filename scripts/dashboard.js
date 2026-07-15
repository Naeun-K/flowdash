/**
 * @fileoverview 사용자의 시간대에 맞는 그리팅(인사말) 메시지를 동적으로 표출하고,
 * 다크/라이트 모드 스위칭 및 계절별 테마 설정을 관리하는 대시보드 제어 모듈입니다.
 */

import { createStorage } from "./storage.js";

/**
 * 테마 설정을 브라우저 LocalStorage에 영구 저장하기 위한 스토리지 인스턴스입니다.
 * @type {Object}
 */
const themeStorage = createStorage("flowdash-theme");

/**
 * [핵심 초기화 모듈 함수]
 * main.js의 DOMContentLoaded 내부에서 호출하여 전체 동작을 엮어줍니다.
 */
export function initDashboardTheme() {
  /**
   * [그리팅 영역] 현재 날짜 및 시간에 맞춰 메시지를 동적으로 초기화합니다.
   */
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dateElement = document.querySelector(".greeting-date");

  // 화면에 현재 날짜 렌더링
  if (dateElement) {
    dateElement.textContent = `${year}년 ${month}월 ${date}일`;
  }

  const hour = now.getHours();
  const greetingElement = document.querySelector(".greeting-message");

  // 시간대에 따른 맞춤형 인사말 출력
  if (greetingElement) {
    if (hour >= 5 && hour < 11) {
      greetingElement.textContent = "좋은 아침이에요 ,  ";
    } else if (hour >= 11 && hour < 17) {
      greetingElement.textContent = "좋은 오후에요 ,  ";
    } else if (hour >= 17 && hour < 22) {
      greetingElement.textContent = "좋은 저녁이에요 ,  ";
    } else {
      greetingElement.textContent = "안녕하세요 ,  ";
    }
  }

  /**
   * 다크/라이트 모드를 토글하는 버튼 요소입니다.
   * @type {HTMLElement|null}
   */
  const themeButton = document.querySelector(".greeting-theme-toggle");

  /**
   * 현재 body에 적용된 다크 모드 상태(`classList.contains("dark")`)에 맞춰 토글 버튼 내의 SVG 아이콘을 갱신합니다.
   * @function updateThemeIcon
   * @returns {void}
   */
  function updateThemeIcon() {
    if (!themeButton) return;
    if (document.body.classList.contains("dark")) {
      themeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M7.9948 11.9922C9.05498 11.9922 10.0717 11.571 10.8214 10.8214C11.571 10.0717 11.9922 9.05498 11.9922 7.9948C11.9922 6.93462 11.571 5.91787 10.8214 5.16821C10.0717 4.41855 9.05498 3.9974 7.9948 3.9974C6.93462 3.9974 5.91787 4.41855 5.16821 5.16821C4.41855 5.91787 3.9974 6.93462 3.9974 7.9948C3.9974 9.05498 4.41855 10.0717 5.16821 10.8214C5.91787 11.571 6.93462 11.9922 7.9948 11.9922ZM7.9948 0C8.12732 0 8.25442 0.0526442 8.34812 0.146351C8.44183 0.240059 8.49448 0.367153 8.49448 0.499675V2.49837C8.49448 2.6309 8.44183 2.75799 8.34812 2.8517C8.25442 2.94541 8.12732 2.99805 7.9948 2.99805C7.86228 2.99805 7.73518 2.94541 7.64148 2.8517C7.54777 2.75799 7.49513 2.6309 7.49513 2.49837V0.499675C7.49513 0.367153 7.54777 0.240059 7.64148 0.146351C7.73518 0.0526442 7.86228 0 7.9948 0ZM7.9948 12.9916C8.12732 12.9916 8.25442 13.0442 8.34812 13.1379C8.44183 13.2316 8.49448 13.3587 8.49448 13.4912V15.4899C8.49448 15.6224 8.44183 15.7495 8.34812 15.8432C8.25442 15.937 8.12732 15.9896 7.9948 15.9896C7.86228 15.9896 7.73518 15.937 7.64148 15.8432C7.54777 15.7495 7.49513 15.6224 7.49513 15.4899V13.4912C7.49513 13.3587 7.54777 13.2316 7.64148 13.1379C7.73518 13.0442 7.86228 12.9916 7.9948 12.9916ZM15.9896 7.9948C15.9896 8.12732 15.937 8.25442 15.8432 8.34812C15.7495 8.44183 15.6224 8.49448 15.4899 8.49448H13.4912C13.3587 8.49448 13.2316 8.44183 13.1379 8.34812C13.0442 8.25442 12.9916 8.12732 12.9916 7.9948C12.9916 7.86228 13.0442 7.73518 13.1379 7.64148C13.2316 7.54777 13.3587 7.49513 13.4912 7.49513H15.4899C15.6224 7.49513 15.7495 7.54777 15.8432 7.64148C15.937 7.73518 15.9896 7.86228 15.9896 7.9948ZM2.99805 7.9948C2.99805 8.12732 2.94541 8.25442 2.8517 8.34812C2.75799 8.44183 2.6309 8.49448 2.49837 8.49448H0.499675C0.367153 8.49448 0.240059 8.44183 0.146351 8.34812C0.0526442 8.25442 0 8.12732 0 7.9948C0 7.86228 0.0526442 7.73518 0.146351 7.64148C0.240059 7.54777 0.367153 7.49513 0.499675 7.49513H2.49837C2.6309 7.49513 2.75799 7.54777 2.8517 7.64148C2.94541 7.73518 2.99805 7.86228 2.99805 7.9948ZM13.6481 2.34148C13.7418 2.43518 13.7944 2.56225 13.7944 2.69475C13.7944 2.82724 13.7418 2.95431 13.6481 3.04802L12.235 4.4621C12.1886 4.50849 12.1334 4.54528 12.0728 4.57036C12.0121 4.59544 11.9471 4.60833 11.8814 4.60828C11.7488 4.60819 11.6217 4.55542 11.528 4.4616C11.4816 4.41514 11.4448 4.36 11.4197 4.29933C11.3947 4.23865 11.3818 4.17363 11.3818 4.10797C11.3819 3.97538 11.4347 3.84825 11.5285 3.75456L12.9416 2.34148C13.0353 2.2478 13.1624 2.19518 13.2949 2.19518C13.4273 2.19518 13.5544 2.2478 13.6481 2.34148ZM4.4611 11.5285C4.55477 11.6222 4.6074 11.7493 4.6074 11.8818C4.6074 12.0143 4.55477 12.1413 4.4611 12.235L3.04802 13.6481C2.95378 13.7391 2.82756 13.7895 2.69655 13.7884C2.56553 13.7872 2.44021 13.7347 2.34756 13.642C2.25492 13.5494 2.20237 13.4241 2.20123 13.2931C2.20009 13.162 2.25046 13.0358 2.34148 12.9416L3.75456 11.5285C3.84826 11.4348 3.97533 11.3822 4.10783 11.3822C4.24032 11.3822 4.3674 11.4348 4.4611 11.5285ZM13.6481 13.6481C13.5544 13.7418 13.4273 13.7944 13.2949 13.7944C13.1624 13.7944 13.0353 13.7418 12.9416 13.6481L11.5285 12.235C11.4375 12.1408 11.3871 12.0146 11.3883 11.8836C11.3894 11.7526 11.4419 11.6272 11.5346 11.5346C11.6272 11.4419 11.7526 11.3894 11.8836 11.3883C12.0146 11.3871 12.1408 11.4375 12.235 11.5285L13.6481 12.9416C13.7418 13.0353 13.7944 13.1624 13.7944 13.2949C13.7944 13.4273 13.7418 13.5544 13.6481 13.6481ZM4.4611 4.4621C4.3674 4.55577 4.24032 4.6084 4.10783 4.6084C3.97533 4.6084 3.84826 4.55577 3.75456 4.4621L2.34148 3.04802C2.29375 3.00192 2.25569 2.94679 2.2295 2.88583C2.20331 2.82486 2.18953 2.7593 2.18895 2.69295C2.18837 2.6266 2.20102 2.56081 2.22614 2.4994C2.25127 2.43799 2.28837 2.3822 2.33528 2.33528C2.3822 2.28837 2.43799 2.25127 2.4994 2.22614C2.56081 2.20102 2.6266 2.18837 2.69295 2.18895C2.7593 2.18953 2.82486 2.20331 2.88583 2.2295C2.94679 2.25569 3.00192 2.29375 3.04802 2.34148L4.4611 3.75456C4.50763 3.80097 4.54455 3.85611 4.56974 3.91682C4.59493 3.97752 4.6079 4.0426 4.6079 4.10833C4.6079 4.17405 4.59493 4.23913 4.56974 4.29984C4.54455 4.36054 4.50763 4.41568 4.4611 4.4621Z" fill="#F1F2F4"/>
      </svg>
    `;
    } else {
      themeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#1B2432" class="bi bi-moon-stars" viewBox="0 0 16 16">
        <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278M4.858 1.311A7.27 7.27 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.32 7.32 0 0 0 5.205-2.162q-.506.063-1.029.063c-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286"/>
        <path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162 .387a.217.217 0 0 1 0 .412l-1.162.387a1.73 1.73 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.73 1.73 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.73 1.73 0 0 0 1.097-1.097zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732 .732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732 .732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732 -.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386 .732-.732z"/>
      </svg>
    `;
    }
  }

  // 초기 로드 시 저장된 테마를 불러와 클래스 및 아이콘 반영
  const savedTheme = themeStorage.get("theme") || "light";
  document.body.classList.toggle("dark", savedTheme === "dark");
  updateThemeIcon();

  // 라이트/다크 모드 토글 버튼 클릭 이벤트 바인딩
  if (themeButton) {
    themeButton.addEventListener("click", () => {
      // 테마 전환 시 자연스러운 애니메이션 효과를 주기 위한 트랜지션 클래스 추가
      document.body.classList.add("theme-transitioning");
      document.body.classList.toggle("dark");

      const currentTheme = document.body.classList.contains("dark")
        ? "dark"
        : "light";
      themeStorage.set("theme", currentTheme);
      themeStorage.set("mode", currentTheme);

      updateThemeIcon();

      // 트랜지션 애니메이션 완료 후 임시 클래스 제거
      setTimeout(() => {
        document.body.classList.remove("theme-transitioning");
      }, 300);
    });
  }

  /**
   * [계절 테마 영역] 드롭다운 및 모달 제어를 위한 DOM 요소 참조 세트입니다.
   */
  const themeSelectButton = document.querySelector(".greeting-theme-button");
  const themeDropdownMenu = document.querySelector(".theme-dropdown-menu");
  const themeDropdown = document.querySelector(".theme-dropdown");
  const themeItems = document.querySelectorAll(".theme-dropdown-item");
  const themeButtonIcon = document.querySelector(".greeting-theme-button-icon");
  const themeButtonText = document.querySelector(".greeting-theme-button-text");

  /**
   * 테마가 기본값('default')일 때 적용할 팔레트 모양의 SVG 문자열입니다.
   * @type {string}
   */
  const defaultThemeIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="13.5" cy="6.5" r="1.5"></circle>
    <circle cx="17.5" cy="10.5" r="1.5"></circle>
    <circle cx="8.5" cy="7.5" r="1.5"></circle>
    <circle cx="6.5" cy="12.5" r="1.5"></circle>
    <path d="M12 3a9 9 0 1 0 9 9c0-1.1-.9-2-2-2h-2.2a2 2 0 0 1-1.8-2.8l.5-1.1A2.2 2.2 0 0 0 13.5 3H12Z"></path>
  </svg>
`;

  /**
   * 계절 테마별 버튼에 렌더링할 이모지 맵핑 객체입니다.
   * @type {Object.<string, string>}
   */
  const themeIcons = { spring: "🌸", summer: "☀️", autumn: "🍂", winter: "❄️" };

  // 계절 테마 선택 버튼 클릭 시 드롭다운 토글 및 웹 접근성 속성(aria-expanded) 제어
  themeSelectButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!themeDropdownMenu) return;
    themeDropdownMenu.hidden = !themeDropdownMenu.hidden;
    themeSelectButton.setAttribute(
      "aria-expanded",
      String(!themeDropdownMenu.hidden),
    );
  });

  // 외부 영역 클릭 시 열려 있던 계절 테마 드롭다운 메뉴 닫기
  document.addEventListener("click", (event) => {
    if (!themeDropdownMenu || !themeDropdown) return;
    if (!themeDropdown.contains(event.target)) {
      themeDropdownMenu.hidden = true;
      themeSelectButton?.setAttribute("aria-expanded", "false");
    }
  });

  /**
   * 인자로 전달받은 계절 테마 이름을 바탕으로 문서(html)의 data attribute를 변경하고 연관된 UI 레이아웃 상태를 갱신합니다.
   * @function applyTheme
   * @param {string} themeName - 적용할 테마명 ('default', 'spring', 'summer', 'autumn', 'winter')
   * @returns {void}
   */

  function applyTheme(themeName) {
    // 1. html 태그의 데이터 속성 제어
    if (themeName === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themeName);
    }

    // 2. 드롭다운 내 아이템의 활성화 클래스(is-selected) 일괄 갱신
    themeItems.forEach((button) => {
      const buttonTheme = button.getAttribute("data-theme");
      button.classList.toggle("is-selected", buttonTheme === themeName);
    });

    // 3. 버튼에 지정된 계절별 CSS 클래스명 분기 적용
    themeSelectButton?.classList.remove(
      "theme-spring",
      "theme-summer",
      "theme-autumn",
      "theme-winter",
    );
    if (themeName !== "default") {
      themeSelectButton?.classList.add(`theme-${themeName}`);
    }

    // 4. 테마 선택 버튼 내 이모지/아이콘 교체
    if (themeButtonIcon) {
      themeButtonIcon.innerHTML =
        themeName === "default"
          ? defaultThemeIcon
          : themeIcons[themeName] || "";
    }
  }
  const savedSeason = themeStorage.get("season") || "default";
  applyTheme(savedSeason);

  // 계절 드롭다운 메뉴 아이템 클릭 핸들러 바인딩
  themeItems.forEach((item) => {
    item.addEventListener("click", () => {
      const selectedTheme = item.dataset.theme;
      themeStorage.set("season", selectedTheme);
      applyTheme(selectedTheme);
      if (themeDropdownMenu) {
        themeDropdownMenu.hidden = true;
      }
      themeSelectButton?.setAttribute("aria-expanded", "false");
    });
  });

  // 상세 설정 모달 관련 DOM 요소 선언
  const themeSettingButton = document.querySelector(".theme-dropdown-setting");
  const themeSettingModal = document.querySelector(".theme-setting-modal");
  const themeSettingModalContent = document.querySelector(
    ".theme-setting-modal-content",
  );
  const themeSettingCloseButton = document.querySelector(
    ".theme-setting-modal-close",
  );
  const themeSettingCancelButton = document.querySelector(
    ".theme-setting-cancel",
  );
  const themeSettingOptions = document.querySelectorAll(
    ".theme-setting-option",
  );
  const themeDarkSwitch = document.querySelector(".theme-switch-input");
  const themeSettingApplyButton = document.querySelector(
    ".theme-setting-apply",
  );

  /**
   * 모달 내에서 '적용' 버튼을 누르기 전, 임시로 선택 상태를 들고 있는 상태 변수입니다.
   */
  let pendingTheme = "default";
  let pendingDarkMode = false;

  /**
   * 상세 설정 모달을 열고 현재 활성화된 테마 및 라이트/다크 모드 상태로 프리뷰와 셀렉터를 동기화합니다.
   * @function openThemeSettingModal
   */
  function openThemeSettingModal() {
    if (!themeSettingModal) return;
    pendingTheme =
      document.documentElement.getAttribute("data-theme") || "default";
    pendingDarkMode = document.body.classList.contains("dark");

    // 현재 저장 상태와 옵션 하이라이트 동기화
    themeSettingOptions.forEach((option) => {
      option.classList.toggle(
        "is-selected",
        option.dataset.theme === pendingTheme,
      );
    });

    // 다크모드 토글 스위치 동기화
    if (themeDarkSwitch) {
      themeDarkSwitch.checked = pendingDarkMode;
    }

    updateThemeModalPreview(pendingTheme);
    themeSettingModal.hidden = false;
    if (themeDropdownMenu) themeDropdownMenu.hidden = true;
    themeSelectButton?.setAttribute("aria-expanded", "false");
  }

  /**
   * 상세 설정 모달을 화면에서 숨깁니다.
   * @function closeThemeSettingModal
   */
  function closeThemeSettingModal() {
    if (!themeSettingModal) return;
    themeSettingModal.hidden = true;
  }

  // 모달 제어 이벤트 리스너 설정
  themeSettingButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    openThemeSettingModal();
  });

  themeSettingCloseButton?.addEventListener("click", closeThemeSettingModal);
  themeSettingCancelButton?.addEventListener("click", closeThemeSettingModal);

  // 모달 바깥의 딤드(배경) 영역 클릭 시 모달 닫기
  themeSettingModal?.addEventListener("click", (event) => {
    if (event.target === themeSettingModal) {
      closeThemeSettingModal();
    }
  });

  /**
   * 모달 내부의 특정 테마 옵션을 선택했을 때, 실제 전체 테마를 바꾸지 않고
   * 모달 미리보기 박스 영역(`themeSettingModalContent`)에만 실시간 테마 컬러 CSS 변수를 주입합니다.
   * @function updateThemeModalPreview
   * @param {string} theme - 미리보기할 테마명
   */
  function updateThemeModalPreview(theme) {
    if (!themeSettingModalContent) return;
    const root = document.documentElement;
    const previousTheme = root.getAttribute("data-theme");

    // 계산된 CSS 변수를 가져오기 위해 html 태그에 임시로 데이터 속성 설정
    if (theme === "default") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }

    const themeStyle = getComputedStyle(root);
    const previewVariables = [
      "--theme-button",
      "--theme-button-hover",
      "--theme-border",
      "--theme-text",
      "--theme-focus",
    ];

    // 추출한 CSS 테마 변수를 프리뷰 컨텐츠 레이어의 인라인 스타일로 복사 반영
    previewVariables.forEach((variableName) => {
      const value = themeStyle.getPropertyValue(variableName).trim();
      themeSettingModalContent.style.setProperty(variableName, value);
    });

    // 기존에 적용 중이던 원래 테마 상태로 문서 속성 복구
    if (previousTheme) {
      root.setAttribute("data-theme", previousTheme);
    } else {
      root.removeAttribute("data-theme");
    }
  }

  // 모달 내 계절 테마 옵션 카드 클릭 시 임시 선택 상태 변경 및 프리뷰 연동
  themeSettingOptions.forEach((option) => {
    option.addEventListener("click", () => {
      pendingTheme = option.dataset.theme;
      themeSettingOptions.forEach((themeOption) => {
        themeOption.classList.remove("is-selected");
      });
      option.classList.add("is-selected");
      updateThemeModalPreview(pendingTheme);
    });
  });

  // 모달 내 다크 모드 토글 스위치 상태 변경 감지
  themeDarkSwitch?.addEventListener("change", () => {
    pendingDarkMode = themeDarkSwitch.checked;
  });

  // 모달 내 최종 '적용' 버튼 클릭 시 임시 설정을 브라우저 스토리지 및 전체 DOM 레이아웃에 완전히 반영
  themeSettingApplyButton?.addEventListener("click", () => {
    themeStorage.set("season", pendingTheme);
    themeStorage.set("mode", pendingDarkMode ? "dark" : "light");
    themeStorage.set("theme", pendingDarkMode ? "dark" : "light");

    document.body.classList.toggle("dark", pendingDarkMode);
    applyTheme(pendingTheme);
    updateThemeIcon();
    closeThemeSettingModal();
  });
}
