import { Router } from 'express';
import db from '../db.js';

const router = Router();

// --------- Get all vehicles ----------
router.get('/', async (req,res) => {
  try {
    const result = await db.query(
      `SELECT v.*, s.name as supplier_name 
       FROM vehicles v 
       LEFT JOIN suppliers s ON v.supplier_id = s.id 
       ORDER BY v.id DESC`
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Create new vehicle ----------
router.post('/', async (req,res) => {
  try {
    const v = req.body;
    const insert = await db.query(
      `INSERT INTO vehicles(plate_number, capacity_weight, driver_name, driver_phone, supplier_id, available_from, available_to, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [
        v.plate_number,
        v.capacity_weight || 0,
        v.driver_name || '',
        v.driver_phone || '',
        v.supplier_id || null,
        v.available_from || null,
        v.available_to || null,
        v.status || 'available'
      ]
    );
    res.json({ id: insert.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Check available vehicles ----------
router.get('/check', async (req,res) => {
  try {
    const { date, min_capacity } = req.query;
    const result = await db.query(
      `SELECT * FROM vehicles 
       WHERE status='available' 
         AND (available_from IS NULL OR available_from <= $1) 
         AND (available_to IS NULL OR available_to >= $2) 
         AND capacity_weight >= $3
       ORDER BY id DESC`,
      [date || null, date || null, min_capacity || 0]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
