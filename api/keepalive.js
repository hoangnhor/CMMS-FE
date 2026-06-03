export default async function handler(req, res) {
  const env = globalThis.process?.env || {};

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const cronSecret = env.CRON_SECRET?.trim();
  if (cronSecret) {
    const authHeader = req.headers.authorization || "";
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  }

  const targetUrl = env.RENDER_HEALTH_URL?.trim() || "https://cmms-be.onrender.com/api/health";

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "user-agent": "vercel-cron/1.0",
      },
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: "Backend health check failed",
        status: response.status,
        body: text.slice(0, 200),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Backend pinged",
      status: response.status,
      body: text.slice(0, 200),
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "Unable to reach backend",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
