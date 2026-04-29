import {
  createAssetApi,
  deleteAssetApi,
  getAssetByIdApi,
  updateAssetApi,
} from "../../services/asset.api";
import {
  buildCreateAssetForm,
  parseCurrencyToNumber,
} from "./helpers";

export function buildAssetPageActions(ctx) {
  const {
    canManageAssets,
    setAssets,
    setNotice,
    setModalError,
    setModalLoading,
    setActionModal,
    setCreateError,
    setCreateLoading,
    setCreateForm,
    setShowCreateModal,
    deleteModal,
    setDeleteModal,
    editForm,
    setEditForm,
    actionModal,
    createForm,
  } = ctx;

  const showNotice = (type, text) => {
    setNotice({ type, text });
  };

  const upsertLocalAsset = (updatedAsset) => {
    setAssets((prev) =>
      prev.map((item) => (item._id === updatedAsset._id ? { ...item, ...updatedAsset } : item))
    );
  };

  const openCreateModal = () => {
    if (!canManageAssets) {
      showNotice("error", "Bạn không có quyền thêm tài sản.");
      return;
    }
    setCreateError("");
    setCreateLoading(false);
    setCreateForm(buildCreateAssetForm());
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateError("");
    setCreateLoading(false);
  };

  const closeActionModal = () => {
    setActionModal(null);
    setModalError("");
    setModalLoading(false);
  };

  const openViewModal = async (id) => {
    try {
      setModalError("");
      setModalLoading(true);
      const res = await getAssetByIdApi(id);
      setActionModal({ mode: "view", asset: res?.data?.asset || null });
    } catch (err) {
      showNotice("error", err?.response?.data?.message || err?.message || "Không tải được chi tiết tài sản.");
    } finally {
      setModalLoading(false);
    }
  };

  const openEditModal = async (id) => {
    if (!canManageAssets) {
      showNotice("error", "Bạn không có quyền sửa tài sản.");
      return;
    }
    try {
      setModalError("");
      setModalLoading(true);
      const res = await getAssetByIdApi(id);
      const asset = res?.data?.asset;
      if (!asset) {
        showNotice("error", "Không tải được dữ liệu tài sản.");
        return;
      }
      setActionModal({ mode: "edit", asset });
      setModalError("");
      setEditForm({
        name: asset.name || "",
        status: asset.status || "",
        location: asset.location || "",
        manufacturer: asset.manufacturer || "",
        model: asset.model || "",
        serialNumber: asset.serialNumber || "",
        purchasePrice:
          asset.purchasePrice === null || asset.purchasePrice === undefined
            ? ""
            : String(asset.purchasePrice),
      });
    } catch (err) {
      showNotice("error", err?.response?.data?.message || err?.message || "Không tải được dữ liệu tài sản.");
    } finally {
      setModalLoading(false);
    }
  };

  const submitEditAsset = async () => {
    if (!canManageAssets) {
      setModalError("Bạn không có quyền cập nhật tài sản.");
      return;
    }
    if (!actionModal?.asset?._id) return;
    if (!editForm.name.trim()) {
      setModalError("Tên tài sản không được để trống.");
      return;
    }
    try {
      setModalError("");
      setModalLoading(true);
      const payload = {
        name: editForm.name.trim(),
        status: editForm.status,
        location: editForm.location.trim(),
        manufacturer: editForm.manufacturer.trim(),
        model: editForm.model.trim(),
        serialNumber: editForm.serialNumber.trim(),
        purchasePrice: parseCurrencyToNumber(editForm.purchasePrice),
      };
      const res = await updateAssetApi(actionModal.asset._id, payload);
      const updatedAsset = res?.data?.asset;
      if (updatedAsset) {
        upsertLocalAsset(updatedAsset);
      }
      showNotice("success", "Cập nhật tài sản thành công.");
      closeActionModal();
    } catch (err) {
      setModalError(err?.response?.data?.message || err?.message || "Cập nhật tài sản thất bại.");
      setModalLoading(false);
    }
  };

  const openDeleteModal = (asset) => {
    if (!canManageAssets) {
      showNotice("error", "Bạn không có quyền xóa tài sản.");
      return;
    }
    setDeleteModal({
      open: true,
      loading: false,
      error: "",
      asset,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, loading: false, error: "", asset: null });
  };

  const removeAsset = async () => {
    if (!deleteModal.asset?._id || deleteModal.loading) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true, error: "" }));
      await deleteAssetApi(deleteModal.asset._id);
      setAssets((prev) => prev.filter((item) => item._id !== deleteModal.asset._id));
      closeDeleteModal();
      showNotice("success", "Đã xóa tài sản.");
    } catch (err) {
      setDeleteModal((prev) => ({
        ...prev,
        loading: false,
        error: err?.response?.data?.message || err?.message || "Xóa tài sản thất bại.",
      }));
    }
  };

  const submitCreateAsset = async () => {
    if (!canManageAssets) {
      setCreateError("Bạn không có quyền thêm tài sản.");
      return;
    }
    if (!createForm.assetCode.trim() || !createForm.name.trim() || !createForm.assetType) {
      setCreateError("Vui lòng nhập đủ Mã tài sản, Tên tài sản và Loại.");
      return;
    }
    try {
      setCreateError("");
      setCreateLoading(true);
      const payload = {
        assetCode: createForm.assetCode.trim(),
        name: createForm.name.trim(),
        assetType: createForm.assetType,
        status: createForm.status,
        location: createForm.location.trim(),
        manufacturer: createForm.manufacturer.trim(),
        model: createForm.model.trim(),
        serialNumber: createForm.serialNumber.trim(),
        purchaseDate: createForm.purchaseDate ? new Date(createForm.purchaseDate).toISOString() : null,
        purchasePrice: parseCurrencyToNumber(createForm.purchasePrice),
        detail: {},
      };
      const res = await createAssetApi(payload);
      const createdAsset = res?.data?.asset;
      if (createdAsset) {
        setAssets((prev) => [createdAsset, ...prev]);
      }
      showNotice("success", "Tạo tài sản thành công.");
      closeCreateModal();
    } catch (err) {
      setCreateError(err?.response?.data?.message || err?.message || "Tạo tài sản thất bại.");
      setCreateLoading(false);
    }
  };

  return {
    openCreateModal,
    closeCreateModal,
    openViewModal,
    openEditModal,
    submitEditAsset,
    openDeleteModal,
    closeDeleteModal,
    removeAsset,
    submitCreateAsset,
    closeActionModal,
  };
}
