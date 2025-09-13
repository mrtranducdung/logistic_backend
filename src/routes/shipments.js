import { Router } from 'express';
import db from '../db.js';
import { genWaybill } from '../utils.js';

const router = Router();

// --------- Get all shipments ----------
router.get('/', async (req,res) => {
  try {
    const result = await db.query(`
      SELECT sh.*, o.order_no, v.plate_number 
      FROM shipments sh 
      LEFT JOIN orders o ON o.id = sh.order_id 
      LEFT JOIN vehicles v ON v.id = sh.vehicle_id
      ORDER BY sh.id DESC
    `);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Create shipment ----------
router.post('/', async (req,res) => {
  try {
    const { order_id, vehicle_id, loading_date, planned_delivery_date } = req.body;
    const wb = genWaybill();

    const insert = await db.query(
      `INSERT INTO shipments(order_id, vehicle_id, waybill_no, loading_date, planned_delivery_date, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [order_id, vehicle_id, wb, loading_date || null, planned_delivery_date || null, 'assigned']
    );

    // update order status
    await db.query('UPDATE orders SET status=$1 WHERE id=$2', ['vehicle_assigned', order_id]);

    res.json({ id: insert.rows[0].id, waybill_no: wb });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Get shipment by id ----------
router.get('/:id', async (req,res) => {
  try {
    const result = await db.query('SELECT * FROM shipments WHERE id=$1', [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
