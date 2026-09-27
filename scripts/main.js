import "../styles/reset.css";
import "../styles/variables.css";
import "../styles/style.css";
import "../styles/season-effects.css";

import { updateSeasonEffect } from "./theme/season-theme.js";
import { initDashboardTheme } from "./dashboard.js"; // 대시보드 테마/그리팅 통합 제어 모듈 경로
import { initFilterAndSort } from "./filter.js"; // 필터 및 검색 정렬 모듈
import { initTodoManager, loadUserTodos } from "./todo-manager.js"; // 할 일(Todo) 생성 및 관리 모듈
import initLocateMiddle from "./utils/locate-contents.js";
import initAuth from "./auth-ui.js";
import { initNickname } from "./nickname.js";

const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID;

const isFlowDashSite =
  window.location.origin === "https://naeun-k.github.io" &&
  window.location.pathname.startsWith("/flowdash/");

if (oneSignalAppId && isFlowDashSite) {
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  window.OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
      appId: oneSignalAppId,
      serviceWorkerPath: "flowdash/push/onesignal/OneSignalSDKWorker.js",
      serviceWorkerParam: {
        scope: "/flowdash/push/onesignal/",
      },
      notifyButton: {
        enable: true,
      },
    });
  });
}
document.addEventListener("DOMContentLoaded", () => {
  initDashboardTheme();
  updateSeasonEffect();
  initLocateMiddle();

  // 이벤트 리스너는 앱 실행 시 한 번만 등록
  initTodoManager();
  initFilterAndSort();

  // 사용자별 데이터는 로그인 사용자가 확인될 때마다 다시 로드
  initAuth(async () => {
    await loadUserTodos();
    await initNickname();
  });
});
