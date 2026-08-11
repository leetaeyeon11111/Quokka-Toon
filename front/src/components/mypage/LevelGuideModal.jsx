import Modal from '../common/Modal'

const RULES = [
  ['게시글 작성', '+4'],
  ['댓글 작성', '+3'],
  ['매일 방문 (출석)', '+1'],
  ['이틀 이상 연속 방문', '+2'],
  ['내 글이 받은 추천 (1개당)', '+1'],
  ['비추천 (1개당)', '−1'],
  ['신고 누적 (1건당)', '−5'],
]

export default function LevelGuideModal({ onClose }) {
  return (
    <Modal title="레벨 가이드" icon="📈" onClose={onClose}>
      <p className="mb-4 text-sm text-ink-500">활동으로 경험치가 쌓여 레벨이 올라가요.</p>
      <ul className="divide-y divide-ink-100">
        {RULES.map(([label, value]) => (
          <li key={label} className="flex items-center justify-between py-2 text-sm">
            <span className="text-ink-700">{label}</span>
            <span className={value.startsWith('−') ? 'font-semibold text-red-500' : 'font-semibold text-mint-500'}>
              {value}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
        ⚠ 신고 누적 5회당 경고 1회 · 삼진아웃제(경고 3회 시 제재).
      </p>
    </Modal>
  )
}
