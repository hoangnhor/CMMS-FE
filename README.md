# CMMS Frontend (Asset Management)

Frontend cho hệ thống CMMS. Tập trung vào workflow theo role, realtime dashboard và auth cookie-based.

- Demo: `https://htcmms.vercel.app/auth`
- FE Repo: `https://github.com/hoangnhor/CMMS-FE`
- BE Repo: `https://github.com/hoangnhor/CMMS-BE`

## Tech Stack (Core)

- React.js
- Tailwind CSS
- Node.js ecosystem (Vite)
- Socket.IO Client
- JWT cookie-based session

## Features

- Đăng nhập/đăng xuất với access + refresh cookie (`withCredentials`)
- Route guard theo role
- Dashboard realtime qua Socket.IO
- Quản lý Asset / Work Order / Preventive Maintenance / User
- Session refresh tự động khi gặp 401 (retry 1 lần trước khi logout)
- CSRF header tự động cho các request thay đổi dữ liệu

## Local Setup

```bash
npm install
npm run dev
```

## Environment

Tạo file `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_DEMO_PASSWORD=password123
```

Ghi chú:
- `VITE_DEMO_PASSWORD` dùng cho nút đăng nhập nhanh ở trang `/auth`.
- Không commit `.env`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run test:e2e
npm run test:e2e:local
npm run check:auth-contract
```

## Auth & Security Notes

- FE không lưu JWT trong localStorage/sessionStorage.
- Token nằm trong httpOnly cookie do backend set.
- FE gửi CSRF token qua header `x-csrf-token` cho method `POST/PUT/PATCH/DELETE`.
- Khi API trả 401:
  - Nếu là endpoint thường: thử `/auth/refresh` rồi retry request.
  - Nếu refresh fail: logout.

## E2E Test Notes

- File test chính: `tests/smoke.spec.js`
- Có thể override API base cho E2E:

```bash
E2E_API_BASE_URL=http://localhost:5000/api npm run test:e2e
```

## Build & Deploy

- Build: `npm run build`
- Output: `dist`
- Deploy: Vercel (khuyến nghị)
- Cần set env production tương ứng:
  - `VITE_API_BASE_URL` hoặc `VITE_USE_SAME_ORIGIN_API=true` (nếu dùng reverse proxy `/api`)

## Project Structure

```text
src/
├─ components/
├─ hooks/
├─ pages/
├─ services/
├─ store/
└─ utils/
```
