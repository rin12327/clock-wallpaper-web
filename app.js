import { CONFIG } from "./config.js";

/* =====================================================================
 *  Tiện ích
 * ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const enc = new TextEncoder();
const dec = new TextDecoder();
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const store = {
  get(k, d) {
    try {
      const v = JSON.parse(localStorage.getItem(k));
      return v ?? d;
    } catch {
      return d;
    }
  },
  set(k, v) {
    localStorage.setItem(k, JSON.stringify(v));
  },
};

/** Bỏ dấu tiếng Việt + chữ thường: "anh dong" tìm ra "Ảnh động" */
const foldVi = (s) => s.toLowerCase().normalize("NFD").replace(/\p{M}+/gu, "").replace(/đ/g, "d");
const fmtDate = (iso) => (iso && iso.length >= 10 ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "");
const two = (n) => String(n).padStart(2, "0");

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 3600);
}

/* =====================================================================
 *  Mẫu thiết kế (đi kèm mỗi bài đăng, cùng định dạng với app Android)
 * ===================================================================== */
const CLOCK_STYLES = [
  ["digital", "Điện tử LED (Digital)"],
  ["neon_glow", "Neon phát sáng"],
  ["cyberpunk", "Cyberpunk lỗi hình"],
  ["retro_pixel", "Retro pixel cổ điển"],
  ["bold", "Đậm mạnh mẽ (Bold)"],
  ["serif", "Cổ điển (Serif)"],
  ["serif_italic", "Serif nghiêng sang trọng"],
  ["monospace", "Đơn không chân (Monospace)"],
  ["cursive", "Thư pháp (Cursive)"],
  ["casual", "Viết tay (Casual)"],
  ["outline", "Chữ rỗng viền (Outline)"],
  ["gradient", "Chuyển màu (Gradient)"],
  ["shadow3d", "Nổi khối 3D"],
  ["elegant", "Thanh mảnh thanh lịch"],
];
const STYLE_KEYS = CLOCK_STYLES.map((s) => s[0]);

const defaultDesign = () => ({
  clock: { style: "digital", color: "#ffffff", scale: 1, sx: 1, sy: 1, rot: 0, x: 0.5, y: 0.35, showClock: true, showSeconds: true, showDate: true },
  img: { scale: 1, rot: 0, x: 0, y: 0 },
});

const num = (v, d, lo, hi) => {
  const n = Number(v);
  return Number.isFinite(n) ? clamp(n, lo, hi) : d;
};

/** Làm sạch mẫu thiết kế (có thể đến từ người lạ) */
function sanitizeDesign(j) {
  const D = defaultDesign();
  const c = j?.clock ?? {};
  const i = j?.img ?? {};
  return {
    clock: {
      style: STYLE_KEYS.includes(c.style) ? c.style : D.clock.style,
      color: /^#[0-9a-fA-F]{6}$/.test(c.color) ? c.color.toLowerCase() : D.clock.color,
      scale: num(c.scale, 1, 0.5, 2.5),
      sx: num(c.sx, 1, 0.5, 2.5),
      sy: num(c.sy, 1, 0.5, 2.5),
      rot: num(c.rot, 0, -180, 180),
      x: num(c.x, 0.5, 0.05, 0.95),
      y: num(c.y, 0.35, 0.05, 0.95),
      showClock: c.showClock !== false,
      showSeconds: c.showSeconds !== false,
      showDate: c.showDate !== false,
    },
    img: {
      scale: num(i.scale, 1, 1, 3),
      rot: num(i.rot, 0, -180, 180),
      x: num(i.x, 0, -2, 2),
      y: num(i.y, 0, -2, 2),
    },
  };
}

let design = sanitizeDesign(store.get("gw_design", {}));
const saveDesign = () => store.set("gw_design", design);

/* =====================================================================
 *  Mã hóa tiêu đề / tên người đăng vào public_id (GIỐNG HỆT app Android)
 *    gw_<ts>_l<loop>s<sound>_<3 số = độ dài phần tiêu đề><base64url(tiêu đề)><base64url(tên)>
 * ===================================================================== */
function b64(str) {
  let bin = "";
  enc.encode(str).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64(s) {
  try {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const bin = atob(s);
    return dec.decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch {
    return "";
  }
}

function cutUtf8(s, maxBytes) {
  const a = Array.from(s);
  while (enc.encode(a.join("")).length > maxBytes) a.pop();
  return a.join("");
}

function buildId(ts, loop, sound, title, author) {
  const t = b64(cutUtf8(title.trim(), 90));
  const a = b64(cutUtf8(author.trim(), 60));
  return `gw_${ts}_l${loop ? 1 : 0}s${sound ? 1 : 0}_${String(t.length).padStart(3, "0")}${t}${a}`;
}

const ID_RE = /^gw_(\d+)_l([01])s([01])_(\d{3})(.*)$/;
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

/** Khóa duy nhất của một bài (dãy số thời gian) dùng cho "bia mộ" và tệp mẫu thiết kế */
const postKey = (id) => (id.match(/^gw_(?:vid_|img_)?(\d{10,})/) || [])[1] || null;
const slug = (s) => foldVi(s || "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "hinh-nen";

function makeItem(id, version, isVideo, isPublic, created = "") {
  const base = `https://res.cloudinary.com/${CONFIG.CLOUD_NAME}/${isVideo ? "video" : "image"}/upload`;
  const v = version > 0 ? `v${version}/` : "";

  let title = "";
  let author = "";
  let loop = !id.endsWith("_l0"); // tương thích bài đăng cũ
  let sound = false;
  const m = id.match(ID_RE);
  if (m) {
    loop = m[2] === "1";
    sound = m[3] === "1";
    const rest = m[5];
    const n = Math.min(parseInt(m[4], 10), rest.length);
    title = unb64(rest.slice(0, n));
    author = unb64(rest.slice(n));
  }

  const name = slug(title);
  const item = { id, isVideo, isPublic, loop, sound, title, author, created };
  if (isVideo) {
    item.url = `${base}/c_limit,w_1080,vc_h264/${v}${id}.mp4`;
    item.thumb = `${base}/so_0,c_fill,w_400,h_720,q_auto/${v}${id}.jpg`;
    item.download = `${base}/vc_h264,fl_attachment:${name}/${v}${id}.mp4`;
  } else {
    item.url = `${base}/c_limit,w_1440,h_2560,q_auto/${v}${id}.jpg`;
    item.thumb = `${base}/c_fill,w_400,h_720,q_auto/${v}${id}.jpg`;
    item.download = `${base}/fl_attachment:${name}/${v}${id}`;
    if (sound) {
      const abase = `https://res.cloudinary.com/${CONFIG.CLOUD_NAME}/video/upload`;
      item.audioUrl = `${abase}/${id}_a.mp3`;
      item.audioDownload = `${abase}/fl_attachment:${name}-am-thanh/${id}_a.mp3`;
    }
  }
  return item;
}

/* =====================================================================
 *  Cloudinary
 * ===================================================================== */
async function fetchJSON(path) {
  const direct = `https://res.cloudinary.com/${CONFIG.CLOUD_NAME}/${path}`;
  try {
    const r = await fetch(direct);
    if (r.status === 404) return null; // chưa có gì được đăng
    if (r.ok) return await r.json();
    throw new Error("HTTP " + r.status);
  } catch {
    // Dự phòng: đi qua hàm serverless /api/list (tránh lỗi CORS)
    const r2 = await fetch(`/api/list?path=${encodeURIComponent(path)}`);
    if (r2.status === 404) return null;
    if (!r2.ok) {
      throw new Error(`Không tải được danh sách (HTTP ${r2.status}). Vào Cloudinary > Settings > Security và bỏ chặn “Resource list”.`);
    }
    return await r2.json();
  }
}

async function listPublic(isVideo) {
  const j = await fetchJSON(`${isVideo ? "video" : "image"}/list/${CONFIG.PUBLIC_TAG}.json`);
  if (!j) return [];
  return j.resources
    .slice()
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .map((r) => makeItem(r.public_id, r.version, isVideo, true, fmtDate(r.created_at)));
}

/** Khóa các bài đã bị xóa / chuyển riêng tư (bia mộ) */
async function listHidden() {
  const out = new Set();
  for (const tag of [CONFIG.DELETE_TAG, CONFIG.PRIVATE_TAG]) {
    try {
      const j = await fetchJSON(`raw/list/${tag}.json`);
      (j?.resources ?? []).forEach((r) => out.add(r.public_id.split("_").pop()));
    } catch {
      /* bỏ qua */
    }
  }
  return out;
}

function uploadCloud(kind, file, publicId, tags, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file, "file");
    fd.append("upload_preset", CONFIG.UPLOAD_PRESET);
    fd.append("public_id", publicId);
    if (tags) fd.append("tags", tags);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CONFIG.CLOUD_NAME}/${kind}/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      let j = {};
      try {
        j = JSON.parse(xhr.responseText);
      } catch {
        /* bỏ qua */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(j);
      else reject(new Error(j.error?.message || "HTTP " + xhr.status));
    };
    xhr.onerror = () => reject(new Error("Lỗi mạng"));
    xhr.send(fd);
  });
}

const uploadJSON = (publicId, tag, obj) =>
  uploadCloud("raw", new Blob([JSON.stringify(obj)], { type: "application/json" }), publicId, tag);

/** Tải mẫu thiết kế của một bài (null nếu bài không có) */
async function fetchDesign(id) {
  const key = postKey(id);
  if (!key) return null;
  try {
    const r = await fetch(`https://res.cloudinary.com/${CONFIG.CLOUD_NAME}/raw/upload/${CONFIG.CFG_TAG}_${key}`);
    if (!r.ok) return null;
    return sanitizeDesign(JSON.parse(await r.text()));
  } catch {
    return null;
  }
}

async function createPost({ isVideo, file, audio, title, author, isPublic, loop, sound, design: d, onStage, onProgress }) {
  const ts = Date.now();
  const hasAudio = !isVideo && !!audio;
  const id = buildId(ts, isVideo && loop, isVideo ? sound : hasAudio, title, author);

  // Đăng âm thanh trước (không gắn tag nên không hiện trong danh sách ảnh động)
  if (hasAudio) {
    onStage("Đang tải âm thanh…");
    await uploadCloud("video", audio, `${id}_a`, null, onProgress);
  }
  onStage(isVideo ? "Đang tải video…" : "Đang tải ảnh…");
  const j = await uploadCloud(isVideo ? "video" : "image", file, id, isPublic ? CONFIG.PUBLIC_TAG : null, onProgress);

  // Mẫu thiết kế đi kèm (lỗi ở bước này không làm hỏng bài đăng)
  let cfgOk = true;
  try {
    onStage("Đang lưu mẫu thiết kế…");
    await uploadJSON(`${CONFIG.CFG_TAG}_${ts}`, CONFIG.CFG_TAG, { v: 1, ...d });
  } catch {
    cfgOk = false;
  }
  return { item: makeItem(j.public_id, j.version, isVideo, isPublic, fmtDate(new Date().toISOString())), cfgOk };
}

/** Xóa / chuyển riêng tư KHÔNG cần API secret: gửi "bia mộ" để Khám phá của mọi người ẩn bài này */
async function markPost(item, action) {
  const key = postKey(item.id);
  if (!key) throw new Error("Không xác định được bài đăng");
  const tag = action === "del" ? CONFIG.DELETE_TAG : CONFIG.PRIVATE_TAG;
  await uploadJSON(`${tag}_${key}`, tag, { id: item.id, action, by: authorName(), time: Date.now() });
}

async function sendReport(item, reason, note) {
  const ts = Date.now();
  await uploadJSON(`gw_report_${ts}`, CONFIG.REPORT_TAG, {
    id: item.id, video: item.isVideo, title: item.title, author: item.author,
    reason, note, reporter: authorName(), time: ts,
  });
}

/* =====================================================================
 *  Trạng thái, tài khoản
 * ===================================================================== */
function loadMine() {
  return store.get("gw_mine", []).map((m) => makeItem(m.id, 0, m.isVideo, m.isPublic, m.created || ""));
}
const saveMine = () =>
  store.set("gw_mine", state.mine.map((m) => ({ id: m.id, isVideo: m.isVideo, isPublic: m.isPublic, created: m.created })));

const state = {
  tab: "image", // image | video | mine
  q: "",
  lists: { image: null, video: null },
  hidden: new Set(),
  reported: new Set(store.get("gw_reported", [])),
  mine: loadMine(),
  loading: false,
  error: null,
};

const user = () => store.get("gw_user", null);
const savedName = () => String(store.get("gw_name", "") || "").trim();
const authorName = () => user()?.name || savedName() || "Khách";
const prefs = () => ({ sound: true, loop: true, ...store.get("gw_pref", {}) });

/* =====================================================================
 *  Điều hướng (thanh menu)
 * ===================================================================== */
const ROUTES = ["studio", "explore", "mine", "app", "help", "profile"];

function showPage(r) {
  location.hash = "#/" + r;
}

function markNav(r) {
  $$("#links a").forEach((a) => a.classList.toggle("active", a.dataset.route === r));
}

function route() {
  const name = (location.hash.match(/^#\/(\w+)/) || [])[1];
  const r = ROUTES.includes(name) ? name : "studio";
  const page = r === "mine" ? "explore" : r;
  $$(".page").forEach((p) => (p.hidden = p.dataset.page !== page));
  markNav(r);
  $("#links").classList.remove("open");
  $("#burger").setAttribute("aria-expanded", "false");
  $("#acc-menu").hidden = true;

  if (r === "mine") setTab("mine");
  else if (r === "explore") setTab(state.tab === "mine" ? "image" : state.tab);
  if (r === "app") checkApk();
  if (r === "profile") renderProfile();
  if (r === "studio") requestAnimationFrame(paintAll);
  window.scrollTo(0, 0);
}

$("#burger").addEventListener("click", () => {
  const open = $("#links").classList.toggle("open");
  $("#burger").setAttribute("aria-expanded", String(open));
});
$("#btn-upload").addEventListener("click", () => {
  showPage("studio");
  toast("Chọn ảnh/video của bạn, căn chỉnh rồi bấm “Đăng mẫu của tôi”");
});

/* =====================================================================
 *  Khám phá
 * ===================================================================== */
async function load(force = false) {
  if (state.tab === "mine") return render();
  const key = state.tab;
  if (!force && state.lists[key]) return render();
  state.loading = true;
  state.error = null;
  render();
  try {
    const [hidden, list] = await Promise.all([listHidden(), listPublic(key === "video")]);
    state.hidden = hidden;
    state.lists[key] = list;
  } catch (e) {
    state.error = e.message || "Lỗi mạng";
  }
  state.loading = false;
  render();
}

function setTab(t) {
  state.tab = t;
  $$("#tabs button[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === t));
  load();
}

function visibleItems() {
  const q = foldVi(state.q.trim());
  const match = (w) => !q || foldVi(`${w.title} ${w.author}`).includes(q);
  if (state.tab === "mine") return state.mine.slice().reverse().filter(match);
  return (state.lists[state.tab] ?? []).filter(
    (w) => !state.reported.has(w.id) && !state.hidden.has(postKey(w.id)) && match(w)
  );
}

function card(w, mineMode) {
  const a = document.createElement("button");
  a.type = "button";
  a.className = "card";

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = w.title || "";
  img.src = w.thumb;

  const badges = document.createElement("div");
  badges.className = "badges";
  const add = (t) => {
    const s = document.createElement("span");
    s.textContent = t;
    badges.append(s);
  };
  if (mineMode) add(w.isPublic ? "🌐" : "🔒"); // ở mục Của tôi: 🌐 công khai, 🔒 riêng tư
  if (w.sound) add("🔊");
  if (w.isVideo) add(w.loop ? "▶ 🔁" : "▶");

  const cap = document.createElement("div");
  cap.className = "cap";
  const t = document.createElement("b");
  t.textContent = w.title || "";
  const s = document.createElement("small");
  s.textContent = w.author ? "bởi " + w.author : "";
  cap.append(t, s);

  a.append(img, badges, cap);
  a.addEventListener("click", () => openViewer(w));
  return a;
}

function render() {
  const grid = $("#grid");
  const status = $("#status");
  grid.replaceChildren();
  status.replaceChildren();
  status.hidden = true;

  const mineMode = state.tab === "mine";
  if (!mineMode && state.loading) {
    status.hidden = false;
    status.textContent = "Đang tải…";
    return;
  }
  if (!mineMode && state.error) {
    status.hidden = false;
    status.textContent = state.error;
    const b = document.createElement("button");
    b.className = "btn grad";
    b.style.marginTop = "14px";
    b.textContent = "Thử lại";
    b.onclick = () => load(true);
    status.append(document.createElement("br"), b);
    return;
  }

  const items = visibleItems();
  if (!items.length) {
    status.hidden = false;
    status.textContent = state.q
      ? "Không tìm thấy bài nào"
      : mineMode
      ? "Bạn chưa đăng gì. Vào mục Thiết kế rồi bấm “Đăng mẫu của tôi”."
      : "Chưa có gì ở đây. Hãy là người đăng đầu tiên!";
    return;
  }
  items.forEach((w) => grid.append(card(w, mineMode)));
}

$("#tabs").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-tab]");
  if (!b) return;
  setTab(b.dataset.tab);
  const r = b.dataset.tab === "mine" ? "mine" : "explore";
  history.replaceState(null, "", location.pathname + location.search + "#/" + r);
  markNav(r);
});
$("#refresh").addEventListener("click", () => {
  state.lists = { image: null, video: null };
  load(true);
});
$("#q").addEventListener("input", (e) => {
  state.q = e.target.value;
  $("#q-clear").hidden = !state.q;
  render();
});
$("#q-clear").addEventListener("click", () => {
  $("#q").value = "";
  state.q = "";
  $("#q-clear").hidden = true;
  render();
});

/* =====================================================================
 *  Vẽ khung điện thoại (dùng chung cho khung thiết kế và bản xem trước khi đăng)
 * ===================================================================== */
function tickClockText(ph) {
  const c = design.clock;
  const d = new Date();
  ph.querySelector(".time-display").textContent =
    `${two(d.getHours())}:${two(d.getMinutes())}` + (c.showSeconds ? `:${two(d.getSeconds())}` : "");
  ph.querySelector(".date-display").textContent = `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function paintClock(ph) {
  const cfg = design.clock;
  const el = ph.querySelector(".clock-overlay");
  const W = ph.clientWidth || 1;
  el.hidden = !cfg.showClock && !cfg.showDate;
  ph.querySelector(".time-display").hidden = !cfg.showClock;
  ph.querySelector(".date-display").hidden = !cfg.showDate;
  el.style.left = cfg.x * 100 + "%";
  el.style.top = cfg.y * 100 + "%";
  // Cỡ chữ = 10% chiều rộng khung * hệ số, giống hệt app Android
  el.style.setProperty("--fs", W * 0.1 * cfg.scale + "px");
  el.style.setProperty("--c", cfg.color);
  el.style.transform = `translate(-50%, -50%) rotate(${cfg.rot}deg) scale(${cfg.sx}, ${cfg.sy})`;
  el.className = `clock-overlay fs-${cfg.style}` + (cfg.showClock ? "" : " only-date");
  tickClockText(ph);
}

function paintBg(ph) {
  const el = ph.querySelector(".bg-media > img, .bg-media > video");
  if (!el) return;
  const i = design.img;
  el.style.transform = `translate(${i.x * ph.clientWidth}px, ${i.y * ph.clientHeight}px) rotate(${i.rot}deg) scale(${i.scale})`;
}

function renderMedia(ph, media, opts = {}) {
  const box = ph.querySelector(".bg-media");
  box.replaceChildren();
  box.classList.toggle("has", !!media);
  ph.querySelector(".bg-empty").hidden = !!media;
  if (!media) return;

  if (media.isVideo) {
    const v = document.createElement("video");
    v.playsInline = true;
    v.autoplay = true;
    v.loop = media.loop;
    v.muted = !!opts.forceMuted || !media.sound;
    v.src = media.url;
    let tries = 0;
    v.addEventListener("error", () => {
      // Video vừa đăng có thể còn đang được Cloudinary xử lý: thử lại thay vì để màn hình đen
      if (media.item && tries++ < 8) {
        setTimeout(() => {
          v.src = media.url;
          v.load();
          v.play().catch(() => {});
        }, 3000);
      }
    });
    box.append(v);
    v.play().catch(() => {
      // Trình duyệt chặn tự phát có tiếng: tắt tiếng rồi phát
      v.muted = true;
      opts.onBlocked?.();
      v.play().catch(() => {});
    });
  } else {
    const img = document.createElement("img");
    img.alt = media.item?.title || "";
    img.src = media.url;
    box.append(img);
  }
}

/* =====================================================================
 *  Thiết kế (studio)
 * ===================================================================== */
const phone = $("#phone");
const studio = { media: null, edit: "clock", audio: null, screenOn: true };

function paintAll() {
  paintBg(phone);
  paintClock(phone);
  const styleName = CLOCK_STYLES.find((s) => s[0] === design.clock.style)?.[1] ?? "";
  $("#sum-clock").textContent = `· ${styleName}`;
  $("#sum-img").textContent = `· ${Math.round(design.img.scale * 100)}% · ${Math.round(design.img.rot)}°`;
}

function stopStudioAudio() {
  if (studio.audio) {
    studio.audio.pause();
    studio.audio = null;
  }
}

function startStudioAudio() {
  stopStudioAudio();
  const m = studio.media;
  if (!m?.audioUrl || !m.sound || !studio.screenOn) return;
  studio.audio = new Audio(m.audioUrl);
  studio.audio.volume = m.volume ?? 1;
  studio.audio.play().catch(() => {});
}

function syncMediaControls() {
  const m = studio.media;
  const show = !!m && (m.isVideo || !!m.audioUrl);
  $("#acc-media").hidden = !show;
  $("#s-note").hidden = !m?.isVideo;
  if (!m) return;
  $("#row-m-loop").hidden = !m.isVideo;
  $("#row-m-vol").hidden = !m.audioUrl;
  $("#m-loop").checked = m.loop;
  $("#m-sound").checked = m.sound;
  $("#m-vol").value = m.volume ?? 1;
  $("#m-vol-out").textContent = Math.round((m.volume ?? 1) * 100) + "%";
}

function setStudioMedia(media) {
  const old = studio.media;
  if (old?.objectUrl && old !== media) URL.revokeObjectURL(old.objectUrl);
  studio.media = media;
  stopStudioAudio();
  studio.screenOn = true;
  $("#screen-off").classList.remove("on");
  renderMedia(phone, media, {
    onBlocked: () => {
      if (studio.media) studio.media.sound = false;
      syncMediaControls();
    },
  });
  paintAll();
  syncMediaControls();
  if (media && !media.isVideo && media.audioUrl && media.sound) startStudioAudio();
  store.set("gw_applied", media?.item ? { id: media.item.id, isVideo: media.isVideo } : null);
}

function mediaSeconds(file, tag) {
  return new Promise((resolve) => {
    const m = document.createElement(tag);
    const url = URL.createObjectURL(file);
    m.preload = "metadata";
    m.onloadedmetadata = () => {
      const d = Number.isFinite(m.duration) ? Math.round(m.duration) : null;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    m.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    m.src = url;
  });
}

async function handleStudioFile(file) {
  if (!file) return;
  const isVideo = file.type.startsWith("video/");
  if (!isVideo && !file.type.startsWith("image/")) return toast("Hãy chọn một ảnh hoặc video");
  if (isVideo) {
    const sec = await mediaSeconds(file, "video");
    if (sec == null) return toast("Không đọc được video này");
    if (sec < 1 || sec > CONFIG.MAX_VIDEO_SECONDS) {
      return toast(`Video dài ${sec}s. Chỉ nhận video từ 1 đến ${CONFIG.MAX_VIDEO_SECONDS} giây`);
    }
  }
  const p = prefs();
  const url = URL.createObjectURL(file);
  setStudioMedia({ isVideo, file, url, objectUrl: url, loop: p.loop, sound: p.sound, volume: 1 });
}

/** Áp dụng một bài của cộng đồng vào khung thiết kế (kèm mẫu thiết kế nếu bài có) */
async function applyToStudio(item) {
  setStudioMedia({
    isVideo: item.isVideo,
    url: item.url,
    item,
    loop: item.loop,
    sound: item.isVideo ? item.sound : !!item.audioUrl,
    audioUrl: item.audioUrl,
    volume: 1,
  });
  showPage("studio");
  const d = await fetchDesign(item.id);
  if (d && studio.media?.item?.id === item.id) {
    design = d;
    saveDesign();
    syncDesignControls();
    paintAll();
    toast("Đã áp dụng mẫu của " + (item.author || "người đăng"));
  } else if (!d) {
    toast("Đã áp dụng. Bài này chưa có mẫu thiết kế nên giữ thiết kế của bạn");
  }
}

/* ---------- Các thanh kéo / ô chọn (gắn theo data-bind) ---------- */
const getPath = (o, p) => p.split(".").reduce((a, k) => a?.[k], o);
const setPath = (o, p, v) => {
  const ks = p.split(".");
  const last = ks.pop();
  ks.reduce((a, k) => a[k], o)[last] = v;
};
const fmtVal = (v, f) => (f === "deg" ? `${Math.round(v)}°` : `${Math.round(v * 100)}%`);

function syncDesignControls() {
  $$("[data-bind]").forEach((el) => {
    const v = getPath(design, el.dataset.bind);
    if (el.type === "checkbox") el.checked = !!v;
    else el.value = v;
    const out = el.closest(".slider")?.querySelector("output");
    if (out) out.textContent = fmtVal(Number(v), el.dataset.fmt);
  });
}

function initStudio() {
  // Danh sách kiểu chữ
  const sel = $("#c-style");
  CLOCK_STYLES.forEach(([k, name]) => {
    const o = document.createElement("option");
    o.value = k;
    o.textContent = name;
    sel.append(o);
  });
  syncDesignControls();

  $$("[data-bind]").forEach((el) => {
    const ev = el.type === "range" || el.type === "color" ? "input" : "change";
    el.addEventListener(ev, () => {
      const v = el.type === "checkbox" ? el.checked : el.type === "range" ? Number(el.value) : el.value;
      setPath(design, el.dataset.bind, v);
      const out = el.closest(".slider")?.querySelector("output");
      if (out) out.textContent = fmtVal(Number(v), el.dataset.fmt);
      saveDesign();
      paintAll();
    });
  });

  // Xoay nhanh 90°
  $$("[data-rot]").forEach((b) =>
    b.addEventListener("click", () => {
      const p = b.dataset.rot;
      let v = getPath(design, p) + Number(b.dataset.step);
      if (v > 180) v -= 360;
      if (v < -180) v += 360;
      setPath(design, p, v);
      saveDesign();
      syncDesignControls();
      paintAll();
    })
  );
  $("#img-reset").addEventListener("click", () => {
    design.img = defaultDesign().img;
    saveDesign();
    syncDesignControls();
    paintAll();
  });
  $("#clock-reset").addEventListener("click", () => {
    design.clock = defaultDesign().clock;
    saveDesign();
    syncDesignControls();
    paintAll();
  });

  // Chế độ chỉnh: ảnh hay đồng hồ
  const setMode = (m) => {
    studio.edit = m;
    $("#mode-image").classList.toggle("active", m === "image");
    $("#mode-clock").classList.toggle("active", m === "clock");
  };
  $("#mode-image").addEventListener("click", () => setMode("image"));
  $("#mode-clock").addEventListener("click", () => setMode("clock"));

  // Kéo trên khung để di chuyển ảnh hoặc đồng hồ (giống app)
  let drag = null;
  phone.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".power")) return;
    drag = { x: e.clientX, y: e.clientY };
    phone.setPointerCapture(e.pointerId);
  });
  phone.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = (e.clientX - drag.x) / phone.clientWidth;
    const dy = (e.clientY - drag.y) / phone.clientHeight;
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (studio.edit === "image") {
      design.img.x = clamp(design.img.x + dx, -2, 2);
      design.img.y = clamp(design.img.y + dy, -2, 2);
    } else {
      design.clock.x = clamp(design.clock.x + dx, 0.05, 0.95);
      design.clock.y = clamp(design.clock.y + dy, 0.05, 0.95);
    }
    paintAll();
  });
  const endDrag = () => {
    if (drag) {
      drag = null;
      saveDesign();
    }
  };
  phone.addEventListener("pointerup", endDrag);
  phone.addEventListener("pointercancel", endDrag);

  // Bật / tắt màn hình: ảnh động và âm thanh phát lại từ đầu, giống trên điện thoại
  $("#btn-power").addEventListener("click", () => {
    studio.screenOn = !studio.screenOn;
    $("#screen-off").classList.toggle("on", !studio.screenOn);
    const v = phone.querySelector(".bg-media video");
    if (!studio.screenOn) {
      v?.pause();
      stopStudioAudio();
    } else {
      if (v) {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
      startStudioAudio();
    }
  });

  // Điều khiển ảnh động / âm thanh
  $("#m-loop").addEventListener("change", () => {
    if (!studio.media) return;
    studio.media.loop = $("#m-loop").checked;
    const v = phone.querySelector(".bg-media video");
    if (v) {
      v.loop = studio.media.loop;
      if (v.loop && v.ended) v.play().catch(() => {});
    }
  });
  $("#m-sound").addEventListener("change", () => {
    if (!studio.media) return;
    studio.media.sound = $("#m-sound").checked;
    const v = phone.querySelector(".bg-media video");
    if (v) v.muted = !studio.media.sound;
    if (!studio.media.isVideo) {
      if (studio.media.sound) startStudioAudio();
      else stopStudioAudio();
    }
  });
  $("#m-vol").addEventListener("input", () => {
    if (!studio.media) return;
    studio.media.volume = +$("#m-vol").value;
    $("#m-vol-out").textContent = Math.round(studio.media.volume * 100) + "%";
    if (studio.audio) studio.audio.volume = studio.media.volume;
  });

  // Nút hành động
  $("#s-pick").addEventListener("click", () => $("#s-file").click());
  $("#s-file").addEventListener("change", (e) => {
    handleStudioFile(e.target.files[0]);
    e.target.value = "";
  });
  $("#s-post").addEventListener("click", openPost);
  $("#s-setwall").addEventListener("click", () => {
    const it = studio.media?.item;
    if (!it) {
      toast(
        studio.media
          ? "Hãy bấm “Đăng mẫu” trước (có thể chọn Riêng tư) để đưa mẫu lên, rồi bấm lại nút này"
          : "Chưa có hình nền. Hãy chọn ảnh/video của bạn hoặc áp dụng một bài từ Khám phá"
      );
      return;
    }
    openGetApp(it);
  });
  $("#s-download").addEventListener("click", () => {
    const m = studio.media;
    if (!m) return toast("Chưa có hình nền để tải");
    const a = document.createElement("a");
    if (m.item) {
      a.href = m.item.download;
    } else {
      a.href = m.url;
      a.download = m.file?.name || "hinh-nen";
    }
    a.rel = "noopener";
    document.body.append(a);
    a.click();
    a.remove();
  });
  $("#s-reset").addEventListener("click", async () => {
    if (!(await confirmBox("Đặt lại tất cả?", "Xóa hình nền đang chọn và đưa đồng hồ, ảnh về thiết kế mặc định."))) return;
    design = defaultDesign();
    saveDesign();
    syncDesignControls();
    setStudioMedia(null);
  });

  new ResizeObserver(paintAll).observe(phone);
  setInterval(() => $$(".phone-frame").forEach(tickClockText), 1000);
  paintAll();

  // Khôi phục hình nền đã áp dụng lần trước
  const a = store.get("gw_applied", null);
  if (a && SAFE_ID.test(a.id)) {
    const it = makeItem(a.id, 0, !!a.isVideo, true);
    setStudioMedia({
      isVideo: it.isVideo, url: it.url, item: it, loop: it.loop,
      sound: it.isVideo ? it.sound : !!it.audioUrl, audioUrl: it.audioUrl, volume: 1,
    });
  }
}

/* =====================================================================
 *  Xem bài đăng
 * ===================================================================== */
const viewer = $("#viewer");
let current = null;
let audioEl = null;
let retryTimer = null;
let retryCount = 0;

function stopAudio() {
  if (audioEl) {
    audioEl.pause();
    audioEl = null;
  }
  $("#btn-listen").textContent = "▶ Nghe thử âm thanh";
}

function buildVideo(box, w) {
  const v = document.createElement("video");
  v.playsInline = true;
  v.controls = true;
  v.preload = "auto";
  v.loop = $("#sw-loop").checked;
  v.muted = !$("#sw-sound").checked;
  v.src = w.url;

  const spin = document.createElement("div");
  spin.className = "spin";
  spin.textContent = "Đang tải video…";
  v.addEventListener("loadeddata", () => spin.remove());
  v.addEventListener("error", () => {
    // Video vừa đăng có thể còn đang được Cloudinary xử lý: thử lại thay vì để màn hình đen
    if (retryCount++ < 8) {
      spin.textContent = "Video đang được xử lý, thử lại…";
      retryTimer = setTimeout(() => {
        v.src = w.url;
        v.load();
      }, 3000);
    } else {
      spin.textContent = "Không phát được video. Thử lại sau ít phút.";
    }
  });
  box.append(v, spin);
  v.play().catch(() => {
    v.muted = true;
    $("#sw-sound").checked = false;
    v.play().catch(() => {});
  });
}

function applyViewerControls() {
  const v = $("#v-media video");
  if (v) {
    v.loop = $("#sw-loop").checked;
    v.muted = !$("#sw-sound").checked;
    if (v.loop && v.ended) v.play().catch(() => {});
  }
  const vol = +$("#vol").value;
  if (audioEl) audioEl.volume = vol;
  $("#vol-pct").textContent = Math.round(vol * 100) + "%";
}
["#sw-loop", "#sw-sound", "#vol"].forEach((s) => $(s).addEventListener("input", applyViewerControls));

$("#btn-listen").addEventListener("click", () => {
  if (audioEl) return stopAudio();
  if (!current?.audioUrl) return;
  audioEl = new Audio(current.audioUrl);
  audioEl.volume = +$("#vol").value;
  audioEl.onended = stopAudio;
  audioEl.play().catch(() => {
    toast("Không phát được âm thanh");
    stopAudio();
  });
  $("#btn-listen").textContent = "⏹ Dừng";
});

function openViewer(w) {
  current = w;
  const isMine = state.mine.some((m) => m.id === w.id);

  $("#v-title").textContent = w.title || "Không có tiêu đề";
  $("#v-meta").textContent = `Đăng bởi ${w.author || "Ẩn danh"}` + (w.created ? ` · ${w.created}` : "");

  const chips = $("#v-chips");
  chips.replaceChildren();
  [w.isVideo ? "🎞️ Ảnh động" : "🖼️ Ảnh", w.isPublic ? "🌐 Công khai" : "🔒 Riêng tư", w.sound ? "🔊 Có âm thanh" : null]
    .filter(Boolean)
    .forEach((t) => {
      const s = document.createElement("span");
      s.textContent = t;
      chips.append(s);
    });

  $("#v-note").textContent = w.isVideo
    ? "ℹ️ Trên điện thoại, mỗi lần tắt rồi bật màn hình ảnh động sẽ phát lại từ đầu. Khi tắt Lặp lại, video chạy hết rồi đứng yên ở khung hình cuối."
    : w.sound
    ? "ℹ️ Âm thanh kèm ảnh phát lại từ đầu mỗi khi bật màn hình."
    : "ℹ️ Bấm Đặt làm hình nền để mở ứng dụng Android, hoặc Áp dụng vào khung thiết kế để chỉnh đồng hồ.";

  $("#row-loop").hidden = !w.isVideo;
  $("#row-sound").hidden = !w.isVideo;
  $("#row-vol").hidden = !w.audioUrl; // ảnh động chỉ cần công tắc bật/tắt tiếng, không cần thanh âm lượng
  $("#row-listen").hidden = !w.audioUrl;
  $("#sw-loop").checked = w.loop;
  $("#sw-sound").checked = w.sound;
  $("#vol").value = 1;
  $("#vol-pct").textContent = "100%";

  const box = $("#v-media");
  box.replaceChildren();
  stopAudio();
  clearTimeout(retryTimer);
  retryCount = 0;
  if (w.isVideo) {
    buildVideo(box, w);
  } else {
    const img = document.createElement("img");
    img.alt = w.title || "";
    img.src = w.url;
    box.append(img);
  }

  const dl = $("#v-download");
  dl.href = w.download;
  dl.textContent = w.isVideo ? "⬇ Tải video" : "⬇ Tải ảnh";
  const da = $("#v-audio");
  da.hidden = !w.audioUrl;
  if (w.audioUrl) da.href = w.audioDownload;

  $("#v-owner").hidden = !isMine;
  $("#v-private").hidden = !w.isPublic;
  $("#v-report").hidden = isMine;

  history.replaceState(null, "", `?post=${w.isVideo ? "video" : "image"}:${encodeURIComponent(w.id)}${location.hash}`);
  if (!viewer.open) viewer.showModal();
}

viewer.addEventListener("close", () => {
  $("#v-media").replaceChildren();
  stopAudio();
  clearTimeout(retryTimer);
  history.replaceState(null, "", location.pathname + location.hash);
  current = null;
});
viewer.addEventListener("click", (e) => {
  if (e.target === viewer) viewer.close();
});
$("#v-close").addEventListener("click", () => viewer.close());

$("#v-copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    toast("Đã chép liên kết");
  } catch {
    toast("Không chép được, hãy copy từ thanh địa chỉ");
  }
});
$("#v-apply").addEventListener("click", () => {
  if (!current) return;
  const w = current;
  viewer.close();
  applyToStudio(w);
});
$("#v-setwall").addEventListener("click", () => {
  if (current) openGetApp(current);
});

/* ---------- Hộp xác nhận ---------- */
function confirmBox(title, text) {
  return new Promise((resolve) => {
    const d = $("#confirm");
    $("#c-title").textContent = title;
    $("#c-text").textContent = text;
    const done = (v) => {
      d.close();
      resolve(v);
    };
    $("#c-ok").onclick = () => done(true);
    $("#c-cancel").onclick = () => done(false);
    d.addEventListener("close", () => resolve(false), { once: true }); // bấm Esc
    d.showModal();
  });
}

/* ---------- Quản lý bài của mình ---------- */
async function manage(action) {
  const w = current;
  if (!w) return;
  try {
    // Bài riêng tư vốn không nằm trong Khám phá nên xóa luôn trên trình duyệt, không cần gửi gì lên mạng
    if (!(action === "del" && !w.isPublic)) await markPost(w, action);
    if (action === "del") state.mine = state.mine.filter((m) => m.id !== w.id);
    else state.mine = state.mine.map((m) => (m.id === w.id ? { ...m, isPublic: false } : m));
    saveMine();
    toast(action === "del" ? "Đã xóa bài đăng" : "Đã chuyển sang riêng tư");
    viewer.close();
    state.lists = { image: null, video: null };
    load(true);
  } catch (e) {
    toast(e.message || "Không thực hiện được");
  }
}
$("#v-private").addEventListener("click", async () => {
  if (await confirmBox("Chuyển sang riêng tư?", "Bài sẽ không còn hiện trong Khám phá, chỉ còn ở mục Của tôi.")) manage("priv");
});
$("#v-delete").addEventListener("click", async () => {
  if (await confirmBox("Xóa bài đăng?", "Bài sẽ biến mất khỏi Khám phá và mục Của tôi.")) manage("del");
});

/* ---------- Báo cáo ---------- */
$("#v-report").addEventListener("click", () => {
  $("#r-error").textContent = "";
  $("#r-note").value = "";
  $("#report").showModal();
});
$("#r-cancel").addEventListener("click", () => $("#report").close());
$("#r-send").addEventListener("click", async () => {
  if (!current) return;
  const btn = $("#r-send");
  btn.disabled = true;
  $("#r-error").textContent = "";
  try {
    const reason = $("input[name=reason]:checked").value;
    await sendReport(current, reason, $("#r-note").value.trim());
    state.reported.add(current.id);
    store.set("gw_reported", [...state.reported]);
    toast("Đã gửi báo cáo. Bài này sẽ được ẩn khỏi trình duyệt của bạn");
    $("#report").close();
    viewer.close();
    render();
  } catch (e) {
    $("#r-error").textContent = e.message || "Gửi báo cáo thất bại";
  }
  btn.disabled = false;
});

/* =====================================================================
 *  Đăng mẫu của tôi (hiện luôn mẫu thiết kế định đăng)
 * ===================================================================== */
const up = { audio: null, busy: false };
const dlgUpload = $("#upload");
const setUpErr = (m) => ($("#u-error").textContent = m);

function syncUploadTexts() {
  const pub = $("#u-public").checked;
  $("#u-public-title").textContent = pub ? "Công khai" : "Riêng tư";
  $("#u-public-sub").textContent = pub ? "Mọi người thấy trong Khám phá" : "Không hiện trong Khám phá, chỉ có ở mục Của tôi";
  const snd = $("#u-sound").checked;
  $("#u-sound-title").textContent = snd ? "Âm thanh: Bật" : "Âm thanh: Tắt";
  $("#u-sound-sub").textContent = snd ? "Khi cài làm hình nền, video phát cả tiếng" : "Video chạy im lặng";
  const lp = $("#u-loop").checked;
  $("#u-loop-title").textContent = lp ? "Lặp lại: Bật" : "Lặp lại: Tắt";
  $("#u-loop-sub").textContent = lp ? "Video chạy lặp mãi làm hình nền" : "Chạy hết video rồi dừng ở khung hình cuối";
}

function updateSubmit() {
  const needName = !user();
  const ok = $("#u-title").value.trim() && (!needName || $("#u-name").value.trim());
  $("#u-submit").disabled = up.busy || !ok;
  $("#u-close").disabled = up.busy;
}

function openPost() {
  const m = studio.media;
  if (!m?.file) {
    toast("Hãy bấm “📁 Chọn ảnh / video của tôi”, căn chỉnh rồi mới đăng mẫu");
    return;
  }

  // Bản xem trước: đúng khung thiết kế người dùng đã làm
  const holder = $("#u-phone");
  holder.replaceChildren();
  const mini = $("#tpl-phone").content.firstElementChild.cloneNode(true);
  holder.append(mini);
  renderMedia(mini, m, { forceMuted: true });

  $("#u-title").value = "";
  $("#u-count").textContent = `0/${CONFIG.MAX_TITLE_CHARS}`;
  up.audio = null;
  $("#u-audio").value = "";
  $("#u-audio-name").textContent = "🎵 Thêm âm thanh (tùy chọn)";
  $("#u-audio-clear").hidden = true;
  $("#u-audio-row").hidden = m.isVideo;
  $("#u-video-rows").hidden = !m.isVideo;
  $("#u-public").checked = true;
  $("#u-sound").checked = m.sound;
  $("#u-loop").checked = m.loop;
  $("#u-progress").hidden = true;
  $("#u-stage").textContent = "";
  setUpErr("");
  syncUploadTexts();

  // Tên người đăng: đã đăng nhập thì khỏi nhập, chưa thì bắt nhập và lưu sẵn
  const u = user();
  $("#u-name-field").hidden = !!u;
  $("#u-name-google").hidden = !u;
  if (u) $("#u-name-google").textContent = `Đăng với tên tài khoản Google: ${u.name}`;
  else $("#u-name").value = savedName();

  updateSubmit();
  dlgUpload.showModal();
  requestAnimationFrame(() => {
    paintBg(mini);
    paintClock(mini);
  });
}

async function handleAudio(file) {
  if (!file) return;
  setUpErr("");
  const sec = await mediaSeconds(file, "audio");
  if (sec == null) return setUpErr("Không đọc được tệp âm thanh này");
  if (sec < 1 || sec > CONFIG.MAX_AUDIO_SECONDS) {
    return setUpErr(`Âm thanh dài ${sec}s. Chỉ nhận từ 1 đến ${CONFIG.MAX_AUDIO_SECONDS} giây`);
  }
  up.audio = file;
  $("#u-audio-name").textContent = `🎵 ${file.name} · ${sec}s`;
  $("#u-audio-clear").hidden = false;
}

$("#u-close").addEventListener("click", () => !up.busy && dlgUpload.close());
dlgUpload.addEventListener("cancel", (e) => up.busy && e.preventDefault());
$("#u-title").addEventListener("input", () => {
  $("#u-count").textContent = `${$("#u-title").value.length}/${CONFIG.MAX_TITLE_CHARS}`;
  updateSubmit();
});
$("#u-name").addEventListener("input", () => {
  store.set("gw_name", $("#u-name").value.trim()); // lưu sẵn cho lần đăng sau
  updateSubmit();
});
["#u-public", "#u-sound", "#u-loop"].forEach((s) => $(s).addEventListener("change", syncUploadTexts));
$("#u-audio-btn").addEventListener("click", () => $("#u-audio").click());
$("#u-audio").addEventListener("change", (e) => handleAudio(e.target.files[0]));
$("#u-audio-clear").addEventListener("click", () => {
  up.audio = null;
  $("#u-audio").value = "";
  $("#u-audio-name").textContent = "🎵 Thêm âm thanh (tùy chọn)";
  $("#u-audio-clear").hidden = true;
});

$("#u-submit").addEventListener("click", async () => {
  const m = studio.media;
  if (up.busy || !m?.file) return;
  const u = user();
  const author = u ? u.name : $("#u-name").value.trim();
  const title = $("#u-title").value.trim();
  if (!title) return setUpErr("Hãy nhập tiêu đề");
  if (!author) return setUpErr("Hãy nhập tên người đăng");
  if (!u) store.set("gw_name", author);

  up.busy = true;
  updateSubmit();
  setUpErr("");
  const prog = $("#u-progress");
  prog.hidden = false;
  prog.value = 0;
  try {
    const { item, cfgOk } = await createPost({
      isVideo: m.isVideo,
      file: m.file,
      audio: up.audio,
      title,
      author,
      isPublic: $("#u-public").checked,
      loop: $("#u-loop").checked,
      sound: $("#u-sound").checked,
      design: JSON.parse(JSON.stringify(design)),
      onStage: (t) => {
        $("#u-stage").textContent = t;
        prog.value = 0;
      },
      onProgress: (p) => (prog.value = p),
    });
    state.mine.push(item);
    saveMine();
    m.item = item; // từ giờ có thể "Đặt làm hình nền" bằng ứng dụng
    store.set("gw_applied", { id: item.id, isVideo: item.isVideo });
    toast(
      (item.isPublic ? "Đã đăng lên Khám phá" : "Đã lưu ở chế độ riêng tư") +
        (cfgOk ? "" : " (chưa lưu được mẫu thiết kế)")
    );
    up.busy = false;
    dlgUpload.close();
    state.lists = { image: null, video: null };
  } catch (e) {
    setUpErr(e.message || "Đăng thất bại");
  }
  up.busy = false;
  prog.hidden = true;
  $("#u-stage").textContent = "";
  updateSubmit();
});

/* =====================================================================
 *  Đặt làm hình nền: mở ứng dụng hoặc tải ứng dụng
 * ===================================================================== */
const isAndroid = /Android/i.test(navigator.userAgent);

function appLink(item) {
  const kind = item.isVideo ? "video" : "image";
  return `${CONFIG.APP_SCHEME}://open?kind=${kind}&id=${encodeURIComponent(item.id)}`;
}

/** Link intent của Android: mở app nếu đã cài, chưa cài thì chuyển về trang Tải ứng dụng */
function intentLink(item) {
  const kind = item.isVideo ? "video" : "image";
  const fallback = encodeURIComponent(location.origin + location.pathname + "#/app");
  return (
    `intent://open?kind=${kind}&id=${encodeURIComponent(item.id)}` +
    `#Intent;scheme=${CONFIG.APP_SCHEME};package=${CONFIG.APP_PACKAGE};` +
    `S.browser_fallback_url=${fallback};end`
  );
}

function openGetApp(item) {
  $("#g-item").textContent = `Bài: ${item.title || "Không có tiêu đề"}` + (item.author ? ` · ${item.author}` : "");
  $("#g-android").hidden = !isAndroid;
  $("#g-other").hidden = isAndroid;
  $("#g-open").href = intentLink(item);
  for (const id of ["#g-apk", "#g-apk2"]) $(id).href = CONFIG.APK_URL;
  $("#g-copy").onclick = async () => {
    const link = `${location.origin}${location.pathname}?post=${item.isVideo ? "video" : "image"}:${encodeURIComponent(item.id)}#/explore`;
    try {
      await navigator.clipboard.writeText(link);
      toast("Đã chép liên kết, hãy mở trên điện thoại");
    } catch {
      toast(link);
    }
  };
  $("#getapp").showModal();
}
$("#g-close").addEventListener("click", () => $("#getapp").close());

async function checkApk() {
  const btn = $("#apk-btn");
  const info = $("#apk-info");
  btn.href = CONFIG.APK_URL;
  info.textContent = "";
  try {
    const r = await fetch(CONFIG.APK_URL, { method: "HEAD" });
    if (r.ok) {
      const len = Number(r.headers.get("content-length"));
      if (len) info.textContent = `Dung lượng khoảng ${(len / 1048576).toFixed(1)} MB`;
    } else {
      info.textContent = "Chưa có file ứng dụng trên máy chủ. (Chủ trang: hãy đưa file APK vào repo, đúng tên trong config.js)";
    }
  } catch {
    /* bỏ qua */
  }
}

/* =====================================================================
 *  Tài khoản, hồ sơ, đăng nhập Google
 * ===================================================================== */
function renderAccountButton() {
  const u = user();
  const btn = $("#acc-btn");
  btn.replaceChildren();
  const av = u?.picture ? document.createElement("img") : document.createElement("span");
  av.className = "av";
  if (u?.picture) {
    av.alt = "";
    av.referrerPolicy = "no-referrer";
    av.src = u.picture;
  } else {
    av.textContent = (authorName()[0] || "?").toUpperCase();
  }
  const nm = document.createElement("span");
  nm.className = "nm";
  nm.textContent = authorName();
  btn.append(av, nm);

  $("#acc-name").textContent = authorName();
  $("#acc-mail").textContent = u?.email || "Chưa đăng nhập";
  $("#acc-signout").hidden = !u;
}

function signOut() {
  window.google?.accounts?.id?.disableAutoSelect();
  store.set("gw_user", null);
  renderAccountButton();
  renderProfile();
  toast("Đã đăng xuất");
}

function renderProfile() {
  const u = user();
  $("#pf-name").textContent = authorName();
  $("#pf-mail").textContent = u?.email || "Chưa đăng nhập";

  const av = $("#pf-avatar");
  av.replaceChildren();
  if (u?.picture) {
    const img = document.createElement("img");
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    img.src = u.picture;
    av.append(img);
  } else {
    av.textContent = (authorName()[0] || "?").toUpperCase();
  }

  $("#st-all").textContent = state.mine.length;
  $("#st-pub").textContent = state.mine.filter((m) => m.isPublic).length;
  $("#st-priv").textContent = state.mine.filter((m) => !m.isPublic).length;

  $("#pf-name-box").hidden = !!u;
  $("#pf-name-google").hidden = !u;
  if (u) $("#pf-name-google").textContent = `Đang dùng tên tài khoản Google: ${u.name}. Không cần nhập tên khi đăng bài.`;
  else $("#pf-name-input").value = savedName();
  $("#pf-signout").hidden = !u;

  const g = $("#pf-google");
  g.replaceChildren();
  if (!u && CONFIG.GOOGLE_CLIENT_ID && window.google?.accounts?.id) {
    window.google.accounts.id.renderButton(g, { theme: "filled_black", size: "large", shape: "pill", text: "signin_with" });
  }

  const p = prefs();
  $("#pref-sound").checked = p.sound;
  $("#pref-loop").checked = p.loop;
}

function initAccount() {
  renderAccountButton();
  $("#acc-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const m = $("#acc-menu");
    m.hidden = !m.hidden;
    $("#acc-btn").setAttribute("aria-expanded", String(!m.hidden));
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".acc-wrap")) $("#acc-menu").hidden = true;
  });
  $("#acc-menu").addEventListener("click", (e) => {
    if (e.target.closest("a, button")) $("#acc-menu").hidden = true;
  });
  $("#acc-signout").addEventListener("click", signOut);
  $("#pf-signout").addEventListener("click", signOut);

  $("#pf-name-input").addEventListener("input", () => {
    store.set("gw_name", $("#pf-name-input").value.trim());
    renderAccountButton();
    $("#pf-name").textContent = authorName();
  });
  $("#pref-sound").addEventListener("change", () => store.set("gw_pref", { ...prefs(), sound: $("#pref-sound").checked }));
  $("#pref-loop").addEventListener("change", () => store.set("gw_pref", { ...prefs(), loop: $("#pref-loop").checked }));
  $("#pf-clear").addEventListener("click", async () => {
    if (!(await confirmBox("Xóa dữ liệu trình duyệt?", "Mẫu thiết kế, mục Của tôi, tên đã lưu và bài đã báo cáo sẽ bị xóa khỏi trình duyệt này."))) return;
    ["gw_design", "gw_mine", "gw_name", "gw_reported", "gw_applied", "gw_pref", "gw_user"].forEach((k) => localStorage.removeItem(k));
    location.href = location.pathname + "#/studio";
    location.reload();
  });

  if (!CONFIG.GOOGLE_CLIENT_ID) return;
  const s = document.createElement("script");
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  s.onload = () => {
    window.google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: (resp) => {
        try {
          const p = JSON.parse(unb64(resp.credential.split(".")[1]));
          // Chỉ để hiển thị tên; chưa xác minh phía máy chủ
          store.set("gw_user", { name: p.name || p.email, email: p.email, picture: p.picture });
          renderAccountButton();
          renderProfile();
          toast("Xin chào " + (p.name || p.email));
        } catch {
          toast("Đăng nhập thất bại");
        }
      },
    });
    renderProfile();
  };
  document.head.append(s);
}

/* =====================================================================
 *  Khởi động
 * ===================================================================== */
async function openFromQuery() {
  const m = (new URLSearchParams(location.search).get("post") || "").match(/^(image|video):(.+)$/);
  if (!m) return;
  const id = m[2];
  if (!SAFE_ID.test(id)) return;
  const mineItem = state.mine.find((x) => x.id === id);
  const key = postKey(id);
  if (!mineItem && key) {
    const hidden = await listHidden().catch(() => new Set());
    if (hidden.has(key)) {
      toast("Bài đăng đã bị xóa hoặc chuyển riêng tư");
      history.replaceState(null, "", location.pathname + location.hash);
      return;
    }
  }
  openViewer(mineItem || makeItem(id, 0, m[1] === "video", true));
}

initAccount();
initStudio();
window.addEventListener("hashchange", route);
route();
openFromQuery();
