import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req,res)=> {
  const rows = db.prepare('SELECT * FROM suppliers ORDER BY id DESC').all();
  res.json(rows);
});

router.post('/', (req,res)=> {
  const { name, contact, phone } = req.body;
  const info = db.prepare('INSERT INTO suppliers(name, contact, phone) VALUES (?,?,?)').run(name, contact || '', phone || '');
  res.json({ id: info.lastInsertRowid });
});

export default router;
