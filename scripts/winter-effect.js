import { createSvgFragment } from "./season-svg-utils.js";
/**
 * @file winterEffect.js
 * @description 화면에 아름답게 흔들리며 떨어지는 겨울 눈송이 애니메이션 효과를 구현한 모듈입니다.
 */

/**
 * 눈송이 생성을 주기적으로 실행하는 인터벌(Interval) 타이머 ID 관리 변수
 * @type {number|null}
 */
let winterInterval = null;

/**
 * 정교한 눈 결정 모양을 렌더링하기 위한 반응형 SVG 구조체 (반사 대칭 디자인 적용)
 * @type {string}
 */
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
    <!-- 눈송이 하나의 가지(Arm) 모양 정의 -->
    <g id="arm">
      <line x1="0" y1="0" x2="0" y2="-42"/>

      <circle cx="0" cy="-48" r="3.5" fill="currentColor" stroke="none"/>
      <line x1="0" y1="-16" x2="-10" y2="-24"/>
      <line x1="0" y1="-16" x2="10" y2="-24"/>
      <circle cx="-11" cy="-25" r="2.4" fill="currentColor" stroke="none"/>
      <circle cx="11" cy="-25" r="2.4" fill="currentColor" stroke="none"/>

      <line x1="0" y1="-28" x2="-9" y2="-35"/>
      <line x1="0" y1="-28" x2="9" y2="-35"/>
      <circle cx="-10" cy="-36" r="2.2" fill="currentColor" stroke="none"/>
      <circle cx="10" cy="-36" r="2.2" fill="currentColor" stroke="none"/>
    </g>
  </defs>

  <!-- 중심 원형 포인트 -->
  <circle r="4" fill="currentColor"/>

  <!-- 가지(Arm)를 60도씩 회전 복사하여 완벽한 육각형 결정 생성 -->
  <use href="#arm"/>
  <use href="#arm" transform="rotate(60)"/>
  <use href="#arm" transform="rotate(120)"/>
  <use href="#arm" transform="rotate(180)"/>
  <use href="#arm" transform="rotate(240)"/>
  <use href="#arm" transform="rotate(300)"/>

</svg>
`;

/**
 * 눈송이에 다양성을 더하기 위해 사용될 겨울 분위기의 파스텔 블루 및 화이트 계열 색상 배열
 * @type {string[]}
 */
const SNOW_COLORS = ["#A9CBEF", "#7FA9D8", "#EAF2F8"];

/**
 * 겨울 눈송이 낙하 애니메이션(Winter Snow Effect)을 시작합니다.
 * - 기존에 작동 중이던 겨울 레이어를 깨끗이 정리하고 새로 생성합니다.
 * - 성능 최적화(Fluffy 함박눈 비율 조절) 및 시각 보호(가장자리 밀도 조절) 로직이 결합되어 있습니다.
 *
 * @function startWinterEffect
 * @returns {void}
 */
export function startWinterEffect() {
  // 1. 중복 실행을 방지하기 위한 사전 초기화
  stopWinterEffect();

  // 2. 화면 전체를 덮을 이펙트 전용 배경 레이어 생성 및 마운트
  let layer = document.getElementById("bg-effect-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "bg-effect-layer";
    document.body.appendChild(layer);
  }
  layer.className = "winter-falling-layer";

  // 3. 애니메이션 재생이 완전히 끝난 눈송이를 DOM에서 자동으로 영구 소멸시키는 트리거
  layer.addEventListener("animationend", (event) => {
    if (event.target.classList.contains("winter-snowflake")) {
      event.target.remove();
    }
  });

  // 4. 250ms 주기로 눈송이 요소를 동적으로 드롭하는 메인 루프 가동
  winterInterval = setInterval(() => {
    const currentSnowflakes = layer.querySelectorAll(".winter-snowflake");

    // 과도한 DOM 노드로 인한 렌더링 병목 현상을 막기 위해 최대 활성 객체를 35개로 강제 제한
    if (currentSnowflakes.length >= 35) return;

    // [성능 및 연출 최적화] 18% 확률로 가벼운 뭉게구름형 함박눈(CSS 전용)을 만들고, 나머지는 SVG 구조물 활용
    const isFluffySnow = Math.random() < 0.18;

    // 크기를 소(40%), 중(40%), 대(20%) 비율 범위로 영리하게 다변화
    const sizeCategory = Math.random();
    let size = 0;
    if (sizeCategory < 0.4) {
      size = Math.floor(Math.random() * (7 - 4 + 1)) + 4; // 소형 결정 (4px ~ 7px)
    } else if (sizeCategory < 0.8) {
      size = Math.floor(Math.random() * (18 - 12 + 1)) + 12; // 중형 결정 (12px ~ 18px)
    } else {
      size = Math.floor(Math.random() * (32 - 26 + 1)) + 26; // 대형 결정 (26px ~ 32px)
    }

    const snowflake = document.createElement("span");
    snowflake.classList.add("winter-snowflake");

    // 눈 종류(Fluffy vs SVG 결정)에 따라 클래스 바인딩 또는 자식 돔 교체
    if (isFluffySnow) {
      snowflake.classList.add("winter-snowflake--fluffy");
    } else {
      snowflake.replaceChildren(createSvgFragment(SNOWFLAKE_SVG));
    }

    // [UI UX 배려] 눈이 중앙 콘텐츠를 가리지 않도록 80% 확률로 좌/우 사이드 영역(0~15%, 85~100%)에 밀집 생성
    let leftPosition = 0;
    if (Math.random() < 0.8) {
      leftPosition =
        Math.random() < 0.5 ? Math.random() * 15 : 85 + Math.random() * 15;
    } else {
      leftPosition = 15 + Math.random() * 70; // 20% 확률로만 화면 중앙 영역에 분산 생성
    }

    // 스타일 매개변수 생성
    const color = SNOW_COLORS[Math.floor(Math.random() * SNOW_COLORS.length)];
    const duration = 8 + Math.random() * 6; // 낙하 속도 (8초 ~ 14초)
    const delay = Math.random() * 3; // 자연스러운 흩뿌림 싱크를 위한 가상 딜레이
    const opacity = 0.6 + Math.random() * 0.4; // 불투명도 편차 (0.6 ~ 1.0)

    // 낙하 중 흔들림 폭(Sway)과 최대 회전 변위 설계
    const swayDistance =
      (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 60); // 좌우 흔들림 거리 (-100px ~ 100px)
    const maxRotation = 180 + Math.floor(Math.random() * 360); // 자전 회전수 (180deg ~ 540deg)

    // 5. CSS custom properties 및 고유 스타일 연동
    snowflake.style.width = `${size}px`;
    snowflake.style.height = `${size}px`;
    snowflake.style.left = `${leftPosition}%`;
    snowflake.style.color = color;
    snowflake.style.opacity = opacity;
    snowflake.style.animationDuration = `${duration}s`;
    snowflake.style.animationDelay = `-${delay}s`; // 로드 즉시 배치된 상태로 애니메이션이 시작되게 만듦
    snowflake.style.setProperty("--sway-distance", `${swayDistance}px`);
    snowflake.style.setProperty("--max-rotation", `${maxRotation}deg`);

    layer.appendChild(snowflake);
  }, 250);
}

/**
 * 활성화되어 있는 겨울 애니메이션 루프를 파괴하고, 잔존하는 눈송이 레이어를 클린업합니다.
 *
 * @function stopWinterEffect
 * @returns {void}
 */
export function stopWinterEffect() {
  // 생성 주기 인터벌 해제
  if (winterInterval) {
    clearInterval(winterInterval);
    winterInterval = null;
  }

  // 화면 내 배경 레이어 영구 파괴
  const layer = document.getElementById("bg-effect-layer");
  if (layer) {
    layer.remove();
  }
}
