# CMMS Frontend

Frontend cho hệ thống CMMS (Asset & Maintenance Management).

- Demo: `https://htcmms.vercel.app/auth`
- Frontend repo: `https://github.com/hoangnhor/CMMS-FE`
- Backend repo: `https://github.com/hoangnhor/CMMS-BE`

## Stack

- React 19 + Vite
- Tailwind CSS 4
- Axios
- React Router
- Zustand
- Socket.IO Client

## Module chính

- Authentication (cookie-based, refresh session)
- Dashboard (KPI + realtime updates)
- Asset Management
- Work Order Management
- Preventive Maintenance
- User Administration

## Chạy local

```bash
npm install
npm run dev
```

Mặc định app chạy tại `http://localhost:5173`.

## Biến môi trường

Tạo `.env` local:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_DEMO_PASSWORD=
```

- `VITE_API_BASE_URL`: URL backend API.
- `VITE_DEMO_PASSWORD`: mật khẩu cho nút đăng nhập nhanh ở trang `/auth`.

Trong production:
- Dùng `VITE_API_BASE_URL=https://your-backend-domain/api`, hoặc
- Dùng `VITE_USE_SAME_ORIGIN_API=true` nếu reverse proxy `/api` cùng domain.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run lint:ci
npm run check:auth-contract
npm run test:ci
npm run test:e2e
npm run test:e2e:local
```

## Luồng auth & security

- Không lưu JWT trong localStorage/sessionStorage.
- Backend set cookie `am_at` (access) + `am_rt` (refresh), FE dùng `withCredentials`.
- Với request `POST/PUT/PATCH/DELETE`, FE tự gửi `x-csrf-token` từ cookie `am_csrf`.
- Khi API trả `401` (trừ nhóm endpoint auth), FE gọi `/auth/refresh` và retry 1 lần.

## Cấu trúc chính

```text
src/
  components/
  hooks/
  pages/
  services/
  store/
  utils/
```
