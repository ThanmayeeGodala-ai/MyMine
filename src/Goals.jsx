
import { useState } from 'react'

function Goals() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Personal')
  const [targetDate, setTargetDate] = useState('')

  const [savedGoals, setSavedGoals] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('myGoals') || '[]'
      )
    } catch {
      return []
    }
  })
  const [editingId, setEditingId] = useState(null)
  const [showCelebration, setShowCelebration] = useState(false)

  
function saveGoal() {
  if (!title.trim()) {
    alert('Please enter a goal title.')
    return
  }

  let updatedGoals

  if (editingId !== null) {
    updatedGoals = savedGoals.map((goal) =>
      goal.id === editingId
        ? {
            ...goal,
            title: title.trim(),
            description: description.trim(),
            category,
            targetDate
          }
        : goal
    )
  } else {
    const newGoal = {
      id: Date.now(),
      createdAt: new Date().toLocaleDateString('en-CA'),
      title: title.trim(),
      description: description.trim(),
      category,
      targetDate,
      progress: 0
    }

    updatedGoals = [newGoal, ...savedGoals]
  }

  localStorage.setItem(
    'myGoals',
    JSON.stringify(updatedGoals)
  )

  setSavedGoals(updatedGoals)

  setTitle('')
  setDescription('')
  setCategory('Personal')
  setTargetDate('')
  setEditingId(null)

  alert('Your goal has been saved! ❤️')
}

  function editGoal(goal) {
  setTitle(goal.title)
  setDescription(goal.description)
  setCategory(goal.category)
  setTargetDate(goal.targetDate)
  setEditingId(goal.id)

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}
function deleteGoal(id) {
  const confirmed = window.confirm(
    'Are you sure you want to delete this goal?'
  )

  if (!confirmed) return

  const updatedGoals = savedGoals.filter(
    (goal) => goal.id !== id
  )

  localStorage.setItem(
    'myGoals',
    JSON.stringify(updatedGoals)
  )

  setSavedGoals(updatedGoals)
}
  function updateProgress(id, newProgress) {
  const updatedGoals = savedGoals.map((goal) =>
    goal.id === id
      ? { ...goal, progress: Number(newProgress) }
      : goal
  )

  localStorage.setItem(
    'myGoals',
    JSON.stringify(updatedGoals)
  )

  setSavedGoals(updatedGoals)
  if (Number(newProgress) === 100) {
  setShowCelebration(true)
}
}

  return (
    <div className="goals-page">
        {showCelebration && (
    <div className="celebration-overlay">
      <div className="celebration-popup">
        <div className="celebration-emoji">🎉</div>
        <h2>You did it!</h2>
        <p>Your dreams are becoming reality! ❤️</p>

        <button
          type="button"
          onClick={() => setShowCelebration(false)}
        >
          Yayy! ♡
        </button>
      </div>
    </div>
  )}
      <div className="goals-heading">
        <p className="greeting">YOUR DREAMS, YOUR JOURNEY</p>
        <h1>My Goals 🎯</h1>
        <p>Little steps today, beautiful achievements tomorrow.</p>
      </div>

      <div className="goal-form-card">
        <h2>Create a New Goal ♡</h2>
        <p>Every big achievement starts with a small step.</p>

        <label>What do you want to achieve?</label>
        <input
          type="text"
          placeholder="e.g. Get an internship"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label>Why is this goal important?</label>
        <textarea
          placeholder="Write a little about your goal..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="4"
        />

        <label>Choose a category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>Personal</option>
          <option>Education</option>
          <option>Career</option>
          <option>Fitness</option>
          <option>Finance</option>
        </select>

        <label>Target date</label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />

        <button
          type="button"
          className="save-entry"
          onClick={saveGoal}
        >
          {editingId !== null ? 'Update My Goal ♡' : 'Add My Goal ♡'}
        </button>
      </div>

      <section className="saved-goals">
        <h2>My Little Milestones ♡</h2>
        <p>{savedGoals.length} goals created</p>

        {savedGoals.length === 0 ? (
          <div className="empty-memories">
            <span>🎯</span>
            <h3>Your dreams deserve a place here.</h3>
            <p>Add your first goal to begin your journey.</p>
          </div>
        ) : (
          <div className="goals-grid">
            {savedGoals.map((goal) => (
              <article className="goal-card" key={goal.id}>
                <span>{goal.category}</span>
                <h3>{goal.title}</h3>

                  {goal.progress === 100 && (
                    <span className="completed-label">
                      ✨ Completed!
                    </span>
                  )}

                  <p>{goal.description}</p>
                <p>
                  Target date: {goal.targetDate || 'Not set'}
                </p>
                <div className="goal-progress">
                  <div className="progress-info">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="goal-actions">
                    <button
                      type="button"
                      onClick={() => editGoal(goal)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-memory"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      Delete
                    </button>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={goal.progress}
                    onChange={(e) =>
                      updateProgress(goal.id, e.target.value)
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Goals
