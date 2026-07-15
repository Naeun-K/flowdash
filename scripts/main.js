import { updateSeasonEffect } from "./season-theme.js"; //계절테마 제어 모듈
import { updateRandomIcon, svgIcons } from "./icon.js"; // svgIcons가 선언된 파일 경로
import { initDashboardTheme } from "./dashboard.js"; // 대시보드 테마/그리팅 통합 제어 모듈 경로
import { initFilterAndSort } from "./filter.js"; // 필터 및 검색 정렬 모듈
import { initTodoManager } from "./modal.js"; // 할 일(Todo) 생성 및 관리 모듈

// 2. 닉네임 관리 기능 가져오기
// (이렇게 import 해오는 것만으로도 nickname.js 내부의 로직이 자동으로 기동됩니다!)
import "./nickname.js";

// 3. 페이지 로드 시 통합 초기화
document.addEventListener("DOMContentLoaded", () => {
  console.log("FlowDash 서비스가 성공적으로 시작되었습니다! 🚀");
  // 무작위 아이콘 업데이트 실행 (데이터 전달)
  updateRandomIcon(svgIcons);
  // 시간대 그리팅 메시지 및 테마 제어 통합 초기화
  initDashboardTheme();
  // 계절 효과 테마 실행
  updateSeasonEffect();

  // 할 일(Todo) 목록 렌더링 및 모달 컨트롤 개시
  initTodoManager();

  // 검색, 필터 드롭다운 상태 복원 및 이벤트 등록
  initFilterAndSort();
});
