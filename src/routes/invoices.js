import { Router } from 'express';
import db from '../db.js';
import { genInvoiceNo } from '../utils.js';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const router = Router();

const invDir = path.join(process.cwd(), 'uploads', 'invoices');
fs.mkdirSync(invDir, { recursive: true });

router.get('/', (req,res)=> {
  const rows = db.prepare(`SELECT i.*, sh.waybill_no FROM invoices i 
    LEFT JOIN shipments sh ON sh.id = i.shipment_id
    ORDER BY i.id DESC`).all();
  res.json(rows);
});

router.post('/:shipment_id/generate', (req,res)=> {
  const sh = db.prepare(`SELECT sh.*, o.order_no, o.receiver_name FROM shipments sh LEFT JOIN orders o ON o.id=sh.order_id WHERE sh.id=?`).get(req.params.shipment_id);
  if (!sh) return res.status(404).json({ error: 'shipment not found' });
  const cost = db.prepare('SELECT total FROM costs WHERE shipment_id=?').get(req.params.shipment_id);
  const amount = cost?.total || 0;
  const invoiceNo = genInvoiceNo();
  const pdfPath = path.join(invDir, `${invoiceNo}.pdf`);

  // create PDF
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(pdfPath));
  doc.fontSize(18).text('HÓA ĐƠN VẬN TẢI', { align: 'center' });
  doc.moveDown();
  doc.text(`Số hóa đơn: ${invoiceNo}`);
  doc.text(`Số waybill: ${sh.waybill_no}`);
  doc.text(`Số đơn hàng: ${sh.order_id} / ${sh.order_no || ''}`);
  doc.text(`Người nhận: ${sh.receiver_name || ''}`);
  doc.text(`Ngày phát hành: ${new Date().toISOString()}`);
  doc.moveDown();
  doc.text(`Thành tiền: ${amount} VND`);
  doc.end();

  const info = db.prepare('INSERT INTO invoices(shipment_id, invoice_no, amount, pdf_path) VALUES (?,?,?,?)')
    .run(req.params.shipment_id, invoiceNo, amount, '/uploads/invoices/' + path.basename(pdfPath));

  res.json({ id: info.lastInsertRowid, invoice_no: invoiceNo, pdf: '/uploads/invoices/' + path.basename(pdfPath) });
});

export default router;
