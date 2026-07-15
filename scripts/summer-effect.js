// ========================================
// 여름 물결 효과
// ========================================

const summerTimers = new WeakMap();

const RIPPLE_SIZE_RANGES = [
  { min: 50, max: 70 },
  { min: 100, max: 140 },
  { min: 180, max: 220 },
];

const MAX_RIPPLES = 7;
const MIN_INTERVAL = 500;
const MAX_INTERVAL = 900;

// 최솟값과 최댓값 사이의 무작위 숫자
function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

// 배열에서 무작위 항목 선택
function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

// 좌우 가장자리와 화면의 빈 공간 위주로 위치 설정
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

// 물결 하나 생성
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

// 다음 물결 생성 예약
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

// 여름 효과 시작
export function startSummerEffect(layer) {
  if (!layer) return;

  // 중복 실행 방지
  if (summerTimers.has(layer)) return;

  summerTimers.set(layer, {
    intervalId: null,
  });

  // 시작 즉시 첫 번째 물결 생성
  createRipple(layer);

  // 이후 1.2~2초 간격으로 생성
  scheduleNextRipple(layer);
}

// 여름 효과 종료
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
