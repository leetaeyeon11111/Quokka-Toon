import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function Section({ title, children }) {
  return (
    <div className="border-t border-ink-100 py-3 first:border-t-0">
      {title && <p className="mb-2 px-4 text-sm font-bold text-ink-900">{title}</p>}
      <ul>{children}</ul>
    </div>
  )
}

function MenuLink({ to, onClose, children }) {
  return (
    <li>
      <Link
        to={to}
        onClick={onClose}
        className="block px-4 py-2 text-sm text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
      >
        {children}
      </Link>
    </li>
  )
}

export default function HamburgerMenu({ onClose }) {
  const { isLoggedIn, logout } = useAuth()

  return (
    <div className="absolute right-0 top-full z-40 w-72 rounded-2xl border border-ink-100 bg-white py-2 shadow-xl">
      {!isLoggedIn && (
        <div className="px-3 pb-1">
          <Link
            to="/login"
            onClick={onClose}
            className="block rounded-xl bg-ink-900 py-3 text-center text-sm font-semibold text-white transition hover:bg-ink-700"
          >
            로그인 / 회원가입
          </Link>
        </div>
      )}

      <Section title="내서재">
        <MenuLink to="/mypage/favorites" onClose={onClose}>
          즐겨찾기
        </MenuLink>
        <MenuLink to="/mypage/taste" onClose={onClose}>
          취향 리포트
        </MenuLink>
        <MenuLink to="/mypage/posts" onClose={onClose}>
          내가 쓴 글
        </MenuLink>
        <MenuLink to="/mypage/info" onClose={onClose}>
          내 정보
        </MenuLink>
      </Section>

      <Section title="웹툰">
        <MenuLink to="/webtoons" onClose={onClose}>
          전체 웹툰
        </MenuLink>
      </Section>

      <Section title="게시판">
        <MenuLink to="/board" onClose={onClose}>
          전체
        </MenuLink>
        <MenuLink to="/board/free" onClose={onClose}>
          자유
        </MenuLink>
        <MenuLink to="/board/webtoon" onClose={onClose}>
          웹툰
        </MenuLink>
      </Section>

      <Section title="문의하기">
        <MenuLink to="/inquiry" onClose={onClose}>
          문의하기 / 내 문의내역
        </MenuLink>
      </Section>

      {isLoggedIn && (
        <div className="px-3 pt-1">
          <button
            type="button"
            onClick={() => {
              logout()
              onClose()
            }}
            className="block w-full rounded-xl bg-ink-900 py-3 text-center text-sm font-semibold text-white transition hover:bg-ink-700"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}
