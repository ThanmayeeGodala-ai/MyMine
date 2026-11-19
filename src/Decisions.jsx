
import { useState } from 'react'

function Decisions() {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [options, setOptions] = useState('')
  const [choice, setChoice] = useState('')
  const [reason, setReason] = useState('')
  const [reflection, setReflection] = useState('')
  const [editingId, setEditingId] = useState(null)

  const [savedDecisions, setSavedDecisions] = useState(() => {
    return JSON.parse(localStorage.getItem('myDecisions') || '[]')
  })

  function saveDecision() {
    if (!title.trim() || !choice.trim()) {
      alert('Please enter your decision and final choice! 💗')
      return
    }

    let updatedDecisions

    if (editingId !== null) {
      updatedDecisions = savedDecisions.map((item) =>
        item.id === editingId
          ? {
              ...item,
              title: title.trim(),
              date,
              options,
              choice,
              reason,
              reflection
            }
          : item
      )
    } else {
      const newDecision = {
        id: Date.now(),
        title: title.trim(),
        date,
        options,
        choice,
        reason,
        reflection
      }

      updatedDecisions = [...savedDecisions, newDecision]
    }

    setSavedDecisions(updatedDecisions)

    localStorage.setItem(
      'myDecisions',
      JSON.stringify(updatedDecisions)
    )

    setTitle('')
    setDate(new Date().toISOString().split('T')[0])
    setOptions('')
    setChoice('')
    setReason('')
    setReflection('')
    setEditingId(null)

    alert(
      editingId !== null
        ? 'Your decision has been updated! 🌷'
        : 'Your decision has been saved! 🌷'
    )
  }

  function editDecision(item) {
    setTitle(item.title)
    setDate(item.date)
    setOptions(item.options)
    setChoice(item.choice)
    setReason(item.reason)
    setReflection(item.reflection)
    setEditingId(item.id)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  function deleteDecision(id) {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this decision?'
    )

    if (!confirmDelete) return

    const updatedDecisions = savedDecisions.filter(
      (item) => item.id !== id
    )

    setSavedDecisions(updatedDecisions)

    localStorage.setItem(
      'myDecisions',
      JSON.stringify(updatedDecisions)
    )

    if (editingId === id) {
      setTitle('')
      setDate(new Date().toISOString().split('T')[0])
      setOptions('')
      setChoice('')
      setReason('')
      setReflection('')
      setEditingId(null)
    }
  }

  return (
    <div className="habits-page">
      <div className="goals-heading">
        <p className="greeting">THINK, CHOOSE, GROW</p>
        <h1>My Decisions 💭</h1>
        <p>
          Every decision teaches you something.
          Make space to understand your choices.
        </p>
      </div>

      <div className="goal-form-card">
        <h2>Record a Decision ♡</h2>

        <label>What decision are you making?</label>
        <input
          type="text"
          placeholder="e.g. Choosing my career path"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label>Decision Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <label>What options did you consider?</label>
        <textarea
          placeholder="Write down the options..."
          value={options}
          onChange={(e) => setOptions(e.target.value)}
        />

        <label>What did you choose?</label>
        <textarea
          placeholder="Write your final choice..."
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
        />

        <label>Why did you make this decision?</label>
        <textarea
          placeholder="Write your reasons..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <label>Reflection (You can fill this in later)</label>
        <textarea
          placeholder="How did your decision turn out?"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
        />

        <button
          type="button"
          className="save-entry"
          onClick={saveDecision}
        >
          {editingId !== null
            ? 'Update My Decision ♡'
            : 'Save My Decision ♡'}
        </button>
      </div>

      <section className="saved-goals">
        <h2>My Past Decisions 🌷</h2>

        {savedDecisions.length === 0 ? (
          <p>Your decision journal will appear here.</p>
        ) : (
          <div className="decision-list">
            {savedDecisions.map((item) => (
              <div className="decision-card" key={item.id}>
                <h3>{item.title}</h3>

                <p>📅 {item.date}</p>

                <div>
                  <strong>Options considered:</strong>
                  <p>{item.options || 'Not specified'}</p>
                </div>

                <div>
                  <strong>My choice:</strong>
                  <p>{item.choice}</p>
                </div>

                <div>
                  <strong>Why I chose it:</strong>
                  <p>{item.reason || 'Not specified'}</p>
                </div>

                <div>
                  <strong>My reflection:</strong>
                  <p>{item.reflection || 'Not added yet'}</p>
                </div>

                <div className="decision-actions">
                  <button
                    type="button"
                    className="edit-decision"
                    onClick={() => editDecision(item)}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    type="button"
                    className="delete-decision"
                    onClick={() => deleteDecision(item.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Decisions
