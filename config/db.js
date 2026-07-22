const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

const client = new MongoClient(uri);

let db;

async function connectDB() {
  if (db) return db; // ถ้าเชื่อมแล้ว ใช้ตัวเดิมซ้ำ ไม่ต้องเชื่อมใหม่

  try {
    await client.connect();
    db = client.db(dbName);
    console.log(`✅ เชื่อมต่อ MongoDB สำเร็จ (database: ${dbName})`);
    return db;
  } catch (err) {
    console.error('❌ เชื่อมต่อ MongoDB ไม่สำเร็จ:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
