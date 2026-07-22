const express = require('express');
const router = express.Router(); // 👈 ประกาศตัวแปร router ที่ขาดไป
const connectDB = require('../config/db');
const upload = require('../middleware/upload');

// 1. เพิ่มข้อมูลสวนใหม่ (POST)
router.post('/gardens', upload.array('images', 10), async (req, res) => {
  try {
    const {
      gardenName,
      description,
      phone,
      facebook,
      lineId,
      addressNo,
      moo,
      soi,
      road,
      subdistrict,
      district,
      province,
      lat,
      lng
    } = req.body;

    if (!gardenName) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อสวน' });
    }

    const imageUrls = (req.files || []).map(file => `/uploads/${file.filename}`);
    const db = await connectDB();
    const gardensCollection = db.collection('orchards');

    const newGarden = {
      garden_name: gardenName,
      description: description || '',
      contact: {
        phone: phone || '',
        facebook: facebook || '',
        line: lineId || ''
      },
      images: imageUrls,
      address: {
        address_no: addressNo || '',
        moo: moo || '',
        soi: soi || '',
        road: road || '',
        subdistrict: subdistrict || '',
        district: district || '',
        province: province || ''
      },
      location: {
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null
      },
      created_at: new Date(),
      is_active: true
    };

    const result = await gardensCollection.insertOne(newGarden);

    res.status(201).json({
      message: 'บันทึกข้อมูลสวนสำเร็จ',
      gardenId: result.insertedId
    });
  } catch (err) {
    console.error('Create garden error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่' });
  }
});

// 2. ดึงรายชื่อสวนทั้งหมด (GET)
router.get('/gardens', async (req, res) => {
  try {
    const db = await connectDB();
    const gardensCollection = db.collection('orchards');

    const gardens = await gardensCollection
      .find({ is_active: true })
      .sort({ created_at: -1 })
      .toArray();

    res.json({ gardens });
  } catch (err) {
    console.error('Get gardens error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่' });
  }
});

// 3. ดึงข้อมูลสวนตาม ID (GET /:id)
router.get('/gardens/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const db = await connectDB();
    const gardensCollection = db.collection('orchards');

    const garden = await gardensCollection.findOne({ _id: new ObjectId(req.params.id) });

    if (!garden) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลสวนนี้' });
    }

    res.json({ garden });
  } catch (err) {
    console.error('Get garden error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่' });
  }
});

// 4. แก้ไข/อัปเดตข้อมูลสวน (PUT /:id)
router.put('/gardens/:id', upload.array('images', 10), async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const db = await connectDB();
    const gardensCollection = db.collection('orchards');

    const {
      gardenName,
      description,
      phone,
      facebook,
      lineId,
      addressNo,
      moo,
      soi,
      road,
      subdistrict,
      district,
      province,
      lat,
      lng
    } = req.body;

    if (!gardenName) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อสวน' });
    }

    const updateFields = {
      garden_name: gardenName,
      description: description || '',
      'contact.phone': phone || '',
      'contact.facebook': facebook || '',
      'contact.line': lineId || '',
      'address.address_no': addressNo || '',
      'address.moo': moo || '',
      'address.soi': soi || '',
      'address.road': road || '',
      'address.subdistrict': subdistrict || '',
      'address.district': district || '',
      'address.province': province || '',
      'location.lat': lat ? parseFloat(lat) : null,
      'location.lng': lng ? parseFloat(lng) : null,
      updated_at: new Date()
    };

    if (req.files && req.files.length > 0) {
      const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
      updateFields.images = imageUrls;
    }

    const result = await gardensCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลสวนที่ต้องการแก้ไข' });
    }

    res.status(200).json({
      message: 'แก้ไขข้อมูลสวนสำเร็จ',
      gardenId: req.params.id
    });

  } catch (err) {
    console.error('Update garden error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล กรุณาลองใหม่' });
  }
});

module.exports = router;