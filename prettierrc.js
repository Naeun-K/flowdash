// .prettierrc.js
// 루트에 파일 생성 (index.html과 같은 위치)

/** @type {import("prettier").Config} */
module.exports = {
  /**
   * 한 줄의 최대 길이
   * - number
   * - 80  : 너무 잦은 줄바꿈
   * - 100 : 팀 프로젝트에서 가장 무난 (권장)
   * - 120 : 가독성 저하 가능
   */
  printWidth: 100,

  /**
   * 들여쓰기 칸 수
   * - number
   * - HTML / CSS / JS 공통 표준: 2
   */
  tabWidth: 2,

  /**
   * 탭 사용 여부
   * - true  : 탭 문자 사용
   * - false : 스페이스 사용 (권장)
   */
  useTabs: false,

  /**
   * 세미콜론 사용 여부 (JavaScript)
   * - true  : 항상 사용 (팀 프로젝트 권장)
   * - false : 사용 안 함
   *
   * ※ 입문자 환경에서는 ASI 혼란 방지를 위해 true 권장
   */
  semi: true,

  /**
   * 문자열 따옴표 (JS / HTML 속성)
   * - true  : 'single quote' (JS 권장)
   * - false : "double quote"
   *
   * ※ HTML 속성은 Prettier가 자동 처리
   */
  singleQuote: true,

  /**
   * 객체 속성의 따옴표 처리 (JavaScript)
   * - "as-needed" : 필요할 때만 따옴표 (권장)
   * - "consistent": 하나라도 있으면 전부 따옴표
   * - "preserve"  : 기존 코드 유지
   */
  quoteProps: "as-needed",

  /**
   * 후행 쉼표(trailing comma)
   * - "none" : 사용 안 함
   * - "es5"  : 객체, 배열 등에서만 사용 (권장)
   * - "all"  : 함수 파라미터까지 포함
   *
   * ※ diff 최소화 + 협업 안정성 ↑
   */
  trailingComma: "es5",

  /**
   * 객체 중괄호 내부 공백 (JS)
   * - true  : { foo: bar }
   * - false : {foo: bar}
   */
  bracketSpacing: true,

  /**
   * HTML / JSX에서 닫는 꺾쇠 위치
   * - false : 꺾쇠를 다음 줄에 배치 (HTML 가독성 ↑)
   * - true  : 마지막 속성 줄 끝에 붙임
   */
  bracketSameLine: false,

  /**
   * 화살표 함수 파라미터 괄호 (JS)
   * - "always" : (x) => x (권장)
   * - "avoid"  : x => x
   *
   * ※ 파라미터 추가 시 diff 최소화
   */
  arrowParens: "always",

  /**
   * 줄바꿈 문자
   * - "lf"   : macOS / Linux / GitHub 표준 (필수)
   * - "crlf" : Windows
   * - "auto" : OS 자동 감지 (팀플 비권장)
   *
   * ※ OS 혼합 환경에서 diff 폭발 방지
   */
  endOfLine: "lf",
};
