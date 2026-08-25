import { PROFILE_ICONS } from '../../data/profileIcons'

// 프로필 아이콘 선택 그리드. value = 선택된 아이콘 경로, onChange(path) 로 변경 통지.
export default function ProfileIconPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {PROFILE_ICONS.map((icon) => {
        const selected = value === icon
        return (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            aria-pressed={selected}
            className={`overflow-hidden rounded-full border-2 transition ${
              selected ? 'border-brand-500 ring-2 ring-brand-200' : 'border-transparent hover:border-ink-200'
            }`}
          >
            <img src={icon} alt="프로필 아이콘" className="aspect-square h-full w-full object-cover" />
          </button>
        )
      })}
    </div>
  )
}
