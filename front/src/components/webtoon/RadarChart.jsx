const RINGS = [0.25, 0.5, 0.75, 1]

export default function RadarChart({ axes, size = 240 }) {
  const center = size / 2
  const maxRadius = size / 2 - 36
  const n = axes.length

  function pointAt(index, ratio) {
    const angle = -Math.PI / 2 + index * ((2 * Math.PI) / n)
    return {
      x: center + Math.cos(angle) * maxRadius * ratio,
      y: center + Math.sin(angle) * maxRadius * ratio,
    }
  }

  const dataPoints = axes.map((axis, i) => pointAt(i, axis.value / 100))
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg width={size} height={size} role="img" aria-label="추천율 오각 레이더 차트">
      {RINGS.map((ratio) => {
        const ringPoints = axes.map((_, i) => pointAt(i, ratio))
        return (
          <polygon
            key={ratio}
            points={ringPoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#e5e4e7"
            strokeWidth={1}
          />
        )
      })}

      {axes.map((_, i) => {
        const outer = pointAt(i, 1)
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={outer.x}
            y2={outer.y}
            stroke="#e5e4e7"
            strokeWidth={1}
          />
        )
      })}

      <polygon points={dataPath} fill="#e8622c" fillOpacity={0.28} stroke="#e8622c" strokeWidth={2} />

      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#e8622c" />
      ))}

      {axes.map((axis, i) => {
        const labelPoint = pointAt(i, 1.22)
        return (
          <text
            key={axis.name}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fill="#3c3944"
            fontWeight={600}
          >
            {axis.name}
          </text>
        )
      })}
    </svg>
  )
}
