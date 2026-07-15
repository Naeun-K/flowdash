import { startSummerEffect, stopSummerEffect } from "./summer-effect.js";
import { startAutumnEffect, stopAutumnEffect } from "./autumn-effect.js";
import { startWinterEffect, stopWinterEffect } from "./winter-effect.js";
import { startSpringEffect, stopSpringEffect } from "./spring-effect.js";
import { createStorage } from "./storage.js";

const themeStorage = createStorage("flowdash-theme");

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


function clearPreviousSeasonEffects(layer) {
  stopSpringEffect();
  stopSummerEffect(layer);
  stopAutumnEffect();
  stopWinterEffect();
  if (layer) {
    layer.textContent = ""; 
  }
}

function updateSeasonEffect() {
  const layer = getSeasonEffectLayer();
  const currentTheme =
    document.documentElement.getAttribute("data-theme") ||
    themeStorage.get("season") ||
    "default";

  
  clearPreviousSeasonEffects(layer);

  
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


const themeObserver = new MutationObserver((mutations) => {
  const isThemeChanged = mutations.some(
    (m) => m.type === "attributes" && m.attributeName === "data-theme",
  );
  if (isThemeChanged) {
    updateSeasonEffect();
  }
});

themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});


updateSeasonEffect();
