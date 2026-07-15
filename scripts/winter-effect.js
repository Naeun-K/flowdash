let winterInterval = null;

const SNOWFLAKE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="-64 -64 128 128"
     width="64"
     height="64"
     fill="none"
     stroke="currentColor"
     stroke-width="6"
     stroke-linecap="round"
     stroke-linejoin="round">

  <defs>
    <g id="arm">
      <!-- 메인 가지 -->
      <line x1="0" y1="0" x2="0" y2="-42"/>

      <!-- 끝 -->
      <circle cx="0" cy="-48" r="3.5" fill="currentColor" stroke="none"/>

      <!-- 첫 번째 가지 -->
      <line x1="0" y1="-16" x2="-10" y2="-24"/>
      <line x1="0" y1="-16" x2="10" y2="-24"/>
      <circle cx="-11" cy="-25" r="2.4" fill="currentColor" stroke="none"/>
      <circle cx="11" cy="-25" r="2.4" fill="currentColor" stroke="none"/>

      <!-- 두 번째 가지 -->
      <line x1="0" y1="-28" x2="-9" y2="-35"/>
      <line x1="0" y1="-28" x2="9" y2="-35"/>
      <circle cx="-10" cy="-36" r="2.2" fill="currentColor" stroke="none"/>
      <circle cx="10" cy="-36" r="2.2" fill="currentColor" stroke="none"/>
    </g>
  </defs>

  <circle r="4" fill="currentColor"/>

  <use href="#arm"/>
  <use href="#arm" transform="rotate(60)"/>
  <use href="#arm" transform="rotate(120)"/>
  <use href="#arm" transform="rotate(180)"/>
  <use href="#arm" transform="rotate(240)"/>
  <use href="#arm" transform="rotate(300)"/>

</svg>
`;

// 지정된 눈송이 색상 조합
const SNOW_COLORS = ["#A9CBEF", "#7FA9D8", "#EAF2F8"];

/**
 * 겨울 눈 애니메이션 시작 함수
 */
export function startWinterEffect() {
  stopWinterEffect();

  let layer = document.getElementById("bg-effect-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "bg-effect-layer";
    document.body.appendChild(layer);
  }
  layer.className = "winter-falling-layer";

  // ==========================================
  // 💡 [수정 및 극대 최적화] 이벤트 위임(Event Delegation) 기법 사용
  // 개별 눈송이마다 이벤트를 걸지 않고, 부모 레이어 단 한 곳에서만 버블링되는 완료 이벤트를 캐치하여 삭제합니다.
  // 이로 인해 타이머 누수 및 이벤트 리스너 누수가 원천적으로 0%가 됩니다.
  // ==========================================
  layer.addEventListener("animationend", (event) => {
    if (event.target.classList.contains("winter-snowflake")) {
      event.target.remove();
    }
  });

  // 눈송이 생성 타이머 시작
  winterInterval = setInterval(() => {
    const currentSnowflakes = layer.querySelectorAll(".winter-snowflake");

    // 풍성함을 유지하되 무리하지 않도록 최대 25개 제한 유지
    if (currentSnowflakes.length >= 35) return;

    const isFluffySnow = Math.random() < 0.18;
    // 크기 분류 난수 설정
    const sizeCategory = Math.random();
    let size = 0;
    if (sizeCategory < 0.4) {
      size = Math.floor(Math.random() * (7 - 4 + 1)) + 4; // 4 ~ 7px
    } else if (sizeCategory < 0.8) {
      size = Math.floor(Math.random() * (18 - 12 + 1)) + 12; // 12 ~ 18px
    } else {
      size = Math.floor(Math.random() * (32 - 26 + 1)) + 26; // 26 ~ 32px
    }

    const snowflake = document.createElement("span");
    snowflake.classList.add("winter-snowflake");

    if (isFluffySnow) {
      snowflake.classList.add("winter-snowflake--fluffy");
    } else {
      snowflake.replaceChildren(createSvgFragment(SNOWFLAKE_SVG));
    }

    // 좌우 배치 비율
    let leftPosition = 0;
    if (Math.random() < 0.8) {
      leftPosition =
        Math.random() < 0.5 ? Math.random() * 15 : 85 + Math.random() * 15;
    } else {
      leftPosition = 15 + Math.random() * 70;
    }

    const color = SNOW_COLORS[Math.floor(Math.random() * SNOW_COLORS.length)];
    const duration = 8 + Math.random() * 6; // 전체 떨어지는 시간
    const delay = Math.random() * 3; // 시작 딜레이
    const opacity = 0.6 + Math.random() * 0.4;

    const swayDistance =
      (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 60);
    const maxRotation = 180 + Math.floor(Math.random() * 360);

    // 인라인 스타일로 변수 전달
    snowflake.style.width = `${size}px`;
    snowflake.style.height = `${size}px`;
    snowflake.style.left = `${leftPosition}%`;
    snowflake.style.color = color;
    snowflake.style.opacity = opacity;
    snowflake.style.animationDuration = `${duration}s`;
    snowflake.style.animationDelay = `-${delay}s`; // 즉시 떨어지는 시각 효과를 위해 음수 유지
    snowflake.style.setProperty("--sway-distance", `${swayDistance}px`);
    snowflake.style.setProperty("--max-rotation", `${maxRotation}deg`);

    layer.appendChild(snowflake);
  }, 250);
}

/**
 * 겨울 눈 애니메이션 중지 및 자원 정리 함수
 */
export function stopWinterEffect() {
  if (winterInterval) {
    clearInterval(winterInterval);
    winterInterval = null;
  }

  const layer = document.getElementById("bg-effect-layer");
  if (layer) {
    // [보완] 부모 레이어와 리스너를 한 번에 파괴하여 완벽하게 가비지 컬렉션 대상이 되도록 처리
    layer.remove();
  }
}
