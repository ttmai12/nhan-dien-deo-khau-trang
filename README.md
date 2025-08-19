# nhan-dien-deo-khau-trang
Hệ Thống Giám Sát Đeo Khẩu Trang Bằng AI
Dự án này là một hệ thống giám sát thời gian thực để phát hiện việc đeo khẩu trang bằng camera, sử dụng công nghệ AI. Hệ thống hỗ trợ:
+ Phát hiện khuôn mặt và phân loại: Đeo khẩu trang đúng, sai, hoặc không đeo.
+ Thống kê thời gian thực (tổng số người, tỷ lệ tuân thủ, cảnh báo).
+ Chụp ảnh từ camera hoặc tải lên để phân tích.
+ Quản lý tài khoản: Đăng nhập, đăng ký, đăng xuất.
+ Lịch sử giám sát: Lưu trữ, xuất báo cáo CSV, xóa lịch sử (dành cho admin).
Giao diện thân thiện với animation và responsive design.
Hệ thống sử dụng Flask làm backend và JavaScript (với face-api.js và TensorFlow.js) cho frontend để xử lý nhận diện khuôn mặt và phân loại khẩu trang.
