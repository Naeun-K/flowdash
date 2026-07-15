/**
 * 1. SVG 문자열을 DOM 객체(DocumentFragment)로 변환하는 함수
 * - 메모리 상에만 존재하는 가상 템플릿(<template>)을 생성하여 HTML 파싱을 수행합니다.
 * - 완성된 DOM 트리(DocumentFragment)를 반환하므로 성능과 보안 측면에서 안전합니다.
 */

export function createSvgFragment(svg) {
  const template = document.createElement("template");
  template.innerHTML = svg.trim();
  return template.content.cloneNode(true);
}
