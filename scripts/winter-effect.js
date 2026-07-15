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

  <circle r="4" fill="currentColor"/>

  <use href="#arm"/>
  <use href="#arm" transform="rotate(60)"/>
  <use href="#arm" transform="rotate(120)"/>
  <use href="#arm" transform="rotate(180)"/>
  <use href="#arm" transform="rotate(240)"/>
  <use href="#arm" transform="rotate(300)"/>

</svg>
`;

const SNOW_COLORS = ["#A9CBEF", "#7FA9D8", "#EAF2F8"];

/**
 * Starts the winter snow animation.
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

  layer.addEventListener("animationend", (event) => {
    if (event.target.classList.contains("winter-snowflake")) {
      event.target.remove();
    }
  });

  winterInterval = setInterval(() => {
    const currentSnowflakes = layer.querySelectorAll(".winter-snowflake");

    if (currentSnowflakes.length >= 35) return;

    const isFluffySnow = Math.random() < 0.18;
    const sizeCategory = Math.random();
    let size = 0;
    if (sizeCategory < 0.4) {
      size = Math.floor(Math.random() * (7 - 4 + 1)) + 4;
    } else if (sizeCategory < 0.8) {
      size = Math.floor(Math.random() * (18 - 12 + 1)) + 12;
    } else {
      size = Math.floor(Math.random() * (32 - 26 + 1)) + 26;
    }

    const snowflake = document.createElement("span");
    snowflake.classList.add("winter-snowflake");

    if (isFluffySnow) {
      snowflake.classList.add("winter-snowflake--fluffy");
    } else {
      snowflake.replaceChildren(createSvgFragment(SNOWFLAKE_SVG));
    }

    let leftPosition = 0;
    if (Math.random() < 0.8) {
      leftPosition =
        Math.random() < 0.5 ? Math.random() * 15 : 85 + Math.random() * 15;
    } else {
      leftPosition = 15 + Math.random() * 70;
    }

    const color = SNOW_COLORS[Math.floor(Math.random() * SNOW_COLORS.length)];
    const duration = 8 + Math.random() * 6;
    const delay = Math.random() * 3;
    const opacity = 0.6 + Math.random() * 0.4;

    const swayDistance =
      (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 60);
    const maxRotation = 180 + Math.floor(Math.random() * 360);

    snowflake.style.width = `${size}px`;
    snowflake.style.height = `${size}px`;
    snowflake.style.left = `${leftPosition}%`;
    snowflake.style.color = color;
    snowflake.style.opacity = opacity;
    snowflake.style.animationDuration = `${duration}s`;
    snowflake.style.animationDelay = `-${delay}s`;
    snowflake.style.setProperty("--sway-distance", `${swayDistance}px`);
    snowflake.style.setProperty("--max-rotation", `${maxRotation}deg`);

    layer.appendChild(snowflake);
  }, 250);
}

/**
 * Stops the winter snow animation and removes the effect layer.
 */
export function stopWinterEffect() {
  if (winterInterval) {
    clearInterval(winterInterval);
    winterInterval = null;
  }

  const layer = document.getElementById("bg-effect-layer");
  if (layer) {
    layer.remove();
  }
}
