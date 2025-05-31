// app.js
require('dotenv').config();
const express     = require('express');
const session     = require('express-session');
const bcrypt      = require('bcrypt');
const fs          = require('fs');
const path        = require('path');
const { ObjectId } = require('mongodb');
const getDb       = require('./dbConnect');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── 中介層：檢查是否已登入 ─────────────────
function ensureLogin(req, res, next) {
  if (!req.session || !req.session.username) {
    return res.status(401).json({ message: '請先登入' });
  }
  next();
}
// 檢查是否為 full 權限
function ensureFull(req, res, next) {
  if (req.session.role !== 'full') {
    return res.status(403).json({ message: '權限不足' });
  }
  next();
}
// ──────────────────────────────────────────

// --- 登入路由 ---
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const cfg    = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'admins.json')));
  const admins = cfg.admins;
  const admin  = admins.find(a => a.username === username);
  if (!admin) return res.status(401).json({ message: '帳號或密碼錯誤' });

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return res.status(401).json({ message: '帳號或密碼錯誤' });

  // 登入成功，寫入 session
  req.session.username = admin.username;
  req.session.role     = admin.role;
  // 回傳 role，讓前端知道 full 或 limited
  res.json({ message: '登入成功', role: admin.role });
});

// --- 登出路由 ---
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: '登出失敗' });
    res.json({ message: '已登出' });
  });
});

// --- 取得所有分數（參賽者列表）── 任何已登入者可 ---
app.get('/api/scores', ensureLogin, async (req, res) => {
  try {
    const db   = await getDb();
    const rows = await db.collection('scores').find().toArray();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '讀取失敗', error: err.message });
  }
});

// --- 新增參賽者（full 權限） ---
app.post('/api/scores', ensureLogin, ensureFull, async (req, res) => {
  // 期待 body: { username: 'xxx', score: 123, date: 'YYYY-MM-DD' }
  const { username, score, date } = req.body;
  if (!username || score === undefined || !date) {
    return res.status(400).json({ message: '缺少必要欄位：username, score, date' });
  }

  try {
    const db = await getDb();
    const newDoc = { username, score, date };
    const result = await db.collection('scores').insertOne(newDoc);
    // 回傳插入後的 _id
    res.json({ message: '新增成功', insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: '新增失敗', error: err.message });
  }
});

// --- 更新分數／使用者名稱：任何已登入者可更新 score；只有 full 可更新 username ---
app.put('/api/scores/:id/score', ensureLogin, async (req, res) => {
  const { score, username } = req.body;

  // limited 權限不得帶 username
  if (username !== undefined && req.session.role !== 'full') {
    return res.status(403).json({ message: '權限不足，無法修改使用者名稱' });
  }

  try {
    const db = await getDb();
    const setObj = {};
    if (score !== undefined) setObj.score = score;
    if (username !== undefined) setObj.username = username;

    const result = await db
      .collection('scores')
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: setObj }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: '找不到該筆資料' });
    }
    res.json({ message: `已更新 id=${req.params.id}` });
  } catch (err) {
    res.status(500).json({ message: '更新失敗', error: err.message });
  }
});

// --- 刪除參賽者（full 權限） ---
app.delete('/api/scores/:id', ensureLogin, ensureFull, async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.collection('scores').deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: '找不到該筆資料' });
    }
    res.json({ message: `已刪除 id=${req.params.id}` });
  } catch (err) {
    res.status(500).json({ message: '刪除失敗', error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
