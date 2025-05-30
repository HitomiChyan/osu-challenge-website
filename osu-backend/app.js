// app.js
const express = require('express');
const bcrypt  = require('bcrypt');
const fs      = require('fs');
const app     = express();

app.use(express.json());
// 讀 admins.json
const { admins } = JSON.parse(fs.readFileSync('config/admins.json'));

// --- middleware 定義 ---
function ensureLogin(req, res, next) { … }
function ensureFull(req, res, next) { … }

// --- 登入路由 ---
app.post('/api/admin/login', async (req, res) => { … });

// --- 報名表路由 ---
app.get  ('/api/registrations',         ensureLogin,        (req,res)=>{…});
app.put  ('/api/registrations/:id/score', ensureLogin,       (req,res)=>{…});
app.delete('/api/registrations/:id',     ensureLogin, ensureFull, (req,res)=>{…});

// 啟動服務
app.listen(3000, ()=> console.log('Server on port 3000'));
