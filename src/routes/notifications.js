import { Router } from 'express';
import db from '../db.js';

const router = Router();

// --------- Get notifications ----------
router.get('/', async (req,res)=> {
  try {
    const userId = req.auth?.sub || null;
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id IS NULL OR user_id=$1 ORDER BY id DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
