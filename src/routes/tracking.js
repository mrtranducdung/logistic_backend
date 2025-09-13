import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/:shipment_id', (req,res)=> {
  const events = db.prepare('SELECT * FROM tracking_events WHERE shipment_id=? ORDER BY event_time ASC').all(req.params.shipment_id);
  res.json(events);
});

router.post('/:shipment_id/events', (req,res)=> {
  const { status, location, note, event_time } = req.body;
  const info = db.prepare('INSERT INTO tracking_events(shipment_id, event_time, status, location, note) VALUES (?,?,?,?,?)')
    .run(req.params.shipment_id, event_time || new Date().toISOString(), status, location || '', note || '');
  res.json({ id: info.lastInsertRowid });
});

router.post('/:shipment_id/deliver', (req,res)=> {
  const { location, note } = req.body;
  db.prepare('UPDATE shipments SET status=? WHERE id=?').run('delivered', req.params.shipment_id);
  db.prepare('INSERT INTO tracking_events(shipment_id, event_time, status, location, note) VALUES (?,?,?,?,?)')
    .run(req.params.shipment_id, new Date().toISOString(), 'DELIVERED', location || '', note || '');
  res.json({ ok: true });
});

export default router;
