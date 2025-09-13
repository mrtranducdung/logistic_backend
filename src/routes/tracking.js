import { Router } from 'express';
import db from '../db.js';

const router = Router();

// --------- Get tracking events by shipment ----------
router.get('/:shipment_id', async (req,res) => {
  try {
    const result = await db.query(
      'SELECT * FROM tracking_events WHERE shipment_id=$1 ORDER BY event_time ASC',
      [req.params.shipment_id]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Add tracking event ----------
router.post('/:shipment_id/events', async (req,res) => {
  try {
    const { status, location, note, event_time } = req.body;
    const insert = await db.query(
      `INSERT INTO tracking_events(shipment_id, event_time, status, location, note)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [req.params.shipment_id, event_time || new Date().toISOString(), status, location || '', note || '']
    );
    res.json({ id: insert.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Mark shipment as delivered ----------
router.post('/:shipment_id/deliver', async (req,res) => {
  try {
    const { location, note } = req.body;
    await db.query('UPDATE shipments SET status=$1 WHERE id=$2', ['delivered', req.params.shipment_id]);

    await db.query(
      `INSERT INTO tracking_events(shipment_id, event_time, status, location, note)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.params.shipment_id, new Date().toISOString(), 'DELIVERED', location || '', note || '']
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
