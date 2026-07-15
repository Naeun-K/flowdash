const summerTimers = new WeakMap();

const RIPPLE_SIZE_RANGES = [
  { min: 50, max: 70 },
  { min: 100, max: 140 },
  { min: 180, max: 220 },
];

const MAX_RIPPLES = 7;
const MIN_INTERVAL = 500;
const MAX_INTERVAL = 900;

/**
 * Returns a random number inside a given inclusive range.
 * @param {number} min - Lower bound.
 * @param {number} max - Upper bound.
 * @returns {number} A random value.
 */
function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Picks a random item from an array.
 * @param {Array<unknown>} items - Candidate values.
 * @returns {unknown} A randomly selected item.
 */
function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Computes a random ripple position based on viewport size.
 * @param {number} size - Ripple size in pixels.
 * @returns {{ top: number, left: number }} A random position.
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
 * Creates a single summer ripple element.
 * @param {HTMLElement} layer - The ripple container.
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
 * Schedules the next ripple generation cycle.
 * @param {HTMLElement} layer - The ripple container.
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
 * Starts generating summer ripple effects.
 * @param {HTMLElement} layer - The ripple container.
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
 * Stops the summer ripple effect and clears existing ripples.
 * @param {HTMLElement} layer - The ripple container.
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
