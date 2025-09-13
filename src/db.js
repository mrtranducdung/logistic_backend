import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // bắt buộc nếu kết nối external (local hoặc bất kỳ host nào)
});

export async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin'
      );

      CREATE TABLE IF NOT EXISTS customers(
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        contact TEXT,
        system_url TEXT
      );

      CREATE TABLE IF NOT EXISTS suppliers(
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        contact TEXT,
        phone TEXT
      );

      CREATE TABLE IF NOT EXISTS vehicles(
        id SERIAL PRIMARY KEY,
        plate_number TEXT NOT NULL,
        capacity_weight REAL,
        driver_name TEXT,
        driver_phone TEXT,
        supplier_id INTEGER REFERENCES suppliers(id),
        available_from TEXT,
        available_to TEXT,
        status TEXT DEFAULT 'available'
      );

      CREATE TABLE IF NOT EXISTS orders(
        id SERIAL PRIMARY KEY,
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
        status TEXT DEFAULT 'new',
        customer_id INTEGER REFERENCES customers(id),
        note TEXT
      );

      CREATE TABLE IF NOT EXISTS shipments(
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        vehicle_id INTEGER REFERENCES vehicles(id),
        waybill_no TEXT UNIQUE,
        loading_date TEXT,
        planned_delivery_date TEXT,
        status TEXT DEFAULT 'created',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tracking_events(
        id SERIAL PRIMARY KEY,
        shipment_id INTEGER NOT NULL REFERENCES shipments(id),
        event_time TEXT NOT NULL,
        status TEXT NOT NULL,
        location TEXT,
        note TEXT
      );

      CREATE TABLE IF NOT EXISTS pods(
        id SERIAL PRIMARY KEY,
        shipment_id INTEGER NOT NULL REFERENCES shipments(id),
        file_path TEXT NOT NULL,
        uploaded_by INTEGER REFERENCES users(id),
        uploaded_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS costs(
        id SERIAL PRIMARY KEY,
        shipment_id INTEGER UNIQUE NOT NULL REFERENCES shipments(id),
        base_fare REAL DEFAULT 0,
        distance_km REAL DEFAULT 0,
        weight_kg REAL DEFAULT 0,
        fuel_surcharge REAL DEFAULT 0,
        extra_fee REAL DEFAULT 0,
        total REAL DEFAULT 0,
        approved BOOLEAN DEFAULT false,
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS invoices(
        id SERIAL PRIMARY KEY,
        shipment_id INTEGER UNIQUE NOT NULL REFERENCES shipments(id),
        invoice_no TEXT UNIQUE NOT NULL,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'issued',
        issued_at TIMESTAMP DEFAULT NOW(),
        pdf_path TEXT
      );

      CREATE TABLE IF NOT EXISTS notifications(
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        read BOOLEAN DEFAULT false
      );
    `);
    console.log('Migration done');
  } finally {
    client.release();
  }
}

export default pool;
