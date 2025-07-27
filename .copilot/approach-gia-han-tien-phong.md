Phân tích Chi tiết Approach: Cronjob Kiểm tra Hợp Đồng Sắp Hết Hạn
Tổng quan
Đây là phân tích chi tiết về cách triển khai một cronjob để kiểm tra các hợp đồng thuê phòng ký túc xá sắp hết hạn, nhằm mục đích cho phép sinh viên chủ động gia hạn hợp đồng hoặc tự động tạo hóa đơn mới nếu sinh viên không chủ động. Mục tiêu chính là đảm bảo quá trình ở KTX của sinh viên không bị gián đoạn và tối ưu hóa quy trình quản lý hóa đơn.

1. Mục tiêu
   Đảm bảo liên tục: Sinh viên không bị gián đoạn quá trình ở KTX khi hợp đồng sắp hết hạn.

Tự động hóa quy trình: Tối ưu hóa việc tạo hóa đơn tiền phòng cho kỳ mới, giảm thiểu sự can thiệp thủ công.

Nâng cao trải nghiệm người dùng: Cung cấp khả năng chủ động gia hạn cho sinh viên, đồng thời giảm tải công việc cho quản trị viên.

2. Phân tích Luồng Hoạt Động
   A. Cronjob Kiểm tra Hợp Đồng Sắp Hết Hạn
   Tần suất chạy: Định kỳ (ví dụ: mỗi ngày hoặc mỗi tuần).

Chức năng: Tìm kiếm các sinh viên có trường NgayKetThucHopDong sắp đến hạn (ví dụ: trong vòng 7 ngày tới).

Hành động: Gửi thông báo nhắc nhở đến sinh viên về việc hợp đồng sắp hết hạn, kèm theo hướng dẫn cách gia hạn.

B. Sinh Viên Chủ Động Gia Hạn
Giao diện: Hiển thị thông báo hoặc một nút "Gia hạn hợp đồng" rõ ràng trên giao diện của sinh viên.

Quy trình: Khi sinh viên nhấn nút, hệ thống sẽ:

Tính toán NgayBatDau và NgayKetThuc cho kỳ hợp đồng mới dựa trên ngày hết hạn hiện tại.

Tạo hóa đơn tiền phòng mới cho kỳ tiếp theo.

(Tùy chọn) Tạo một bản ghi đăng ký mới hoặc cập nhật hợp đồng hiện có của sinh viên.

C. Tự Động Tạo Hóa Đơn Mới
Điều kiện kích hoạt: Nếu sinh viên không chủ động gia hạn và hợp đồng đã đến ngày hết hạn (giả định sinh viên vẫn còn đang ở KTX).

Hành động: Hệ thống sẽ tự động tạo hóa đơn tiền phòng mới cho kỳ tiếp theo.

Thông báo: Gửi thông báo cho sinh viên về hóa đơn mới được tạo.

D. Tái Sử Dụng Logic Hiện Có
Tính toán tiền phòng: Sử dụng lại hàm calculateRoomFee đã có để tính toán số tiền phòng cho kỳ mới, đảm bảo tính nhất quán.

Tạo và thanh toán hóa đơn: Tận dụng service tạo hóa đơn/thanh toán hiện có (ví dụ: ThanhToan) để tích hợp liền mạch.

3. Các Bước Triển Khai Cụ Thể
1. Triển khai Cronjob Kiểm tra Hợp Đồng
   [ ] Tạo cronjob: Thiết lập một cronjob chạy hàng ngày (có thể sử dụng thư viện như node-cron trong Node.js).

[ ] Truy vấn dữ liệu: Viết truy vấn để lấy danh sách sinh viên có NgayKetThucHopDong trong vòng 7 ngày tới.

[ ] Gửi thông báo: Triển khai chức năng gửi thông báo (email hoặc thông báo trong ứng dụng) tới các sinh viên này.

2. Xây dựng API/Service Gia Hạn Hợp Đồng
   [ ] Tạo API: Phát triển một API POST mới, ví dụ: /api/registration/renew.

[ ] Kiểm tra điều kiện: Đảm bảo các điều kiện như hợp đồng sắp hết hạn, sinh viên còn ở, và chưa gia hạn được kiểm tra trước khi xử lý.

[ ] Tính toán ngày: Sử dụng một module hỗ trợ tính toán ngày (ví dụ: dateCalculator.js) để xác định ngày bắt đầu/kết thúc kỳ mới.

[ ] Tạo hóa đơn: Gọi lại hàm calculateRoomFee để tính tiền và tạo bản ghi hóa đơn mới trong bảng ThanhToan.

[ ] Cập nhật hợp đồng: (Tùy chọn) Cập nhật trạng thái hợp đồng hiện tại hoặc tạo bản ghi đăng ký mới nếu cần.

3. Logic Tự Động Tạo Hóa Đơn
   [ ] Tích hợp vào Cronjob: Trong cùng cronjob, thêm logic để kiểm tra nếu đến ngày hết hạn mà sinh viên chưa chủ động gia hạn, hệ thống sẽ tự động tạo hóa đơn mới cho kỳ tiếp theo.

[ ] Thông báo tự động: Gửi thông báo đến sinh viên về hóa đơn mới được tạo tự động.

4. Phát triển Giao Diện Người Dùng
   [ ] Hiển thị thông báo: Thiết kế và hiển thị thông báo trên dashboard của sinh viên khi hợp đồng sắp hết hạn.

[ ] Nút gia hạn: Thêm một nút "Gia hạn hợp đồng" liên kết đến API gia hạn đã tạo.

5. Quản lý Thanh Toán Hóa Đơn Mới
   [ ] Quy trình hiện có: Đảm bảo sinh viên có thể thanh toán hóa đơn mới thông qua các phương thức thanh toán hiện có (PayOS/tiền mặt) như bình thường.

[ ] Cập nhật trạng thái: Hệ thống tự động cập nhật trạng thái hóa đơn sau khi thanh toán thành công.

6. (Tùy Chọn) Dashboard Quản Trị Viên
   [ ] Theo dõi trạng thái: Xây dựng một dashboard hoặc phần thống kê cho phép quản trị viên theo dõi các hợp đồng sắp hết hạn, những hợp đồng đã được gia hạn và chưa gia hạn.

Tóm tắt Checklist Triển Khai
[ ] Cronjob kiểm tra hợp đồng sắp hết hạn và gửi thông báo.

[ ] API cho phép sinh viên chủ động gia hạn hợp đồng.

[ ] Logic tự động tạo hóa đơn mới nếu sinh viên không chủ động.

[ ] Giao diện người dùng hiển thị thông báo và nút gia hạn.

[ ] Đảm bảo khả năng thanh toán hóa đơn mới (giữ nguyên quy trình hiện có).

[ ] (Tùy chọn) Dashboard quản trị viên để theo dõi trạng thái gia hạn.
