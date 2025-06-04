// dbConnect.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

// Optional debug flag to print connection details when needed
const DEBUG_DB = process.env.DEBUG_DB === 'true';

// Debug logging of environment variables
if (DEBUG_DB) {
  console.log('--- dbConnect.js 環境變數檢查 ---');
  console.log('MONGODB_USER:', process.env.MONGODB_USER);
  console.log('MONGODB_PASSWORD:', process.env.MONGODB_PASSWORD ? '******' : '(undefined)');
  console.log('MONGODB_DBNAME:', process.env.MONGODB_DBNAME);
  console.log('----------------------------------\n');
}

// 把環境變數組成連線用的 URI
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}` +
            `@osu-db.nh5nspe.mongodb.net/?retryWrites=true&w=majority`;
if (DEBUG_DB) {
  console.log('Generated MongoDB URI:', uri);
}

// 建立 MongoClient
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let dbInstance = null;

async function getDb() {
  if (!dbInstance) {
    try {
      console.log('\n嘗試連線到 MongoDB...');
      await client.connect();
      const dbName = process.env.MONGODB_DBNAME;
      if (!dbName) {
        throw new Error('MONGODB_DBNAME 未設定！');
      }
      dbInstance = client.db(dbName);
      console.log(`✅ MongoDB 連線成功，使用資料庫：${dbInstance.databaseName}\n`);
    } catch (e) {
      console.error('\n❌ 無法連線到 MongoDB：', e.message, '\n');
      throw e;
    }
  }
  return dbInstance;
}

module.exports = getDb;
