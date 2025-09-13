# Logistic Backend (Express + SQLite)

## Chức năng chính
- Đơn hàng, kiểm tra xe, gán nhà cung cấp/xe
- Tạo số waybill, tracking lộ trình
- Giao hàng, upload POD
- Tính chi phí, duyệt chi phí, phát hành hóa đơn (PDF)
- Thông báo tới khách hàng
- Xác thực JWT đơn giản

## Cài đặt
```bash
cd backend
cp .env.example .env
npm install
npm run seed   # khởi tạo DB và dữ liệu mẫu
npm start
```
Mặc định chạy ở `http://localhost:4000`.
Tài khoản mẫu: `admin / admin123`
