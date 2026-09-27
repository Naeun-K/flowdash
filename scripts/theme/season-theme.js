import { startSummerEffect, stopSummerEffect } from "./summer-effect.js";
import { startAutumnEffect, stopAutumnEffect } from "./autumn-effect.js";
import { startWinterEffect, stopWinterEffect } from "./winter-effect.js";
import { startSpringEffect, stopSpringEffect } from "./spring-effect.js";
import { createStorage } from "../utils/storage.js";
import { updateRandomIcon } from "../icons/random-icons.js";

/**
 * @namespace themeStorage
 * @description 로컬 스토리지에 테마 설정을 영구 저장하고 불러오기 위한 스토리지 인스턴스
 */
const themeStorage = createStorage("flowdash-theme");

/**
 * 화면 전체에 계절 효과를 렌더링할 전용 컨테이너 레이어 DOM을
 * 조회하거나 생성합니다.
 */
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

/**
 * 이전에 동작 중이던 모든 계절 효과를 정지시키고
 * 렌더링 컨테이너의 잔여 요소를 제거합니다.
 */
function clearPreviousSeasonEffects(layer) {
  stopSpringEffect();
  stopSummerEffect(layer);
  stopAutumnEffect();
  stopWinterEffect();

  if (layer) {
    layer.textContent = "";
  }
}

/**
 * 현재 테마에 맞는 계절 효과와 랜덤 아이콘을 갱신합니다.
 */
function updateSeasonEffect() {
  const layer = getSeasonEffectLayer();

  const currentTheme =
    document.documentElement.getAttribute("data-theme") ||
    themeStorage.get("season") ||
    "default";

  // 기존 계절 효과 제거
  clearPreviousSeasonEffects(layer);

  // 현재 계절에 맞는 효과 실행
  if (currentTheme === "spring") {
    startSpringEffect();
  } else if (currentTheme === "summer") {
    startSummerEffect(layer);
  } else if (currentTheme === "autumn") {
    startAutumnEffect();
  } else if (currentTheme === "winter") {
    startWinterEffect();
  }

  // 현재 테마에 맞는 랜덤 아이콘으로 변경
  // 무작위 아이콘 업데이트 실행 (데이터 전달)
  updateRandomIcon();
}

/**
 * html의 data-theme 변경을 감시합니다.
 */
const themeObserver = new MutationObserver((mutations) => {
  const isThemeChanged = mutations.some(
    (mutation) =>
      mutation.type === "attributes" && mutation.attributeName === "data-theme",
  );

  if (isThemeChanged) {
    updateSeasonEffect();
  }
});

themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

export { updateSeasonEffect };
