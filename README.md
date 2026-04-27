# Frontend

React/Vite client cho Digital Foreman. Tailwind được build local bằng `@tailwindcss/vite`, không dùng CDN runtime.

```bash
npm install
npm run dev
npm run lint
npm run build
```

Biến môi trường local:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Biến môi trường production khi chạy sau Nginx reverse proxy:

```env
VITE_API_BASE_URL=/api
```

Màn hình chính:

- `/auth`: đăng nhập
- `/dashboard`: tổng quan vận hành
- `/assets`: quản lý tài sản
- `/work-orders`: vòng đời Work Order
- `/maintenance`: lịch bảo trì PM
- `/users`: quản lý người dùng cho admin
