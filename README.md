# Asset Management Frontend (CMMS)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/State-Zustand-18181B)
![Socket.IO Client](https://img.shields.io/badge/Socket.IO-Client-010101?logo=socketdotio&logoColor=white)

> Product-scale frontend cho CMMS: đồng bộ realtime, trải nghiệm dữ liệu lớn ổn định và luồng thao tác theo role.

- Live Demo: `[TODO]`
- Related Repositories: `[TODO: FE repo]` | `[TODO: BE repo]`

## 🔥 Điểm sáng Kỹ thuật (Technical Highlights)

1. Role-based UI boundary với route guard và action-level restrictions.
2. Realtime synchronization qua Socket.IO events + debounced refresh.
3. Product list UX: server-side pagination, sticky header, unified loading/empty states, KPI skeleton.
4. Resilient auth session với Zustand hydrate + auto logout khi API trả 401.

## 📦 Cấu trúc State/Luồng dữ liệu

| Layer | Vai trò |
|---|---|
| `store/authStore` | auth state + session hydrate |
| `services/http` | API wrapper thống nhất response |
| `services/realtime` | socket connect/auth/subscribe |
| `hooks/*` | orchestration dữ liệu theo màn hình |
| `pages/*` | business UI flows |

## 🔄 Luồng nghiệp vụ cốt lõi (Core Flow)

```text
Login -> JWT -> Auth Store -> Protected Routes
Realtime Event -> Debounced Reload -> UI Sync
List Query (paginated, keyword) -> Items + Pagination -> Table States
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
├─ assets/
├─ components/
│  ├─ layout/
│  └─ ui/
├─ hooks/
├─ pages/
├─ services/
├─ store/
├─ styles/
└─ utils/
```
