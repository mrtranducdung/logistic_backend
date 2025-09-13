import { Router } from 'express';
import db from '../db.js';
import { genWaybill } from '../utils.js';

const router = Router();

router.get('/', (req,res)=> {
  const rows = db.prepare(`SELECT sh.*, o.order_no, v.plate_number FROM shipments sh 
    LEFT JOIN orders o ON o.id = sh.order_id 
    LEFT JOIN vehicles v ON v.id = sh.vehicle_id
    ORDER BY sh.id DESC`).all();
  res.json(rows);
});

router.post('/', (req,res)=> {
  const { order_id, vehicle_id, loading_date, planned_delivery_date } = req.body;
  const wb = genWaybill();
  const info = db.prepare(`INSERT INTO shipments(order_id, vehicle_id, waybill_no, loading_date, planned_delivery_date, status) 
    VALUES (?,?,?,?,?,?)`).run(order_id, vehicle_id, wb, loading_date || null, planned_delivery_date || null, 'assigned');
  // update order status
  db.prepare('UPDATE orders SET status=? WHERE id=?').run('vehicle_assigned', order_id);
  res.json({ id: info.lastInsertRowid, waybill_no: wb });
});

router.get('/:id', (req,res)=> {
  const row = db.prepare('SELECT * FROM shipments WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

export default router;
