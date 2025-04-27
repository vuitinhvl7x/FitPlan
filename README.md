# FitPlan API

## Giới thiệu

FitPlan API là một dự án API được xây dựng bằng Node.js và Express.js, cung cấp các chức năng cho việc quản lý và theo dõi các kế hoạch tập luyện.

## Cấu trúc dự án

- `server`: Thư mục chứa code của dự án.
- `src`: Thư mục chứa code nguồn của dự án.
- `models`: Thư mục chứa các mô hình dữ liệu.
- `controllers`: Thư mục chứa các controller xử lý yêu cầu HTTP.
- `routers`: Thư mục chứa các router định nghĩa các route của API.
- `utils`: Thư mục chứa các hàm tiện ích.
- `validators`: Thư mục chứa các validator kiểm tra dữ liệu.

## Cài đặt

1. Clone dự án về máy của bạn bằng cách chạy lệnh `git clone https://github.com/vuitinhvl7x/FitPlan.git`.
2. Di chuyển vào thư mục `server` bằng cách chạy lệnh `cd server`.
3. Cài đặt các dependencies bằng cách chạy lệnh `npm install`.
4. Tạo file `.env` trong thư mục `server` và cấu hình các biến môi trường cần thiết.

## Cấu hình .env

- `DB_USER`: Tên người dùng cơ sở dữ liệu.
- `DB_PASSWORD`: Mật khẩu cơ sở dữ liệu.
- `DB_NAME`: Tên cơ sở dữ liệu.
- `DB_HOST`: Địa chỉ host của cơ sở dữ liệu.
- `JWT_SECRET`: Chuỗi bí mật cho JWT.
- `CLOUDINARY_CLOUD_NAME`: Tên cloud của Cloudinary.
- `CLOUDINARY_API_KEY`: API key của Cloudinary.
- `CLOUDINARY_API_SECRET`: API secret của Cloudinary.
- `RAPIDAPI_KEY_EXERCISEDB`: API key của ExerciseDB trên RapidAPI.

## Khởi động dự án

1. Chạy lệnh `npm run dev` để khởi động dự án ở chế độ phát triển.
2. Chạy lệnh `npm start` để khởi động dự án ở chế độ sản xuất.

## API Endpoints

- `/api/auth`: Các endpoint liên quan đến xác thực.
- `/api/users`: Các endpoint liên quan đến người dùng.
- `/api/profiles`: Các endpoint liên quan đến hồ sơ người dùng.
- `/api/exercises`: Các endpoint liên quan đến bài tập.

## Tài liệu API

Tài liệu API sẽ được cung cấp trong tương lai.

## Liên hệ

Nếu bạn có bất kỳ câu hỏi hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi qua email xuanhajforwork@gmail.com.
