import { createSvgFragment } from "../utils/season-svg-utils.js";
import { defaultIcons } from "./default.js";
import { seasonIcons } from "./seasons.js";

/**
 * 현재 적용된 테마에 맞는 아이콘 목록을 반환합니다.
 *
 * 계절 테마:
 * - spring
 * - summer
 * - autumn
 * - winter
 *
 * 그 외 테마는 기본 아이콘을 사용합니다.
 */
function getCurrentIcons() {
  const theme = document.documentElement.dataset.theme;

  const currentSeasonIcons = seasonIcons[theme];

  // 현재 테마에 해당하는 계절 아이콘이 존재하면 반환
  if (currentSeasonIcons && Object.keys(currentSeasonIcons).length > 0) {
    return currentSeasonIcons;
  }

  // 기본 / 다크 테마 등은 기본 아이콘 사용
  return defaultIcons;
}

/**
 * 전달받은 아이콘 목록에서 하나를 무작위로 선택합니다.
 */
function getRandomIcon(icons) {
  const iconList = Object.values(icons);

  if (iconList.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * iconList.length);

  return iconList[randomIndex];
}

/**
 * 현재 테마에 맞는 아이콘 중 하나를 랜덤으로 선택하여
 * .greeting-icon 영역에 표시합니다.
 */
export function updateRandomIcon() {
  const iconSpan = document.querySelector(".greeting-icon");

  // 아이콘을 표시할 요소가 없으면 종료
  if (!iconSpan) return;

  // 현재 테마에 맞는 아이콘 목록 가져오기
  const icons = getCurrentIcons();

  // 해당 목록에서 랜덤 아이콘 선택
  const selectedSvg = getRandomIcon(icons);

  // 사용할 수 있는 SVG가 없으면 종료
  if (!selectedSvg) return;

  // 기존 아이콘을 제거하고 새로운 SVG 삽입
  iconSpan.replaceChildren(createSvgFragment(selectedSvg));
}
