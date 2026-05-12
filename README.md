# Asset Management Frontend (CMMS)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/State-Zustand-18181B)
![Socket.IO Client](https://img.shields.io/badge/Socket.IO-Client-010101?logo=socketdotio&logoColor=white)

> Product-scale frontend cho CMMS: đồng bộ realtime, trải nghiệm dữ liệu lớn ổn định và luồng thao tác theo role.

- Live Demo: `https://htcmms.vercel.app/auth`
- Related Repositories: `https://github.com/hoangnhor/CMMS-FE` | `https://github.com/hoangnhor/CMMS-BE`

## 🔥 Technical Highlights

1. Role-based UI boundary với route guard và action-level restrictions.
2. Realtime synchronization qua Socket.IO events + debounced refresh.
3. Unified table states (loading/empty/error), responsive table UX.
4. Resilient auth session với Zustand hydrate + auto logout khi API trả 401.

## 📦 State & Data Flow

| Layer | Vai trò |
|---|---|
| `store/authStore` | auth state + session hydrate |
| `services/http` | API wrapper thống nhất response/error |
| `services/realtime` | socket connect/auth/subscribe |
| `hooks/*` | orchestration dữ liệu theo màn hình |
| `pages/*` | business UI flows |

## 🔄 Core Flow

```text
Login -> JWT -> Auth Store -> Protected Routes
Realtime Event -> Debounced Reload -> UI Sync
List Query (paginated, keyword) -> Items + Pagination -> Table States
```

## 🚀 Local Setup

```bash
npm install
npm run dev
```

### `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🔌 API Usage Notes

- FE gọi trực tiếp `VITE_API_BASE_URL`.
- JWT được gắn qua `Authorization: Bearer <token>` trong service layer.
- Nếu backend trả `success=false` hoặc `401`, HTTP layer sẽ normalize lỗi để UI xử lý thống nhất.

## 🧪 Demo Account Notes

- Dùng tài khoản được seed từ backend (`npm run seed` phía backend).
- Không hardcode tài khoản demo trong frontend.

## 🛡️ Frontend Security Checklist

- [ ] `VITE_API_BASE_URL` trỏ đúng HTTPS backend production.
- [ ] Không commit `.env`.
- [ ] Không lưu secret ở frontend env.
- [ ] Verify CORS backend chỉ whitelist frontend domain production.
- [ ] Kiểm tra auto logout khi token hết hạn/không hợp lệ.

## 🚢 Deployment Notes (Vercel)

1. Set `VITE_API_BASE_URL` trong Vercel Project Settings.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Verify sau deploy:
   - Login được
   - Dashboard load dữ liệu
   - Các trang Assets/WO/Maintenance/Users render đúng loading/empty/error state

## ✅ Final Release Checklist

1. `npm run lint` pass.
2. `npm run build` pass.
3. FE kết nối đúng BE domain production.
4. Kiểm tra responsive desktop + mobile các trang chính.
5. Smoke test các flow: login, CRUD cơ bản, realtime refresh.

## 📂 Source Structure

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
└─ utils/
```
