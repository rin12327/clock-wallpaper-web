// Cấu hình trang web. KHÔNG đặt API Secret vào đây (file này công khai cho mọi người xem).
export const CONFIG = {
  CLOUD_NAME: "mdkn3zbh",
  UPLOAD_PRESET: "gw_unsigned", // preset kiểu Unsigned trong Cloudinary

  // Đăng nhập Google (tùy chọn). Để trống thì ẩn nút đăng nhập, người dùng tự nhập tên hiển thị.
  // Dùng "OAuth client ID" loại Web, và thêm tên miền Vercel vào "Authorized JavaScript origins".
  GOOGLE_CLIENT_ID: "",

  // Các tag này phải GIỐNG HỆT bên app Android để hai bên dùng chung dữ liệu
  PUBLIC_TAG: "gw_public",
  DELETE_TAG: "gw_del",
  PRIVATE_TAG: "gw_priv",
  REPORT_TAG: "gw_report",

  MAX_VIDEO_SECONDS: 30,
  MAX_AUDIO_SECONDS: 30,
  MAX_TITLE_CHARS: 40,
};
