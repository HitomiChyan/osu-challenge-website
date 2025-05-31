// app.js
require('dotenv').config();
const express    = require('express');
const session    = require('express-session');
const bcrypt     = require('bcrypt');
const fs         = require('fs');
const path       = require('path');
// 確保只寫一次下面這行，別再重複宣告
const { ObjectId } = require('mongodb');
const getDb      = require('./dbConnect');

const app = express();
app.use(express.json());
// ─── 新增這行：告訴 Express 將 public 資料夾當作靜態資源提供 ───
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// ─── 中介層：檢查是否已登入 ─────────────────
function ensureLogin(req, res, next) {
  if (!req.session || !req.session.username) {
    return res.status(401).json({ message: '請先登入' });
  }
  next();
}
function ensureFull(req, res, next) {
  if (req.session.role !== 'full') {
    return res.status(403).json({ message: '權限不足' });
  }
  next();
}
// ──────────────────────────────────────────

// 登入路由
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const cfg    = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'admins.json')));
  const admins = cfg.admins;
  const admin  = admins.find(a => a.username === username);
  if (!admin) return res.status(401).json({ message: '帳號或密碼錯誤' });

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return res.status(401).json({ message: '帳號或密碼錯誤' });
  
  // 驗證成功，寫入 session
  req.session.username = admin.username;
  req.session.role     = admin.role;
  res.json({ message: '登入成功', role: admin.role });
});

// 登出路由
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: '登出失敗' });
    res.json({ message: '已登出' });
  });
});

// 讀取所有分數：任何已登入者可
app.get('/api/scores', ensureLogin, async (req, res) => {
  try {
    const db   = await getDb();
    const rows = await db.collection('scores').find().toArray();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '讀取失敗', error: err.message });
  }
});

// 更新分數：任何已登入者可
app.put('/api/scores/:id/score', ensureLogin, async (req, res) => {
  const { score } = req.body;
  try {
    const db = await getDb();
    const result = await db
      .collection('scores')
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { score } }
      );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: '找不到該筆資料' });
    }
    res.json({ message: `已更新 id=${req.params.id} 的分數` });
  } catch (err) {
    res.status(500).json({ message: '更新失敗', error: err.message });
  }
});

// 刪除分數：只有 full 權限
app.delete('/api/scores/:id', ensureLogin, ensureFull, async (req, res) => {
  try {
    const db = await getDb();
    const result = await db
      .collection('scores')
      .deleteOne({ _id: new ObjectId(req.params.id) });
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
