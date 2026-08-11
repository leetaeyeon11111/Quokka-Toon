import { Outlet } from 'react-router-dom'
import Header from '../components/header/Header'

export default function SiteLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-ink-50">
      <Header />
      <main className="mx-auto flex w-full max-w-300 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
