// Hàm serverless của Vercel: chuyển tiếp danh sách (list.json) của Cloudinary.
// Chỉ dùng làm dự phòng khi trình duyệt không gọi thẳng được (lỗi CORS). Không cần API secret.
module.exports = async function handler(req, res) {
  const path = String(req.query.path || "");

  // Chỉ cho phép đúng dạng  <image|video|raw>/list/<tag>.json
  if (!/^(image|video|raw)\/list\/[a-z0-9_]+\.json$/i.test(path)) {
    res.status(400).json({ error: "bad path" });
    return;
  }

  const cloud = process.env.CLOUDINARY_CLOUD_NAME || "mdkn3zbh";
  try {
    const r = await fetch(`https://res.cloudinary.com/${cloud}/${path}`);
    const text = await r.text();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(r.status).send(text);
  } catch (e) {
    res.status(502).json({ error: "upstream" });
  }
};
