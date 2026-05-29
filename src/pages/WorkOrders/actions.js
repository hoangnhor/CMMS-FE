import {
  createCommand,
  detailCommand,
  updateCommand,
} from "./commands";
import {
  approveFlow,
  completeFlow,
  rejectFlow,
  signOffFlow,
  startFlow,
  submitForApprovalFlow,
} from "./actionFlows";
import {
  buildApproveModal,
  buildCompleteModal,
  buildCreateWorkOrderForm,
  buildEditWorkOrderModal,
  buildRejectModal,
  buildSubmitModal,
} from "./helpers";

export function buildWorkOrderPageActions(ctx) {
  const {
    user,
    canCreateWorkOrder,
    assets,
    technicians,
    loadWorkOrders,
    submitModal,
    setSubmitModal,
    approveModal,
    setApproveModal,
    rejectModal,
    setRejectModal,
    completeModal,
    setCompleteModal,
    editModal,
    setEditModal,
    createForm,
    setCreateForm,
    setCreateError,
    setCreateLoading,
    setShowCreateModal,
    setNotice,
    setActionModal,
    setModalLoading,
    setModalError,
  } = ctx;

  const showNotice = (type, text) => {
    setNotice({ type, text });
  };

  const openSubmitModal = (item) => {
    setSubmitModal({ ...buildSubmitModal(item), open: true });
  };

  const closeSubmitModal = () => {
    setSubmitModal(buildSubmitModal());
  };

  const submitForApproval = async () => {
    await submitForApprovalFlow({
      submitModal,
      setSubmitModal,
      closeSubmitModal,
      loadWorkOrders,
    });
  };

  const approve = async (item, assignedTo = null) => {
    const payload = {};
    if (item.priority !== "urgent") {
      payload.assignedTo = assignedTo || user?._id;
    }
    return approveFlow({ item, payload, loadWorkOrders, showNotice });
  };

  const openApproveModal = (item) => {
    if (user?.role === "admin" && item?.priority !== "urgent") {
      setApproveModal({
        ...buildApproveModal(item, technicians[0]?._id || ""),
        open: true,
        assignedTo: technicians[0]?._id || "",
      });
      return;
    }
    approve(item);
  };

  const closeApproveModal = () => {
    setApproveModal(buildApproveModal());
  };

  const submitApproveModal = async () => {
    if (!approveModal.item?._id || approveModal.loading) return;
    if (!approveModal.assignedTo) {
      setApproveModal((prev) => ({ ...prev, error: "Vui lòng chọn kỹ thuật viên." }));
      return;
    }
    try {
      setApproveModal((prev) => ({ ...prev, loading: true, error: "" }));
      const ok = await approve(approveModal.item, approveModal.assignedTo);
      if (ok) {
        closeApproveModal();
      } else {
        setApproveModal((prev) => ({ ...prev, loading: false, error: "Không thể duyệt lệnh. Vui lòng kiểm tra lại." }));
      }
    } catch {
      setApproveModal((prev) => ({ ...prev, loading: false, error: "Duyệt thất bại." }));
    }
  };

  const openRejectModal = (item) => {
    setRejectModal({ ...buildRejectModal(item), open: true });
  };

  const closeRejectModal = () => {
    setRejectModal(buildRejectModal());
  };

  const submitRejectModal = async () => {
    await rejectFlow({
      rejectModal,
      setRejectModal,
      closeRejectModal,
      loadWorkOrders,
      showNotice,
    });
  };

  const start = async (id) => {
    await startFlow({ id, loadWorkOrders, showNotice });
  };

  const openCompleteModal = (item) => {
    setCompleteModal({ ...buildCompleteModal(item), open: true });
  };

  const closeCompleteModal = () => {
    setCompleteModal(buildCompleteModal());
  };

  const submitCompleteModal = async () => {
    await completeFlow({
      completeModal,
      setCompleteModal,
      closeCompleteModal,
      loadWorkOrders,
      showNotice,
    });
  };

  const signOff = async (id) => {
    await signOffFlow({ id, loadWorkOrders, showNotice });
  };

  const openEditModal = (item) => {
    setEditModal({ ...buildEditWorkOrderModal(item), open: true });
  };

  const closeEditModal = () => {
    setEditModal(buildEditWorkOrderModal());
  };

  const submitEditModal = async () => {
    if (!editModal.item?._id || editModal.loading) return;
    if (!editModal.form.assetId) {
      setEditModal((prev) => ({ ...prev, error: "Vui lòng chọn tài sản." }));
      return;
    }
    try {
      setEditModal((prev) => ({ ...prev, loading: true, error: "" }));
      await updateCommand(editModal.item._id, {
        assetId: editModal.form.assetId,
        woType: editModal.form.woType,
        triggerSource: editModal.form.triggerSource,
        priority: editModal.form.priority,
        scheduledDate: editModal.form.scheduledDate ? new Date(editModal.form.scheduledDate).toISOString() : null,
      });
      closeEditModal();
      await loadWorkOrders();
    } catch (err) {
      setEditModal((prev) => ({
        ...prev,
        loading: false,
        error: err?.response?.data?.message || err?.message || "Sửa Work Order thất bại",
      }));
    }
  };

  const openDetail = async (item) => {
    try {
      setModalError("");
      setModalLoading(true);
      const res = await detailCommand(item._id);
      setActionModal({ mode: "view", wo: res?.data || null });
    } catch (err) {
      setModalError(err?.response?.data?.message || err?.message || "Không tải được chi tiết Work Order.");
      setActionModal({ mode: "view", wo: null });
    } finally {
      setModalLoading(false);
    }
  };

  const closeActionModal = () => {
    setActionModal(null);
    setModalLoading(false);
    setModalError("");
  };

  const openCreate = () => {
    if (!canCreateWorkOrder) {
      setCreateError("Bạn không có quyền tạo lệnh công việc.");
      return;
    }
    setCreateError("");
    setCreateForm({ ...buildCreateWorkOrderForm(), assetId: assets[0]?._id || "" });
    setShowCreateModal(true);
  };

  const createWorkOrder = async () => {
    if (!createForm.assetId) {
      setCreateError("Vui lòng chọn tài sản");
      return;
    }
    try {
      setCreateLoading(true);
      setCreateError("");
      await createCommand({
        assetId: createForm.assetId,
        woType: createForm.woType,
        triggerSource: createForm.triggerSource,
        priority: createForm.priority,
        scheduledDate: createForm.scheduledDate ? new Date(createForm.scheduledDate).toISOString() : null,
      });
      setShowCreateModal(false);
      await loadWorkOrders();
    } catch (err) {
      setCreateError(err?.response?.data?.message || err?.message || "Tạo lệnh thất bại");
    } finally {
      setCreateLoading(false);
    }
  };

  return {
    openSubmitModal,
    closeSubmitModal,
    submitForApproval,
    openApproveModal,
    closeApproveModal,
    submitApproveModal,
    openRejectModal,
    closeRejectModal,
    submitRejectModal,
    start,
    openCompleteModal,
    closeCompleteModal,
    submitCompleteModal,
    signOff,
    openEditModal,
    closeEditModal,
    submitEditModal,
    openDetail,
    closeActionModal,
    openCreate,
    createWorkOrder,
    showNotice,
  };
}
