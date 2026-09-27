export default function initLocateMiddle() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  if (anchorLinks.length === 0) return;

  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      const targetRect = target.getBoundingClientRect();
      const targetTop = targetRect.top + window.scrollY;

      // 대상 콘텐츠가 화면 세로 중앙에 위치하도록 계산
      const targetPosition =
        targetTop - (window.innerHeight - targetRect.height) / 2;

      window.scrollTo(0, targetPosition);
    });
  });
}
