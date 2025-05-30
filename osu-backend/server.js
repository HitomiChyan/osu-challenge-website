require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 🚀 **改進：使用 `process.env.MONGODB_URI` 直接載入**
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// 🌟 **改進：確保 MongoDB 連線全域管理**
let db;
async function connectDB() {
    if (!db) {
        await client.connect();
        db = client.db("osuChallengeDB");
        console.log("✅ MongoDB 連線成功！");
    }
    return db;
}

// 假設登入系統（正式版應使用 JWT）
const validUsers = [
    { username: "admin", password: "1234" }
];

app.post('/upload', async (req, res) => {
    try {
        const db = await connectDB();
        const collection = db.collection("scores");

        // 🌟 **確保帳號 & 密碼都正確**
        const userExists = validUsers.find(user => user.username === req.body.username && user.password === req.body.password);
        if (!userExists) {
            return res.status(403).json({ message: "❌ 未授權！請先登入。" });
        }

