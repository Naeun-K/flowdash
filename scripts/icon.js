const images = [
  "love.webp",
  "moon.webp",
  "power.webp",
  "smile.webp",
  "turtle.webp",
];

function updateRandomIcon() {
  const iconSpan = document.querySelector(".greeting-icon");

  if (!iconSpan) return; // 요소가 없으면 종료

  // 랜덤 인덱스 선택
  const randomIndex = Math.floor(Math.random() * images.length);
  const selectedImage = images[randomIndex];

  // img 태그 생성 및 속성 부여
  const img = document.createElement("img");
  img.src = `img/${selectedImage}`;
  img.alt = "랜덤 아이콘";
  img.style.width = "34px"; // SVG 크기에 맞춤
  img.style.height = "34px";

  // 기존 내용을 지우고 이미지 삽입
  iconSpan.innerHTML = "";
  iconSpan.appendChild(img);
}

// 페이지가 로드될 때 실행
window.addEventListener("DOMContentLoaded", updateRandomIcon);
