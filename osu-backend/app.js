// osu-backend/app.js
require('dotenv').config();
const express     = require('express');
const path        = require('path');
const session     = require('express-session');
const bcrypt      = require('bcrypt');
const fs          = require('fs');
const cors        = require('cors');
const { ObjectId } = require('mongodb');
const getDb       = require('./dbConnect');

const app = express();

// 1. CORS（一定要放 app.use(express.static) 之前）
app.use(cors({
  origin: ['http://localhost:5500', 'https://hitomichyan.github.io'],
  credentials: true
}));


// 2. 靜態資源設定
app.use(express.static(__dirname));

// 3. 解析 JSON 請求
app.use(express.json());

// 4. Session 設定
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax',
    // 如果你是 HTTPS 請設 sameSite: 'none', secure: true
  }
}));

// 5. 首頁
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── 中介層 ────────────────────────
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

// ─── 管理員登入 ────────────────────
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const cfg    = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'admins.json')));
  const admins = cfg.admins;
  const admin  = admins.find(a => a.username === username);
  if (!admin) return res.status(401).json({ message: '帳號或密碼錯誤' });

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return res.status(401).json({ message: '帳號或密碼錯誤' });

  req.session.username = admin.username;
  req.session.role     = admin.role;
  res.json({ message: '登入成功', role: admin.role });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: '登出失敗' });
    res.json({ message: '已登出' });
  });
});

// === 非挑戰者 CRUD ===
app.post('/api/nonchallengers', ensureLogin, ensureFull, async (req, res) => {
  const { activityName, twitchName, twitchID, manualTickets, note } = req.body;
  if (!activityName) return res.status(400).json({ message: '缺少活動名稱' });
  try {
    const db = await getDb();
    const doc = {
      activityName,
      twitchName: twitchName || '',
      twitchID: twitchID || '',
      manualTickets: manualTickets || 0,
      totalTickets: manualTickets || 0,
      note: note || '',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const result = await db.collection('nonchallengers').insertOne(doc);
    res.json({ message: '新增成功', insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: '新增失敗', error: err.message });
  }
});
app.get('/api/nonchallengers', ensureLogin, async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.collection('nonchallengers').find().toArray();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '讀取失敗', error: err.message });
  }
});
app.put('/api/nonchallengers/:id', ensureLogin, ensureFull, async (req, res) => {
  try {
    const db = await getDb();
    const { twitchName, twitchID, manualTickets, note } = req.body;
    const updateObj = {};
    if (twitchName !== undefined) updateObj.twitchName = twitchName;
    if (twitchID !== undefined) updateObj.twitchID = twitchID;
    if (manualTickets !== undefined) {
      updateObj.manualTickets = manualTickets;
      updateObj.totalTickets  = manualTickets;
    }
    if (note !== undefined) updateObj.note = note;
    const result = await db.collection('nonchallengers').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateObj }
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: '找不到資料' });
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ message: '更新失敗', error: err.message });
  }
});
app.delete('/api/nonchallengers/:id', ensureLogin, ensureFull, async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.collection('nonchallengers').deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: '找不到資料' });
    res.json({ message: '刪除成功' });
  } catch (err) {
    res.status(500).json({ message: '刪除失敗', error: err.message });
  }
});

// === 報名（registrations）CRUD ===
// 新增報名
app.post('/api/registrations', ensureLogin, ensureFull, async (req, res) => {
  const {
    activityName,
    identity,
    twitchName,
    twitchID,
    osuID,
    rank,
    time,
    results,
    manualTickets,
    note
  } = req.body;

  if (!activityName) {
    return res.status(400).json({ message: '缺少活動名稱' });
  }
  if (!twitchName || !twitchID || !osuID || !rank || !time) {
    return res.status(400).json({ message: '缺少必要欄位' });
  }
  const finalIdentity = identity || '挑戰者';
  const doc = {
    activityName,
    identity: finalIdentity,
    twitchName: twitchName || '',
    twitchID: twitchID || '',
    osuID: osuID || '',
    rank: rank || '',
    time: time || '',
    results: Array.isArray(results) && results.length === 3 ? results : ['挑戰失敗', '挑戰失敗', '挑戰失敗'],
    reward: 0,
    manualTickets: Number(manualTickets) || 0,
    totalTickets: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    note: note || ''
  };

  try {
    const db = await getDb();
    const result = await db.collection('registrations').insertOne(doc);
    res.json({ message: '報名成功', insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: '報名失敗', error: err.message });
  }
});

// 取得所有報名
app.get('/api/registrations', ensureLogin, async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.collection('registrations').find().toArray();
    rows.sort((a, b) => new Date(a.time) - new Date(b.time));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '讀取失敗', error: err.message });
  }
});

// 計算獎勵
function calcRewardForOne(rank, result) {
  // 自訂計算方式
  if (result === "FC+SS") {
    if (rank === "3Digit") return 8;
    if (rank === "4Digit") return 5;
    if (rank === "5Digit") return 3;
  }
  if (result === "FC") {
    if (rank === "3Digit") return 4;
    if (rank === "4Digit") return 3;
    if (rank === "5Digit") return 2;
  }
  return 0;
}
function calcBestReward(rank, results) {
  const rewards = results.map(r => calcRewardForOne(rank, r));
  return Math.max(...rewards);
}

// 更新報名
app.put('/api/registrations/:id', ensureLogin, async (req, res) => {
  const id = req.params.id;
  const {
    activityName,
    identity,
    twitchName,
    twitchID,
    osuID,
    rank,
    time,
    results,
    manualTickets
  } = req.body;

  try {
    const db = await getDb();
    const orig = await db.collection('registrations').findOne({ _id: new ObjectId(id) });
    if (!orig) {
      return res.status(404).json({ message: '找不到該筆報名' });
    }
    const updateObj = {};
    if (req.session.role === 'full') {
      if (activityName !== undefined) updateObj.activityName = activityName;
      if (identity !== undefined)     updateObj.identity = identity;
      if (twitchName !== undefined)   updateObj.twitchName = twitchName;
      if (twitchID !== undefined)     updateObj.twitchID = twitchID;
      if (osuID !== undefined)        updateObj.osuID = osuID;
      if (rank !== undefined)         updateObj.rank = rank;
      if (time !== undefined)         updateObj.time = time;
      if (Array.isArray(results) && results.length === 3) {
        updateObj.results = results;
      }
      if (manualTickets !== undefined) updateObj.manualTickets = Number(manualTickets) || 0;
    } else {
      // limited：只能改 results
      if (Array.isArray(results) && results.length === 3) {
        updateObj.results = results;
      } else {
        return res.status(403).json({ message: 'limited 權限僅能更新挑戰結果' });
      }
    }
    let needRecalc = false;
    if (updateObj.results !== undefined) needRecalc = true;
    if (updateObj.rank    !== undefined) needRecalc = true;
    if (updateObj.manualTickets !== undefined) needRecalc = true;
    if (needRecalc) {
      const newRank    = updateObj.rank !== undefined ? updateObj.rank : orig.rank;
      const newResults = updateObj.results !== undefined ? updateObj.results : orig.results;
      const bestReward = calcBestReward(newRank, newResults);
      const newManual  = updateObj.manualTickets !== undefined ? updateObj.manualTickets : orig.manualTickets;
      const newTotal   = bestReward + newManual;
      updateObj.reward       = bestReward;
      updateObj.totalTickets = newTotal;
    }
    const result = await db
      .collection('registrations')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateObj });
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: '找不到該筆報名' });
    }
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ message: '更新失敗', error: err.message });
  }
});

// 刪除報名
app.delete('/api/registrations/:id', ensureLogin, ensureFull, async (req, res) => {
  try {
    const db = await getDb();
    const result = await db
      .collection('registrations')
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: '找不到該筆報名' });
    }
    res.json({ message: '刪除成功' });
  } catch (err) {
    res.status(500).json({ message: '刪除失敗', error: err.message });
  }
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
