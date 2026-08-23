// 메인페이지 위를 자유롭게 돌아다니는 쿼카 마스코트들 (장식용, 클릭 방해 없음)
const QUOKKAS = [
  { left: '6%', top: '22%', size: 74, anim: 'quokka-roam-a', duration: 26, delay: 0, flip: false },
  { left: '78%', top: '30%', size: 58, anim: 'quokka-roam-b', duration: 32, delay: -6, flip: true },
  { left: '40%', top: '68%', size: 66, anim: 'quokka-roam-c', duration: 29, delay: -12, flip: false },
  { left: '86%', top: '72%', size: 50, anim: 'quokka-roam-a', duration: 35, delay: -18, flip: true },
  { left: '18%', top: '80%', size: 60, anim: 'quokka-roam-b', duration: 30, delay: -3, flip: false },
]

export default function FloatingQuokkas() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {QUOKKAS.map((q, i) => (
        <img
          key={i}
          src="/quokka.png"
          alt=""
          className="floating-quokka"
          style={{
            left: q.left,
            top: q.top,
            width: q.size,
            height: 'auto',
            opacity: 0.72,
            animationName: q.anim,
            animationDuration: `${q.duration}s`,
            animationDelay: `${q.delay}s`,
            transform: q.flip ? 'scaleX(-1)' : undefined,
          }}
        />
      ))}
    </div>
  )
}
