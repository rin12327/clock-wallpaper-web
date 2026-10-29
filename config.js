// Cấu hình trang web. KHÔNG đặt API Secret vào đây (file này công khai cho mọi người xem).
export const CONFIG = {
  CLOUD_NAME: "mdkn3zbh",
  UPLOAD_PRESET: "gw_unsigned", // preset kiểu Unsigned trong Cloudinary

  // Đăng nhập Google (tùy chọn). Để trống thì ẩn nút đăng nhập, người dùng tự nhập tên.
  // Dùng "OAuth client ID" loại Web, và thêm tên miền Vercel vào "Authorized JavaScript origins".
  GOOGLE_CLIENT_ID: "",

  // Ứng dụng Android: đặt file APK vào repo với đúng tên này (hoặc đổi thành link GitHub Releases)
  APK_URL: "/ClockWallpaper.apk",
  APP_PACKAGE: "com.yourname.clockwallpaper", // phải trùng applicationId của app
  APP_SCHEME: "gwall", // phải trùng intent-filter trong AndroidManifest của app

  // Các tag này phải GIỐNG HỆT bên app Android để hai bên dùng chung dữ liệu
  PUBLIC_TAG: "gw_public",
  DELETE_TAG: "gw_del",
  PRIVATE_TAG: "gw_priv",
  REPORT_TAG: "gw_report",
  CFG_TAG: "gw_cfg", // tệp "mẫu thiết kế" (đồng hồ, xoay, zoom...) đi kèm mỗi bài đăng

  MAX_VIDEO_SECONDS: 30,
  MAX_AUDIO_SECONDS: 30,
  MAX_TITLE_CHARS: 40,
};
