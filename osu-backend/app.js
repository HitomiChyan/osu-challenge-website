require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt  = require('bcrypt');
const fs      = require('fs');
const path    = require('path');
const db      = require('./dbConnect');

const app = express();
app.use(express.json());
app.use(session({ 
  secret: process.env.SESSION_SECRET, 
  resave: false, 
  saveUninitialized: false 
}));

// ... 中介層 ensureLogin、ensureFull 如前 …

// 登入、登出如前 …

// 只留一組：用資料庫去讀所有報名
app.get('/api/registrations', ensureLogin, async (req, res) => {
  try {
    const rows = await db.query('SELECT id, name, score FROM registrations');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '讀取失敗', error: err.message });
  }
});

// 刪除（full 權限）
app.delete('/api/registrations/:id', ensureLogin, ensureFull, async (req, res) => {
  // ... 同上 …
});

// 更新成績
app.put('/api/registrations/:id/score', ensureLogin, async (req, res) => {
  // ... 同上 …
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running');
});
