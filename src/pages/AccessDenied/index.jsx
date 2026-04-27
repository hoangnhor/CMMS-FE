import { Link } from "react-router-dom";

function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-[#eef3f8] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined">block</span>
        </div>
        <h1 className="text-2xl font-extrabold text-primary mb-2">Không có quyền truy cập</h1>
        <p className="text-sm text-slate-600 mb-6">
          Tài khoản của bạn không có quyền mở trang này. Vui lòng quay lại trang phù hợp với vai trò của bạn.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary-container text-[#4edea3] font-semibold"
        >
          Quay về Bảng điều khiển
        </Link>
      </div>
    </div>
  );
}

export default AccessDeniedPage;
