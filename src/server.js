import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { expressjwt as jwt } from 'express-jwt';
import db, { migrate } from './db.js';

dotenv.config();

// chạy migrate async trước khi listen
await migrate();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const JWT_SECRET = process.env.JWT_SECRET;

// ---------- helpers ----------
async function addNotification(userId, message) {
  await db.query('INSERT INTO notifications(user_id, message) VALUES ($1, $2)', [userId, message]);
}
app.set('notify', addNotification);

// ---------- routes ----------
import authRoutes from './routes/auth.js';
import ordersRoutes from './routes/orders.js';
import suppliersRoutes from './routes/suppliers.js';
import vehiclesRoutes from './routes/vehicles.js';
import shipmentsRoutes from './routes/shipments.js';
import trackingRoutes from './routes/tracking.js';
import podRoutes from './routes/pod.js';
import costsRoutes from './routes/costs.js';
import invoicesRoutes from './routes/invoices.js';
import notificationsRoutes from './routes/notifications.js';

app.use('/auth', authRoutes);
app.use('/public', (req,res)=> res.json({ok:true}));

app.use(
  jwt({ secret: JWT_SECRET, algorithms: ['HS256'] })
    .unless({ path: ['/auth/login', '/auth/register', '/public'] })
);

// protected routes
app.use('/orders', ordersRoutes);
app.use('/suppliers', suppliersRoutes);
app.use('/vehicles', vehiclesRoutes);
app.use('/shipments', shipmentsRoutes);
app.use('/tracking', trackingRoutes);
app.use('/pod', podRoutes);
app.use('/costs', costsRoutes);
app.use('/invoices', invoicesRoutes);
app.use('/notifications', notificationsRoutes);

// 404
app.use((req,res)=> res.status(404).json({ error: 'Not found' }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log('Logistic backend listening on port', port);
});
