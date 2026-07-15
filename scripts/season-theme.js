import { startSummerEffect, stopSummerEffect } from "./summer-effect.js";
import { startAutumnEffect, stopAutumnEffect } from "./autumn-effect.js";
import { startWinterEffect, stopWinterEffect } from "./winter-effect.js";
import { startSpringEffect, stopSpringEffect } from "./spring-effect.js";
import { createStorage } from "./storage.js";

const themeStorage = createStorage("flowdash-theme");

function getSeasonEffectLayer() {
  let layer = document.querySelector(".season-effect-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "season-effect-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.prepend(layer);
  }
  return layer;
}

// [핵심] 기존 찌꺼기 애니메이션 루프와 타임아웃을 안전하게 완전 청소하는 유틸리티
function clearPreviousSeasonEffects(layer) {
  stopSpringEffect();
  stopSummerEffect(layer);
  stopAutumnEffect();
  stopWinterEffect();
  if (layer) {
    layer.textContent = ""; // 남아있는 파티클 Element DOM들을 완벽히 지워 메모리 누수를 원천 차단
  }
}

function updateSeasonEffect() {
  const layer = getSeasonEffectLayer();
  const currentTheme =
    document.documentElement.getAttribute("data-theme") ||
    themeStorage.get("season") ||
    "default";

  // 1. 새 효과가 적용되기 전에, 활성화된 모든 루프와 가비지 컬렉팅 요소를 청소
  clearPreviousSeasonEffects(layer);

  // 2. 단 한 가지의 특정 애니메이션만 실행하여 중복 구동을 방지
  if (currentTheme === "spring") {
    startSpringEffect();
  } else if (currentTheme === "summer") {
    startSummerEffect(layer);
  } else if (currentTheme === "autumn") {
    startAutumnEffect();
  } else if (currentTheme === "winter") {
    startWinterEffect();
  }
}

// 돔 어트리뷰트 감지 설정 최적화
const themeObserver = new MutationObserver((mutations) => {
  const isThemeChanged = mutations.some(
    (m) => m.type === "attributes" && m.attributeName === "data-theme",
  );
  if (isThemeChanged) {
    updateSeasonEffect();
  }
});

themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

// 첫 실행 동기화
updateSeasonEffect();
