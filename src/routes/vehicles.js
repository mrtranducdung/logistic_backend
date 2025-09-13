import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req,res)=> {
  const rows = db.prepare('SELECT v.*, s.name as supplier_name FROM vehicles v LEFT JOIN suppliers s ON v.supplier_id = s.id ORDER BY v.id DESC').all();
  res.json(rows);
});

router.post('/', (req,res)=> {
  const v = req.body;
  const info = db.prepare(`INSERT INTO vehicles(plate_number, capacity_weight, driver_name, driver_phone, supplier_id, available_from, available_to, status)
    VALUES (?,?,?,?,?,?,?,?)`).run(v.plate_number, v.capacity_weight || 0, v.driver_name || '', v.driver_phone || '', v.supplier_id || null, v.available_from || '', v.available_to || '', v.status || 'available');
  res.json({ id: info.lastInsertRowid });
});

router.get('/check', (req,res)=> {
  const { date, min_capacity } = req.query;
  const rows = db.prepare(`SELECT * FROM vehicles WHERE status='available' AND (available_from IS NULL OR available_from<=?) AND (available_to IS NULL OR available_to>=?) AND capacity_weight>=? ORDER BY id DESC`).all(date || '', date || '', min_capacity || 0);
  res.json(rows);
});

export default router;
