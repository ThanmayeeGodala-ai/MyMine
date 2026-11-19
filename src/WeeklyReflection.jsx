
import { useState } from 'react'

function getLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekStart(date = new Date()) {
  const monday = new Date(date)
  const day = monday.getDay()

  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day))

  return getLocalDate(monday)
}

function getWeekDates(weekStart) {
  const start = new Date(`${weekStart}T12:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  return {
    start: weekStart,
    end: getLocalDate(end)
  }
}

function formatDate(date) {
  if (!date) return ''

  return new Date(`${date}T12:00:00`).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'long'
    }
  )
}

function loadData(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function WeeklyReflection() {
  const [weekStart, setWeekStart] = useState(getWeekStart())

  const { start, end } = getWeekDates(weekStart)

  // Read saved information from all MyMine sections
  const diaryEntries = loadData('diaryEntries')
  const goals = loadData('myGoals')
  const habits = loadData('myHabits')
  const decisions = loadData('myDecisions')
  const letters = loadData('futureLetters')

  // Diary memories from the selected week
  const weeklyDiary = diaryEntries.filter(
    (item) => item.date >= start && item.date <= end
  )

  // Decisions recorded during the selected week
  const weeklyDecisions = decisions.filter(
    (item) => item.date >= start && item.date <= end
  )

  // Habit completions during the selected week
  const weeklyHabitActivity = habits.flatMap((habit) =>
    (habit.completedDates || [])
      .filter((date) => date >= start && date <= end)
      .map((date) => ({
        name: habit.name,
        date
      }))
  )

  // Future letters: IDs are approximate creation timestamps
  const weeklyLetters = letters.filter((letter) => {
    const createdDate = letter.id
      ? getLocalDate(new Date(Number(letter.id)))
      : ''

    return createdDate >= start && createdDate <= end
  })

  const isCurrentWeek = weekStart === getWeekStart()

  function changeWeek(amount) {
    const date = new Date(`${weekStart}T12:00:00`)
    date.setDate(date.getDate() + amount * 7)
    setWeekStart(getLocalDate(date))
  }

  const diaryMoodSummary = [
    ...new Set(weeklyDiary.map((item) => item.mood).filter(Boolean))
  ]

  const hasActivity =
    weeklyDiary.length > 0 ||
    weeklyDecisions.length > 0 ||
    weeklyHabitActivity.length > 0 ||
    weeklyLetters.length > 0

  return (
    <div className="habits-page">

      <div className="goals-heading">
        <p className="greeting">YOUR JOURNEY, YOUR STORY</p>
        <h1>My Weekly Reflection 🌷</h1>
        <p>
          A little look back at everything you experienced
          and everything you are becoming.
        </p>
      </div>

      <div className="goal-form-card">

        <p className="greeting">YOUR WEEK IN REVIEW</p>

        <h2>
          {formatDate(start)} – {formatDate(end)}
        </h2>

        <div className="week-navigation">
        <button
            type="button"
            className="week-nav-button"
            onClick={() => changeWeek(-1)}
        >
            ← Previous Week
        </button>

        <button
            type="button"
            className="week-nav-button"
            onClick={() => changeWeek(1)}
            disabled={isCurrentWeek}
        >
            Next Week →
        </button>
        </div>

        {!hasActivity ? (
          <div className="empty-memories">
            <span>🌱</span>
            <h3>Your story is still unfolding.</h3>
            <p>
              No recorded activity was found for this week.
              Come back after adding memories, completing habits
              or recording decisions.
            </p>
          </div>
        ) : (
          <div className="weekly-reflection-content">

            {/* DIARY REFLECTION */}

            {weeklyDiary.length > 0 && (
              <section>
                <h2>📖 Moments From My Diary</h2>

                <p>
                  This week, you recorded {weeklyDiary.length}
                  {' '}diary {weeklyDiary.length === 1 ? 'entry' : 'entries'}.
                  Your memories included:
                </p>

                {weeklyDiary.map((item) => (
                  <div className="decision-card" key={item.id}>
                    <h3>{item.mood} {item.title}</h3>
                    <p>{formatDate(item.date)}</p>
                    <p>{item.entry}</p>
                  </div>
                ))}
              </section>
            )}

            {/* GOAL REFLECTION */}

            {goals.length > 0 && (
              <section>
                <h2>🎯 My Dreams and Goals</h2>

                <p>
                  Here is where your goals stand right now:
                </p>

                {goals.map((goal) => (
                  <div className="decision-card" key={goal.id}>
                    <h3>{goal.title}</h3>
                    <p>{goal.description}</p>
                    <p>Category: {goal.category}</p>
                    <p>Current progress: {goal.progress || 0}%</p>
                  </div>
                ))}

                <p>
                  Keep taking little steps towards the things
                  that matter to you.
                </p>
                <small>
                  Goal progress is your current saved progress,
                  not a weekly progress measurement.
                </small>
              </section>
            )}

            {/* HABIT REFLECTION */}

            {weeklyHabitActivity.length > 0 && (
              <section>
                <h2>🌱 Little Habits, Little Steps</h2>

                <p>
                  You showed up for these habits during the week:
                </p>

                {weeklyHabitActivity.map((item, index) => (
                  <div className="decision-card" key={`${item.name}-${item.date}-${index}`}>
                    <h3>♡ {item.name}</h3>
                    <p>Completed on {formatDate(item.date)}</p>
                  </div>
                ))}
              </section>
            )}

            {/* DECISION REFLECTION */}

            {weeklyDecisions.length > 0 && (
              <section>
                <h2>💭 Choices I Made</h2>

                {weeklyDecisions.map((item) => (
                  <div className="decision-card" key={item.id}>
                    <h3>{item.title}</h3>
                    <p>Date: {formatDate(item.date)}</p>

                    <p>
                      <strong>My choice:</strong> {item.choice}
                    </p>

                    {item.options && (
                      <p>
                        <strong>Options considered:</strong> {item.options}
                      </p>
                    )}

                    {item.reason && (
                      <p>
                        <strong>My reason:</strong> {item.reason}
                      </p>
                    )}

                    {item.reflection && (
                      <p>
                        <strong>My reflection:</strong> {item.reflection}
                      </p>
                    )}
                  </div>
                ))}
              </section>
            )}

            {/* FUTURE ME */}

            {weeklyLetters.length > 0 && (
              <section>
                <h2>💌 Messages to My Future Self</h2>

                {weeklyLetters.map((letter) => (
                  <div className="decision-card" key={letter.id}>
                    <h3>{letter.title}</h3>
                    <p>{letter.message}</p>
                    <p>Opening date: {letter.openDate}</p>
                  </div>
                ))}
              </section>
            )}

            {/* MOOD OVERVIEW */}

            {diaryMoodSummary.length > 0 && (
              <section>
                <h2>♡ Feelings I Recorded</h2>
                <p>
                  The moods you selected in your diary this week:
                </p>
                <h2>{diaryMoodSummary.join('  ')}</h2>
              </section>
            )}

            <div className="decision-card">
              <h2>🌷 A Note to Myself</h2>
              <p>
                These are the moments, choices and little steps
                you recorded this week. Every memory is part of
                your story. Take a moment to appreciate how far
                you've come.
              </p>
              <p>With love, MyMine ♡</p>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

export default WeeklyReflection
