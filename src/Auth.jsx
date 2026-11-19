
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import Diary from './Diary'
import Goals from './Goals'
import HabitTracker from './HabitTracker'
import Decisions from './Decisions'
import FutureMe from './FutureMe'
import WeeklyReflection from './WeeklyReflection'
import JourneyTimeline from './JourneyTimeline'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  const [savedGoals, setSavedGoals] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('myGoals') || '[]')
    } catch {
      return []
    }
  })

  const [savedHabits, setSavedHabits] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('myHabits') || '[]')
    } catch {
      return []
    }
  })

  // Diary entries are loaded directly from the backend
  const [savedEntries, setSavedEntries] = useState([])
  const [diaryLoading, setDiaryLoading] = useState(false)

  const [focus, setFocus] = useState(
    localStorage.getItem('dailyFocus') || ''
  )

  const [focusInput, setFocusInput] = useState(focus)

  // Get login session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch diary entries from Node.js backend
  async function refreshDiaryCount() {
    if (!API_URL) {
      console.error('Backend URL is missing.')
      return
    }

    try {
      setDiaryLoading(true)

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw error
      }

      if (!data.session) {
        setSavedEntries([])
        return
      }

      const response = await fetch(`${API_URL}/diary`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${data.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Unable to load diary entries.')
      }

      const entries = await response.json()

      if (!Array.isArray(entries)) {
        throw new Error('Invalid diary response from backend.')
      }

      setSavedEntries(entries)

    } catch (error) {
      console.error('Dashboard diary error:', error)
    } finally {
      setDiaryLoading(false)
    }
  }

  // Load diary entries after login
  useEffect(() => {
    if (session) {
      refreshDiaryCount()
    } else {
      setSavedEntries([])
    }
  }, [session])

  const completedGoals = savedGoals.filter(
    (goal) => goal.progress === 100
  ).length

  const activeGoals = savedGoals.length - completedGoals

  const averageProgress = savedGoals.length > 0
    ? Math.round(
        savedGoals.reduce(
          (total, goal) => total + Number(goal.progress || 0), 0
        ) / savedGoals.length
      )
    : 0

  function saveFocus() {
    const updatedFocus = focusInput.trim()

    localStorage.setItem('dailyFocus', updatedFocus)
    setFocus(updatedFocus)

    alert('Your daily focus has been saved! 🌷')
  }

  function refreshDashboard() {
    try {
      setSavedGoals(
        JSON.parse(localStorage.getItem('myGoals') || '[]')
      )

      setSavedHabits(
        JSON.parse(localStorage.getItem('myHabits') || '[]')
      )
    } catch (error) {
      console.error('Unable to refresh dashboard:', error)
    }

    refreshDiaryCount()
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert('Unable to logout. Please try again.')
      console.error(error)
    }
  }

  function navigateTo(page) {
    if (page === 'dashboard') {
      refreshDashboard()
    }

    setActivePage(page)
    setMenuOpen(false)
  }

  if (authLoading) {
    return <div>Loading MyMine... 🌷</div>
  }

  if (!session) {
    return <Auth />
  }

  const today = (() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  })()

  const completedHabitsToday = savedHabits.filter(
    (habit) => (habit.completedDates || []).includes(today)
  ).length

  const habitProgress = savedHabits.length
    ? Math.round(
        (completedHabitsToday / savedHabits.length) * 100
      )
    : 0

  return (
    <div className="app">

      <aside className="sidebar">
        <h2>MyMine ✨</h2>
        <p className="tagline">Your personal growth space</p>

        <nav>
          <a
            href="#dashboard"
            className={activePage === 'dashboard' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault()
              navigateTo('dashboard')
            }}
          >
            ⌂ Dashboard
          </a>

          <a
            href="#diary"
            className={activePage === 'diary' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault()
              navigateTo('diary')
            }}
          >
            📖 My Diary
          </a>

          <a
            href="#goals"
            className={activePage === 'goals' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault()
              navigateTo('goals')
            }}
          >
            🎯 My Goals
          </a>

          <a
            href="#habits"
            className={activePage === 'habits' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault()
              navigateTo('habits')
            }}
          >
            ✓ Habit Tracker
          </a>

          <a
            href="#decisions"
            className={activePage === 'decisions' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault()
              navigateTo('decisions')
            }}
          >
            💭 Decisions
          </a>

          <a
            href="#future"
            className={activePage === 'future' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault()
              navigateTo('future')
            }}
          >
            ✉ Future Me
          </a>

          <a
            href="#weekly"
            className={activePage === 'weekly' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault()
              navigateTo('weekly')
            }}
          >
            🌷 Weekly Reflection
          </a>

          <a
            href="#journey"
            className={activePage === 'journey' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault()
              navigateTo('journey')
            }}
          >
            ♡ My Journey
          </a>
        </nav>

        <div className="sidebar-bottom">
          <p>Small steps, big changes.</p>

          <button type="button" onClick={handleLogout}>
            Logout ↗
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="mobile-header">
        <h2>MyMine ✨</h2>

        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <button onClick={() => navigateTo('dashboard')}>
            ⌂ Dashboard
          </button>
          <button onClick={() => navigateTo('diary')}>
            📖 My Diary
          </button>
          <button onClick={() => navigateTo('goals')}>
            🎯 My Goals
          </button>
          <button onClick={() => navigateTo('habits')}>
            ✓ Habit Tracker
          </button>
          <button onClick={() => navigateTo('decisions')}>
            💭 Decisions
          </button>
          <button onClick={() => navigateTo('future')}>
            ✉ Future Me
          </button>
          <button onClick={() => navigateTo('weekly')}>
            🌷 Weekly Reflection
          </button>
          <button onClick={() => navigateTo('journey')}>
            ♡ My Journey
          </button>

          <button
            className="mobile-menu-logout"
            onClick={handleLogout}
          >
            Logout ↗
          </button>
        </div>
      )}

      <main className="main-content">

        {activePage === 'diary' ? (
          <Diary />
        ) : activePage === 'goals' ? (
          <Goals />
        ) : activePage === 'habits' ? (
          <HabitTracker />
        ) : activePage === 'decisions' ? (
          <Decisions />
        ) : activePage === 'future' ? (
          <FutureMe />
        ) : activePage === 'weekly' ? (
          <WeeklyReflection />
        ) : activePage === 'journey' ? (
          <JourneyTimeline />
        ) : (
          <>
            <header>
              <div>
                <p className="greeting">YOUR PERSONAL SPACE</p>
                <h1>Welcome back! 🌷</h1>
                <p>Every day is a new chance to grow.</p>
              </div>

              <div className="profile">TM</div>
            </header>

            <section className="quote">
              <p>
                “Become someone your future self will thank you for.”
              </p>
            </section>

            <section className="overview">

              <div className="card">
                <span>🎯</span>
                <h3>Active Goals</h3>
                <h2>{activeGoals}</h2>
                <p>Goals you're working towards</p>
              </div>

              <div className="card">
                <span>✨</span>
                <h3>Completed Goals</h3>
                <h2>{completedGoals}</h2>
                <p>Dreams you're turning into reality</p>
              </div>

              <div className="card">
                <span>🌷</span>
                <h3>Overall Progress</h3>
                <h2>{averageProgress}%</h2>
                <p>Every little step counts</p>
              </div>

              <div className="card">
                <span>📖</span>
                <h3>Diary Entries</h3>
                <h2>
                  {diaryLoading ? '...' : savedEntries.length}
                </h2>
                <p>Your memories live here</p>
              </div>

              <div className="card">
                <span>🌱</span>
                <h3>Today's Habits</h3>
                <h2>
                  {completedHabitsToday}/{savedHabits.length}
                </h2>
                <p>{habitProgress}% completed today</p>
              </div>

            </section>

            <section className="bottom-section">

              <div className="panel">
                <h2>Today's Focus ✨</h2>

                <p>
                  What's the one thing you want to accomplish today?
                </p>

                <input
                  type="text"
                  placeholder="Write your main priority..."
                  value={focusInput}
                  onChange={(e) => setFocusInput(e.target.value)}
                />

                <button type="button" onClick={saveFocus}>
                  Save My Focus ♡
                </button>

                {focus && (
                  <p className="saved-focus">
                    🌷 Today's priority: {focus}
                  </p>
                )}
              </div>

              <div className="panel">
                <h2>Your Growth Journey 🌷</h2>

                <p>You're growing every single day.</p>

                <h3>{averageProgress}% completed</h3>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${averageProgress}%` }}
                  ></div>
                </div>

                <p>
                  {averageProgress === 100
                    ? "✨ You are making your dreams come true!"
                    : averageProgress >= 50
                    ? "🌷 You're halfway there. Keep going!"
                    : "🌱 Every little step matters. Keep growing!"}
                </p>
              </div>

            </section>

            <footer>
              Made with care, for the person you're becoming. ♡
            </footer>
          </>
        )}
      </main>
    </div>
  )
}

export default App
