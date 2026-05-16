import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import FeedbackButton from './components/FeedbackButton'
import './index.css'

// ── Eagerly loaded (needed immediately on first paint) ────────────────────────
import LandingPage  from './pages/LandingPage'
import AuthPage     from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'

// ── Lazy loaded (code-split — only downloaded when user navigates there) ──────
const ResumePage   = lazy(() => import('./pages/ResumePage'))
const JobsPage     = lazy(() => import('./pages/JobsPage'))
const TrackerPage  = lazy(() => import('./pages/TrackerPage'))
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'))
const ContactsPage = lazy(() => import('./pages/ContactsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-accent animate-pulse-dot"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return user ? <>{children}</> : <Navigate to="/auth" replace />
}

function App() {
  const { user } = useAuth()
  return (
    <>
      {/* React Router v7 future flags — suppresses console warnings */}
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/"    element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/resume"    element={<Suspense fallback={<PageLoader />}><ResumePage /></Suspense>} />
            <Route path="/jobs"      element={<Suspense fallback={<PageLoader />}><JobsPage /></Suspense>} />
            <Route path="/companies" element={<Suspense fallback={<PageLoader />}><CompaniesPage /></Suspense>} />
            <Route path="/contacts"  element={<Suspense fallback={<PageLoader />}><ContactsPage /></Suspense>} />
            <Route path="/tracker"   element={<Suspense fallback={<PageLoader />}><TrackerPage /></Suspense>} />
          </Route>
          <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
        </Routes>
      </BrowserRouter>
      {user && <FeedbackButton />}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#1a1a2e', color: '#f0eee8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '14px' },
          success: { iconTheme: { primary: '#34d399', secondary: '#07070f' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#07070f' } },
        }}
      />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><AuthProvider><App /></AuthProvider></React.StrictMode>
)
