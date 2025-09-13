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

// --------- Get cost by shipment_id ----------
router.get('/:shipment_id', async (req,res)=> {
  try {
    const result = await db.query('SELECT * FROM costs WHERE shipment_id=$1', [req.params.shipment_id]);
    res.json(result.rows[0] || {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Calculate or insert/update cost ----------
router.post('/:shipment_id/calc', async (req,res)=> {
  const payload = req.body;
  const total = calcTotal(payload);

  try {
    const existsResult = await db.query('SELECT id FROM costs WHERE shipment_id=$1', [req.params.shipment_id]);
    if (existsResult.rows.length > 0) {
      await db.query(
        `UPDATE costs SET 
          base_fare=$1, distance_km=$2, weight_kg=$3, fuel_surcharge=$4, extra_fee=$5, total=$6, approved=false
         WHERE shipment_id=$7`,
        [
          payload.base_fare||0,
          payload.distance_km||0,
          payload.weight_kg||0,
          payload.fuel_surcharge||0,
          payload.extra_fee||0,
          total,
          req.params.shipment_id
        ]
      );
    } else {
      await db.query(
        `INSERT INTO costs(shipment_id, base_fare, distance_km, weight_kg, fuel_surcharge, extra_fee, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          req.params.shipment_id,
          payload.base_fare||0,
          payload.distance_km||0,
          payload.weight_kg||0,
          payload.fuel_surcharge||0,
          payload.extra_fee||0,
          total
        ]
      );
    }
    res.json({ total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Review cost ----------
router.post('/:shipment_id/review', async (req,res)=> {
  const { approved } = req.body;
  try {
    await db.query(
      'UPDATE costs SET approved=$1, reviewed_by=$2, reviewed_at=NOW() WHERE shipment_id=$3',
      [approved ? true : false, req.auth?.sub || null, req.params.shipment_id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
