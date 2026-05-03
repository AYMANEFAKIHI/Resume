import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ResumePage from './pages/ResumePage'
import JobsPage from './pages/JobsPage'
import TrackerPage from './pages/TrackerPage'
import NotFoundPage from './pages/NotFoundPage'
import Layout from './components/Layout'
import FeedbackButton from './components/FeedbackButton'
import './index.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
      <div className="flex gap-2">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-accent animate-pulse-dot"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/auth" replace />
}

function App() {
  const { user } = useAuth()

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
          </Route>
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="resume"  element={<ResumePage />} />
            <Route path="jobs"    element={<JobsPage />} />
            <Route path="tracker" element={<TrackerPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>

      {/* Global feedback button — shown when logged in */}
      {user && <FeedbackButton />}

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#f0eee8',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#34d399', secondary: '#07070f' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#07070f' } },
        }}
      />
    </>
  )
}

function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Root /></React.StrictMode>
)
