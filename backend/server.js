
const cors = require('cors')
require('dotenv').config()

const express = require('express')
const { createClient } = require('@supabase/supabase-js')
const pool = require('./db')

const app = express()
const PORT = process.env.PORT || 5000

// CORS CONFIGURATION
app.use(cors({
  origin: 'https://probable-cod-g4wrjrw74xvpfr7q-5173.app.github.dev',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

// SUPABASE CLIENT
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// VERIFY SUPABASE LOGIN
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required'
      })
    }

    const token = authHeader.split(' ')[1]
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return res.status(401).json({
        message: 'Invalid or expired login session'
      })
    }

    req.user = data.user
    next()
  } catch (error) {
    console.error('Authentication error:', error.message)
    res.status(401).json({
      message: 'Authentication failed'
    })
  }
}

// HOME ROUTE
app.get('/', (req, res) => {
  res.send('Welcome to MyMine Backend! ♡')
})

// DATABASE TEST
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')

    res.json({
      message: 'MyMine database connected successfully! ♡',
      time: result.rows[0].now
    })
  } catch (error) {
    console.error('Database error:', error.message)
    res.status(500).json({
      message: 'Database connection failed'
    })
  }
})

// CREATE DIARY ENTRY
app.post('/diary', authenticateUser, async (req, res) => {
  try {
    const { title, content, mood, entry_date } = req.body
    const photos = req.body.photos ?? []

    if (!Array.isArray(photos)) {
      return res.status(400).json({
        message: 'Photos must be an array'
      })
    }

    const result = await pool.query(
      `INSERT INTO diary_entries
       (user_id, title, content, mood, entry_date, photos)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING *`,
      [
        req.user.id,
        title,
        content,
        mood,
        entry_date,
        JSON.stringify(photos)
      ]
    )

    res.status(201).json({
      message: 'Diary entry saved successfully! ♡',
      entry: result.rows[0]
    })
  } catch (error) {
    console.error('Diary save error:', error.message)
    res.status(500).json({
      message: 'Could not save diary entry'
    })
  }
})

// GET USER'S DIARY ENTRIES
app.get('/diary', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM diary_entries
       WHERE user_id = $1
       ORDER BY entry_date DESC, created_at DESC`,
      [req.user.id]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Diary fetch error:', error.message)
    res.status(500).json({
      message: 'Could not fetch diary entries'
    })
  }
})

// UPDATE DIARY ENTRY
app.put('/diary/:id', authenticateUser, async (req, res) => {
  try {
    const { title, content, mood, entry_date } = req.body
    const photos = req.body.photos ?? []
    const { id } = req.params

    if (!Array.isArray(photos)) {
      return res.status(400).json({
        message: 'Photos must be an array'
      })
    }

    const result = await pool.query(
      `UPDATE diary_entries
       SET title = $1,
           content = $2,
           mood = $3,
           entry_date = $4,
           photos = $5::jsonb,
           updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        title,
        content,
        mood,
        entry_date,
        JSON.stringify(photos),
        id,
        req.user.id
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Diary entry not found'
      })
    }

    res.json({
      message: 'Diary entry updated successfully! ♡',
      entry: result.rows[0]
    })
  } catch (error) {
    console.error('Diary update error:', error.message)
    res.status(500).json({
      message: 'Could not update diary entry'
    })
  }
})

// DELETE DIARY ENTRY
app.delete('/diary/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `DELETE FROM diary_entries
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Diary entry not found'
      })
    }

    res.json({
      message: 'Diary entry deleted successfully! ♡'
    })
  } catch (error) {
    console.error('Diary delete error:', error.message)
    res.status(500).json({
      message: 'Could not delete diary entry'
    })
  }
})

// START SERVER
app.listen(PORT, () => {
  console.log(`MyMine server is running on port ${PORT}`)
})
