

import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL

const moods = ['😊', '😌', '🥰', '😔', '😴']
const BUCKET_NAME = 'diary-photos'

function Diary() {
  const [session, setSession] = useState(null)
  const [mood, setMood] = useState('😊')
  const [title, setTitle] = useState('')
  const [entry, setEntry] = useState('')
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [photos, setPhotos] = useState([])
  const [savedEntries, setSavedEntries] = useState([])
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Get the current logged-in user
  useEffect(() => {
    let active = true

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!active) return

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      setSession(data.session)
    }

    loadSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // Send authenticated requests to Node.js
  async function apiRequest(path, options = {}) {
    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) {
      throw new Error('Please log in again to access your diary.')
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session.access_token}`,
        ...options.headers
      }
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Something went wrong.')
    }

    return result
  }

  // Get secure image URLs from Supabase Storage
  async function getPhotoUrls(paths = []) {
    return Promise.all(
      paths.map(async (path) => {
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(path, 60 * 60)

        if (error) {
          console.error('Photo URL error:', error.message)
          return null
        }

        return {
          path,
          preview: data.signedUrl
        }
      })
    ).then((items) => items.filter(Boolean))
  }

  // Fetch diary entries from the backend
  async function fetchEntries() {
    setLoading(true)
    setMessage('')

    try {
      const result = await apiRequest('/diary')

      const entries = await Promise.all(
        result.map(async (item) => {
          const photoItems = await getPhotoUrls(item.photos || [])

          return {
            id: item.id,
            date: item.entry_date,
            mood: item.mood,
            title: item.title,
            entry: item.content,
            photos: photoItems
          }
        })
      )

      setSavedEntries(entries)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchEntries()
    } else {
      setSavedEntries([])
      setLoading(false)
    }
  }, [session])

  // Compress selected photos
  function compressPhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        const image = new Image()

        image.onload = () => {
          const maxSize = 1000
          let width = image.width
          let height = image.height

          if (width > maxSize || height > maxSize) {
            const scale = Math.min(
              maxSize / width,
              maxSize / height
            )

            width = Math.round(width * scale)
            height = Math.round(height * scale)
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const context = canvas.getContext('2d')
          context.drawImage(image, 0, 0, width, height)

          resolve(canvas.toDataURL('image/jpeg', 0.75))
        }

        image.onerror = reject
        image.src = event.target.result
      }

      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files || [])
    const remaining = 5 - photos.length

    if (files.length > remaining) {
      alert('You can add up to 5 photos to one memory.')
    }

    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) continue

      try {
        const compressedPhoto = await compressPhoto(file)

        setPhotos((current) => [
          ...current,
          {
            preview: compressedPhoto,
            newPhoto: true
          }
        ])
      } catch {
        alert('Sorry, one of your photos could not be loaded.')
      }
    }

    e.target.value = ''
  }

  function removePhoto(index) {
    setPhotos((current) =>
      current.filter((_, i) => i !== index)
    )
  }

  // Upload new photos and keep existing photo paths
  async function uploadPhotos() {
    const { data: userData, error: userError } =
      await supabase.auth.getUser()

    if (userError || !userData.user) {
      throw new Error('Please log in again before uploading photos.')
    }

    const userId = userData.user.id
    const uploadedPaths = []

    for (const photo of photos) {
      if (!photo.newPhoto) {
        uploadedPaths.push(photo.path)
        continue
      }

      const response = await fetch(photo.preview)
      const blob = await response.blob()

      const fileName =
        `${userId}/${crypto.randomUUID()}.jpg`

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (error) {
        throw new Error(`Photo upload failed: ${error.message}`)
      }

      uploadedPaths.push(data.path)
    }

    return uploadedPaths
  }

  function resetForm() {
    setTitle('')
    setEntry('')
    setMood('😊')
    setPhotos([])
    setDate(new Date().toISOString().split('T')[0])
    setEditingId(null)
  }

  // Save a new diary entry or update an existing one
  async function saveEntry() {
    if (!title.trim() || !entry.trim()) {
      alert('Please add a title and write something about your day.')
      return
    }

    if (!API_URL) {
      alert('Backend URL is missing. Please configure VITE_API_URL.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const photoPaths = await uploadPhotos()

      const body = {
        title: title.trim(),
        content: entry.trim(),
        mood,
        entry_date: date,
        photos: photoPaths
      }

      if (editingId !== null) {
        await apiRequest(`/diary/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        })

        alert('Your memory has been updated! ❤️')
      } else {
        await apiRequest('/diary', {
          method: 'POST',
          body: JSON.stringify(body)
        })

        alert('Your memory has been saved! ❤️')
      }

      resetForm()
      await fetchEntries()
    } catch (error) {
      setMessage(error.message)
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  // Delete a diary entry
  async function deleteEntry(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this memory?'
    )

    if (!confirmed) return

    try {
      await apiRequest(`/diary/${id}`, {
        method: 'DELETE'
      })

      setSelectedEntry(null)
      await fetchEntries()
      alert('Your memory has been deleted.')
    } catch (error) {
      setMessage(error.message)
      alert(error.message)
    }
  }

  // Edit a saved memory
  function editEntry(item) {
    setTitle(item.title)
    setEntry(item.entry)
    setMood(item.mood)
    setDate(item.date)

    setPhotos(item.photos || [])

    setEditingId(item.id)
    setSelectedEntry(null)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  function formatDate(dateValue) {
    return new Date(dateValue + 'T00:00:00').toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    )
  }

  if (!session) {
    return (
      <div className="diary-page">
        <p>Please log in to access your personal diary. ♡</p>
      </div>
    )
  }

  return (
    <div className="diary-page">
      <div className="diary-heading">
        <p className="greeting">YOUR PERSONAL JOURNAL</p>
        <h1>My Diary 📖</h1>
        <p>A little space for everything that makes you, you.</p>
      </div>

      {message && (
        <p role="alert">{message}</p>
      )}

      <div className="diary-card">
        <label>Choose a date</label>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <h3>How are you feeling today?</h3>

        <div className="mood-options">
          {moods.map((item) => (
            <button
              key={item}
              className={mood === item ? 'selected-mood' : ''}
              onClick={() => setMood(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        <label htmlFor="diary-title">Give your day a title</label>

        <input
          id="diary-title"
          type="text"
          placeholder="A little title for today..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label htmlFor="diary-entry">Today's memories</label>

        <textarea
          id="diary-entry"
          placeholder="Dear diary, today..."
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          rows="8"
        />

        <div className="diary-photo-section">
          <label htmlFor="diary-photos">
            Add pictures to your memory 📸
          </label>

          <p>
            Keep your favourite moments close.
            You can add up to 5 photos.
          </p>

          <input
            id="diary-photos"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden-photo-input"
          />

          <label
            htmlFor="diary-photos"
            className="choose-photos-button"
          >
            📸 Choose your photos ♡
          </label>

          {photos.length > 0 && (
            <div className="diary-photo-preview">
              {photos.map((photo, index) => (
                <div className="diary-photo-item" key={index}>
                  <img
                    src={photo.preview}
                    alt={`Diary memory ${index + 1}`}
                  />

                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="save-entry"
          onClick={saveEntry}
          disabled={saving}
        >
          {saving
            ? 'Saving...'
            : editingId !== null
              ? 'Update My Memory ♡'
              : 'Save My Memory ♡'}
        </button>

        {editingId !== null && (
          <button
            type="button"
            onClick={resetForm}
          >
            Cancel Editing
          </button>
        )}
      </div>

      {/* SAVED MEMORIES */}

      <section className="saved-memories">
        <div className="memories-heading">
          <div>
            <p className="greeting">YOUR LITTLE TIME CAPSULE</p>
            <h2>Saved Memories ♡</h2>
          </div>

          <span>{savedEntries.length} entries</span>
        </div>

        {loading ? (
          <p>Loading your memories... ♡</p>
        ) : savedEntries.length === 0 ? (
          <div className="empty-memories">
            <span>📖</span>
            <h3>Your story starts here.</h3>
            <p>Your saved memories will appear here.</p>
          </div>
        ) : (
          <div className="memories-grid">
            {savedEntries.map((item) => (
              <article className="memory-card" key={item.id}>
                <div className="memory-top">
                  <span className="memory-mood">{item.mood}</span>

                  <span className="memory-date">
                    {formatDate(item.date)}
                  </span>
                </div>

                <h3>{item.title}</h3>

                <p className="memory-preview">
                  {item.entry.length > 110
                    ? item.entry.slice(0, 110) + '...'
                    : item.entry}
                </p>

                {item.photos?.length > 0 && (
                  <div className="memory-card-photos">
                    {item.photos.slice(0, 3).map((photo, index) => (
                      <img
                        src={photo.preview}
                        alt={`Memory photo ${index + 1}`}
                        key={index}
                      />
                    ))}

                    {item.photos.length > 3 && (
                      <span>+{item.photos.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="memory-actions">
                  <button
                    type="button"
                    onClick={() => setSelectedEntry(item)}
                  >
                    Read memory →
                  </button>

                  <button
                    type="button"
                    onClick={() => editEntry(item)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-memory"
                    onClick={() => deleteEntry(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* FULL MEMORY VIEW */}

      {selectedEntry && (
        <div className="memory-overlay">
          <div className="memory-detail">
            <button
              className="close-memory"
              onClick={() => setSelectedEntry(null)}
              type="button"
            >
              ✕
            </button>

            <p className="greeting">A MEMORY FROM YOUR JOURNAL</p>

            <span className="memory-detail-mood">
              {selectedEntry.mood}
            </span>

            <h2>{selectedEntry.title}</h2>

            <p className="memory-date">
              {formatDate(selectedEntry.date)}
            </p>

            <div className="memory-full-text">
              {selectedEntry.entry}
            </div>

            {selectedEntry.photos?.length > 0 && (
              <div className="memory-detail-photos">
                <h3>Little moments captured ♡</h3>

                <div className="diary-photo-preview">
                  {selectedEntry.photos.map((photo, index) => (
                    <img
                      src={photo.preview}
                      alt={`Memory photo ${index + 1}`}
                      key={index}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Diary
