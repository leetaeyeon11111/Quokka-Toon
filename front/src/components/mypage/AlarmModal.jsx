import { useState } from 'react'
import Modal from '../common/Modal'

const PRESETS = ['1주', '2주', '4주', '사용자 지정']

export default function AlarmModal({ webtoon, currentFreq, onSave, onClose }) {
  const [freq, setFreq] = useState(currentFreq ?? '2주')
  const [customDay, setCustomDay] = useState('월')

  return (
    <Modal title="알람 설정" icon="🔔" onClose={onClose}>
      <p className="mb-4 text-sm text-ink-500">
        <span className="font-semibold text-ink-900">{webtoon?.title}</span> 새 회차 알람을 언제 받을까요?
      </p>

      <div className="mb-3 flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setFreq(p)}
            className={`flex-1 rounded-full border py-2 text-xs font-semibold transition ${
              freq === p ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-100 text-ink-500'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {freq === '사용자 지정' && (
        <select
          value={customDay}
          onChange={(e) => setCustomDay(e.target.value)}
          className="mb-3 w-full rounded-xl border border-ink-100 bg-ink-50 px-3 py-2 text-sm outline-none"
        >
          {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
            <option key={d} value={d}>
              매주 {d}요일
            </option>
          ))}
        </select>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full border border-ink-100 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => {
            onSave(freq === '사용자 지정' ? `매주 ${customDay}요일` : freq)
            onClose()
          }}
          className="flex-1 rounded-full bg-ink-900 py-3 text-sm font-semibold text-white hover:bg-ink-700"
        >
          저장
        </button>
      </div>
    </Modal>
  )
}
