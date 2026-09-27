const isFlowDashSite =
  window.location.origin === "https://naeun-k.github.io" &&
  window.location.pathname.startsWith("/flowdash/");

export function syncOneSignalUser(user) {
  if (!isFlowDashSite || !import.meta.env.VITE_ONESIGNAL_APP_ID) {
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];

  window.OneSignalDeferred.push(async function (OneSignal) {
    try {
      if (user) {
        await OneSignal.login(user.uid);
      } else {
        await OneSignal.logout();
      }
    } catch (error) {
      console.error("OneSignal 사용자 연결 실패:", error);
    }
  });
}
