import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req,res)=> {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id IS NULL OR user_id=? ORDER BY id DESC').all(req.auth?.sub || null);
  res.json(rows);
});

export default router;
