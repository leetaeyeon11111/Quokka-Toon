// 백엔드 DefaultProfileIcon 과 동일한 기본 제공 아이콘.
// API가 비어도 선택 UI가 비지 않도록 프론트에 카탈로그를 둔다.
export const DEFAULT_PROFILE_ICONS = [
  { id: 'a1-fantasy', label: '판타지', group: 'GENRE', groupLabel: '장르', imageUrl: '/avatars/quokka-ip-a1-fantasy.png' },
  { id: 'a2-romance', label: '꽃', group: 'FEMALE', groupLabel: '여성향', imageUrl: '/avatars/quokka-ip-a2-romance.png' },
  { id: 'a3-action', label: '액션', group: 'GENRE', groupLabel: '장르', imageUrl: '/avatars/quokka-ip-a3-action.png' },
  { id: 'a4-wuxia', label: '격투', group: 'GENRE', groupLabel: '장르', imageUrl: '/avatars/quokka-ip-a4-wuxia.png' },
  { id: 'a5-school', label: '학원', group: 'GENRE', groupLabel: '장르', imageUrl: '/avatars/quokka-ip-a5-school.png' },
  { id: 'a6-gag', label: '개그', group: 'GENRE', groupLabel: '장르', imageUrl: '/avatars/quokka-ip-a6-gag.png' },
  { id: 'b1-heart-eyes', label: '로맨스', group: 'FEMALE', groupLabel: '여성향', imageUrl: '/avatars/quokka-ip-b1-heart-eyes.png' },
  { id: 'b2-north-duke', label: '북부대공', group: 'FEMALE', groupLabel: '여성향', imageUrl: '/avatars/quokka-ip-b2-north-duke.png' },
  { id: 'b3-south-duke', label: '남부대공', group: 'FEMALE', groupLabel: '여성향', imageUrl: '/avatars/quokka-ip-b3-south-duke.png' },
  { id: 'b4-villainess', label: '악녀', group: 'FEMALE', groupLabel: '여성향', imageUrl: '/avatars/quokka-ip-b4-villainess.png' },
  { id: 'c1-crown', label: '왕관', group: 'MALE', groupLabel: '남성향', imageUrl: '/avatars/quokka-ip-c1-crown.png' },
  { id: 'c2-wuxia-manual', label: '무협지', group: 'MALE', groupLabel: '남성향', imageUrl: '/avatars/quokka-ip-c2-wuxia-manual.png' },
  { id: 'c3-hunter', label: '헌터', group: 'MALE', groupLabel: '남성향', imageUrl: '/avatars/quokka-ip-c3-hunter.png' },
]

export const PROFILE_ICON_GROUP_ORDER = ['GENRE', 'FEMALE', 'MALE']
