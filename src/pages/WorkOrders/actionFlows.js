import {
  approveCommand,
  completeCommand,
  rejectCommand,
  signOffCommand,
  startCommand,
  submitCommand,
} from "./commands";

export async function submitForApprovalFlow({
  submitModal,
  setSubmitModal,
  closeSubmitModal,
  loadWorkOrders,
}) {
  if (!submitModal.item?._id || submitModal.loading) return;
  try {
    setSubmitModal((prev) => ({ ...prev, loading: true, error: "" }));
    await submitCommand(submitModal.item._id);
    closeSubmitModal();
    await loadWorkOrders();
  } catch (err) {
    setSubmitModal((prev) => ({
      ...prev,
      loading: false,
      error: err?.response?.data?.message || err?.message || "Gửi duyệt thất bại",
    }));
  }
}

export async function approveFlow({ item, payload, loadWorkOrders, showNotice }) {
  try {
    await approveCommand(item._id, payload);
    await loadWorkOrders();
    showNotice("success", "Đã duyệt lệnh công việc.");
    return true;
  } catch (err) {
    showNotice("error", err?.response?.data?.message || err?.message || "Duyệt thất bại");
    return false;
  }
}

export async function rejectFlow({
  rejectModal,
  setRejectModal,
  closeRejectModal,
  loadWorkOrders,
  showNotice,
}) {
  if (!rejectModal.item?._id || rejectModal.loading) return;
  const reason = rejectModal.reason.trim();
  if (!reason) {
    setRejectModal((prev) => ({ ...prev, error: "Vui lòng nhập lý do từ chối." }));
    return;
  }
  try {
    setRejectModal((prev) => ({ ...prev, loading: true, error: "" }));
    await rejectCommand(rejectModal.item._id, { rejectedReason: reason });
    closeRejectModal();
    await loadWorkOrders();
    showNotice("success", "Đã từ chối lệnh công việc.");
  } catch (err) {
    setRejectModal((prev) => ({
      ...prev,
      loading: false,
      error: err?.response?.data?.message || err?.message || "Từ chối thất bại",
    }));
  }
}

export async function startFlow({ id, loadWorkOrders, showNotice }) {
  try {
    await startCommand(id);
    await loadWorkOrders();
    showNotice("success", "Đã bắt đầu lệnh công việc.");
  } catch (err) {
    showNotice("error", err?.response?.data?.message || err?.message || "Bắt đầu thất bại");
  }
}

export async function completeFlow({
  completeModal,
  setCompleteModal,
  closeCompleteModal,
  loadWorkOrders,
  showNotice,
}) {
  if (!completeModal.item?._id || completeModal.loading) return;
  const laborHours = Number(completeModal.laborHours);
  if (Number.isNaN(laborHours) || laborHours < 0) {
    setCompleteModal((prev) => ({ ...prev, error: "Giờ công không hợp lệ." }));
    return;
  }
  try {
    setCompleteModal((prev) => ({ ...prev, loading: true, error: "" }));
    await completeCommand(completeModal.item._id, {
      laborHours,
      findings: completeModal.findings.trim(),
    });
    closeCompleteModal();
    await loadWorkOrders();
    showNotice("success", "Đã hoàn thành lệnh công việc.");
  } catch (err) {
    setCompleteModal((prev) => ({
      ...prev,
      loading: false,
      error: err?.response?.data?.message || err?.message || "Hoàn thành thất bại",
    }));
  }
}

export async function signOffFlow({ id, loadWorkOrders, showNotice }) {
  try {
    await signOffCommand(id, { qcSignOff: true });
    await loadWorkOrders();
    showNotice("success", "Đã sign-off lệnh công việc.");
  } catch (err) {
    showNotice("error", err?.response?.data?.message || err?.message || "Sign-off thất bại");
  }
}
