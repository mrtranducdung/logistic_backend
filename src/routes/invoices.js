import { Router } from 'express';
import db from '../db.js';
import { genInvoiceNo } from '../utils.js';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const router = Router();

const invDir = path.join(process.cwd(), 'uploads', 'invoices');
fs.mkdirSync(invDir, { recursive: true });

// --------- Get all invoices ----------
router.get('/', async (req,res)=> {
  try {
    const result = await db.query(`
      SELECT i.*, sh.waybill_no 
      FROM invoices i
      LEFT JOIN shipments sh ON sh.id = i.shipment_id
      ORDER BY i.id DESC
    `);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------- Generate invoice ----------
router.post('/:shipment_id/generate', async (req,res)=> {
  try {
    const shRes = await db.query(`
      SELECT sh.*, o.order_no, o.receiver_name 
      FROM shipments sh 
      LEFT JOIN orders o ON o.id = sh.order_id 
      WHERE sh.id=$1
    `, [req.params.shipment_id]);
    const sh = shRes.rows[0];
    if (!sh) return res.status(404).json({ error: 'shipment not found' });

    const costRes = await db.query('SELECT total FROM costs WHERE shipment_id=$1', [req.params.shipment_id]);
    const amount = costRes.rows[0]?.total || 0;

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

    const insertRes = await db.query(
      `INSERT INTO invoices(shipment_id, invoice_no, amount, pdf_path) 
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [req.params.shipment_id, invoiceNo, amount, '/uploads/invoices/' + path.basename(pdfPath)]
    );

    const id = insertRes.rows[0].id;
    res.json({ id, invoice_no: invoiceNo, pdf: '/uploads/invoices/' + path.basename(pdfPath) });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
