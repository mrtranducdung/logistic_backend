import { Router } from 'express';
import db from '../db.js';

const router = Router();

// --------- Get all orders ----------
router.get('/', async (req,res) => {
  try {
    const result = await db.query('SELECT * FROM orders ORDER BY id DESC');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Get order by id ----------
router.get('/:id', async (req,res) => {
  try {
    const result = await db.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Create new order ----------
router.post('/', async (req,res) => {
  try {
    const o = req.body;
    const result = await db.query(
      `INSERT INTO orders(
        order_no, order_date, pickup_location, receiver_name, receiver_phone, receiver_address,
        goods_detail, weight_kg, volume_cbm, planned_delivery_date, status, customer_id, note
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [
        o.order_no,
        o.order_date,
        o.pickup_location,
        o.receiver_name,
        o.receiver_phone,
        o.receiver_address || '',
        o.goods_detail,
        o.weight_kg || 0,
        o.volume_cbm || 0,
        o.planned_delivery_date,
        'accepted',
        o.customer_id || null,
        o.note || ''
      ]
    );
    res.json({ id: result.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Update order ----------
router.put('/:id', async (req,res) => {
  try {
    const o = req.body;
    await db.query(
      `UPDATE orders SET
        order_no=$1, order_date=$2, pickup_location=$3, receiver_name=$4, receiver_phone=$5, receiver_address=$6,
        goods_detail=$7, weight_kg=$8, volume_cbm=$9, planned_delivery_date=$10, status=$11, customer_id=$12, note=$13
       WHERE id=$14`,
      [
        o.order_no,
        o.order_date,
        o.pickup_location,
        o.receiver_name,
        o.receiver_phone,
        o.receiver_address || '',
        o.goods_detail,
        o.weight_kg || 0,
        o.volume_cbm || 0,
        o.planned_delivery_date,
        o.status || 'accepted',
        o.customer_id || null,
        o.note || '',
        req.params.id
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Reject order ----------
router.post('/:id/reject', async (req,res) => {
  try {
    await db.query('UPDATE orders SET status=$1 WHERE id=$2', ['rejected', req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
