import { Router } from 'express';
import db from '../db.js';

const router = Router();

// --------- Get all suppliers ----------
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM suppliers ORDER BY id DESC');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Create supplier ----------
router.post('/', async (req, res) => {
  try {
    const { name, contact, phone } = req.body;
    const insert = await db.query(
      'INSERT INTO suppliers(name, contact, phone) VALUES ($1,$2,$3) RETURNING id',
      [name, contact || '', phone || '']
    );
    res.json({ id: insert.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
