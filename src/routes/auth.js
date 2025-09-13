import { Router } from 'express';
import db from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// --------- Register ----------
router.post('/register', async (req,res) => {
  const { username, password, role } = req.body;
  if (!username || !password) 
    return res.status(400).json({ error: 'username and password required' });

  const hash = bcrypt.hashSync(password, 10);

  try {
    const result = await db.query(
      'INSERT INTO users(username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hash, role || 'user']
    );
    const user = result.rows[0];
    res.json({ id: user.id, username: user.username, role: user.role });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// --------- Login ----------
router.post('/login', async (req,res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE username=$1', [username]);
    const row = result.rows[0];
    if (!row) return res.status(401).json({ error: 'invalid credentials' });

    const ok = bcrypt.compareSync(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign(
      { sub: row.id, username: row.username, role: row.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: row.id, username: row.username, role: row.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
