import { Router } from 'express';
import db from '../db.js';
import { money } from '../utils.js';

const router = Router();

function calcTotal({ base_fare=0, distance_km=0, weight_kg=0, fuel_surcharge=0, extra_fee=0 }){
  const distanceFee = Number(distance_km) * 0.8; // 0.8 per km
  const weightFee = Number(weight_kg) * 0.05;   // 0.05 per kg
  const total = Number(base_fare) + distanceFee + weightFee + Number(fuel_surcharge) + Number(extra_fee);
  return money(total);
}

router.get('/:shipment_id', (req,res)=> {
  const row = db.prepare('SELECT * FROM costs WHERE shipment_id=?').get(req.params.shipment_id);
  res.json(row || {});
});

router.post('/:shipment_id/calc', (req,res)=> {
  const payload = req.body;
  const total = calcTotal(payload);
  const exists = db.prepare('SELECT id FROM costs WHERE shipment_id=?').get(req.params.shipment_id);
  if (exists) {
    db.prepare('UPDATE costs SET base_fare=?, distance_km=?, weight_kg=?, fuel_surcharge=?, extra_fee=?, total=?, approved=0 WHERE shipment_id=?')
      .run(payload.base_fare||0, payload.distance_km||0, payload.weight_kg||0, payload.fuel_surcharge||0, payload.extra_fee||0, total, req.params.shipment_id);
  } else {
    db.prepare('INSERT INTO costs(shipment_id, base_fare, distance_km, weight_kg, fuel_surcharge, extra_fee, total) VALUES (?,?,?,?,?,?,?)')
      .run(req.params.shipment_id, payload.base_fare||0, payload.distance_km||0, payload.weight_kg||0, payload.fuel_surcharge||0, payload.extra_fee||0, total);
  }
  res.json({ total });
});

router.post('/:shipment_id/review', (req,res)=> {
  const { approved } = req.body;
  db.prepare('UPDATE costs SET approved=?, reviewed_by=?, reviewed_at=datetime("now") WHERE shipment_id=?')
    .run(approved ? 1 : 0, req.auth?.sub || null, req.params.shipment_id);
  res.json({ ok: true });
});

export default router;
