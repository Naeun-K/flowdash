import { startSummerEffect, stopSummerEffect } from "./summer-effect.js";
import { startAutumnEffect, stopAutumnEffect } from "./autumn-effect.js";
import { startWinterEffect, stopWinterEffect } from "./winter-effect.js";
import { startSpringEffect, stopSpringEffect } from "./spring-effect.js";
import { createStorage } from "./storage.js";

/**
 * @namespace themeStorage
 * @description 로컬 스토리지에 테마 설정을 영구 저장하고 불러오기 위한 스토리지 인스턴스
 */
const themeStorage = createStorage("flowdash-theme");

/**
 * 화면 전체에 계절 효과(벚꽃, 눈, 낙엽 등)를 렌더링할 전용 컨테이너 레이어 DOM을 조회하거나 생성합니다.
 * - 바디(body) 태그 내 최상단에 생성하며, 스크린 리더 등 보조 기술이 무시하도록 ARIA 속성을 지정합니다.
 * @returns {HTMLElement} 계절 효과 렌더링용 컨테이너 요소 (`.season-effect-layer`)
 */
function getSeasonEffectLayer() {
  let layer = document.querySelector(".season-effect-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "season-effect-layer";
    layer.setAttribute("aria-hidden", "true"); // 접근성: 보조 기기(스크린 리더)에서 시각 효과 요소 제외
    document.body.prepend(layer);
  }
  return layer;
}

/**
 * 이전에 동작 중이던 모든 계절 효과를 안전하게 정지시키고 렌더링 컨테이너의 잔여 요소를 완전히 비웁니다.
 * - 새로운 계절 효과가 시작될 때 효과가 중첩되어 화면이 깨지는 현상을 방지합니다.
 * @param {HTMLElement} layer - 계절 효과가 그려지던 컨테이너 DOM 객체
 */
function clearPreviousSeasonEffects(layer) {
  stopSpringEffect();
  stopSummerEffect(layer);
  stopAutumnEffect();
  stopWinterEffect();
  if (layer) {
    layer.textContent = ""; // 남아있는 잔여 그래픽 요소(Canvas, Div 등)를 물리적으로 제거
  }
}

/**
 * [핵심 기능] 현재 적용된 시스템 테마에 맞추어 활성화할 계절 효과를 판단하고 실시간 실행합니다.
 * - 우선순위: HTML 태그의 `data-theme` 속성값 ➡️ 로컬 스토리지 저장값 ➡️ 기본값('default')
 * - 이전 효과를 모두 청소한 뒤, 해당하는 계절의 이펙트 기동 함수를 호출합니다.
 */
function updateSeasonEffect() {
  const layer = getSeasonEffectLayer();

  // 현재 활성화된 테마 문자열 식별
  const currentTheme =
    document.documentElement.getAttribute("data-theme") ||
    themeStorage.get("season") ||
    "default";
  console.log(currentTheme);
  // 1. 기존 동작 중인 이펙트 리소스를 일괄 해제
  clearPreviousSeasonEffects(layer);

  // 2. 결정된 테마에 맞춰 새로운 특수 효과 재생 시작
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

/**
 * @type {MutationObserver}
 * html 태그의 특성 변화(Attributes) 중 특히 `data-theme` 속성의 실시간 수정을 감시하는 관찰자 객체
 */
const themeObserver = new MutationObserver((mutations) => {
  const isThemeChanged = mutations.some(
    (m) => m.type === "attributes" && m.attributeName === "data-theme",
  );
  // data-theme 속성이 실제로 바뀌었다면 화면의 계절 효과를 다시 로드합니다.
  if (isThemeChanged) {
    updateSeasonEffect();
  }
});

// `html` 문서 시작 요소에 테마 관찰 인터페이스 바인딩 시작
themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"], // 다른 속성이 아닌 오직 'data-theme' 속성 변화만 정밀 추적
});

// --- 초기 진입 실행부 ---
// 페이지 최초 진입 또는 새로고침 시 저장된 테마에 맞게 첫 화면 이펙트 즉시 기동
updateSeasonEffect();

//  외부 파일(main.js)에서 이 함수를 쓸 수 있도록 내보냄
export { updateSeasonEffect };
