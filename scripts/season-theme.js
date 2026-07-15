// ========================================
// 계절 효과 가져오기
// ========================================

import { startSummerEffect, stopSummerEffect } from "./summer-effect.js";

import { startAutumnEffect, stopAutumnEffect } from "./autumn-effect.js";

import { startWinterEffect, stopWinterEffect } from "./winter-effect.js";
import { startSpringEffect, stopSpringEffect } from "./spring-effect.js";

console.log("★★★★ season-theme 실행 ★★★★");

// ========================================
// 여름 효과 레이어 가져오기 또는 자동 생성
// ========================================

function getSeasonEffectLayer() {
  let layer = document.querySelector(".season-effect-layer");

  if (!layer) {
    layer = document.createElement("div");
    layer.className = "season-effect-layer";
    layer.setAttribute("aria-hidden", "true");

    document.body.prepend(layer);

    console.log("계절 효과 레이어 자동 생성됨");
  }

  return layer;
}

// ========================================
// 모든 계절 효과 중지
// ========================================

function stopAllSeasonEffects(layer) {
  stopSummerEffect(layer);
  stopAutumnEffect();
  stopWinterEffect();
  stopSpringEffect();
}

// ========================================
// 현재 테마에 맞는 효과 실행
// ========================================

function updateSeasonEffect() {
  const layer = getSeasonEffectLayer();

  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "default";

  console.log("현재 테마:", currentTheme);

  stopAllSeasonEffects(layer);

  if (currentTheme === "spring") {
    console.log("봄 효과 시작");
    startSpringEffect();
  }
  if (currentTheme === "summer") {
    console.log("여름 효과 시작");
    startSummerEffect(layer);
  }

  if (currentTheme === "autumn") {
    console.log("가을 효과 시작");
    startAutumnEffect();
  }

  if (currentTheme === "winter") {
    console.log("겨울 효과 시작");
    startWinterEffect();
  }
}

// ========================================
// 테마 변경 감지
// ========================================

const themeObserver = new MutationObserver((mutationList) => {
  const themeChanged = mutationList.some(
    (mutation) =>
      mutation.type === "attributes" && mutation.attributeName === "data-theme",
  );

  if (themeChanged) {
    updateSeasonEffect();
  }
});

themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

// ========================================
// 처음 실행
// ========================================

updateSeasonEffect();
