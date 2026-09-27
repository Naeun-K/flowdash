import {
  signUp,
  signIn,
  logOut,
  initializeAuthPersistence,
  observeAuthState,
} from "./lib/auth.js";
import { saveUserProfile } from "./lib/firestore.js";

/**
 * Firebase Authentication과 인증 화면을 연결합니다.
 */
export default async function initAuth(onAuthenticated) {
  const authContainer = document.querySelector("#auth-container");
  const appContainer = document.querySelector("#app-container");
  const appLoading = document.querySelector("#app-loading");

  const authForm = document.querySelector("#auth-form");
  const emailInput = document.querySelector("#auth-email");
  const passwordInput = document.querySelector("#auth-password");

  const passwordToggle = document.querySelector(".auth-password-toggle");
  const passwordRequirements = {
    length: document.querySelector('[data-requirement="length"]'),
    letter: document.querySelector('[data-requirement="letter"]'),
    number: document.querySelector('[data-requirement="number"]'),
    special: document.querySelector('[data-requirement="special"]'),
  };
  const signUpButton = document.querySelector(".auth-signup-button");
  const logoutButton = document.querySelector(".logout-button");
  const errorMessage = document.querySelector("#auth-error-message");

  if (
    !authContainer ||
    !appContainer ||
    !appLoading ||
    !authForm ||
    !emailInput ||
    !passwordInput ||
    !passwordToggle ||
    !signUpButton ||
    !logoutButton ||
    !errorMessage
  ) {
    return;
  }

  try {
    await initializeAuthPersistence();
  } catch (error) {
    console.error("Firebase 로그인 유지 설정 실패:", error);
  }
  /**
   * 비밀번호 표시 여부를 전환합니다.
   */
  passwordToggle.addEventListener("click", () => {
    const isPasswordVisible = passwordInput.type === "text";

    passwordInput.type = isPasswordVisible ? "password" : "text";

    passwordToggle.setAttribute(
      "aria-label",
      isPasswordVisible ? "비밀번호 보기" : "비밀번호 숨기기",
    );

    passwordToggle.setAttribute("aria-pressed", String(!isPasswordVisible));
  });
  /**
   * 비밀번호 입력 시 조건 충족 여부를 실시간으로 표시합니다.
   */
  passwordInput.addEventListener("input", () => {
    updatePasswordRequirements(passwordInput.value);
  });
  /**
   * 인증 관련 오류 메시지를 표시합니다.
   *
   * @param {string} message
   */
  const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  };

  /**
   * 기존 오류 메시지를 초기화합니다.
   */
  const clearError = () => {
    errorMessage.textContent = "";
    errorMessage.hidden = true;
  };

  /**
   * 이메일과 비밀번호 입력값을 가져옵니다.
   *
   * @returns {{ email: string, password: string }}
   */
  const getAuthValues = () => ({
    email: emailInput.value.trim(),
    password: passwordInput.value,
  });

  /**
   * 비밀번호의 각 조건을 검사합니다.
   * - 8자 이상
   * - 영문 포함
   * - 숫자 포함
   * - 특수문자 포함
   *
   * @param {string} password
   * @returns {{
   *   length: boolean,
   *   letter: boolean,
   *   number: boolean,
   *   special: boolean
   * }}
   */
  const getPasswordValidation = (password) => ({
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9\s]/.test(password),
  });

  /**
   * 모든 비밀번호 조건을 만족하는지 확인합니다.
   *
   * @param {string} password
   * @returns {boolean}
   */
  const isValidPassword = (password) => {
    const validation = getPasswordValidation(password);

    return Object.values(validation).every(Boolean);
  };

  /**
   * 비밀번호 조건 검사 결과를 화면에 표시합니다.
   *
   * @param {string} password
   */
  const updatePasswordRequirements = (password) => {
    const validation = getPasswordValidation(password);

    Object.entries(validation).forEach(([key, isValid]) => {
      const requirement = passwordRequirements[key];

      if (!requirement) return;

      const icon = requirement.querySelector(".password-requirement-icon");

      requirement.classList.toggle("is-valid", isValid);
      requirement.classList.toggle("is-invalid", !isValid);

      if (icon) {
        icon.textContent = isValid ? "✓" : "✕";
      }
    });
  };
  /**
   * Firebase 오류 코드를 사용자용 메시지로 변환합니다.
   *
   * @param {unknown} error
   * @returns {string}
   */
  const getErrorMessage = (error) => {
    switch (error?.code) {
      case "auth/invalid-email":
        return "올바른 이메일 주소를 입력해주세요.";

      case "auth/missing-password":
        return "비밀번호를 입력해주세요.";

      case "auth/weak-password":
        return "비밀번호는 6자 이상 입력해주세요.";

      case "auth/email-already-in-use":
        return "이미 가입된 이메일입니다.";

      case "auth/invalid-credential":
        return "이메일 또는 비밀번호가 올바르지 않습니다.";

      case "auth/too-many-requests":
        return "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.";

      default:
        console.error(error);
        return "오류가 발생했습니다. 다시 시도해주세요.";
    }
  };

  /**
   * 로그인
   */
  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearError();

    if (!authForm.checkValidity()) {
      showError("이메일과 비밀번호를 올바르게 입력해주세요.");
      return;
    }

    const { email, password } = getAuthValues();

    try {
      await signIn(email, password);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  });

  /**
   * 회원가입
   */
  signUpButton.addEventListener("click", async () => {
    clearError();

    if (!authForm.checkValidity()) {
      showError("이메일과 비밀번호를 올바르게 입력해주세요.");
      return;
    }

    const { email, password } = getAuthValues();
    if (!isValidPassword(password)) {
      showError(
        "비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 포함해야 합니다.",
      );
      return;
    }
    try {
      const userCredential = await signUp(email, password);

      await saveUserProfile({
        nickname: "Flowdash",
        email: userCredential.user.email,
        createdAt: Date.now(),
      });
    } catch (error) {
      showError(getErrorMessage(error));
    }
  });

  /**
   * 로그아웃
   */
  logoutButton.addEventListener("click", async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  });

  /**
   * Firebase 로그인 상태 감지
   */
  observeAuthState(async (user) => {
    clearError();

    if (user) {
      // 로그인 상태
      authContainer.hidden = true;

      authForm.reset();
      updatePasswordRequirements("");

      if (typeof onAuthenticated === "function") {
        try {
          await onAuthenticated(user);
        } catch (error) {
          console.error("사용자 데이터 초기화 실패:", error);
        }
      }

      // 사용자 데이터 초기화 완료 후 메인 화면 표시
      appLoading.hidden = true;
      appContainer.hidden = false;

      return;
    }

    // 로그아웃 상태
    appLoading.hidden = true;
    appContainer.hidden = true;
    authContainer.hidden = false;
  });
}
