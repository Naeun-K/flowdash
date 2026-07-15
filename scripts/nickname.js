import { createStorage } from "./storage.js";

const nicknameStorage = createStorage("flowdash-nickname");
const nicknameElement = document.querySelector(".greeting-nickname");

const measureSpan = document.createElement("span");
measureSpan.style.visibility = "hidden";
measureSpan.style.position = "absolute";
measureSpan.style.whiteSpace = "pre";
measureSpan.style.top = "-9999px";
measureSpan.style.left = "-9999px";
document.body.append(measureSpan);

if (nicknameElement) {
  const savedNickname = nicknameStorage.get("nickname");
  nicknameElement.textContent = savedNickname || "Flowdash";

  nicknameElement.addEventListener("click", handleNicknameClick);
}

/**
 * Switches the nickname element into an editable input.
 */
function handleNicknameClick() {
  if (!nicknameElement) return;

  const input = document.createElement("input");
  input.value = nicknameElement.textContent.trim();

  input.style.color = "var(--theme-text)";
  input.style.border = "1px solid var(--theme-text)";
  input.style.font = "inherit";
  input.style.background = "transparent";
  input.style.padding = "0 2px";
  input.style.outline = "none";
  input.style.boxSizing = "content-box";

  function resizeInput() {
    measureSpan.textContent = input.value || " ";
    measureSpan.style.font = getComputedStyle(input).font;
    input.style.width = `${measureSpan.offsetWidth + 6}px`;
  }

  nicknameElement.replaceWith(input);
  input.focus();
  resizeInput();

  let isSaving = false;

  function saveNickname() {
    if (isSaving) return;
    isSaving = true;

    const newNickname = input.value.trim();
    const finalNickname = newNickname || "Flowdash";

    nicknameStorage.set("nickname", finalNickname);
    nicknameElement.textContent = finalNickname;

    cleanupEvents();
    input.replaceWith(nicknameElement);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      saveNickname();
    }
  }

  function cleanupEvents() {
    input.removeEventListener("input", resizeInput);
    input.removeEventListener("keydown", handleKeyDown);
    input.removeEventListener("blur", saveNickname);
  }

  input.addEventListener("input", resizeInput);
  input.addEventListener("keydown", handleKeyDown);
  input.addEventListener("blur", saveNickname);
}
