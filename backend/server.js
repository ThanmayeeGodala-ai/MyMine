
const cors = require('cors')
require('dotenv').config()

const express = require('express')
const { createClient } = require('@supabase/supabase-js')
const pool = require('./db')

const app = express()
const PORT = process.env.PORT || 5000

// CORS CONFIGURATION
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://probable-cod-g4wrjrw74xvpfr7q-5173.app.github.dev'
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests without an origin (health checks, server tools)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
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
        message: 'Invalid or expired session'
      })
    }

    req.user = data.user
    next()
  } catch (error) {
    console.error('Authentication error:', error)

    return res.status(401).json({
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
      message: 'Database connected successfully!',
      time: result.rows[0].now
    })
  } catch (error) {
    console.error('Database error:', error)

    res.status(500).json({
      message: 'Database connection failed'
    })
  }
})

// GET DIARY ENTRIES
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
    console.error('Fetch diary error:', error)

    res.status(500).json({
      message: 'Failed to fetch diary entries'
    })
  }
})

// CREATE DIARY ENTRY
app.post('/diary', authenticateUser, async (req, res) => {
  try {
    const { title, content, mood, entry_date, photos } = req.body

    const result = await pool.query(
      `INSERT INTO diary_entries
       (user_id, title, content, mood, entry_date, photos)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.user.id,
        title,
        content,
        mood,
        entry_date,
        JSON.stringify(photos || [])
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Create diary error:', error)

    res.status(500).json({
      message: 'Failed to save diary entry'
    })
  }
})

// UPDATE DIARY ENTRY
app.put('/diary/:id', authenticateUser, async (req, res) => {
  try {
    const { title, content, mood, entry_date, photos } = req.body

    const result = await pool.query(
      `UPDATE diary_entries
       SET title = $1,
           content = $2,
           mood = $3,
           entry_date = $4,
           photos = $5,
           updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        title,
        content,
        mood,
        entry_date,
        JSON.stringify(photos || []),
        req.params.id,
        req.user.id
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Diary entry not found'
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Update diary error:', error)

    res.status(500).json({
      message: 'Failed to update diary entry'
    })
  }
})

// DELETE DIARY ENTRY
app.delete('/diary/:id', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM diary_entries
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Diary entry not found'
      })
    }

    res.json({
      message: 'Diary entry deleted successfully'
    })
  } catch (error) {
    console.error('Delete diary error:', error)

    res.status(500).json({
      message: 'Failed to delete diary entry'
    })
  }
})

// START SERVER
app.listen(PORT, () => {
  console.log(`MyMine server is running on port ${PORT}`)
})
