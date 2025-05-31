// dbConnect.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}` +
            `@osu-db.nh5nspe.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

let dbInstance = null;

async function getDb() {
  if (!dbInstance) {
    // 第一次呼叫時才真正連線並指定 db 名稱
    await client.connect();
    dbInstance = client.db(process.env.MONGODB_DBNAME || 'osuDB');  
    console.log('✅ MongoDB connected, using DB:', dbInstance.databaseName);
  }
  return dbInstance;
}

module.exports = getDb;
