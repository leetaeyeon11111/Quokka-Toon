// Date.now()/Math.random()은 렌더 중 호출이 금지된 impure 함수라 이벤트 핸들러에서도
// 일관되게 피하고, 대신 세션 내에서만 유일하면 되는 mock id를 카운터로 생성한다.
let counter = 0

export function nextId(prefix) {
  counter += 1
  // "-new-" 네임스페이스로 시드 mock 데이터의 id(예: inq-1)와 절대 겹치지 않게 한다.
  return `${prefix}-new-${counter}`
}
