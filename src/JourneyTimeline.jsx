
import { useState } from 'react'

function loadData(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function formatDate(date) {
  if (!date) return 'A chapter in my journey'

  return new Date(`${date}T12:00:00`).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  )
}

function JourneyTimeline() {
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [turning, setTurning] = useState(false)
  const [turnDirection, setTurnDirection] = useState(null)
  const [bookOpen, setBookOpen] = useState(false)

  const diary = loadData('diaryEntries')
  const goals = loadData('myGoals')
  const habits = loadData('myHabits')
  const decisions = loadData('myDecisions')
  const letters = loadData('futureLetters')

  const events = []

  diary.forEach((item) => {
    events.push({
      id: `diary-${item.id}`,
      date: item.date,
      type: 'diary',
      icon: item.mood || '📖',
      title: item.title,
      description: item.entry,
      label: 'A memory from my diary'
    })
  })

  goals.forEach((item) => {
    events.push({
      id: `goal-${item.id}`,
      date: item.createdAt || item.targetDate || null,
      type: 'goal',
      icon: '🎯',
      title: item.title,
      description: item.description,
      label: 'A dream I decided to pursue'
    })
  })

  habits.forEach((habit) => {
    ;(habit.completedDates || []).forEach((date) => {
      events.push({
        id: `habit-${habit.id}-${date}`,
        date,
        type: 'habit',
        icon: '🌱',
        title: habit.name,
        description: 'I showed up for myself and completed this habit.',
        label: 'A little promise I kept'
      })
    })
  })

  decisions.forEach((item) => {
    events.push({
      id: `decision-${item.id}`,
      date: item.date,
      type: 'decision',
      icon: '💭',
      title: item.title,
      description: `My choice: ${item.choice}${
        item.reason ? `\n\nWhy I chose it: ${item.reason}` : ''
      }${
        item.reflection ? `\n\nMy reflection: ${item.reflection}` : ''
      }`,
      label: 'A choice that shaped my journey'
    })
  })

  letters.forEach((item) => {
    const createdDate = item.id
      ? (() => {
          const date = new Date(Number(item.id))

          if (Number.isNaN(date.getTime())) return null

          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')

          return `${year}-${month}-${day}`
        })()
      : null

    events.push({
      id: `letter-${item.id}`,
      date: createdDate,
      type: 'letter',
      icon: '💌',
      title: item.title,
      description: item.message,
      label: 'A message to my future self'
    })
  })

  const filters = [
    { value: 'all', label: 'All Moments' },
    { value: 'diary', label: 'Diary' },
    { value: 'goal', label: 'Goals' },
    { value: 'habit', label: 'Habits' },
    { value: 'decision', label: 'Decisions' },
    { value: 'letter', label: 'Letters' }
  ]

  const filteredEvents = events
    .filter((item) => item.date)
    .filter((item) => filter === 'all' || item.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date))

  function changeFilter(value) {
    if (turning) return

    setFilter(value)
    setPage(0)
  }

  function previousPage() {
    if (turning || page === 0) return

    setTurning(true)
    setTurnDirection('previous')

    setTimeout(() => {
      setPage((current) => Math.max(0, current - 2))
      setTurning(false)
      setTurnDirection(null)
    }, 750)
  }

  function nextPage() {
    if (turning || page + 2 >= filteredEvents.length) return

    setTurning(true)
    setTurnDirection('next')

    setTimeout(() => {
      setPage((current) => current + 2)
      setTurning(false)
      setTurnDirection(null)
    }, 750)
  }

  if (!bookOpen) {
    return (
      <div className="journey-page">
        <div className="goals-heading">
          <p className="greeting">EVERY LITTLE MOMENT MATTERS</p>
          <h1>My Journey ♡</h1>
          <p>A book filled with the story of me.</p>
        </div>

        <div className="book-cover">
          <div className="cover-decoration">✧ ♡ ✧</div>
          <p className="cover-small">MY PERSONAL STORY</p>
          <h1>My Journey</h1>
          <p className="cover-heart">♡</p>

          <p className="cover-description">
            Every little moment, every little dream,
            every version of me.
          </p>

          <div className="cover-line"></div>
          <p className="cover-footer">WRITTEN BY ME</p>

          <button
            type="button"
            className="open-book-button"
            onClick={() => setBookOpen(true)}
          >
            Open My Book ♡
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="journey-page">
      <div className="goals-heading">
        <p className="greeting">MY PERSONAL STORY</p>
        <h1>My Journey ♡</h1>
        <p>Every page holds a piece of me.</p>
      </div>

      <div className="journey-filters">
        {filters.map((item) => (
          <button
            type="button"
            key={item.value}
            className={
              filter === item.value
                ? 'journey-filter active'
                : 'journey-filter'
            }
            onClick={() => changeFilter(item.value)}
            disabled={turning}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={`storybook ${turning ? 'is-turning' : ''}`}>
        <div className="storybook-spread">
          <div className="book-spine"></div>

          {/* ANIMATED PAPER LAYER */}
          {turning && (
            <div
              className={`turning-paper ${turnDirection}`}
              aria-hidden="true"
            >
              <div className="turning-paper-front"></div>
              <div className="turning-paper-back"></div>
            </div>
          )}

          {/* LEFT PAGE */}
          <div className="book-left-page">
            {filteredEvents[page] ? (
              <div className="storybook-content">
                <p className="storybook-chapter">
                  {filteredEvents[page].label}
                </p>

                <span className="storybook-icon">
                  {filteredEvents[page].icon}
                </span>

                <h2>{filteredEvents[page].title}</h2>

                <p className="storybook-date">
                  {formatDate(filteredEvents[page].date)}
                </p>

                <div className="storybook-divider">✧ ♡ ✧</div>

                <p className="storybook-description">
                  {filteredEvents[page].description}
                </p>
              </div>
            ) : (
              <div className="storybook-ending">
                <h2>My story begins...</h2>
                <p>Every little moment matters. ♡</p>
              </div>
            )}

            <div className="storybook-bottom">
              <span>My Journey ♡</span>
              <span>{page + 1}</span>
            </div>
          </div>

          {/* RIGHT PAGE */}
          <div className="book-right-page">
            {filteredEvents[page + 1] ? (
              <div className="storybook-content">
                <p className="storybook-chapter">
                  {filteredEvents[page + 1].label}
                </p>

                <span className="storybook-icon">
                  {filteredEvents[page + 1].icon}
                </span>

                <h2>{filteredEvents[page + 1].title}</h2>

                <p className="storybook-date">
                  {formatDate(filteredEvents[page + 1].date)}
                </p>

                <div className="storybook-divider">✧ ♡ ✧</div>

                <p className="storybook-description">
                  {filteredEvents[page + 1].description}
                </p>
              </div>
            ) : (
              <div className="storybook-ending">
                <h2>To be continued...</h2>
                <p>Your story is still being written. 🌷</p>
              </div>
            )}

            <div className="storybook-bottom">
              <span>My Journey ♡</span>
              <span>{page + 2}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE NAVIGATION */}
      <div className="book-navigation">
        <button
          type="button"
          className="book-nav-button"
          onClick={previousPage}
          disabled={page === 0 || turning}
        >
          ← Previous Pages
        </button>

        <button
          type="button"
          className="book-nav-button"
          onClick={nextPage}
          disabled={page + 2 >= filteredEvents.length || turning}
        >
          Next Pages →
        </button>
      </div>

      <button
        type="button"
        className="close-book-button"
        onClick={() => {
          if (turning) return
          setBookOpen(false)
          setPage(0)
        }}
      >
        Close My Book ♡
      </button>
    </div>
  )
}

export default JourneyTimeline
