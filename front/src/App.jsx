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
import ProtectedRoute from './components/common/ProtectedRoute'
import AiSummaryMarkMockPage from './pages/AiSummaryMarkMockPage'
import AiSearchMockPage from './pages/AiSearchMockPage'
import MediaMixButtonMockPage from './pages/MediaMixButtonMockPage'
import HeaderProfileMockPage from './pages/HeaderProfileMockPage'
import HeaderLogoMockPage from './pages/HeaderLogoMockPage'
import BannedPage from './pages/BannedPage'

function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/recommend" element={<RecommendResultPage />} />
        <Route path="/webtoons" element={<WebtoonListPage />} />
        <Route path="/webtoons/:id" element={<WebtoonDetailPage />} />
        <Route path="/dev/ai-summary-mark" element={<AiSummaryMarkMockPage />} />
        <Route path="/dev/ai-search" element={<AiSearchMockPage />} />
        <Route path="/dev/media-mix-buttons" element={<MediaMixButtonMockPage />} />
        <Route path="/dev/header-profile" element={<HeaderProfileMockPage />} />
        <Route path="/dev/header-logo" element={<HeaderLogoMockPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/oauth/kakao/callback" element={<OAuthCallback provider="kakao" />} />
        <Route path="/oauth/naver/callback" element={<OAuthCallback provider="naver" />} />
        <Route path="/banned" element={<BannedPage />} />
        <Route path="/inquiry" element={<InquiryPage />} />

        <Route path="/mypage/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
        <Route path="/mypage/taste" element={<ProtectedRoute><TastePage /></ProtectedRoute>} />
        <Route path="/mypage/posts" element={<ProtectedRoute><PostsPage /></ProtectedRoute>} />
        <Route path="/mypage/info" element={<ProtectedRoute><InfoPage /></ProtectedRoute>} />

        <Route path="/board" element={<BoardListPage boardType="all" />} />
        <Route path="/board/free" element={<BoardListPage boardType="free" />} />
        <Route path="/board/webtoon" element={<BoardListPage boardType="webtoon" />} />
        <Route path="/board/write" element={<BoardWritePage />} />
        <Route path="/board/post/:id" element={<BoardPostPage />} />

        <Route path="/admin" element={<AdminConsolePage />} />

        <Route
          path="*"
          element={
            <PlaceholderPage
              title="페이지를 찾을 수 없어요"
              description="주소가 잘못되었거나 이동한 페이지예요."
              showBack
            />
          }
        />
      </Route>
    </Routes>
  )
}

export default App
