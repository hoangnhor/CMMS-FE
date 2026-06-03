const DEFAULT_HEALTH_URL = "https://cmms-be.onrender.com/api/health";

function resolveHealthUrl() {
  const raw = String(process.env.RENDER_HEALTH_URL || "").trim();
  return raw || DEFAULT_HEALTH_URL;
}

export default async function handler(_req, res) {
  const healthUrl = resolveHealthUrl();

  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "user-agent": "vercel-keepalive",
        accept: "application/json",
      },
    });

    const text = await response.text();

    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(200).json({
      success: true,
      target: healthUrl,
      status: response.status,
      ok: response.ok,
      body: text ? text.slice(0, 200) : "",
    });
  } catch (error) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(502).json({
      success: false,
      target: healthUrl,
      message: error?.message || "Keep-alive ping failed",
    });
  }
}
