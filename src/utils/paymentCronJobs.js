const cron = require("node-cron");
const paymentService = require("../services/paymentService");
const DangKy = require("../models/DangKy");
const SinhVien = require("../models/SinhVien");
const emailService = require("./email");
const { Op } = require("sequelize");

class PaymentCronJobs {
  /**
   * Khởi tạo tất cả cron jobs cho payment system
   */
  static initializeJobs() {
    console.log("🕐 Initializing payment cron jobs...");

    // Job 1: Đánh dấu thanh toán quá hạn - chạy mỗi ngày lúc 6:00 AM
    cron.schedule(
      "0 6 * * *",
      async () => {
        console.log("⏰ Running overdue payment check...");
        try {
          const result = await paymentService.markOverduePayments();
          if (result.success) {
            console.log(
              `✅ Overdue check completed: ${result.data.updatedCount} payments marked`
            );
          } else {
            console.error("❌ Overdue check failed:", result.message);
          }
        } catch (error) {
          console.error("❌ Overdue check error:", error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh",
      }
    );

    // Job 2: Cleanup expired payment links - chạy mỗi giờ
    cron.schedule(
      "0 * * * *",
      async () => {
        console.log("🧹 Cleaning up expired payment links...");
        try {
          // Reset trạng thái từ DANG_CHO_THANH_TOAN về CHUA_THANH_TOAN sau 1 giờ
          const ThanhToan = require("../models/ThanhToan");
          const { Op } = require("sequelize");

          const oneHourAgo = new Date();
          oneHourAgo.setHours(oneHourAgo.getHours() - 1);

          const [updatedCount] = await ThanhToan.update(
            {
              TrangThai: "CHUA_THANH_TOAN",
              OrderCode: null,
              NgayCapNhat: new Date(),
            },
            {
              where: {
                TrangThai: "DANG_CHO_THANH_TOAN",
                NgayCapNhat: {
                  [Op.lt]: oneHourAgo,
                },
              },
            }
          );

          if (updatedCount > 0) {
            console.log(`✅ Cleaned up ${updatedCount} expired payment links`);
          }
        } catch (error) {
          console.error("❌ Cleanup error:", error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh",
      }
    );

    // Job 3: Payment statistics logging - chạy mỗi tuần lúc thứ 2, 8:00 AM
    cron.schedule(
      "0 8 * * 1",
      async () => {
        console.log("📊 Generating weekly payment statistics...");
        try {
          const ThanhToan = require("../models/ThanhToan");
          const sequelize = require("../config/database");

          const stats = await ThanhToan.findAll({
            attributes: [
              "TrangThai",
              [sequelize.fn("COUNT", sequelize.col("MaThanhToan")), "count"],
              [sequelize.fn("SUM", sequelize.col("SoTien")), "total"],
            ],
            group: ["TrangThai"],
            raw: true,
          });

          console.log("📈 Weekly Payment Statistics:");
          stats.forEach((stat) => {
            console.log(
              `   ${stat.TrangThai}: ${stat.count} payments, ${Number(
                stat.total
              ).toLocaleString("vi-VN")} VND`
            );
          });
        } catch (error) {
          console.error("❌ Statistics error:", error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh",
      }
    );

    // Job 4: Nhắc nhở hợp đồng sắp hết hạn - chạy mỗi ngày lúc 7:00 AM
    cron.schedule(
      "0 7 * * *",
      async () => {
        console.log("🔔 Checking expiring contracts (DangKy)...");
        try {
          const today = new Date();
          const sevenDaysLater = new Date();
          sevenDaysLater.setDate(today.getDate() + 7);

          // Lấy các hợp đồng sắp hết hạn trong 7 ngày tới, đã duyệt và còn ở
          const expiringContracts = await DangKy.findAll({
            where: {
              NgayKetThucHopDong: {
                [Op.gte]: today,
                [Op.lte]: sevenDaysLater,
              },
              TrangThai: "DA_DUYET",
            },
            include: [
              {
                model: SinhVien,
                as: "sinhVien",
                attributes: ["HoTen", "Email"],
              },
            ],
          });

          for (const contract of expiringContracts) {
            const sv = contract.sinhVien;
            if (!sv?.Email) continue;
            const subject = "[KTX STU] Hợp đồng ở ký túc xá sắp hết hạn";
            const html = `<p>Chào ${sv.HoTen},</p>
              <p>Hợp đồng ở ký túc xá của bạn sẽ hết hạn vào ngày <b>${contract.NgayKetThucHopDong}</b>.</p>
              <p>Vui lòng truy cập hệ thống để gia hạn hợp đồng nếu bạn muốn tiếp tục ở lại.</p>
              <p>Trân trọng,<br/>Phòng Quản lý Ký túc xá STU</p>`;
            try {
              await emailService.sendEmail({
                to: sv.Email,
                subject,
                html,
              });
              console.log(`📧 Sent expiry reminder to ${sv.Email}`);
            } catch (err) {
              console.error(
                `❌ Failed to send expiry reminder to ${sv.Email}:`,
                err.message
              );
            }
          }

          // Tự động tạo hóa đơn nếu sinh viên không chủ động
          // Lấy các hợp đồng đã hết hạn hôm nay, đã duyệt
          const registrationService = require("../services/registrationService");
          const expiredContracts = await DangKy.findAll({
            where: {
              NgayKetThucHopDong: today,
              TrangThai: "DA_DUYET",
            },
            include: [
              {
                model: SinhVien,
                as: "sinhVien",
                attributes: ["HoTen", "Email"],
              },
            ],
          });
          for (const contract of expiredContracts) {
            // Kiểm tra đã có đăng ký mới chưa (chưa chủ động gia hạn)
            const countNew = await DangKy.count({
              where: {
                MaSinhVien: contract.MaSinhVien,
                NgayDangKy: { [Op.gt]: contract.NgayKetThucHopDong },
              },
            });
            if (countNew > 0) continue; // Đã chủ động gia hạn
            // Tự động renew
            const result = await registrationService.renewContract(
              contract.MaSinhVien
            );
            if (result.success && contract.sinhVien?.Email) {
              const subject =
                "[KTX STU] Hệ thống đã tự động gia hạn hợp đồng và tạo hóa đơn mới";
              const html = `<p>Chào ${contract.sinhVien.HoTen},</p>
                <p>Hợp đồng ở ký túc xá của bạn đã được hệ thống tự động gia hạn cho kỳ tiếp theo.</p>
                <p>Hóa đơn tiền phòng mới đã được tạo. Vui lòng đăng nhập để kiểm tra và thanh toán.</p>
                <p>Trân trọng,<br/>Phòng Quản lý Ký túc xá STU</p>`;
              try {
                await emailService.sendEmail({
                  to: contract.sinhVien.Email,
                  subject,
                  html,
                });
                console.log(
                  `📧 Sent auto-renewal notice to ${contract.sinhVien.Email}`
                );
              } catch (err) {
                console.error(
                  `❌ Failed to send auto-renewal notice to ${contract.sinhVien.Email}:`,
                  err.message
                );
              }
            }
          }
        } catch (error) {
          console.error("❌ Error checking expiring contracts:", error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh",
      }
    );

    // Job 5: Hủy đăng ký nếu sinh viên không đến nhận phòng sau 2 ngày kể từ ngày nhận phòng dự kiến
    cron.schedule(
      "0 23 * * *",
      async () => {
        console.log("🚨 Checking students who did not check-in after approval...");
        try {
          const twoDaysAgo = new Date();
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

          // Lấy các đăng ký đã duyệt, chưa bị từ chối, chưa check-in, ngày nhận phòng <= twoDaysAgo
          const overdueRegs = await DangKy.findAll({
            where: {
              TrangThai: "DA_DUYET",
              NgayNhanPhong: { [Op.lte]: twoDaysAgo },
            },
            include: [
              {
                model: SinhVien,
                as: "sinhVien",
                attributes: ["MaSinhVien", "HoTen", "Email", "TrangThai", "MaPhong", "MaGiuong"],
              },
            ],
          });

          for (const reg of overdueRegs) {
            const sv = reg.sinhVien;
            if (!sv) continue;
            // Chỉ xử lý nếu sinh viên vẫn ở trạng thái CHO_NHAN_PHONG hoặc DA_DUYET
            if (sv.TrangThai !== "CHO_NHAN_PHONG" && sv.TrangThai !== "DA_DUYET") continue;

            // Đổi trạng thái đăng ký thành DA_TU_CHOI (hoặc KHONG_NHAN_PHONG nếu có)
            await reg.update({ TrangThai: "DA_TU_CHOI" });

            // Đổi trạng thái sinh viên thành KHONG_NHAN_PHONG
            await sv.update({
              TrangThai: "KHONG_NHAN_PHONG",
              MaPhong: null,
              MaGiuong: null,
            });

            // Bỏ gán phòng/giường (nếu có)
            if (sv.MaGiuong) {
              const Giuong = require("../models/Giuong");
              await Giuong.update(
                { DaCoNguoi: false, MaSinhVienChiEm: null },
                { where: { MaGiuong: sv.MaGiuong } }
              );
            }

            // Gửi email thông báo
            try {
              await emailService.sendCancelDueToNoCheckInEmail({
                email: sv.Email,
                hoTen: sv.HoTen,
                maSinhVien: sv.MaSinhVien,
                maPhong: reg.MaPhong,
                maGiuong: reg.MaGiuong,
                ngayNhanPhong: reg.NgayNhanPhong,
                soNgayChoPhep: 2,
              });
              console.log(`📧 Sent cancel due to no check-in to ${sv.Email}`);
            } catch (err) {
              console.error(`❌ Failed to send cancel due to no check-in to ${sv.Email}:`, err.message);
            }
          }
        } catch (error) {
          console.error("❌ Error checking students who did not check-in:", error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh",
      }
    );

    console.log("✅ Payment cron jobs initialized successfully");
  }

  /**
   * Chạy job đánh dấu thanh toán quá hạn ngay lập tức (for testing)
   */
  static async runOverdueCheckNow() {
    console.log("🚀 Running overdue payment check immediately...");
    try {
      const result = await paymentService.markOverduePayments();
      if (result.success) {
        console.log(
          `✅ Immediate overdue check completed: ${result.data.updatedCount} payments marked`
        );
      } else {
        console.error("❌ Immediate overdue check failed:", result.message);
      }
      return result;
    } catch (error) {
      console.error("❌ Immediate overdue check error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Chạy cleanup expired payment links ngay lập tức (for testing)
   */
  static async runCleanupNow() {
    console.log("🚀 Running payment link cleanup immediately...");
    try {
      const ThanhToan = require("../models/ThanhToan");
      const { Op } = require("sequelize");

      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const [updatedCount] = await ThanhToan.update(
        {
          TrangThai: "CHUA_THANH_TOAN",
          OrderCode: null,
          NgayCapNhat: new Date(),
        },
        {
          where: {
            TrangThai: "DANG_CHO_THANH_TOAN",
            NgayCapNhat: {
              [Op.lt]: oneHourAgo,
            },
          },
        }
      );

      console.log(
        `✅ Immediate cleanup completed: ${updatedCount} expired payment links`
      );
      return { success: true, updatedCount };
    } catch (error) {
      console.error("❌ Immediate cleanup error:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = PaymentCronJobs;
