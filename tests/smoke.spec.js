import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = "admin@factory.local";
const ADMIN_PASSWORD = "password123";

async function loginAsAdmin(page) {
  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: "Đăng nhập hệ thống" })).toBeVisible();
  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /Đăng nhập/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Bảng điều khiển Tổng quát" })).toBeVisible();
}

async function loginApi(request) {
  const response = await request.post("http://localhost:5000/api/auth/login", {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.data.token;
}

async function createAssetApi(request, token, { assetCode, assetName }) {
  const response = await request.post("http://localhost:5000/api/assets", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      assetCode,
      name: assetName,
      assetType: "machine",
      status: "active",
      location: "Smoke Test Line",
      manufacturer: "Codex",
      model: "SMK-1",
      serialNumber: assetCode,
      purchasePrice: 1000000,
      detail: {
        spindleHours: 0,
        cycleCount: 0,
        oee_availability: 95,
        oee_performance: 95,
        oee_quality: 99,
        alarmCode: "",
        pmIntervalHours: 500,
        pmIntervalDays: 90,
      },
    },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.data.asset;
}

async function deleteAssetApi(request, token, assetId) {
  if (!assetId) return;
  await request.delete(`http://localhost:5000/api/assets/${assetId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function deactivateUserByEmail(request, token, email) {
  const response = await request.get("http://localhost:5000/api/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  const user = payload.data.find((item) => item.email === email);
  if (!user) return null;
  await request.patch(`http://localhost:5000/api/users/${user._id}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { isActive: false },
  });
  return user._id;
}

test("browser smoke test for main screens", async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto("/assets");
  await expect(page.getByRole("heading", { name: "Quản lý Tài sản" })).toBeVisible();

  await page.goto("/work-orders");
  await expect(page.getByRole("heading", { name: "Tóm tắt vận hành hôm nay" })).toBeVisible();

  await page.goto("/maintenance");
  await expect(page.getByRole("heading", { name: "Danh sách kế hoạch bảo trì" })).toBeVisible();

  await page.goto("/users");
  await expect(page.getByRole("heading", { name: "Quản lý người dùng" })).toBeVisible();
});

test("browser smoke test can create asset from assets page", async ({ page, request }) => {
  const stamp = Date.now();
  const assetCode = `SMK-UI-${stamp}`;
  const assetName = `Smoke Asset ${stamp}`;
  const token = await loginApi(request);
  let createdAssetId = null;

  try {
    await loginAsAdmin(page);
    await page.goto("/assets");
    await page.getByRole("button", { name: /Thêm tài sản/i }).click();

    const modal = page.locator(".app-modal-panel").last();
    await expect(modal.getByRole("heading", { name: "Thêm tài sản mới" })).toBeVisible();
    await modal.getByPlaceholder("Mã tài sản*").fill(assetCode);
    await modal.getByPlaceholder("Tên tài sản*").fill(assetName);
    await modal.getByPlaceholder("Vị trí").fill("Smoke Test Line");
    await modal.getByPlaceholder("Hãng").fill("Codex");
    await modal.getByPlaceholder("Model").fill("SMK-1");
    await modal.getByPlaceholder("Serial").fill(assetCode);
    await modal.getByPlaceholder("Giá trị").fill("1000000");
    await modal.getByRole("button", { name: /^Tạo tài sản$/i }).click();

    await expect(page.getByText("Tạo tài sản thành công.")).toBeVisible();
    await expect(page.getByRole("cell", { name: assetCode, exact: true })).toBeVisible();

    const lookup = await request.get("http://localhost:5000/api/assets", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const lookupJson = await lookup.json();
    const createdAsset = lookupJson.data.find((item) => item.assetCode === assetCode);
    expect(createdAsset).toBeTruthy();
    createdAssetId = createdAsset._id;
  } finally {
    await deleteAssetApi(request, token, createdAssetId);
  }
});

test("browser smoke test can create work order from work orders page", async ({ page, request }) => {
  const stamp = Date.now();
  const token = await loginApi(request);
  const asset = await createAssetApi(request, token, {
    assetCode: `SMK-WO-${stamp}`,
    assetName: `Smoke WO Asset ${stamp}`,
  });

  try {
    await loginAsAdmin(page);
    await page.goto("/work-orders");
    await page.getByRole("button", { name: /TẠO LỆNH MỚI/i }).click();

    const modal = page.locator(".app-modal-panel").last();
    await expect(modal.getByRole("heading", { name: "Tạo lệnh công việc" })).toBeVisible();
    await modal.locator("select").nth(0).selectOption(asset._id);
    await modal.locator("select").nth(1).selectOption("CM");
    await modal.locator("select").nth(2).selectOption("production_request");
    await modal.locator("select").nth(3).selectOption("medium");
    await modal.locator('input[type="date"]').fill("2026-04-28");
    await modal.getByRole("button", { name: /^Tạo lệnh$/i }).click();
    await expect(modal).toBeHidden();

    const response = await request.get("http://localhost:5000/api/work-orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    const createdWorkOrder = payload.data.find(
      (item) => item.assetId?._id === asset._id && item.status === "draft"
    );
    expect(createdWorkOrder).toBeTruthy();
  } finally {
    await deleteAssetApi(request, token, asset._id);
  }
});

test("browser smoke test can create PM schedule from maintenance page", async ({ page, request }) => {
  test.setTimeout(60000);
  const stamp = Date.now();
  const token = await loginApi(request);
  const asset = await createAssetApi(request, token, {
    assetCode: `SMK-PM-${stamp}`,
    assetName: `Smoke PM Asset ${stamp}`,
  });

  try {
    await loginAsAdmin(page);
    await page.goto("/maintenance");
    await page.getByRole("button", { name: /^Tạo kế hoạch mới$/i }).click();

    const modal = page.locator(".app-modal-panel").last();
    await expect(modal.getByRole("heading", { name: "Tạo kế hoạch mới" })).toBeVisible();
    await modal.locator("select").nth(0).selectOption(asset._id);
    await modal.locator("select").nth(1).selectOption("days");
    await modal.locator('input[type="number"]').fill("30");
    await expect(modal.locator("select").nth(0)).toHaveValue(asset._id);
    await expect(modal.locator("select").nth(1)).toHaveValue("days");
    await expect(modal.locator('input[type="number"]')).toHaveValue("30");
    await modal.getByRole("button", { name: /^Lưu kế hoạch$/i }).click();

    await expect.poll(
      async () => {
        const response = await request.get("http://localhost:5000/api/pm-schedules", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        return payload.data.some(
          (item) => item.assetId?._id === asset._id && item.triggerType === "days" && item.intervalValue === 30
        );
      },
      {
        timeout: 20000,
        intervals: [500, 1000, 1500],
      }
    ).toBe(true);
  } finally {
    await deleteAssetApi(request, token, asset._id);
  }
});

test("browser smoke test can create user from users page", async ({ page, request }) => {
  const stamp = Date.now();
  const token = await loginApi(request);
  const userEmail = `smoke.${stamp}@factory.local`;
  const userName = `Smoke User ${stamp}`;

  try {
    await loginAsAdmin(page);
    await page.goto("/users");
    await expect(page.getByRole("heading", { name: "Quản lý người dùng" })).toBeVisible();

    const inputs = page.locator("form input");
    await inputs.nth(0).fill(userName);
    await inputs.nth(1).fill(userEmail);
    await inputs.nth(2).fill("password123");
    await page.locator("form select").selectOption("technician");
    await page.getByRole("button", { name: /Xác nhận thêm mới/i }).click();

    await expect(page.getByText("Đã tạo người dùng mới.")).toBeVisible();

    const response = await request.get("http://localhost:5000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    const createdUser = payload.data.find((item) => item.email === userEmail);
    expect(createdUser).toBeTruthy();
  } finally {
    await deactivateUserByEmail(request, token, userEmail);
  }
});
