import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req,res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  res.json(rows);
});

router.get('/:id', (req,res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

router.post('/', (req,res) => {
  const o = req.body;
  const stmt = db.prepare(`INSERT INTO orders(
    order_no, order_date, pickup_location, receiver_name, receiver_phone, receiver_address,
    goods_detail, weight_kg, volume_cbm, planned_delivery_date, status, customer_id, note
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const info = stmt.run(
    o.order_no, o.order_date, o.pickup_location, o.receiver_name, o.receiver_phone, o.receiver_address || '',
    o.goods_detail, o.weight_kg || 0, o.volume_cbm || 0, o.planned_delivery_date, 'accepted', o.customer_id || null, o.note || ''
  );
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', (req,res) => {
  const o = req.body;
  const stmt = db.prepare(`UPDATE orders SET
    order_no=?, order_date=?, pickup_location=?, receiver_name=?, receiver_phone=?, receiver_address=?,
    goods_detail=?, weight_kg=?, volume_cbm=?, planned_delivery_date=?, status=?, customer_id=?, note=?
    WHERE id=?`);
  stmt.run(o.order_no, o.order_date, o.pickup_location, o.receiver_name, o.receiver_phone, o.receiver_address || '',
    o.goods_detail, o.weight_kg || 0, o.volume_cbm || 0, o.planned_delivery_date, o.status || 'accepted',
    o.customer_id || null, o.note || '', req.params.id);
  res.json({ ok: true });
});

router.post('/:id/reject', (req,res) => {
  db.prepare('UPDATE orders SET status=? WHERE id=?').run('rejected', req.params.id);
  res.json({ ok: true });
});

export default router;
