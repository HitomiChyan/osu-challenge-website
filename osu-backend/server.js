require('dotenv').config({ path: './.env' });
console.log("🔍 MONGODB_URI:", process.env.MONGODB_URI); // 測試載入
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 🚀 **使用 `process.env.MONGODB_URI` 直接載入**
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// 🌟 **確保 MongoDB 連線全域管理**
let db;
async function connectDB() {
    if (!db) {
        try {
            await client.connect();
            db = client.db("osuChallengeDB");
            console.log("✅ MongoDB 連線成功！");
        } catch (error) {
            console.error("❌ MongoDB 連線失敗：", error);
            throw error;
        }
    }
    return db;
}

// **載入身份驗證路由**
const authRoutes = require("./auth");
app.use("/auth", authRoutes);

// **登入系統（正式版應使用 JWT）**
const validUsers = [
    { username: "admin", password: "1234" }
];

// **處理 `upload` API**
app.post('/upload', async (req, res) => {
    try {
        const db = await connectDB();
        const collection = db.collection("scores");

        // 🌟 **驗證帳號 & 密碼**
        const userExists = validUsers.find(user => user.username === req.body.username && user.password === req.body.password);
        if (!userExists) {
            return res.status(403).json({ message: "❌ 未授權！請先登入。" });
        }

        // **儲存分數**
        await collection.insertOne({
            username: req.body.username,
            score: req.body.score,
            date: req.body.date
        });

        res.status(200).json({ message: "✅ 成功上傳挑戰結果！" });
    } catch (error) {
        console.error("❌ 伺服器錯誤：", error);
        res.status(500).json({ message: "❌ 伺服器錯誤", error });
    }
}); // 🔹 **這裡補齊 `}`！🚀**

// **處理 `leaderboard` API**
app.get('/leaderboard', async (req, res) => {
    try {
        const db = await connectDB();
        const collection = db.collection("scores");

        // 依照分數排序
        const leaderboard = await collection.find().sort({ score: -1 }).toArray();
        res.status(200).json(leaderboard);
    } catch (error) {
        console.error("