import Modal from '../common/Modal'

const RULES = [
  ['하루 첫 방문', '+1 · 하루 1회'],
  ['연속 방문 2일째부터', '+2 · 하루 1회'],
  ['게시글 작성', '+4 · 하루 2건'],
  ['댓글·대댓글 작성', '+3 · 합산 하루 3건'],
  ['정식 웹툰 리뷰 최초 작성', '+5 · 하루 2건'],
  ['내 글·정식 리뷰가 받은 추천', '+1 · 합산 하루 10 EXP'],
]

export default function LevelGuideModal({ onClose }) {
  return (
    <Modal title="레벨 가이드" icon="📈" onClose={onClose}>
      <p className="mb-4 text-sm text-ink-500">활동으로 경험치가 쌓여 레벨이 올라가요.</p>
      <ul className="divide-y divide-ink-100">
        {RULES.map(([label, value]) => (
          <li key={label} className="flex items-center justify-between py-2 text-sm">
            <span className="text-ink-700">{label}</span>
            <span className="text-right font-semibold text-mint-500">
              {value}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
        모든 양의 경험치는 하루 최대 20 EXP까지 자동 지급되며, 남은 한도만큼 부분 지급될 수 있어요.
        비추천·신고로는 EXP가 차감되지 않습니다. Lv.100 이후에도 EXP는 누적되고 Lv.100 MAX로 표시돼요.
      </p>
    </Modal>
  )
}
