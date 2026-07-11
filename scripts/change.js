const sortButton = document.querySelector(".search-sort-button");
const sortButtonText = document.querySelector(".search-sort-button-text");
const sortInfo = document.querySelector(".search-sort-info");
const sortIcon = document.querySelector(".search-sort-button-icon svg");
const boardLists = [
  document.querySelector(".todo-list"),
  document.querySelector(".doing-list"),
  document.querySelector(".done-list"),
];

let isAscending = true;

const clearTouchActiveState = () => {
  sortButton.classList.remove("is-touch-active");
  sortButton.classList.remove("search-sort-button--touch-reset");
};

sortButton.addEventListener(
  "touchstart",
  () => {
    sortButton.classList.add("is-touch-active");
    sortButton.classList.add("search-sort-button--touch-reset");
  },
  { passive: true },
);

sortButton.addEventListener("touchend", clearTouchActiveState, {
  passive: true,
});
sortButton.addEventListener("touchcancel", clearTouchActiveState, {
  passive: true,
});
sortButton.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch" || event.pointerType === "pen") {
    sortButton.classList.add("is-touch-active");
    sortButton.classList.add("search-sort-button--touch-reset");
  }
});
sortButton.addEventListener("pointerup", clearTouchActiveState);
sortButton.addEventListener("pointercancel", clearTouchActiveState);
sortButton.addEventListener("pointerleave", clearTouchActiveState);
sortButton.addEventListener("mouseup", clearTouchActiveState);
sortButton.addEventListener("blur", clearTouchActiveState);

sortButton.addEventListener("click", () => {
  isAscending = !isAscending;

  const text = isAscending ? "오름차순" : "내림차순";

  sortButtonText.textContent = `정렬: ${text}`;
  sortInfo.innerHTML = `<span class="sort-title">정렬: </span>${text}`;

  sortIcon.style.transform = isAscending ? "rotate(0deg)" : "rotate(180deg)";

  // ⭐ 여기부터 실제 정렬
  boardLists.forEach((list) => {
    if (!list) return;

    const items = [...list.querySelectorAll(".board-item")];

    items.sort((a, b) => {
      const titleA = a.querySelector(".todo-title").textContent;
      const titleB = b.querySelector(".todo-title").textContent;

      return isAscending
        ? titleA.localeCompare(titleB, "ko")
        : titleB.localeCompare(titleA, "ko");
    });

    items.forEach((item) => {
      list.appendChild(item);
    });
  });
});
