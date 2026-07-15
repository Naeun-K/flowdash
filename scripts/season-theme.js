// ========================================
// 봄 - 벚꽃잎 생성
// ========================================

// ========================================
// 여름 - 물결 생성
// ========================================

import { startSummerEffect, stopSummerEffect } from "./summer-effect.js";

console.log("★★★★ season-theme 실행 ★★★★");
console.log("season-theme.js 실행됨");
// ========================================
// 계절 효과 레이어 가져오기 또는 자동 생성
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
// 현재 테마에 맞는 효과 실행
// ========================================

function updateSeasonEffect() {
  const layer = getSeasonEffectLayer();

  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "default";

  console.log("현재 테마:", currentTheme);

  stopSummerEffect(layer);

  if (currentTheme === "summer") {
    console.log("여름 효과 시작");
    startSummerEffect(layer);
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

// 처음 실행
updateSeasonEffect();
// ========================================
// 가을 - 낙엽 생성
// ========================================

// ========================================
// 겨울 - 눈송이 생성
// ========================================
