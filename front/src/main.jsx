import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppDataProvider } from './store/AppDataProvider.jsx'
import ExperienceNotificationProvider from './components/common/ExperienceNotifications.jsx'
import DialogProvider from './components/common/DialogProvider.jsx'
import BanGuard from './components/common/BanGuard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BanGuard />
        <AppDataProvider>
          <ExperienceNotificationProvider>
            <DialogProvider>
              <App />
            </DialogProvider>
          </ExperienceNotificationProvider>
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
