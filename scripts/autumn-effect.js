// let autumnInterval = null;
// const LEAF_COLORS = ["#C97843", "#D98A4E", "#E5A85F", "#B85F3C"];

// /**
//  * 가을 낙엽 애니메이션 시작 함수
//  * @param {HTMLElement} layer - 효과가 적용될 고정 배경 레이어 DOM
//  */
// export function startAutumnEffect(layer) {
//   // 이미 실행 중인 경우 중복 방지 정리
//   stopAutumnEffect(layer);

//   if (!layer) return;
//   layer.classList.add("autumn-falling-layer");

//   // 낙엽 생성 루프 (비동기 스케줄링)
//   autumnInterval = setInterval(() => {
//     // 1. 전체 낙엽 개수 체크 (최대 7개)
//     const currentLeaves = layer.querySelectorAll(".autumn-leaf");
//     if (currentLeaves.length >= 7) return;

//     // 2. 크기 분류 및 큰 낙엽 개수 제한 체크
//     const sizeCategory = Math.random(); // 0 ~ 1
//     let size = 0;
//     let isLarge = false;

//     if (sizeCategory < 0.4) {
//       // 작은 낙엽 (12~18px) - 40% 확률
//       size = Math.floor(Math.random() * (18 - 12 + 1)) + 12;
//     } else if (sizeCategory < 0.8) {
//       // 중간 낙엽 (22~30px) - 40% 확률
//       size = Math.floor(Math.random() * (30 - 22 + 1)) + 22;
//     } else {
//       // 큰 낙엽 (38~46px) - 20% 확률
//       const largeCount = layer.querySelectorAll(
//         '.autumn-leaf[data-size="large"]',
//       ).length;
//       if (largeCount >= 2) return; // 큰 낙엽은 동시에 2개 이상 생성 금지

//       size = Math.floor(Math.random() * (46 - 38 + 1)) + 38;
//       isLarge = true;
//     }

//     // 3. 낙엽 요소 생성 및 속성 정의
//     const leaf = document.createElement("div");
//     leaf.classList.add("autumn-leaf");
//     if (isLarge) leaf.setAttribute("data-size", "large");

//     // 화면 좌우 가장자리 위주 생성 (80% 확률로 좌우 15% 영역 선택, 20% 확률로 중앙부)
//     let leftPosition = 0;
//     if (Math.random() < 0.8) {
//       leftPosition =
//         Math.random() < 0.5
//           ? Math.random() * 15 // 왼쪽 가장자리 (0% ~ 15%)
//           : 85 + Math.random() * 15; // 오른쪽 가장자리 (85% ~ 100%)
//     } else {
//       leftPosition = 15 + Math.random() * 70; // 중앙 빈 공간 (15% ~ 85%)
//     }

//     // 무작위 변수 계산 (색상, 회전 각도, 흔들림 거리, 재생 시간)
//     const randomColor =
//       LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
//     const duration = 6 + Math.random() * 5; // 6초 ~ 11초 (벚꽃보다 느리게 설정)
//     const maxRotation = 540 + Math.floor(Math.random() * 360); // 540도 ~ 900도 회전
//     const swayDistance =
//       (Math.random() < 0.5 ? -1 : 1) * (80 + Math.random() * 100); // 좌우 흔들림 폭 (-180px ~ 180px)

//     // 스타일 적용
//     leaf.style.width = `${size}px`;
//     leaf.style.height = `${size}px`;
//     leaf.style.left = `${leftPosition}%`;
//     leaf.style.animationDuration = `${duration}s`;
//     leaf.style.setProperty("--leaf-color", randomColor);
//     leaf.style.setProperty("--max-rotation", `${maxRotation}deg`);
//     leaf.style.setProperty("--sway-distance", `${swayDistance}px`);

//     // 4. 애니메이션 종료 후 완전히 DOM에서 삭제 처리
//     leaf.addEventListener("animationend", () => {
//       leaf.remove();
//     });

//     layer.appendChild(leaf);
//   }, 800); // 0.8초마다 생성 시도
// }

// /**
//  * 가을 낙엽 애니메이션 중지 및 자원 정리 함수
//  * @param {HTMLElement} layer - 효과가 적용되었던 고정 배경 레이어 DOM
//  */
// export function stopAutumnEffect(layer) {
//   // 타이머 클리어
//   if (autumnInterval) {
//     clearInterval(autumnInterval);
//     autumnInterval = null;
//   }

//   // 레이어 내부 잔여 요소 및 클래스 완전 정리
//   if (layer) {
//     layer.innerHTML = "";
//     layer.className = "";
//   }
// }

let autumnInterval = null;
const LEAF_COLORS = ["#D96C3F", "#E58B3A", "#D4A15A", "#C96A43", "#E7B86A"];
const LEAF_SVGS = [
  // 1. 🇨🇦 캐나다 국기 스타일 단풍잎 (Sugar Maple Leaf) - 정밀 좌표 검증 완료!
  `<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%; height:100%;">
    <path d="M12 2s-.3 1.8-.8 2.5c-.5.7-1.3.5-1.9.8-.6.3-.9 1.1-1.3 1.5-.4.4-1.2.1-1.6.6-.4.5-.2 1.2-.5 1.8s-.9.8-1.4 1.3c-.5.5-.4 1.2-.4 1.7 0 .5.6.8.6 1.4s-.8.6-1 1.2c-.2.6.3.8.1 1.3-.2.5-.9 0-1.4.5s-.3 1 .2 1.4c.5.4 1.2.1 1.6.6.4.4.1 1.1.5 1.5.4.4.9-.1 1.4.2s.5.9.9 1.1c.4.2.8-.4 1.1-.2s.5.9.8 1.1c.3.2.5-.4.8-.2s.4.8.8.8.8-.8.8-.8-.4-.6-.2-.8c.2-.2.8 0 1.1-.2s.4-.9.8-1.1c.4-.2.7.4 1.1.2s.5-.7.9-1.1c.4-.4.1-1.1.5-1.5s1.1-.2 1.6-.6c.5-.4.4-1 .2-1.4s-1.2 0-1.4-.5c-.2-.5.3-.7.1-1.3-.2-.6-1-.6-1-1.2s.6-.9.6-1.4c0-.5.1-1.2-.4-1.7-.5-.5-1-.7-1.4-1.3s-.1-1.3-.5-1.8c-.4-.5-1.2-.2-1.6-.6s-.7-1.2-1.3-1.5c-.6-.3-1.4-.1-1.9-.8C12.3 3.8 12 2 12 2z"/>
  </svg>`,

  // 2. 세 갈래 정통 단풍잎 (일반 단풍잎 모양)
  `<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%; height:100%;">
    <path d="M12,2 L13.5,6 L17.5,4.5 L16,8.5 L20,10 L16,11.5 L17.5,15.5 L13.5,14 L12,18 L10.5,14 L6.5,15.5 L8,11.5 L4,10 L8,8.5 L6.5,4.5 L10.5,6 Z"/>
  </svg>`,

  // 3. 동글동글 이쁜 가을잎
  `<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%; height:100%;">
    <path d="M17,8 C14,5 10,5 6,8 C3,11 3,15 6,18 C10,21 14,21 17,18 C20,15 20,11 17,8 Z M12,17 C9.5,15 7.5,12 12,7 C16.5,12 14.5,15 12,17 Z"/>
  </svg>`,

  // 4. 은행잎 모양 (가을 느낌 대폭 상승!) ⭐ 새로 추가
  `<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%; height:100%;">
    <path d="M12 22C12.5 17 14.5 13 19 11C20.5 10 21 8.5 20 7C17.5 7.5 15.5 8 13.5 6C12 4.5 11 2.5 9.5 2C8 3 8.5 5 7.5 7C5.5 8 3.5 8 2 9.5C1.5 11.5 3 12.5 5.5 12C9 13.5 11 17 11 22h1z"/>
  </svg>`,
];
// const LEAF_SVGS = [
//   //   `
//   // <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
//   // <path fill="#D56A3A" d="
//   // M32 4
//   // L36 16
//   // L48 8
//   // L45 22
//   // L58 20
//   // L48 30
//   // L60 36
//   // L46 38
//   // L50 52
//   // L38 45
//   // L32 60
//   // L26 45
//   // L14 52
//   // L18 38
//   // L4 36
//   // L16 30
//   // L6 20
//   // L19 22
//   // L16 8
//   // L28 16Z"/>
//   // <path d="M32 18V60" stroke="#7A4B2A" stroke-width="2" stroke-linecap="round"/>
//   // </svg>
//   // `,
//   `
// <svg xmlns="http://www.w3.org/2000/svg"
// viewBox="0 0 128 128">

// <path
// fill="#D96A3A"
// stroke="#B44A28"
// stroke-width="2"
// d="
// M64 8

// L72 30
// L92 16
// L88 40

// L112 34
// L98 54
// L118 62
// L96 70

// L102 94
// L80 84
// L64 118

// L48 84
// L26 94
// L32 70

// L10 62
// L30 54
// L16 34
// L40 40

// L36 16
// L56 30
// Z"/>

// <path
// d="M64 24
// V112"
// stroke="#6E4225"
// stroke-width="3"
// stroke-linecap="round"/>

// <path
// d="M64 46
// L46 58

// M64 52
// L82 62

// M64 70
// L42 82

// M64 74
// L86 86"
// stroke="#8D5A36"
// stroke-width="2"
// stroke-linecap="round"/>

// </svg>
// `,
//   // Oval Leaf
//   `
// <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
// <path fill="#E58A4B" d="
// M32 8
// L35 18
// L43 13
// L41 23
// L51 24
// L43 31
// L52 37
// L41 39
// L44 49
// L35 44
// L32 56
// L29 44
// L20 49
// L23 39
// L12 37
// L21 31
// L13 24
// L23 23
// L21 13
// L29 18Z"/>
// <path d="M32 20V56" stroke="#8A5A36" stroke-width="2"/>
// </svg>
// `,

//   // Small Leaf
//   `
// <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
// <path fill="#F2BE55" d="
// M32 10
// C48 10 56 24 54 38
// C48 34 42 34 36 40
// L32 56
// L28 40
// C22 34 16 34 10 38
// C8 24 16 10 32 10Z"/>
// <path d="M32 22V56" stroke="#9C6A2E" stroke-width="2"/>
// <path d="M24 26C28 30 36 30 40 26" stroke="#9C6A2E" stroke-width="1.5" fill="none"/>
// </svg>
// `,

//   // Round Leaf
//   `
// <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
// <path fill="#C86C47" d="
// M32 8
// C40 8 46 14 45 20
// C53 23 53 32 46 36
// C51 42 46 52 34 56
// C22 52 14 42 18 36
// C11 32 11 23 19 20
// C18 14 24 8 32 8Z"/>
// <path d="M32 10V58" stroke="#734728" stroke-width="2"/>
// </svg>
// `,

//   // Long Leaf
//   `
// <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
// <path fill="#D99B4A" d="
// M32 6
// C46 18 48 40 32 58
// C16 40 18 18 32 6Z"/>
// <path d="M32 8V58" stroke="#7A5633" stroke-width="2"/>
// <path d="M32 18L39 24M32 28L40 34M32 38L38 44M32 18L25 24M32 28L24 34M32 38L26 44"
// stroke="#9E7444"
// stroke-width="1.2"
// stroke-linecap="round"/>
// </svg>
// `,
// ];
/**
 * 가을 낙엽 애니메이션 시작 함수
 * (이제 외부에서 layer를 넘겨받지 않고, 함수 내부에서 동적으로 만듭니다!)
 */
export function startAutumnEffect() {
  // 1. 중복 실행 방지를 위해 기존 효과 먼저 정리
  stopAutumnEffect();

  // 2. [변경] HTML에 레이어가 없으면 자바스크립트가 직접 생성하여 body에 주입
  let layer = document.getElementById("bg-effect-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "bg-effect-layer";
    document.body.appendChild(layer); // body 바로 아래에 추가
  }

  // CSS 클래스 부여
  layer.className = "autumn-falling-layer";

  // 낙엽 생성 루프
  autumnInterval = setInterval(() => {
    // 3. 전체 낙엽 개수 체크 (최대 7개)
    const currentLeaves = layer.querySelectorAll(".autumn-leaf");
    if (currentLeaves.length >= 7) return;

    // 4. 크기 분류 및 큰 낙엽 개수 제한 체크
    const sizeCategory = Math.random();
    let size = 0;
    let isLarge = false;

    if (sizeCategory < 0.4) {
      size = Math.floor(Math.random() * (18 - 12 + 1)) + 12; // 작은 낙엽
    } else if (sizeCategory < 0.8) {
      size = Math.floor(Math.random() * (30 - 22 + 1)) + 22; // 중간 낙엽
    } else {
      const largeCount = layer.querySelectorAll(
        '.autumn-leaf[data-size="large"]',
      ).length;
      if (largeCount >= 2) return; // 큰 낙엽 최대 2개 제한

      size = Math.floor(Math.random() * (46 - 38 + 1)) + 38; // 큰 낙엽
      isLarge = true;
    }

    // 5. 낙엽 요소 생성 및 스타일 정의
    const leaf = document.createElement("div");
    leaf.classList.add("autumn-leaf");
    if (isLarge) leaf.setAttribute("data-size", "large");

    // 가장자리 위주 무작위 위치 계산
    let leftPosition = 0;
    if (Math.random() < 0.8) {
      leftPosition =
        Math.random() < 0.5 ? Math.random() * 15 : 85 + Math.random() * 15;
    } else {
      leftPosition = 15 + Math.random() * 70;
    }

    const randomColor =
      LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
    const duration = 6 + Math.random() * 5;
    const maxRotation = 540 + Math.floor(Math.random() * 360);
    const swayDistance =
      (Math.random() < 0.5 ? -1 : 1) * (80 + Math.random() * 100);

    leaf.style.width = `${size}px`;
    leaf.style.height = `${size}px`;
    leaf.style.left = `${leftPosition}%`;
    leaf.style.animationDuration = `${duration}s`;
    leaf.style.setProperty("--leaf-color", randomColor);
    leaf.style.setProperty("--max-rotation", `${maxRotation}deg`);
    leaf.style.setProperty("--sway-distance", `${swayDistance}px`);

    // 애니메이션 종료 시 자동 제거
    leaf.addEventListener("animationend", () => {
      leaf.remove();
    });

    layer.appendChild(leaf);
  }, 800);
}

/**
 * 가을 낙엽 애니메이션 중지 및 자원 정리 함수
 */
export function stopAutumnEffect() {
  // 타이머 클리어
  if (autumnInterval) {
    clearInterval(autumnInterval);
    autumnInterval = null;
  }

  // [변경] 생성했던 레이어가 존재한다면 완전히 삭제(remove)해 자원을 비웁니다.
  const layer = document.getElementById("bg-effect-layer");
  if (layer) {
    layer.remove();
  }
}
