import fetch from 'node-fetch';
import db from './src/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// 1️⃣ Tạo user admin nếu chưa có
function createAdminUser() {
  const exists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!exists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users(username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
    console.log('Admin user created: username=admin, password=admin123');
  } else {
    console.log('Admin user already exists');
  }
}

// 2️⃣ Login để lấy token
async function login() {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  const passwordCorrect = bcrypt.compareSync('admin123', user.password_hash);
  if (!passwordCorrect) throw new Error('Wrong password');

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
  console.log('Generated JWT token:', token);
  return token;
}

// 3️⃣ Gọi thử route protected /orders
async function testProtectedRoute(token) {
  const res = await fetch('http://localhost:4000/orders', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  console.log('/orders response:', data);
}

async function main() {
  createAdminUser();
  const token = await login();
  await testProtectedRoute(token);
}

main().catch(console.error);
