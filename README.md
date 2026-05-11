# Asset Management Frontend (CMMS)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/State-Zustand-18181B)
![Socket.IO Client](https://img.shields.io/badge/Socket.IO-Client-010101?logo=socketdotio&logoColor=white)
![Axios](https://img.shields.io/badge/HTTP-Axios-5A29E4)

> Frontend CMMS theo hướng product-scale: realtime vận hành, role-based experience, và trải nghiệm dữ liệu lớn ổn định cho môi trường nhà máy.

- Live Demo: `[TODO: add URL]`
- Related Repositories: `[TODO: FE repo]` | `[TODO: BE repo]`

## 🔥 Điểm sáng Kỹ thuật (Technical Highlights)

1. **Role-based UI Boundary**
   - Guard route theo role (`admin`, `site_manager`, `technician`, `accountant`).
   - Điều hướng và hành động được khóa theo quyền, không chỉ ẩn UI.

2. **Realtime Data Synchronization**
   - Subscribe domain events từ Socket.IO (`asset/work_order/pm_schedule/maintenance_log/user`).
   - Refresh có debounce để giảm jitter và tránh request burst.

3. **Product-scale List UX**
   - Server-side pagination + debounced search (300ms).
   - Sticky table headers, unified loading/empty states, KPI skeleton cards.

4. **Resilient Auth Session Management**
   - Zustand hydrate session từ local/session storage.
   - Axios interceptor auto-logout khi token invalid (401).

## 📦 Cấu trúc State/Luồng dữ liệu

| Layer | Vai trò | Ghi chú |
|---|---|---|
| `store/authStore` | Auth state + hydration | token/user + remember me |
| `services/http` | API abstraction | unwrap response thống nhất |
| `services/realtime` | Socket lifecycle | JWT handshake + subscribe/unsubscribe |
| `hooks/*` | Data orchestration | dashboard/assets/work-orders flow |
| `pages/*` | Screen-level logic | tách action/helpers/usePage |

## 🔄 Luồng nghiệp vụ cốt lõi (Core Flow)

```text
[Login]
  -> POST /api/auth/login
  -> setAuth(token, user)
  -> route guard mở quyền theo role

[Realtime Update]
  -> socket event (work_order.changed, ...)
  -> debounced refresh in hooks
  -> table/KPI cập nhật đồng bộ

[List Page]
  -> query: paginated=true&page=&limit=&keyword=
  -> render items + pagination metadata
  -> UX states: skeleton/loading/empty/error
```

## 🚀 Cài đặt & Khởi chạy (Local Development)

```bash
npm install
npm run dev
```

### `.env`

```env
VITE_API_BASE_URL=
```

### Lệnh chính

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## 📂 Cấu trúc mã nguồn (Folder Structure)

```text
src/
├─ assets/                  # static assets
├─ components/
│  ├─ layout/               # App shell + private route
│  └─ ui/                   # shared table states / skeletons
├─ hooks/                   # useDashboard, useDebouncedValue, ...
├─ pages/                   # Auth, Dashboard, Assets, WorkOrders, Maintenance, Users
├─ services/                # api/http/realtime layer
├─ store/                   # Zustand auth store
├─ styles/                  # global style tokens
└─ utils/                   # mappers, parsers, formatters
```
