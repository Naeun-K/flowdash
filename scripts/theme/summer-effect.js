/**
 * 여름 물결 효과의 타이머 ID를 관리하는 WeakMap 객체
 * @type {WeakMap<HTMLElement, { intervalId: number|null }>}
 */
const summerTimers = new WeakMap();

/**
 * 물결(ripple)의 크기 범위를 정의하는 옵션 배열 (픽셀 단위)
 * @type {Array<{ min: number, max: number }>}
 */
const RIPPLE_SIZE_RANGES = [
  { min: 50, max: 70 },
  { min: 100, max: 140 },
  { min: 180, max: 220 },
];

/**
 * 화면에 동시에 존재할 수 있는 최대 물결 개수
 * @type {number}
 */
const MAX_RIPPLES = 7;

/**
 * 물결 생성 최소 주기 (밀리초 단위)
 * @type {number}
 */
const MIN_INTERVAL = 500;

/**
 * 물결 생성 최대 주기 (밀리초 단위)
 * @type {number}
 */
const MAX_INTERVAL = 900;

/**
 * 지정된 범위(최솟값, 최댓값 포함) 내에서 무작위 숫자를 반환합니다.
 * @param {number} min - 최솟값 (하한선)
 * @param {number} max - 최댓값 (상한선)
 * @returns {number} 무작위로 생성된 값
 */
function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * 배열에서 무작위로 하나의 아이템을 선택합니다.
 * @param {Array<unknown>} items - 선택 대상 후보 값들이 담긴 배열
 * @returns {unknown} 무작위로 선택된 아이템
 */
function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * 뷰포트 크기를 기준으로 무작위 물결(ripple)의 위치를 계산합니다.
 * @param {number} size - 픽셀 단위의 물결 크기
 * @returns {{ top: number, left: number }} 무작위로 계산된 위치 좌표 (top, left)
 */
function getRandomPosition(size) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const sides = ["left", "center", "right"];
  const side = getRandomItem(sides);

  const verticalAreas = [
    {
      min: -size * 0.2,
      max: viewportHeight * 0.25,
    },
    {
      min: viewportHeight * 0.3,
      max: viewportHeight * 0.7,
    },
    {
      min: viewportHeight * 0.25,
      max: viewportHeight * 0.7,
    },
  ];

  const verticalArea = getRandomItem(verticalAreas);
  const top = getRandomNumber(verticalArea.min, verticalArea.max);

  let left;

  if (side === "left") {
    left = getRandomNumber(-size * 0.45, viewportWidth * 0.1);
  } else if (side === "center") {
    left = getRandomNumber(viewportWidth * 0.3, viewportWidth * 0.7 - size);
  } else {
    left = getRandomNumber(viewportWidth * 0.85, viewportWidth - size * 0.45);
  }

  return { top, left };
}

/**
 * 하나의 여름 물결(ripple) 요소를 생성합니다.
 * @param {HTMLElement} layer - 물결 요소가 추가될 컨테이너 레이어
 */
function createRipple(layer) {
  const currentRippleCount = layer.querySelectorAll(".summer-ripple").length;

  if (currentRippleCount >= MAX_RIPPLES) return;

  const sizeRange = getRandomItem(RIPPLE_SIZE_RANGES);
  const size = getRandomNumber(sizeRange.min, sizeRange.max);

  const duration = getRandomNumber(4.5, 5.6);
  const delay = getRandomNumber(0, 0.5);

  const { top, left } = getRandomPosition(size);

  const ripple = document.createElement("span");

  ripple.className = "summer-ripple";

  const heightRatio = getRandomNumber(0.75, 1);

  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;

  ripple.style.left = `${left}px`;
  ripple.style.top = `${top}px`;

  ripple.style.setProperty("--duration", `${duration}s`);
  ripple.style.animationDelay = `${delay}s`;

  ripple.addEventListener(
    "animationend",
    () => {
      ripple.remove();
    },
    { once: true },
  );

  layer.append(ripple);
}

/**
 * 다음 물결 생성 주기를 스케줄링(예약)합니다.
 * @param {HTMLElement} layer - 물결 요소가 추가될 컨테이너 레이어
 */
function scheduleNextRipple(layer) {
  const timerData = summerTimers.get(layer);

  if (!timerData) return;

  const interval = getRandomNumber(MIN_INTERVAL, MAX_INTERVAL);

  timerData.intervalId = window.setInterval(() => {
    createRipple(layer);

    clearInterval(timerData.intervalId);
    scheduleNextRipple(layer);
  }, interval);
}

/**
 * 여름 물결(ripple) 효과 생성을 시작합니다.
 * @param {HTMLElement} layer - 물결 효과를 적용할 컨테이너 레이어
 */
export function startSummerEffect(layer) {
  if (!layer) return;

  if (summerTimers.has(layer)) return;

  summerTimers.set(layer, {
    intervalId: null,
  });

  createRipple(layer);

  scheduleNextRipple(layer);
}

/**
 * 여름 물결 효과를 중지하고 기존에 생성된 모든 물결 요소를 제거합니다.
 * @param {HTMLElement} layer - 물결 효과를 중지할 컨테이너 레이어
 */
export function stopSummerEffect(layer) {
  if (!layer) return;

  const timerData = summerTimers.get(layer);

  if (timerData?.intervalId) {
    clearInterval(timerData.intervalId);
  }

  summerTimers.delete(layer);

  layer.querySelectorAll(".summer-ripple").forEach((ripple) => {
    ripple.remove();
  });
}
