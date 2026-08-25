const SRC = '/icons/quokka-adult-cover.png'

/**
 * 19금 썸네일 가림용 쿼카 마크.
 * fill: 카드 전체를 덮는 가림 이미지로 쓴다.
 */
export default function AdultCoverMark({ sizeClass = 'h-9 w-9', className = '', fill = false }) {
  return (
    <img
      src={SRC}
      alt=""
      aria-hidden="true"
      className={
        fill
          ? `h-full w-full object-contain ${className}`
          : `${sizeClass} object-contain ${className}`
      }
    />
  )
}
