import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const dbFile = process.env.DATABASE_FILE || './data/logistic.db';
const dir = path.dirname(dbFile);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const db = new Database(dbFile);

export function migrate() {
  db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin'
  );
  CREATE TABLE IF NOT EXISTS customers(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    system_url TEXT
  );
  CREATE TABLE IF NOT EXISTS suppliers(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    phone TEXT
  );
  CREATE TABLE IF NOT EXISTS vehicles(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT NOT NULL,
    capacity_weight REAL,
    driver_name TEXT,
    driver_phone TEXT,
    supplier_id INTEGER,
    available_from TEXT,
    available_to TEXT,
    status TEXT DEFAULT 'available',
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  );
  CREATE TABLE IF NOT EXISTS orders(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT NOT NULL,
    order_date TEXT NOT NULL,
    pickup_location TEXT NOT NULL,
    receiver_name TEXT NOT NULL,
    receiver_phone TEXT,
    receiver_address TEXT,
    goods_detail TEXT NOT NULL,
    weight_kg REAL DEFAULT 0,
    volume_cbm REAL DEFAULT 0,
    planned_delivery_date TEXT,
    status TEXT DEFAULT 'new', -- new, rejected, accepted, vehicle_assigned, in_transit, delivered, billed
    customer_id INTEGER,
    note TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );
  CREATE TABLE IF NOT EXISTS shipments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    vehicle_id INTEGER,
    waybill_no TEXT UNIQUE,
    loading_date TEXT,
    planned_delivery_date TEXT,
    status TEXT DEFAULT 'created', -- created, assigned, enroute, delivered, pod_uploaded
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );
  CREATE TABLE IF NOT EXISTS tracking_events(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL,
    event_time TEXT NOT NULL,
    status TEXT NOT NULL,
    location TEXT,
    note TEXT,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id)
  );
  CREATE TABLE IF NOT EXISTS pods(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_by INTEGER,
    uploaded_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS costs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL UNIQUE,
    base_fare REAL DEFAULT 0,
    distance_km REAL DEFAULT 0,
    weight_kg REAL DEFAULT 0,
    fuel_surcharge REAL DEFAULT 0,
    extra_fee REAL DEFAULT 0,
    total REAL DEFAULT 0,
    approved INTEGER DEFAULT 0,
    reviewed_by INTEGER,
    reviewed_at TEXT,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS invoices(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL UNIQUE,
    invoice_no TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'issued', -- issued, corrected
    issued_at TEXT DEFAULT (datetime('now')),
    pdf_path TEXT,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id)
  );
  CREATE TABLE IF NOT EXISTS notifications(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    read INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  `);
}

export default db;
