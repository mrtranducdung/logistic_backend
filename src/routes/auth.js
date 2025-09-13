import { Router } from 'express';
import db from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

router.post('/register', (req,res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const info = db.prepare('INSERT INTO users(username, password_hash, role) VALUES (?,?,?)').run(username, hash, role || 'user');
    res.json({ id: info.lastInsertRowid, username });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/login', (req,res) => {
  const { username, password } = req.body;
  const row = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!row) return res.status(401).json({ error: 'invalid credentials' });
  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ sub: row.id, username: row.username, role: row.role }, process.env.JWT_SECRET || 'dev_secret_change_me', { expiresIn: '7d' });
  res.json({ token, user: { id: row.id, username: row.username, role: row.role } });
});

export default router;
