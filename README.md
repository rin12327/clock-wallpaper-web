# Live Wallpaper Community Hub

Web tĩnh (HTML + CSS + JS thuần, không cần build) dùng chung dữ liệu với app Android qua Cloudinary.
Ảnh và ảnh động đăng từ điện thoại sẽ hiện ở đây, và ngược lại.

## Cấu trúc

```
index.html     giao diện: khung điện thoại + bảng cộng đồng
style.css
app.js         toàn bộ logic
config.js      cấu hình (cloud name, upload preset, Google client ID)
api/list.js    hàm serverless dự phòng (chỉ dùng nếu trình duyệt bị chặn CORS)
vercel.json
package.json
```

## 1. Cloudinary (làm một lần)

1. **Settings → Upload → Upload presets → Add upload preset**
   - Tên: `gw_unsigned`
   - Signing mode: **Unsigned**
2. **Settings → Security**: bỏ chặn **Resource list** (nếu đang tick "Restricted"). Không bỏ thì Khám phá không tải được danh sách.
3. Nếu đổi tên preset hoặc cloud name, sửa trong `config.js` (và trong `Cloud.kt` của app).

> Tuyệt đối **không** đưa API Secret vào `config.js` hay bất kỳ file nào trong repo.

## 2. Đưa lên Git rồi Vercel

1. Vào repo GitHub → **Add file → Upload files**.
2. Kéo thả toàn bộ file **và thư mục `api`** vào, ghi đè `index.html` cũ → **Commit changes**.
3. Vercel đã nối với repo nên sẽ tự deploy. Nếu tạo project mới: **Import** repo, Framework Preset chọn **Other**, để trống Build Command và Output Directory.
4. (Tùy chọn) Nếu muốn dùng cloud name khác mà không sửa code: thêm biến môi trường `CLOUDINARY_CLOUD_NAME` trong Vercel → Settings → Environment Variables (chỉ áp dụng cho `api/list.js`).

Chạy thử trên máy: `npx serve` (hoặc `vercel dev`) trong thư mục này. Không mở trực tiếp bằng `file://` vì dùng ES module.

## 3. Đăng nhập Google (tùy chọn)

1. Google Cloud Console → Credentials → **OAuth client ID** loại **Web** (có thể dùng lại client Web của app).
2. **Authorized JavaScript origins**: thêm `https://<ten-mien-vercel-cua-ban>`.
3. Dán client ID vào `GOOGLE_CLIENT_ID` trong `config.js`.

Tên Google chỉ dùng để hiển thị là người đăng, chưa được xác minh ở phía máy chủ.

## Cách hoạt động

- **Áp dụng:** trên web, "Áp dụng" đặt bài vào khung điện thoại (có đồng hồ, kéo được, đổi kiểu chữ/màu/cỡ, bật tắt giây và ngày). Web **không** đổi được hình nền thật của điện thoại; hãy tải về hoặc dùng app Android.
- **Bật/tắt màn hình (⏻):** thử hành vi trên điện thoại, ảnh động và âm thanh phát lại từ đầu mỗi lần bật.
- **Đăng bài:** ảnh hoặc ảnh động (1–30 giây). Công khai/riêng tư, lặp lại, âm thanh. Ảnh có thể kèm âm thanh (tối đa 30 giây).
- **Tiêu đề và tên người đăng** được mã hóa trong `public_id` (cùng định dạng với app), nên hai bên thấy giống nhau.
- **Xóa / chuyển riêng tư:** vì không có API secret nên web gửi một "bia mộ" (tệp nhỏ gắn tag `gw_del` / `gw_priv`), Khám phá của mọi người sẽ ẩn bài đó. File gốc vẫn nằm trong Cloudinary, bạn tự xóa trong Media Library theo tag. Danh sách có thể trễ khoảng 1 phút do CDN.
- **Báo cáo:** gửi tệp JSON gắn tag `gw_report`. Xem trong Media Library rồi xử lý.
- **Mục "Của tôi"** lưu trong trình duyệt, nên web và app không chia sẻ mục này. Bài công khai thì ai cũng thấy ở Khám phá.

## Giới hạn cần biết

- Không có kiểm tra chủ bài ở phía máy chủ: giao diện chỉ hiện nút xóa/riêng tư cho bài của mình, nhưng ai biết tên upload preset (nằm trong `config.js` và APK) đều có thể gửi bia mộ để ẩn bài người khác. Muốn chặn hẳn cần máy chủ riêng có xác thực.
- Upload preset unsigned cho phép ai cũng đăng được tệp vào tài khoản Cloudinary. Nên giới hạn dung lượng/định dạng trong preset và theo dõi dung lượng.
