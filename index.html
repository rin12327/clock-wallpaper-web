<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Live Wallpaper Community Hub</title>
  <meta name="description" content="Thiết kế hình nền và ảnh động, chia sẻ với cộng đồng, đặt làm hình nền bằng ứng dụng Android." />
  <meta name="theme-color" content="#0b0f19" />
  <meta property="og:title" content="Live Wallpaper Community Hub" />
  <meta property="og:description" content="Thiết kế hình nền và ảnh động, chia sẻ với cộng đồng." />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🎞️%3C/text%3E%3C/svg%3E" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <!-- ================= THANH MENU ================= -->
  <header class="nav">
    <div class="nav-in">
      <a class="brand" href="#/studio">🎞️ <span>Live Wallpaper Hub</span></a>
      <button class="burger" id="burger" aria-label="Mở menu" aria-expanded="false">☰</button>
      <nav class="links" id="links">
        <a href="#/studio" data-route="studio">🎨 Thiết kế</a>
        <a href="#/explore" data-route="explore">🧭 Khám phá</a>
        <a href="#/mine" data-route="mine">📁 Của tôi</a>
        <a href="#/app" data-route="app">📱 Tải ứng dụng</a>
        <a href="#/help" data-route="help">❓ Hướng dẫn</a>
      </nav>
      <div class="nav-right">
        <button id="btn-upload" class="btn grad">＋ Đăng</button>
        <div class="acc-wrap">
          <button id="acc-btn" class="acc-btn" aria-haspopup="true" aria-expanded="false" aria-label="Tài khoản"></button>
          <div id="acc-menu" class="acc-menu" hidden>
            <div class="acc-head"><b id="acc-name"></b><small id="acc-mail" class="dim"></small></div>
            <a href="#/profile">👤 Hồ sơ &amp; cài đặt</a>
            <a href="#/mine">📁 Bài đăng của tôi</a>
            <button type="button" id="acc-signout" hidden>🚪 Đăng xuất</button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <main>
    <!-- ================= THIẾT KẾ ================= -->
    <section class="page" data-page="studio">
      <div class="page-head">
        <h1>Thiết kế hình nền</h1>
        <p>Chọn ảnh hoặc ảnh động, kéo đồng hồ và chỉnh theo ý bạn. Xong thì <b>Đăng mẫu</b> để cả cộng đồng thấy, hoặc <b>Đặt làm hình nền</b> trên điện thoại.</p>
      </div>

      <div class="studio">
        <div class="phone-col">
          <div class="phone-frame studio-phone" id="phone">
            <div class="bg-media"></div>
            <div class="bg-empty">Chọn ảnh hoặc video của bạn<br />hoặc áp dụng một bài từ Khám phá</div>
            <div class="clock-overlay"><div class="time-display">12:34:56</div><div class="date-display"></div></div>
            <div class="screen-off" id="screen-off"></div>
            <button class="power" id="btn-power" title="Tắt / bật màn hình" aria-label="Tắt / bật màn hình">⏻</button>
          </div>
          <p class="hint">Kéo trên khung để di chuyển. Bấm ⏻ để thử tắt rồi bật màn hình: ảnh động và âm thanh phát lại từ đầu như trên điện thoại.</p>
        </div>

        <div class="side">
          <div class="seg" role="group" aria-label="Đối tượng đang chỉnh">
            <button type="button" id="mode-image" class="seg-btn">🖼️ Chỉnh ảnh</button>
            <button type="button" id="mode-clock" class="seg-btn active">⏰ Chỉnh đồng hồ</button>
          </div>

          <div class="studio-actions">
            <button type="button" id="s-pick" class="btn outline">📁 Chọn ảnh / video của tôi</button>
            <button type="button" id="s-post" class="btn grad">📤 Đăng mẫu của tôi</button>
            <button type="button" id="s-setwall" class="btn grad2">📱 Đặt làm hình nền</button>
            <button type="button" id="s-download" class="btn outline">⬇ Tải xuống</button>
            <button type="button" id="s-reset" class="btn outline danger">↺ Đặt lại tất cả</button>
          </div>
          <input id="s-file" type="file" accept="image/*,video/*" hidden />
          <p id="s-note" class="note" hidden>ℹ️ Trên ứng dụng Android, ảnh động hiện chỉ phát video (chưa hiện đồng hồ, chưa xoay/zoom). Web vẫn xem trước đầy đủ.</p>

          <details class="acc" open>
            <summary>🖼️ Hình nền <span class="sum" id="sum-img"></span></summary>
            <div class="acc-body">
              <label class="slider"><span>Zoom</span><input type="range" min="1" max="3" step="0.01" data-bind="img.scale" data-fmt="pct" /><output></output></label>
              <label class="slider"><span>Xoay</span><input type="range" min="-180" max="180" step="1" data-bind="img.rot" data-fmt="deg" /><output></output></label>
              <div class="row gap">
                <button type="button" class="btn mini" data-rot="img.rot" data-step="-90">⟲ 90°</button>
                <button type="button" class="btn mini" data-rot="img.rot" data-step="90">⟳ 90°</button>
                <button type="button" class="btn mini" id="img-reset">Đặt lại ảnh</button>
              </div>
            </div>
          </details>

          <details class="acc" open>
            <summary>⏰ Đồng hồ <span class="sum" id="sum-clock"></span></summary>
            <div class="acc-body">
              <div class="chk-row">
                <label class="chk"><input type="checkbox" data-bind="clock.showClock" /> Giờ</label>
                <label class="chk"><input type="checkbox" data-bind="clock.showSeconds" /> Giây</label>
                <label class="chk"><input type="checkbox" data-bind="clock.showDate" /> Ngày tháng năm</label>
              </div>
              <div class="row gap">
                <label class="fld grow"><span>Kiểu chữ nghệ thuật</span><select id="c-style" data-bind="clock.style"></select></label>
                <label class="fld"><span>Màu</span><input type="color" data-bind="clock.color" /></label>
              </div>
              <label class="slider"><span>Cỡ chữ</span><input type="range" min="0.5" max="2.5" step="0.01" data-bind="clock.scale" data-fmt="pct" /><output></output></label>
              <label class="slider"><span>Giãn ngang</span><input type="range" min="0.5" max="2.5" step="0.01" data-bind="clock.sx" data-fmt="pct" /><output></output></label>
              <label class="slider"><span>Giãn dọc</span><input type="range" min="0.5" max="2.5" step="0.01" data-bind="clock.sy" data-fmt="pct" /><output></output></label>
              <label class="slider"><span>Xoay</span><input type="range" min="-180" max="180" step="1" data-bind="clock.rot" data-fmt="deg" /><output></output></label>
              <div class="row gap">
                <button type="button" class="btn mini" data-rot="clock.rot" data-step="-90">⟲ 90°</button>
                <button type="button" class="btn mini" data-rot="clock.rot" data-step="90">⟳ 90°</button>
                <button type="button" class="btn mini" id="clock-reset">Đặt lại đồng hồ</button>
              </div>
            </div>
          </details>

          <details class="acc" id="acc-media" hidden>
            <summary>🔊 Ảnh động &amp; âm thanh</summary>
            <div class="acc-body">
              <label class="sw" id="row-m-loop"><div><b>Lặp lại</b><small>Bật: chạy mãi. Tắt: chạy hết rồi dừng ở khung hình cuối</small></div><input id="m-loop" type="checkbox" role="switch" /></label>
              <label class="sw" id="row-m-sound"><div><b>Âm thanh</b><small>Bật hoặc tắt tiếng</small></div><input id="m-sound" type="checkbox" role="switch" /></label>
              <label class="slider" id="row-m-vol"><span>Âm lượng</span><input id="m-vol" type="range" min="0" max="1" step="0.01" value="1" /><output id="m-vol-out">100%</output></label>
            </div>
          </details>
        </div>
      </div>
    </section>

    <!-- ================= KHÁM PHÁ / CỦA TÔI ================= -->
    <section class="page" data-page="explore" hidden>
      <div class="page-head">
        <h1>Khám phá</h1>
        <p>Hình nền và ảnh động do cộng đồng đăng từ web và điện thoại.</p>
      </div>
      <div class="search">
        <span class="search-icon">🔍</span>
        <input id="q" type="search" placeholder="Tìm theo tiêu đề hoặc tên người đăng" autocomplete="off" />
        <button id="q-clear" class="icon-btn clear" hidden aria-label="Xóa">✕</button>
      </div>
      <nav class="tabs" id="tabs">
        <button data-tab="image" class="active">Ảnh</button>
        <button data-tab="video">Ảnh động</button>
        <button data-tab="mine">Của tôi</button>
        <button id="refresh" class="refresh" aria-label="Tải lại">↻</button>
      </nav>
      <div id="status" class="status" hidden></div>
      <div id="grid" class="grid"></div>
    </section>

    <!-- ================= TẢI ỨNG DỤNG ================= -->
    <section class="page" data-page="app" hidden>
      <div class="page-head">
        <h1>Ứng dụng Android</h1>
        <p>Đặt hình nền thật, đồng hồ chạy theo giờ, ảnh động có âm thanh.</p>
      </div>
      <div class="cards">
        <div class="panel">
          <h3>⬇ Tải ứng dụng</h3>
          <p class="dim">File cài đặt APK cho điện thoại Android.</p>
          <a id="apk-btn" class="btn grad block" href="#" download>Tải ClockWallpaper.apk</a>
          <p id="apk-info" class="dim small"></p>
          <ol class="steps">
            <li>Mở file vừa tải trên điện thoại.</li>
            <li>Nếu máy hỏi, cho phép <b>cài ứng dụng từ nguồn này</b> (Cài đặt → Bảo mật).</li>
            <li>Bấm <b>Cài đặt</b> rồi mở ứng dụng.</li>
          </ol>
        </div>
        <div class="panel">
          <h3>📱 Đặt hình nền từ web</h3>
          <ol class="steps">
            <li>Chọn một bài ở <b>Khám phá</b> hoặc <b>Thiết kế</b> mẫu của bạn.</li>
            <li>Bấm <b>Đặt làm hình nền</b> rồi chọn <b>Mở trong ứng dụng</b>.</li>
            <li>Ứng dụng mở sẵn đúng ảnh hoặc ảnh động đó, bạn chỉ việc bấm đặt.</li>
          </ol>
          <p class="dim small">Chưa cài ứng dụng thì bước 2 sẽ đưa bạn về trang này để tải.</p>
        </div>
        <div class="panel">
          <h3>✨ Có gì trong ứng dụng</h3>
          <ul class="steps">
            <li>Đồng hồ nghệ thuật 14 kiểu, xoay, giãn, kéo tự do.</li>
            <li>Ảnh động từ video, bật/tắt lặp lại và âm thanh.</li>
            <li>Chèn âm thanh riêng, phát lại mỗi khi bật màn hình.</li>
            <li>Đăng lên Cộng đồng, thấy chung với web.</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ================= HƯỚNG DẪN ================= -->
    <section class="page" data-page="help" hidden>
      <div class="page-head"><h1>Hướng dẫn</h1></div>
      <div class="faq">
        <details open><summary>Làm sao đăng một mẫu hình nền?</summary><p>Vào <b>Thiết kế</b> → <b>Chọn ảnh / video của tôi</b> → kéo đồng hồ, chỉnh kiểu chữ, xoay, zoom → bấm <b>Đăng mẫu của tôi</b>, nhập tiêu đề (và tên nếu chưa đăng nhập) rồi <b>Đăng</b>. Mẫu thiết kế đi kèm bài đăng nên người khác áp dụng là thấy y như bạn làm.</p></details>
        <details><summary>Làm sao đặt làm hình nền điện thoại?</summary><p>Web không tự đổi được hình nền thật. Bấm <b>Đặt làm hình nền</b>: nếu đã cài ứng dụng, chọn <b>Mở trong ứng dụng</b>, ứng dụng sẽ mở sẵn bài đó để bạn bấm đặt. Chưa cài thì tải ứng dụng ở mục <b>Tải ứng dụng</b>.</p></details>
        <details><summary>Có đặt được làm hình nền máy tính không?</summary><p>Ảnh thì tải về rồi đặt như bình thường. Ảnh động cần phần mềm như Lively Wallpaper hoặc Wallpaper Engine trên Windows.</p></details>
        <details><summary>Gỡ ứng dụng thì hình nền có còn không?</summary><p>Ảnh động và đồng hồ chạy bằng chính ứng dụng nên khi gỡ ứng dụng Android sẽ dừng chúng, đây là giới hạn của hệ điều hành. Ứng dụng có tùy chọn <b>giữ ảnh tĩnh dự phòng</b> để máy vẫn còn hình khi bạn gỡ ứng dụng.</p></details>
        <details><summary>Công khai và riêng tư khác gì?</summary><p><b>Công khai</b>: hiện trong Khám phá. <b>Riêng tư</b>: không hiện trong Khám phá, chỉ có trong mục Của tôi trên thiết bị này. Riêng tư chưa phải là khóa bảo mật: ai có đường dẫn trực tiếp vẫn xem được.</p></details>
        <details><summary>Tên người đăng lấy ở đâu?</summary><p>Nếu đã đăng nhập Google thì dùng tên tài khoản, không cần nhập. Nếu chưa, bạn phải nhập tên một lần, trang sẽ nhớ cho lần sau. Tên này do bạn tự đặt, chưa được xác minh.</p></details>
        <details><summary>Báo cáo bài đăng vi phạm</summary><p>Mở bài đăng của người khác rồi bấm <b>Báo cáo bài đăng</b>. Bài đó sẽ được ẩn trên trình duyệt của bạn và báo cáo được gửi cho quản trị viên.</p></details>
      </div>
    </section>

    <!-- ================= HỒ SƠ & CÀI ĐẶT ================= -->
    <section class="page" data-page="profile" hidden>
      <div class="page-head"><h1>Hồ sơ &amp; cài đặt</h1></div>
      <div class="cards">
        <div class="panel center">
          <div id="pf-avatar" class="avatar"></div>
          <h3 id="pf-name"></h3>
          <p id="pf-mail" class="dim"></p>
          <div class="stats">
            <div><b id="st-all">0</b><small>Bài đăng</small></div>
            <div><b id="st-pub">0</b><small>Công khai</small></div>
            <div><b id="st-priv">0</b><small>Riêng tư</small></div>
          </div>
          <div id="pf-google"></div>
          <button type="button" id="pf-signout" class="btn outline danger" hidden>Đăng xuất</button>
        </div>
        <div class="panel">
          <h3>Tên người đăng</h3>
          <div id="pf-name-box">
            <label class="field"><span>Tên hiển thị (bắt buộc khi chưa đăng nhập)</span><input id="pf-name-input" maxlength="20" autocomplete="off" /></label>
            <p class="dim small">Tên được lưu sẵn để lần sau đăng bài không phải nhập lại.</p>
          </div>
          <p id="pf-name-google" class="dim" hidden></p>
        </div>
        <div class="panel">
          <h3>Mặc định khi đăng</h3>
          <label class="sw"><div><b>Bật âm thanh cho ảnh động</b></div><input id="pref-sound" type="checkbox" role="switch" /></label>
          <label class="sw"><div><b>Bật lặp lại cho ảnh động</b></div><input id="pref-loop" type="checkbox" role="switch" /></label>
        </div>
        <div class="panel">
          <h3>Dữ liệu trên trình duyệt</h3>
          <p class="dim small">Xóa mẫu thiết kế, danh sách “Của tôi”, tên đã lưu và các bài đã báo cáo trên trình duyệt này. Bài đã đăng trên Cloudinary không bị xóa.</p>
          <button type="button" id="pf-clear" class="btn outline danger">Xóa dữ liệu trình duyệt</button>
        </div>
      </div>
    </section>
  </main>

  <footer class="foot">© Live Wallpaper Community Hub · Web không tự đổi được hình nền thật của điện thoại, hãy dùng ứng dụng Android.</footer>

  <template id="tpl-phone">
    <div class="phone-frame">
      <div class="bg-media"></div>
      <div class="bg-empty"></div>
      <div class="clock-overlay"><div class="time-display">12:34:56</div><div class="date-display"></div></div>
    </div>
  </template>

  <!-- ============ XEM BÀI ĐĂNG ============ -->
  <dialog id="viewer">
    <button class="icon-btn close" id="v-close" aria-label="Đóng">✕</button>
    <div class="viewer">
      <div class="media" id="v-media"></div>
      <div class="info">
        <h2 id="v-title"></h2>
        <p class="dim" id="v-meta"></p>
        <div class="chips" id="v-chips"></div>
        <p class="note" id="v-note"></p>

        <label class="sw" id="row-loop"><div><b>Lặp lại</b><small>Bật: chạy mãi. Tắt: chạy hết rồi dừng ở khung hình cuối</small></div><input id="sw-loop" type="checkbox" role="switch" /></label>
        <label class="sw" id="row-sound"><div><b>Âm thanh</b><small>Bật hoặc tắt tiếng của video</small></div><input id="sw-sound" type="checkbox" role="switch" /></label>
        <div class="sw static" id="row-vol"><div><b>Âm lượng âm thanh kèm ảnh <span id="vol-pct">100%</span></b><input id="vol" type="range" min="0" max="1" step="0.01" value="1" /></div></div>
        <div id="row-listen"><button type="button" class="btn outline block" id="btn-listen">▶ Nghe thử âm thanh</button></div>

        <button type="button" id="v-setwall" class="btn grad block">📱 Đặt làm hình nền</button>
        <button type="button" id="v-apply" class="btn grad2 block">🎨 Áp dụng vào khung thiết kế</button>
        <div class="actions">
          <a id="v-download" class="btn outline" href="#" rel="noopener">⬇ Tải xuống</a>
          <a id="v-audio" class="btn outline" href="#" rel="noopener" hidden>🎵 Tải âm thanh</a>
          <button type="button" id="v-copy" class="btn outline">🔗 Chép liên kết</button>
        </div>

        <div id="v-owner" hidden>
          <h3>Quản lý bài đăng</h3>
          <div class="actions">
            <button type="button" id="v-private" class="btn outline">🔒 Chuyển sang riêng tư</button>
            <button type="button" id="v-delete" class="btn outline danger">🗑 Xóa bài đăng</button>
          </div>
        </div>
        <button type="button" id="v-report" class="btn outline danger block">🚩 Báo cáo bài đăng</button>
      </div>
    </div>
  </dialog>

  <!-- ============ ĐĂNG MẪU ============ -->
  <dialog id="upload" class="wide">
    <div class="pad">
      <div class="row between">
        <h2>Đăng mẫu của tôi</h2>
        <button class="icon-btn" id="u-close" aria-label="Đóng">✕</button>
      </div>
      <div class="post-grid">
        <div class="post-preview">
          <div id="u-phone" class="mini"></div>
          <p class="dim small center">Đây là mẫu bạn sắp đăng</p>
        </div>
        <div class="post-form">
          <label class="field">
            <span>Tiêu đề bài đăng</span>
            <input id="u-title" maxlength="40" autocomplete="off" />
            <small id="u-count" class="dim">0/40</small>
          </label>

          <div id="u-name-wrap">
            <label class="field" id="u-name-field">
              <span>Tên người đăng (bắt buộc, được lưu sẵn cho lần sau)</span>
              <input id="u-name" maxlength="20" autocomplete="off" />
            </label>
            <p id="u-name-google" class="dim small" hidden></p>
          </div>

          <div id="u-audio-row" class="pick">
            <button type="button" id="u-audio-btn">
              <b id="u-audio-name">🎵 Thêm âm thanh (tùy chọn)</b>
              <small class="dim">Phát lại từ đầu mỗi khi bật màn hình • tối đa 30 giây</small>
            </button>
            <button type="button" id="u-audio-clear" class="icon-btn" hidden aria-label="Bỏ âm thanh">✕</button>
          </div>
          <input id="u-audio" type="file" accept="audio/*" hidden />

          <label class="sw"><div><b id="u-public-title">Công khai</b><small id="u-public-sub"></small></div><input id="u-public" type="checkbox" role="switch" checked /></label>

          <div id="u-video-rows">
            <label class="sw"><div><b id="u-sound-title">Âm thanh: Bật</b><small id="u-sound-sub"></small></div><input id="u-sound" type="checkbox" role="switch" checked /></label>
            <label class="sw"><div><b id="u-loop-title">Lặp lại: Bật</b><small id="u-loop-sub"></small></div><input id="u-loop" type="checkbox" role="switch" checked /></label>
          </div>

          <p id="u-error" class="err" role="alert"></p>
          <progress id="u-progress" max="1" value="0" hidden></progress>
          <p id="u-stage" class="dim small"></p>
          <button id="u-submit" class="btn grad block" disabled>Đăng mẫu</button>
        </div>
      </div>
    </div>
  </dialog>

  <!-- ============ ĐẶT LÀM HÌNH NỀN: TẢI / MỞ ỨNG DỤNG ============ -->
  <dialog id="getapp" class="narrow">
    <div class="pad">
      <div class="row between">
        <h2>Đặt làm hình nền</h2>
        <button class="icon-btn" id="g-close" aria-label="Đóng">✕</button>
      </div>
      <p class="dim">Trình duyệt không đổi được hình nền thật. Hãy dùng <b>ứng dụng Android</b> của chúng tôi để đặt.</p>
      <div class="note" id="g-item"></div>

      <div id="g-android">
        <a id="g-open" class="btn grad block" href="#">📱 Mở trong ứng dụng</a>
        <p class="dim small">Đã cài ứng dụng? Bấm nút trên, ứng dụng mở sẵn đúng bài này, bạn chỉ việc bấm đặt.</p>
        <a id="g-apk" class="btn outline block" href="#" download>⬇ Tải ứng dụng (APK)</a>
        <p class="dim small">Chưa cài? Tải về, mở file và cho phép cài đặt từ nguồn này.</p>
      </div>
      <div id="g-other" hidden>
        <p class="note">Bạn đang không dùng điện thoại Android. Hãy mở liên kết này trên điện thoại:</p>
        <button type="button" id="g-copy" class="btn outline block">🔗 Chép liên kết bài đăng</button>
        <a id="g-apk2" class="btn outline block" href="#" download>⬇ Tải APK về máy rồi chuyển sang điện thoại</a>
      </div>
    </div>
  </dialog>

  <!-- ============ BÁO CÁO ============ -->
  <dialog id="report" class="narrow">
    <div class="pad">
      <h2>Báo cáo bài đăng</h2>
      <p class="dim small">Chọn lý do bạn muốn báo cáo</p>
      <label class="radio"><input type="radio" name="reason" value="Nội dung nhạy cảm / phản cảm" checked /> Nội dung nhạy cảm / phản cảm</label>
      <label class="radio"><input type="radio" name="reason" value="Spam hoặc quảng cáo" /> Spam hoặc quảng cáo</label>
      <label class="radio"><input type="radio" name="reason" value="Vi phạm bản quyền" /> Vi phạm bản quyền</label>
      <label class="radio"><input type="radio" name="reason" value="Thông tin sai lệch" /> Thông tin sai lệch</label>
      <label class="radio"><input type="radio" name="reason" value="Lý do khác" /> Lý do khác</label>
      <label class="field"><span>Ghi chú (không bắt buộc)</span><input id="r-note" maxlength="200" autocomplete="off" /></label>
      <p id="r-error" class="err" role="alert"></p>
      <div class="row gap">
        <button type="button" class="btn outline grow" id="r-cancel">Hủy</button>
        <button type="button" class="btn grad grow" id="r-send">Gửi báo cáo</button>
      </div>
    </div>
  </dialog>

  <!-- ============ XÁC NHẬN ============ -->
  <dialog id="confirm" class="narrow small-dialog">
    <div class="pad">
      <h2 id="c-title"></h2>
      <p class="dim" id="c-text"></p>
      <div class="row gap">
        <button type="button" class="btn outline grow" id="c-cancel">Hủy</button>
        <button type="button" class="btn grad grow" id="c-ok">Đồng ý</button>
      </div>
    </div>
  </dialog>

  <div id="toast" class="toast" role="status" hidden></div>

  <script type="module" src="app.js"></script>
</body>
</html>
