// 선택 가능한 프로필 아이콘 목록.
// 실제 이미지 파일은 front/public/profile-icons/ 아래에 quokka-1.png ~ quokka-12.png 로 둔다.
export const PROFILE_ICONS = Array.from(
  { length: 12 },
  (_, i) => `/profile-icons/quokka-${i + 1}.png`,
)

// 기본 아이콘 (미선택 시)
export const DEFAULT_PROFILE_ICON = PROFILE_ICONS[0]
