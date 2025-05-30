require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@osu-db.nh5nspe.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

// 假設登入系統（正式版應使用 JWT）
const validUsers = [
    { username: "admin", password: "1234" }
];

app.post('/upload', async (req, res) => {
    try {
        await client.connect();
        const db = client.db("osuChallengeDB");
        const collection = db.collection("scores");

        // 🌟 確保登入者才能上傳
        const userExists = validUsers.find(user => user.username === req.body.username);
        if (!userExists) {
            return res.status(403).json({ message: "❌ 未授權！請先登入。" });
        }

        // 🌟 儲存日期
        await collection.insertOne({
            username: req.body.username,
            score: req.body.score,
            date: req.body.date
        });

        res.status(200).json({ message: "✅ 成功上傳挑戰結果！" });
    } catch (error) {
        res.status(500).json({ message: "❌ 伺服器錯誤", error });
    } finally {
        await client.close();
    }
});

app.get('/leaderboard', async (req, res) => {
    try {
        await client.connect();
        const db = client.db("osuChallengeDB");
        const collection = db.collection("scores");

        // 依照分數排序
        const leaderboard = await collection.find().sort({ score: -1 }).toArray();
        res.status(200).json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: "❌ 伺服器錯誤", error });
    } finally {
        await client.close();
    }
});

app.listen(3000, () => {
    console.log("🚀 伺服器已啟動：http://localhost:3000");
});
