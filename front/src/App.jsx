import { Routes, Route } from 'react-router-dom'
import SiteLayout from './layouts/SiteLayout'
import MainPage from './pages/MainPage'
import RecommendResultPage from './pages/RecommendResultPage'
import WebtoonListPage from './pages/WebtoonListPage'
import WebtoonDetailPage from './pages/WebtoonDetailPage'
import PlaceholderPage from './components/common/PlaceholderPage'

import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import OAuthCallback from './pages/OAuthCallback'
import InquiryPage from './pages/InquiryPage'

import FavoritesPage from './pages/mypage/FavoritesPage'
import TastePage from './pages/mypage/TastePage'
import PostsPage from './pages/mypage/PostsPage'
import InfoPage from './pages/mypage/InfoPage'

import BoardListPage from './pages/BoardListPage'
import BoardPostPage from './pages/BoardPostPage'
import BoardWritePage from './pages/BoardWritePage'

import AdminConsolePage from './pages/admin/AdminConsolePage'

function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/recommend" element={<RecommendResultPage />} />
        <Route path="/webtoons" element={<WebtoonListPage />} />
        <Route path="/webtoons/:id" element={<WebtoonDetailPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/oauth/kakao/callback" element={<OAuthCallback provider="kakao" />} />
        <Route path="/oauth/naver/callback" element={<OAuthCallback provider="naver" />} />
        <Route path="/inquiry" element={<InquiryPage />} />

        <Route path="/mypage/favorites" element={<FavoritesPage />} />
        <Route path="/mypage/taste" element={<TastePage />} />
        <Route path="/mypage/posts" element={<PostsPage />} />
        <Route path="/mypage/info" element={<InfoPage />} />

        <Route path="/board" element={<BoardListPage boardType="all" />} />
        <Route path="/board/free" element={<BoardListPage boardType="free" />} />
        <Route path="/board/webtoon" element={<BoardListPage boardType="webtoon" />} />
        <Route path="/board/write" element={<BoardWritePage />} />
        <Route path="/board/post/:id" element={<BoardPostPage />} />

        <Route path="/admin" element={<AdminConsolePage />} />

        <Route path="*" element={<PlaceholderPage title="페이지를 찾을 수 없어요" />} />
      </Route>
    </Routes>
  )
}

export default App
