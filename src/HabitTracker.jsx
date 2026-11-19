
import { useState } from 'react'
function getTodayDate() {
  const today = new Date()

  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
function HabitTracker() {
  const [habit, setHabit] = useState('')

  const [habits, setHabits] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('myHabits') || '[]')
    } catch {
      return []
    }
  })

  function addHabit() {
    if (!habit.trim()) {
      alert('Please enter a habit first! 🌷')
      return
    }

    const newHabit = {
        id: Date.now(),
        name: habit.trim(),
        completedDates: []
    }

    const updatedHabits = [...habits, newHabit]

    setHabits(updatedHabits)
    localStorage.setItem('myHabits', JSON.stringify(updatedHabits))
    setHabit('')
  }

  function toggleHabit(id) {
    const today = getTodayDate()

    const updatedHabits = habits.map((item) => {
        if (item.id !== id) return item

        const completedDates = item.completedDates || (
        item.completed ? [today] : []
        )

        const alreadyCompleted = completedDates.includes(today)

        return {
        ...item,
        completedDates: alreadyCompleted
            ? completedDates.filter((date) => date !== today)
            : [...completedDates, today]
        }
    })

    setHabits(updatedHabits)
    localStorage.setItem('myHabits', JSON.stringify(updatedHabits))
}

  function deleteHabit(id) {
    const updatedHabits = habits.filter(
      (item) => item.id !== id
    )

    setHabits(updatedHabits)
    localStorage.setItem('myHabits', JSON.stringify(updatedHabits))
  }

  const today = getTodayDate()

const completedDates = [
  ...new Set(
    habits.flatMap((item) => item.completedDates || [])
  )
].sort()

const completedHabits = habits.filter(
  (item) => (item.completedDates || []).includes(today)
).length

const completedDaySet = new Set(completedDates)

let currentStreak = 0

const streakStart = new Date(
  `${completedDaySet.has(today) ? today : (() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  })()}T12:00:00`
)

while (true) {
  const year = streakStart.getFullYear()
  const month = String(streakStart.getMonth() + 1).padStart(2, '0')
  const day = String(streakStart.getDate()).padStart(2, '0')
  const dateKey = `${year}-${month}-${day}`

  if (!completedDaySet.has(dateKey)) break

  currentStreak++
  streakStart.setDate(streakStart.getDate() - 1)
}

let bestStreak = 0
let runningStreak = 0
let previousDate = null

completedDates.forEach((date) => {
  const currentDate = new Date(`${date}T12:00:00`)

  const difference = previousDate
    ? (currentDate - previousDate) / (1000 * 60 * 60 * 24)
    : 0

  runningStreak = difference === 1 ? runningStreak + 1 : 1

  bestStreak = Math.max(bestStreak, runningStreak)
  previousDate = currentDate
})

  return (
    <div className="habits-page">
      <div className="goals-heading">
        <p className="greeting">SMALL STEPS, BIG CHANGES</p>
        <h1>My Little Habits 🌱</h1>
        <p>Build little routines that create a beautiful life.</p>
      </div>

      <div className="goal-form-card">
        <h2>Create a New Habit ♡</h2>

        <label>What habit do you want to build?</label>

        <input
          type="text"
          placeholder="e.g. Read for 20 minutes"
          value={habit}
          onChange={(e) => setHabit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addHabit()
          }}
        />

        <button
          type="button"
          className="save-entry"
          onClick={addHabit}
        >
          Add My Habit ♡
        </button>
      </div>

      <section className="saved-goals">
        <h2>My Daily Habits 🌷</h2>
        <div className="streak-cards">
            <div className="streak-card">
                <span>🔥</span>
                <h3>{currentStreak}</h3>
                <p>Current Streak</p>
                <small>Days in a row</small>
            </div>

            <div className="streak-card">
                <span>🏆</span>
                <h3>{bestStreak}</h3>
                <p>Best Streak</p>
                <small>Your personal record</small>
            </div>
            </div>
        <div className="habit-progress">
        <div className="habit-progress-heading">
            <span>Today's Progress</span>
            <span>{completedHabits}/{habits.length}</span>
        </div>

        <div className="habit-progress-track">
            <div
            className="habit-progress-fill"
            style={{
                width: habits.length
                ? `${(completedHabits / habits.length) * 100}%`
                : '0%'
            }}
            ></div>
        </div>
        </div>

        <p>
          {completedHabits} out of {habits.length} habits completed today ✨
        </p>

        {habits.length === 0 ? (
          <p>Your little routines will appear here.</p>
        ) : (
          <div className="habit-list">
            {habits.map((item) => (
              <div className="habit-card" key={item.id}>
                <label className="habit-label">
                  <input
                    type="checkbox"
                    checked={(item.completedDates || []).includes(today)}
                    onChange={() => toggleHabit(item.id)}
                  />

                  <span className={(item.completedDates || []).includes(today) ? 'habit-completed' : ''}>
                    {item.name}
                  </span>
                </label>

                <button
                  type="button"
                  className="delete-habit"
                  onClick={() => deleteHabit(item.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default HabitTracker
