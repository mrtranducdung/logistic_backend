import { customAlphabet } from 'nanoid';

export const genWaybill = () => {
  const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 10);
  return 'WB-' + nanoid();
};

export const genInvoiceNo = () => {
  const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ0123456789', 8);
  return 'INV-' + nanoid();
};

export const money = (n) => Math.round(n * 100) / 100;

export const nowIso = () => new Date().toISOString();
