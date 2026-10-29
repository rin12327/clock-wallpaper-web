import { CONFIG } from "./config.js";

/* =====================================================================
 *  Tiện ích
 * ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const enc = new TextEncoder();
const dec = new TextDecoder();

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

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 3400);
}

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

/** Khóa duy nhất của một bài (dãy số thời gian) dùng cho "bia mộ" xóa / riêng tư */
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

async function createPost({ isVideo, file, audio, title, author, isPublic, loop, sound, onStage, onProgress }) {
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
  return makeItem(j.public_id, j.version, isVideo, isPublic, fmtDate(new Date().toISOString()));
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
    id: item.id,
    video: item.isVideo,
    title: item.title,
    author: item.author,
    reason,
    note,
    reporter: authorName(),
    time: ts,
  });
}

/* =====================================================================
 *  Trạng thái
 * ===================================================================== */
const state = {
  tab: "image", // image | video | mine
  q: "",
  lists: { image: null, video: null },
  hidden: new Set(),
  reported: new Set(store.get("gw_reported", [])),
  mine: store.get("gw_mine", []).map((m) => makeItem(m.id, 0, m.isVideo, m.isPublic, m.created || "")),
  loading: false,
  error: null,
};

const saveMine = () =>
  store.set(
    "gw_mine",
    state.mine.map((m) => ({ id: m.id, isVideo: m.isVideo, isPublic: m.isPublic, created: m.created }))
  );

const user = () => store.get("gw_user", null);
const authorName = () => user()?.name || store.get("gw_name", "") || "Khách";

/* =====================================================================
 *  Lưới Khám phá
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
      ? "Bạn chưa đăng gì. Bấm “＋ Đăng” để bắt đầu."
      : "Chưa có gì ở đây. Hãy là người đăng đầu tiên!";
    return;
  }
  items.forEach((w) => grid.append(card(w, mineMode)));
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
  v.volume = +$("#vol").value;
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
    // Trình duyệt chặn tự phát có tiếng: tắt tiếng rồi phát
    v.muted = true;
    $("#sw-sound").checked = false;
    v.play().catch(() => {});
  });
}

function applyControls() {
  const v = $("#v-media video");
  const vol = +$("#vol").value;
  if (v) {
    v.loop = $("#sw-loop").checked;
    v.muted = !$("#sw-sound").checked;
    v.volume = vol;
    if (v.loop && v.ended) v.play().catch(() => {});
  }
  if (audioEl) audioEl.volume = vol;
  $("#vol-pct").textContent = Math.round(vol * 100) + "%";
}
["#sw-loop", "#sw-sound", "#vol"].forEach((s) => $(s).addEventListener("input", applyControls));

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
    : "ℹ️ Tải ảnh về rồi đặt làm hình nền, hoặc dùng ứng dụng Android để đặt và căn chỉnh đồng hồ.";

  // Công tắc xem thử
  $("#row-loop").hidden = !w.isVideo;
  $("#row-sound").hidden = !w.isVideo;
  $("#row-vol").hidden = !(w.isVideo || w.audioUrl);
  $("#row-listen").hidden = !w.audioUrl;
  $("#sw-loop").checked = w.loop;
  $("#sw-sound").checked = w.sound;
  $("#vol").value = 1;
  $("#vol-pct").textContent = "100%";

  // Phần xem
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

  // Tải xuống
  const dl = $("#v-download");
  dl.href = w.download;
  dl.textContent = w.isVideo ? "⬇ Tải video" : "⬇ Tải ảnh";
  const da = $("#v-audio");
  da.hidden = !w.audioUrl;
  if (w.audioUrl) da.href = w.audioDownload;

  // Chủ bài thấy nút quản lý, người khác thấy nút báo cáo
  $("#v-owner").hidden = !isMine;
  $("#v-private").hidden = !w.isPublic;
  $("#v-report").hidden = isMine;

  history.replaceState(null, "", `#post=${w.isVideo ? "video" : "image"}:${encodeURIComponent(w.id)}`);
  if (!viewer.open) viewer.showModal();
}

viewer.addEventListener("close", () => {
  $("#v-media").replaceChildren();
  stopAudio();
  clearTimeout(retryTimer);
  history.replaceState(null, "", location.pathname + location.search);
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
 *  Đăng bài
 * ===================================================================== */
const up = { isVideo: false, file: null, audio: null, busy: false, previewUrl: null };
const dlgUpload = $("#upload");

const setUpErr = (m) => ($("#u-error").textContent = m);

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
  $("#u-submit").disabled = up.busy || !up.file || !$("#u-title").value.trim();
  $("#u-close").disabled = up.busy;
}

function clearPreview() {
  if (up.previewUrl) URL.revokeObjectURL(up.previewUrl);
  up.previewUrl = null;
  $("#u-preview").replaceChildren();
  $("#u-drop").classList.remove("has");
  $("#u-drop-text").hidden = false;
  $("#u-drop-text").textContent = up.isVideo
    ? `Chạm hoặc kéo thả video vào đây\n(1–${CONFIG.MAX_VIDEO_SECONDS} giây)`
    : "Chạm hoặc kéo thả ảnh vào đây";
}

function setUploadType(isVideo) {
  up.isVideo = isVideo;
  up.file = null;
  up.audio = null;
  $("#u-type-image").classList.toggle("active", !isVideo);
  $("#u-type-video").classList.toggle("active", isVideo);
  $("#u-file").accept = isVideo ? "video/*" : "image/*";
  $("#u-file").value = "";
  $("#u-audio").value = "";
  $("#u-audio-row").hidden = isVideo;
  $("#u-video-rows").hidden = !isVideo;
  $("#u-audio-name").textContent = "🎵 Thêm âm thanh (tùy chọn)";
  $("#u-audio-clear").hidden = true;
  setUpErr("");
  clearPreview();
  updateSubmit();
}

function openUpload(isVideo = false) {
  $("#u-title").value = "";
  $("#u-count").textContent = `0/${CONFIG.MAX_TITLE_CHARS}`;
  $("#u-author").textContent = authorName();
  $("#u-public").checked = true;
  $("#u-sound").checked = true;
  $("#u-loop").checked = true;
  $("#u-progress").hidden = true;
  $("#u-stage").textContent = "";
  syncUploadTexts();
  setUploadType(isVideo);
  dlgUpload.showModal();
}

async function handleFile(file) {
  if (!file) return;
  setUpErr("");
  if (up.isVideo) {
    if (!file.type.startsWith("video/")) return setUpErr("Hãy chọn một tệp video");
    const sec = await mediaSeconds(file, "video");
    if (sec == null) return setUpErr("Không đọc được video này");
    if (sec < 1 || sec > CONFIG.MAX_VIDEO_SECONDS) {
      return setUpErr(`Video dài ${sec}s. Chỉ nhận video từ 1 đến ${CONFIG.MAX_VIDEO_SECONDS} giây`);
    }
  } else if (!file.type.startsWith("image/")) {
    return setUpErr("Hãy chọn một tệp ảnh");
  }
  up.file = file;

  clearPreview();
  up.previewUrl = URL.createObjectURL(file);
  const el = document.createElement(up.isVideo ? "video" : "img");
  el.src = up.previewUrl;
  if (up.isVideo) {
    el.muted = true;
    el.loop = true;
    el.autoplay = true;
    el.playsInline = true;
  }
  $("#u-preview").append(el);
  $("#u-drop").classList.add("has");
  $("#u-drop-text").hidden = true;
  updateSubmit();
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

// Sự kiện của hộp đăng bài
$("#btn-upload").addEventListener("click", () => openUpload(state.tab === "video"));
$("#u-close").addEventListener("click", () => !up.busy && dlgUpload.close());
dlgUpload.addEventListener("cancel", (e) => up.busy && e.preventDefault());
$("#u-type-image").addEventListener("click", () => setUploadType(false));
$("#u-type-video").addEventListener("click", () => setUploadType(true));
$("#u-title").addEventListener("input", () => {
  $("#u-count").textContent = `${$("#u-title").value.length}/${CONFIG.MAX_TITLE_CHARS}`;
  updateSubmit();
});
["#u-public", "#u-sound", "#u-loop"].forEach((s) => $(s).addEventListener("change", syncUploadTexts));
$("#u-rename").addEventListener("click", () => {
  if (user()) return toast("Đang dùng tên tài khoản Google");
  const n = prompt("Tên hiển thị trên bài đăng (tối đa 20 ký tự)", store.get("gw_name", ""));
  if (n !== null) {
    store.set("gw_name", n.trim().slice(0, 20));
    $("#u-author").textContent = authorName();
  }
});

const drop = $("#u-drop");
drop.addEventListener("click", () => $("#u-file").click());
drop.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && $("#u-file").click());
drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  drop.classList.add("over");
});
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("over");
  handleFile(e.dataTransfer.files[0]);
});
$("#u-file").addEventListener("change", (e) => handleFile(e.target.files[0]));
$("#u-audio-btn").addEventListener("click", () => $("#u-audio").click());
$("#u-audio").addEventListener("change", (e) => handleAudio(e.target.files[0]));
$("#u-audio-clear").addEventListener("click", () => {
  up.audio = null;
  $("#u-audio").value = "";
  $("#u-audio-name").textContent = "🎵 Thêm âm thanh (tùy chọn)";
  $("#u-audio-clear").hidden = true;
});

$("#u-submit").addEventListener("click", async () => {
  if (up.busy || !up.file) return;
  up.busy = true;
  updateSubmit();
  setUpErr("");
  const prog = $("#u-progress");
  prog.hidden = false;
  prog.value = 0;
  try {
    const item = await createPost({
      isVideo: up.isVideo,
      file: up.file,
      audio: up.audio,
      title: $("#u-title").value.trim(),
      author: authorName(),
      isPublic: $("#u-public").checked,
      loop: $("#u-loop").checked,
      sound: $("#u-sound").checked,
      onStage: (t) => {
        $("#u-stage").textContent = t;
        prog.value = 0;
      },
      onProgress: (p) => (prog.value = p),
    });
    state.mine.push(item);
    saveMine();
    toast(item.isPublic ? "Đã đăng lên Khám phá" : "Đã lưu ở chế độ riêng tư");
    up.busy = false;
    dlgUpload.close();
    state.lists = { image: null, video: null };
    load(true);
  } catch (e) {
    setUpErr(e.message || "Đăng thất bại");
  }
  up.busy = false;
  prog.hidden = true;
  $("#u-stage").textContent = "";
  updateSubmit();
});

/* =====================================================================
 *  Đăng nhập Google (tùy chọn)
 * ===================================================================== */
function renderAccount() {
  const box = $("#account");
  box.replaceChildren();
  const u = user();
  if (u) {
    if (u.picture) {
      const img = document.createElement("img");
      img.alt = "";
      img.referrerPolicy = "no-referrer";
      img.src = u.picture;
      box.append(img);
    }
    const n = document.createElement("span");
    n.className = "name";
    n.textContent = u.name;
    const out = document.createElement("button");
    out.className = "link";
    out.textContent = "Đăng xuất";
    out.onclick = () => {
      window.google?.accounts?.id?.disableAutoSelect();
      store.set("gw_user", null);
      renderAccount();
    };
    box.append(n, out);
    return;
  }
  if (CONFIG.GOOGLE_CLIENT_ID && window.google?.accounts?.id) {
    const holder = document.createElement("div");
    box.append(holder);
    window.google.accounts.id.renderButton(holder, { theme: "filled_black", size: "medium", shape: "pill", text: "signin" });
  } else {
    const n = document.createElement("span");
    n.className = "name dim";
    n.textContent = authorName();
    box.append(n);
  }
}

function initGoogle() {
  renderAccount();
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
          renderAccount();
          toast("Xin chào " + (p.name || p.email));
        } catch {
          toast("Đăng nhập thất bại");
        }
      },
    });
    renderAccount();
  };
  document.head.append(s);
}

/* =====================================================================
 *  Khung điện thoại: "Áp dụng" hình nền + đồng hồ (giống màn hình điện thoại)
 * ===================================================================== */
const CLOCK_STYLES = [
  ["digital", "Điện tử LED (Digital)"],
  ["neon", "Neon phát sáng"],
  ["cyberpunk", "Cyberpunk lỗi hình"],
  ["retro", "Retro pixel cổ điển"],
  ["bold", "Đậm mạnh mẽ (Bold)"],
  ["serif", "Cổ điển (Serif)"],
  ["serif_italic", "Serif nghiêng sang trọng"],
  ["cursive", "Thư pháp (Cursive)"],
  ["outline", "Chữ rỗng viền (Outline)"],
  ["gradient", "Chuyển màu (Gradient)"],
  ["shadow3d", "Nổi khối 3D"],
  ["elegant", "Thanh mảnh thanh lịch"],
];

const clockCfg = {
  x: 0.5, y: 0.35, scale: 1, color: "#ffffff", style: "digital",
  showClock: true, showSeconds: true, showDate: true,
  ...store.get("gw_clock", {}),
};
const saveClock = () => store.set("gw_clock", clockCfg);

let applied = null; // bài đang áp dụng trong khung điện thoại
let appliedAudio = null;
let screenOn = true;
let appliedRetry = 0;
let appliedTimer = null;

const two = (n) => String(n).padStart(2, "0");

function tickClock() {
  const d = new Date();
  $("#t-time").textContent = `${two(d.getHours())}:${two(d.getMinutes())}` + (clockCfg.showSeconds ? `:${two(d.getSeconds())}` : "");
  $("#t-date").textContent = `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function styleClock() {
  const c = $("#clock");
  c.hidden = !clockCfg.showClock && !clockCfg.showDate;
  $("#t-time").hidden = !clockCfg.showClock;
  $("#t-date").hidden = !clockCfg.showDate;
  c.style.left = clockCfg.x * 100 + "%";
  c.style.top = clockCfg.y * 100 + "%";
  // Cỡ chữ = 10% chiều rộng khung * hệ số, giống hệt app Android
  c.style.setProperty("--fs", $("#phone").clientWidth * 0.1 * clockCfg.scale + "px");
  c.style.setProperty("--c", clockCfg.color);
  c.className = `clock-overlay fs-${clockCfg.style}` + (!clockCfg.showClock ? " only-date" : "");
  $("#c-size-pct").textContent = Math.round(clockCfg.scale * 100) + "%";
  tickClock();
}

function stopAppliedAudio() {
  if (appliedAudio) {
    appliedAudio.pause();
    appliedAudio = null;
  }
}

function startAppliedAudio() {
  stopAppliedAudio();
  if (!applied?.audioUrl || !$("#p-sound").checked || !screenOn) return;
  appliedAudio = new Audio(applied.audioUrl);
  appliedAudio.volume = +$("#p-vol").value;
  appliedAudio.play().catch(() => {});
}

/** Công tắc Lặp lại / Âm thanh / Âm lượng của khung điện thoại có tác dụng ngay */
function applyPhoneMedia() {
  const v = $("#bg-media video");
  const vol = +$("#p-vol").value;
  if (v) {
    v.loop = $("#p-loop").checked;
    v.muted = !$("#p-sound").checked;
    v.volume = vol;
    if (v.loop && v.ended && screenOn) v.play().catch(() => {});
  } else if (applied?.audioUrl) {
    if ($("#p-sound").checked) {
      if (!appliedAudio) startAppliedAudio();
    } else {
      stopAppliedAudio();
    }
  }
  if (appliedAudio) appliedAudio.volume = vol;
  $("#p-vol-pct").textContent = Math.round(vol * 100) + "%";
}

function applyToPhone(w, opts = {}) {
  applied = w;
  store.set("gw_applied", { id: w.id, isVideo: w.isVideo });
  clearTimeout(appliedTimer);
  appliedRetry = 0;
  stopAppliedAudio();

  const loop = opts.loop ?? w.loop;
  const sound = opts.sound ?? (w.isVideo ? w.sound : !!w.audioUrl);
  const volume = opts.volume ?? 1;

  $("#p-media-ctl").hidden = !(w.isVideo || w.audioUrl);
  $("#p-loop-row").hidden = !w.isVideo;
  $("#p-loop").checked = loop;
  $("#p-sound").checked = sound;
  $("#p-vol").value = volume;
  $("#p-vol-pct").textContent = Math.round(volume * 100) + "%";

  $("#bg-empty").hidden = true;
  const box = $("#bg-media");
  box.replaceChildren();
  screenOn = true;
  $("#screen-off").classList.remove("on");

  if (w.isVideo) {
    const v = document.createElement("video");
    v.playsInline = true;
    v.autoplay = true;
    v.loop = loop;
    v.muted = !sound;
    v.volume = volume;
    v.src = w.url;
    v.addEventListener("error", () => {
      // Video vừa đăng có thể còn đang được Cloudinary xử lý: thử lại thay vì để màn hình đen
      if (appliedRetry++ < 8) {
        appliedTimer = setTimeout(() => {
          v.src = w.url;
          v.load();
          v.play().catch(() => {});
        }, 3000);
      }
    });
    box.append(v);
    v.play().catch(() => {
      // Trình duyệt chặn tự phát có tiếng: tắt tiếng rồi phát
      v.muted = true;
      $("#p-sound").checked = false;
      v.play().catch(() => {});
    });
  } else {
    const img = document.createElement("img");
    img.alt = w.title || "";
    img.src = w.url;
    box.append(img);
    if (w.audioUrl && sound) startAppliedAudio();
  }
  styleClock();
}

function clearPhone() {
  applied = null;
  store.set("gw_applied", null);
  clearTimeout(appliedTimer);
  stopAppliedAudio();
  $("#bg-media").replaceChildren();
  $("#bg-empty").hidden = false;
  $("#p-media-ctl").hidden = true;
}

function togglePower() {
  screenOn = !screenOn;
  $("#screen-off").classList.toggle("on", !screenOn);
  const v = $("#bg-media video");
  if (!screenOn) {
    v?.pause();
    stopAppliedAudio();
  } else {
    // Bật màn hình: ảnh động và âm thanh phát lại từ đầu, giống trên điện thoại
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    startAppliedAudio();
  }
}

function initPhone() {
  // Bảng điều khiển đồng hồ
  const sel = $("#c-style");
  CLOCK_STYLES.forEach(([k, name]) => {
    const o = document.createElement("option");
    o.value = k;
    o.textContent = name;
    sel.append(o);
  });
  if (!CLOCK_STYLES.some(([k]) => k === clockCfg.style)) clockCfg.style = "digital";

  $("#c-show").checked = clockCfg.showClock;
  $("#c-sec").checked = clockCfg.showSeconds;
  $("#c-date").checked = clockCfg.showDate;
  sel.value = clockCfg.style;
  $("#c-color").value = clockCfg.color;
  $("#c-size").value = clockCfg.scale;

  const bind = (id, ev, fn) =>
    $(id).addEventListener(ev, () => {
      fn();
      saveClock();
      styleClock();
    });
  bind("#c-show", "change", () => (clockCfg.showClock = $("#c-show").checked));
  bind("#c-sec", "change", () => (clockCfg.showSeconds = $("#c-sec").checked));
  bind("#c-date", "change", () => (clockCfg.showDate = $("#c-date").checked));
  bind("#c-style", "change", () => (clockCfg.style = sel.value));
  bind("#c-color", "input", () => (clockCfg.color = $("#c-color").value));
  bind("#c-size", "input", () => (clockCfg.scale = +$("#c-size").value));
  $("#c-reset").addEventListener("click", () => {
    clockCfg.x = 0.5;
    clockCfg.y = 0.35;
    clockCfg.scale = 1;
    $("#c-size").value = 1;
    saveClock();
    styleClock();
  });

  // Kéo đồng hồ để đổi vị trí
  const clockEl = $("#clock");
  let dragging = false;
  clockEl.addEventListener("pointerdown", (e) => {
    dragging = true;
    clockEl.setPointerCapture(e.pointerId);
  });
  clockEl.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const r = $("#phone").getBoundingClientRect();
    clockCfg.x = Math.min(0.95, Math.max(0.05, (e.clientX - r.left) / r.width));
    clockCfg.y = Math.min(0.95, Math.max(0.05, (e.clientY - r.top) / r.height));
    styleClock();
  });
  const endDrag = () => {
    if (dragging) {
      dragging = false;
      saveClock();
    }
  };
  clockEl.addEventListener("pointerup", endDrag);
  clockEl.addEventListener("pointercancel", endDrag);

  // Điều khiển ảnh động / âm thanh
  ["#p-loop", "#p-sound", "#p-vol"].forEach((s) => $(s).addEventListener("input", applyPhoneMedia));
  $("#btn-power").addEventListener("click", togglePower);
  $("#p-clear").addEventListener("click", () => {
    clearPhone();
    toast("Đã gỡ hình nền");
  });

  // Nút "Áp dụng" trong cửa sổ xem bài
  $("#v-apply").addEventListener("click", () => {
    if (!current) return;
    applyToPhone(current, {
      loop: $("#sw-loop").checked,
      sound: current.isVideo ? $("#sw-sound").checked : !!current.audioUrl,
      volume: +$("#vol").value,
    });
    viewer.close();
    $("#phone").scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Đã áp dụng vào khung điện thoại");
  });

  new ResizeObserver(styleClock).observe($("#phone"));
  setInterval(tickClock, 1000);
  styleClock();

  // Khôi phục hình nền đã áp dụng lần trước
  const a = store.get("gw_applied", null);
  if (a && SAFE_ID.test(a.id)) applyToPhone(makeItem(a.id, 0, !!a.isVideo, true));
}

/* =====================================================================
 *  Khởi động
 * ===================================================================== */
$("#tabs").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-tab]");
  if (!b) return;
  state.tab = b.dataset.tab;
  document.querySelectorAll("#tabs button[data-tab]").forEach((x) => x.classList.toggle("active", x === b));
  load();
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

async function openFromHash() {
  const m = location.hash.match(/^#post=(image|video):(.+)$/);
  if (!m) return;
  const id = decodeURIComponent(m[2]);
  if (!SAFE_ID.test(id)) return;
  const mineItem = state.mine.find((x) => x.id === id);
  const key = postKey(id);
  if (!mineItem && key) {
    const hidden = await listHidden().catch(() => new Set());
    if (hidden.has(key)) {
      toast("Bài đăng đã bị xóa hoặc chuyển riêng tư");
      history.replaceState(null, "", location.pathname);
      return;
    }
  }
  openViewer(mineItem || makeItem(id, 0, m[1] === "video", true));
}

initPhone();
initGoogle();
load();
openFromHash();
