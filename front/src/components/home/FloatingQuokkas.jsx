// 메인페이지 가장자리를 돌아다니는 쿼카 마스코트들 (장식용, 클릭 방해 없음)
// 상단 좌/우, 하단 좌 세 구역에 각각 배치해 동선이 겹치지 않고 가운데 문구도 가리지 않는다.
const QUOKKAS = [
  { left: '2%', top: '5%', size: 70, anim: 'quokka-roam-tl', duration: 30, delay: 0 },
  { left: '70%', top: '8%', size: 58, anim: 'quokka-roam-tr', duration: 34, delay: -8 },
  { left: '8%', top: '86%', size: 62, anim: 'quokka-roam-bottom', duration: 32, delay: -15 },
]

export default function FloatingQuokkas() {
  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden>
      {QUOKKAS.map((q, i) => (
        <img
          key={i}
          src="/quokka_float.png"
          alt=""
          className="floating-quokka"
          style={{
            left: q.left,
            top: q.top,
            width: q.size,
            height: 'auto',
            opacity: 0.9,
            animationName: q.anim,
            animationDuration: `${q.duration}s`,
            animationDelay: `${q.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
