
import { useState } from 'react'

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function FutureMe() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [openDate, setOpenDate] = useState('')

  const [letters, setLetters] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('futureLetters') || '[]')
    } catch {
      return []
    }
  })

  function saveLetter() {
    if (!title.trim() || !message.trim() || !openDate) {
      alert('Please fill in all the details! 💌')
      return
    }

    if (openDate < getTodayDate()) {
      alert('Please choose today or a future date! 🌷')
      return
    }

    const newLetter = {
      id: Date.now(),
      title: title.trim(),
      message: message.trim(),
      openDate
    }

    const updatedLetters = [...letters, newLetter]

    setLetters(updatedLetters)
    localStorage.setItem('futureLetters', JSON.stringify(updatedLetters))

    setTitle('')
    setMessage('')
    setOpenDate('')

    alert('Your letter has been sealed! 💌')
  }

  const today = getTodayDate()

  const lockedLetters = letters.filter(
    (letter) => letter.openDate > today
  )

  const openedLetters = letters.filter(
    (letter) => letter.openDate <= today
  )

  return (
    <div className="habits-page">
      <div className="goals-heading">
        <p className="greeting">A MESSAGE THROUGH TIME</p>
        <h1>Dear Future Me 💌</h1>
        <p>
          Write to the person you're becoming.
          Your future self is waiting.
        </p>
      </div>

      <div className="goal-form-card">
        <h2>Write a Letter ♡</h2>

        <label>Give your letter a title</label>
        <input
          type="text"
          placeholder="e.g. A letter to 2027 me"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label>What do you want to tell your future self?</label>
        <textarea
          rows="7"
          placeholder="Dear future me... I hope you are happy, healthy and proud of yourself..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <label>When should this letter be opened?</label>
        <input
          type="date"
          min={today}
          value={openDate}
          onChange={(e) => setOpenDate(e.target.value)}
        />

        <button
          type="button"
          className="save-entry"
          onClick={saveLetter}
        >
          Seal My Letter 💌
        </button>
      </div>

      <section className="saved-goals">
        <h2>My Sealed Letters 🔒</h2>

        {lockedLetters.length === 0 ? (
          <p>No sealed letters yet. Write your first one! 🌷</p>
        ) : (
          <div className="decision-list">
            {lockedLetters.map((letter) => (
              <div className="decision-card" key={letter.id}>
                <h3>🔒 {letter.title}</h3>
                <p>Opening date: {letter.openDate}</p>
                <p>Your message is waiting for its special day.</p>
              </div>
            ))}
          </div>
        )}

        <h2 style={{ marginTop: '35px' }}>
          Letters From My Past Self 💗
        </h2>

        {openedLetters.length === 0 ? (
          <p>Your future letters will appear here when their dates arrive.</p>
        ) : (
          <div className="decision-list">
            {openedLetters.map((letter) => (
              <div className="decision-card" key={letter.id}>
                <h3>💌 {letter.title}</h3>
                <p>Written for: {letter.openDate}</p>
                <p>{letter.message}</p>
                <p>With love, your past self ♡</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default FutureMe
