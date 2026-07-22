const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connectDB = require('../config/db');

const router = express.Router();

// สมัครสมาชิก (เจ้าของสวน)
router.post('/register', async (req, res) => {
  try {
    const { displayName, email, password } = req.body;

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!displayName || !email || !password) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const db = await connectDB();
    const usersCollection = db.collection('users');

    // เช็คว่าอีเมลนี้มีอยู่แล้วหรือยัง
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'อีเมลนี้ถูกใช้สมัครแล้ว' });
    }

    // เข้ารหัสรหัสผ่านก่อนบันทึก (ห้ามเก็บรหัสผ่านตรงๆ เด็ดขาด)
    const password_hash = await bcrypt.hash(password, 10);

    const result = await usersCollection.insertOne({
      display_name: displayName,
      email,
      password_hash,
      role: 'owner',
      created_at: new Date(),
      is_active: true
    });

    res.status(201).json({
      message: 'สมัครสมาชิกสำเร็จ',
      userId: result.insertedId
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่' });
  }
});

// เข้าสู่ระบบ
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const db = await connectDB();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        displayName: user.display_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่' });
  }
});

module.exports = router;
