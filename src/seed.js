import db, { migrate } from './db.js';
import bcrypt from 'bcryptjs';

migrate();

const admin = db.prepare('SELECT * FROM users WHERE username=?').get('admin');
if (!admin) {
  db.prepare('INSERT INTO users(username, password_hash, role) VALUES (?,?,?)')
    .run('admin', bcrypt.hashSync('admin123', 10), 'admin');
}

const sup = db.prepare('SELECT * FROM suppliers WHERE name=?').get('NCC A');
if (!sup) {
  const s1 = db.prepare('INSERT INTO suppliers(name, contact, phone) VALUES (?,?,?)').run('NCC A', 'Ms. Lan', '090000001');
  const s2 = db.prepare('INSERT INTO suppliers(name, contact, phone) VALUES (?,?,?)').run('NCC B', 'Mr. Minh', '090000002');
  db.prepare('INSERT INTO vehicles(plate_number, capacity_weight, driver_name, driver_phone, supplier_id, status) VALUES (?,?,?,?,?,?)')
    .run('51D-123.45', 5000, 'Nguyen Van A', '090111111', s1.lastInsertRowid, 'available');
  db.prepare('INSERT INTO vehicles(plate_number, capacity_weight, driver_name, driver_phone, supplier_id, status) VALUES (?,?,?,?,?,?)')
    .run('51D-678.90', 8000, 'Tran Van B', '090222222', s2.lastInsertRowid, 'available');
}

const c1 = db.prepare('SELECT * FROM customers WHERE name=?').get('Agriwell');
if (!c1) {
  db.prepare('INSERT INTO customers(name, contact, system_url) VALUES (?,?,?)')
    .run('Agriwell', 'anh Hai', 'https://customer.agriwell.example');
}

const orderExists = db.prepare('SELECT * FROM orders WHERE order_no=?').get('ORD-0001');
if (!orderExists) {
  db.prepare(`INSERT INTO orders(order_no, order_date, pickup_location, receiver_name, receiver_phone, receiver_address, goods_detail, weight_kg, volume_cbm, planned_delivery_date, status, customer_id, note)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run('ORD-0001', new Date().toISOString().slice(0,10), 'Kho ABC, HCM', 'Cty XYZ', '090333333', 'Hà Nội', 'Quế, hồi, hạt điều', 3000, 12, new Date(Date.now()+86400000*2).toISOString().slice(0,10), 'accepted', 1, 'Giao gấp');
}

console.log('Seeded.');
