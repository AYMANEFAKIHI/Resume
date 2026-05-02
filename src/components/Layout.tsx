import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Briefcase, ClipboardList, LogOut, Zap, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard',  desc: 'Overview & stats'    },
  { to: '/resume',  icon: FileText,        label: 'Resume',     desc: 'Upload & analyze'    },
  { to: '/jobs',    icon: Briefcase,       label: 'Jobs',       desc: 'Find & match'        },
  { to: '/tracker', icon: ClipboardList,   label: 'Tracker',    desc: 'All applications'    },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    try { await signOut(); navigate('/auth') }
    catch { toast.error('Sign out failed') }
  }

  const initials = user?.email?.slice(0,2).toUpperCase() ?? 'U'

  return (
    <div className="flex min-h-screen bg-[#07070f]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 fixed top-0 left-0 h-full flex flex-col z-50"
        style={{ background: 'rgba(10,10,20,0.95)', borderRight: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>

        {/* Logo */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', boxShadow: '0 4px 16px rgba(108,99,255,0.35)' }}>
              <Zap size={17} className="text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-base gradient-text">InternIQ</div>
              <div className="text-white/25 text-xs">AI Job Platform</div>
            </div>
          </div>
        </div>

        {/* Morocco badge */}
        <div className="mx-4 mb-4 px-3 py-2 rounded-xl bg-amber-400/5 border border-amber-400/15">
          <div className="text-xs text-amber-400/80 flex items-center gap-1.5">
            🇲🇦 <span>Morocco-first job search</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ to, icon: Icon, label, desc }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 group
                ${isActive ? 'nav-active' : 'text-white/35 hover:text-white hover:bg-white/[0.04]'}`
              }>
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-accent2' : ''} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium leading-tight">{label}</div>
                    <div className="text-xs opacity-50 leading-tight mt-0.5">{desc}</div>
                  </div>
                  {isActive && <ChevronRight size={13} className="text-accent2/50" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 mt-2 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/50 truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30
                       hover:text-red-400 hover:bg-red-400/[0.06] transition-all w-full mt-1">
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
