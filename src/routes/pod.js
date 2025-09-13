import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../db.js';

const router = Router();

const podDir = path.join(process.cwd(), 'uploads', 'pod');
fs.mkdirSync(podDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, podDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random()*1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// --------- Upload POD ----------
router.post('/:shipment_id', upload.single('file'), async (req,res)=> {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });

    const filePath = '/uploads/pod/' + req.file.filename;

    await db.query(
      'INSERT INTO pods(shipment_id, file_path, uploaded_by) VALUES ($1,$2,$3)',
      [req.params.shipment_id, filePath, req.auth?.sub || null]
    );

    await db.query('UPDATE shipments SET status=$1 WHERE id=$2', ['pod_uploaded', req.params.shipment_id]);

    res.json({ ok: true, file: filePath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
