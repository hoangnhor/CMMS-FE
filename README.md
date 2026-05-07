# Frontend - Asset Management

Ứng dụng React + Vite cho hệ thống quản lý tài sản và bảo trì.

## Công nghệ

- React 19
- Vite 8
- React Router 7
- Zustand
- Axios
- Socket.IO Client

## Yêu cầu

- Node.js >= 18
- npm >= 9

## Cài đặt

```bash
npm install
```

## Biến môi trường

Tạo file `.env` trong thư mục `frontend`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Lưu ý:
- Build production bắt buộc phải có `VITE_API_BASE_URL`.
- Hệ thống tự normalize base URL để luôn có hậu tố `/api`.

## Chạy local

```bash
npm run dev
```

Mặc định FE chạy tại `http://localhost:5173`.

## Build production

```bash
npm run build
npm run preview
```

## Lint

```bash
npm run lint
```

## Cấu trúc chính

```text
src/
  components/layout/      # Layout và route guard
  pages/                  # Các màn hình chính
  services/               # API client, realtime
  store/                  # Zustand store
  utils/                  # helper xử lý base URL, format
```

## Các màn hình

- `/auth`: đăng nhập
- `/dashboard`: tổng quan
- `/assets`: quản lý tài sản
- `/work-orders`: quản lý work order
- `/maintenance`: kế hoạch bảo trì PM
- `/users`: quản lý người dùng (admin)

## Realtime

Frontend kết nối Socket.IO qua `src/services/realtime.js`, dùng cùng host backend (lấy từ API base URL).
