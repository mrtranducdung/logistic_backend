import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../db.js';

const router = Router();

const podDir = path.join(process.cwd(), 'uploads', 'pod');
fs.mkdirSync(podDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function(req, file, cb){ cb(null, podDir); },
  filename: function(req, file, cb){
    const unique = Date.now() + '-' + Math.round(Math.random()*1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/:shipment_id', upload.single('file'), (req,res)=> {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  db.prepare('INSERT INTO pods(shipment_id, file_path, uploaded_by) VALUES (?,?,?)')
    .run(req.params.shipment_id, '/uploads/pod/' + req.file.filename, req.auth?.sub || null);
  db.prepare('UPDATE shipments SET status=? WHERE id=?').run('pod_uploaded', req.params.shipment_id);
  res.json({ ok: true, file: '/uploads/pod/' + req.file.filename });
});

export default router;
