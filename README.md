# Asset Management Frontend (CMMS)

Frontend cho hệ thống quản lý tài sản, bảo trì và Work Order trong môi trường nhà máy.

## Highlights

- Role-based UI (admin, site_manager, technician, accountant)
- Realtime dashboard + realtime refresh từ Socket.IO events
- Product-scale list handling: server-side pagination + debounced search
- Smart filters, export CSV, sticky table header, loading/empty states chuẩn hóa
- Auth session management với Zustand (remember me + auto logout khi 401)

## Tech Stack

- React 19
- Vite 8
- React Router 7
- Zustand
- Axios
- Socket.IO Client
- Tailwind CSS 4

## Core Modules

- `/auth`: đăng nhập
- `/dashboard`: KPI vận hành, chart 7 ngày, cảnh báo gần hạn/quá hạn
- `/assets`: quản lý tài sản, lọc nâng cao, CRUD theo quyền
- `/work-orders`: vòng đời Work Order (draft -> submit -> approve/reject -> in_progress -> done -> sign-off)
- `/maintenance`: quản lý lịch PM, theo dõi due status
- `/users`: quản lý người dùng (admin)

## UX/Product Improvements

- Debounced search `300ms`
- Server-side pagination cho list lớn
- Sticky table headers cho bảng chính
- Unified table states (loading / empty / error style)
- KPI skeleton loading cards
- Notice auto-dismiss

## Project Structure

```text
src/
  components/
    layout/               # App shell + route guard
    ui/                   # shared UI states/skeleton
  hooks/                  # custom hooks (dashboard, debounce, ...)
  pages/                  # feature pages
  services/               # API + realtime integration
  store/                  # Zustand auth store
  utils/                  # helpers/parsers
```

## Environment

Tạo `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Notes:
- Production build yêu cầu `VITE_API_BASE_URL`.
- App tự normalize base URL để luôn có hậu tố `/api`.

## Local Setup

```bash
npm install
npm run dev
```

Mặc định chạy tại `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Quality

```bash
npm run lint
```

## Realtime Integration

Client subscribe các event chính:

- `asset.changed`
- `work_order.changed`
- `pm_schedule.changed`
- `maintenance_log.changed`
- `user.changed`

Realtime socket dùng cùng backend host (resolve từ `VITE_API_BASE_URL`).

## API Contract Notes

List endpoints hỗ trợ dạng response phân trang:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "totalPages": 25
    }
  }
}
```

Assets API trả thêm `summary` để render KPI chính xác ở FE.
