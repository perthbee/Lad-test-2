const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());          // อนุญาตให้ frontend (คนละ origin/พอร์ต) เรียก API นี้ได้
app.use(express.json());  // อ่าน JSON body จาก POST request

const client = new MongoClient(process.env.MONGO_URI);
let destinationsCollection;

// เชื่อมต่อ MongoDB ครั้งเดียวตอนเริ่มเซิร์ฟเวอร์ แล้วเก็บ collection ไว้ใช้ซ้ำ
async function connectDB() {
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  destinationsCollection = db.collection(process.env.COLLECTION_NAME);
  console.log(`เชื่อมต่อ MongoDB สำเร็จ -> database: ${process.env.DB_NAME}, collection: ${process.env.COLLECTION_NAME}`);
}

// 3.2.1 GET /api/destinations -> ดึงข้อมูลสถานที่ทั้งหมด
// 3.2.2 GET /api/destinations?category=natural -> กรองตามประเภท (ใช้ query เดียวกัน endpoint เดียวกัน)
app.get('/api/destinations', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};

    const results = await destinationsCollection.find(filter).toArray();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', error: err.message });
  }
});

// 3.2.3 POST /api/destinations -> เพิ่มสถานที่ท่องเที่ยวใหม่
app.post('/api/destinations', async (req, res) => {
  try {
    const { titleeng, titleth, category, description, location, rating } = req.body;

    if (!titleeng || !titleth || !category || !location) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ: titleeng, titleth, category, location' });
    }

    const newDestination = {
      titleeng,
      titleth,
      category,
      description: description || '',
      location,
      rating: Number(rating) || 0,
    };

    const result = await destinationsCollection.insertOne(newDestination);
    res.status(201).json({ message: 'เพิ่มสถานที่ท่องเที่ยวสำเร็จ', insertedId: result.insertedId, data: newDestination });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล', error: err.message });
  }
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`เซิร์ฟเวอร์กำลังทำงานที่ http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('เชื่อมต่อ MongoDB ไม่สำเร็จ:', err.message);
    process.exit(1);
  });
