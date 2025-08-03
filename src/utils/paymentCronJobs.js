const cron = require("node-cron");
const paymentService = require("../services/paymentService");
const DangKy = require("../models/DangKy");
const SinhVien = require("../models/SinhVien");
const emailService = require("./email");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const SYSTEM_USER = require("../constants/system");

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
      // "* * * * *",
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
          // Lấy các hợp đồng đã hết hạn hôm nay, đã duyệt và KHÔNG có nguyện vọng từ chối gia hạn
          const registrationService = require("../services/registrationService");
          const expiredContracts = await DangKy.findAll({
            where: {
              NgayKetThucHopDong: today,
              TrangThai: "DA_DUYET",
              [Op.or]: [{ NguyenVong: { [Op.ne]: "KHONG_GIA_HAN" } }],
            },
            include: [
              {
                model: SinhVien,
                as: "sinhVien",
                attributes: ["HoTen", "Email"],
              },
            ],
          });

          console.log(
            `📋 Found ${expiredContracts.length} contracts eligible for auto-renewal`
          );

          for (const contract of expiredContracts) {
            // Kiểm tra đã có đăng ký mới chưa (chưa chủ động gia hạn)
            const countNew = await DangKy.count({
              where: {
                MaSinhVien: contract.MaSinhVien,
                NgayDangKy: { [Op.gt]: contract.NgayKetThucHopDong },
              },
            });
            if (countNew > 0) {
              console.log(
                `⏭️ Skipping ${contract.MaSinhVien} - already has new registration`
              );
              continue; // Đã chủ động gia hạn
            }

            console.log(
              `🔄 Auto-renewing contract for ${
                contract.MaSinhVien
              } (NguyenVong: ${contract.NguyenVong || "null"})`
            );

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
            } else if (!result.success) {
              // Gửi email thông báo cho quản trị viên khi gia hạn thất bại
              try {
                await emailService.sendEmail({
                  to: "buiquangquy12823@gmail.com",
                  subject: "[KTX STU] Lỗi gia hạn hợp đồng",
                  html: `<p>Không thể gia hạn hợp đồng cho sinh viên ${
                    contract.sinhVien?.HoTen || "N/A"
                  } (${contract.MaSinhVien}).</p>
                    <p><strong>Lỗi:</strong> ${
                      result.error || result.message || "Không xác định"
                    }</p>
                    <p>Vui lòng kiểm tra và xử lý thủ công.</p>
                    <p>Thời gian: ${new Date().toLocaleString("vi-VN")}</p>`,
                });
                console.log(
                  `📧 Sent failure notice to admin for ${contract.MaSinhVien}`
                );
              } catch (emailErr) {
                console.error(
                  `❌ Failed to send admin notification for ${contract.MaSinhVien}:`,
                  emailErr.message
                );
              }
            }
          }

          // Xử lý sinh viên không gia hạn (checkout tự động)
          console.log("🚪 Processing students who chose not to renew...");

          const checkoutContracts = await DangKy.findAll({
            where: {
              NgayKetThucHopDong: today,
              TrangThai: "DA_DUYET",
              NguyenVong: "KHONG_GIA_HAN",
            },
            include: [
              {
                model: SinhVien,
                as: "sinhVien",
                attributes: ["HoTen", "Email", "TrangThai"],
              },
            ],
          });

          console.log(
            `📋 Found ${checkoutContracts.length} students to checkout`
          );

          for (const contract of checkoutContracts) {
            try {
              // Validate: Sinh viên phải đang ở (không phải NGUNG_O)
              if (contract.sinhVien?.TrangThai === "NGUNG_O") {
                console.log(
                  `⏭️ Skipping ${contract.MaSinhVien} - already checked out`
                );
                continue;
              }

              console.log(`🔄 Auto-checkout for ${contract.MaSinhVien}`);

              // Thực hiện checkout trong transaction
              await sequelize.transaction(async (t) => {
                // 1. Cập nhật trạng thái sinh viên
                await SinhVien.update(
                  { TrangThai: "NGUNG_O" },
                  {
                    where: { MaSinhVien: contract.MaSinhVien },
                    transaction: t,
                  }
                );

                // 2. Giải phóng giường nếu có
                if (contract.MaGiuong) {
                  const Giuong = require("../models/Giuong");
                  await Giuong.update(
                    { DaCoNguoi: false },
                    {
                      where: { MaGiuong: contract.MaGiuong },
                      transaction: t,
                    }
                  );
                }

                // 3. Giảm số lượng hiện tại của phòng
                if (contract.MaPhong) {
                  const Phong = require("../models/Phong");
                  await Phong.increment(
                    { SoLuongHienTai: -1 },
                    {
                      where: { MaPhong: contract.MaPhong },
                      transaction: t,
                    }
                  );
                }

                // 4. Update NgayKetThuc trong LichSuOPhong
                const LichSuOPhong = require("../models/LichSuOPhong");
                await LichSuOPhong.update(
                  {
                    NgayKetThuc: today,
                    NgayCapNhat: new Date(),
                    NguoiCapNhat: SYSTEM_USER.SYSTEM,
                  },
                  {
                    where: {
                      MaSinhVien: contract.MaSinhVien,
                      NgayKetThuc: null, // Chỉ update record chưa có NgayKetThuc
                    },
                    transaction: t,
                  }
                );
              });

              // 5. Gửi email xác nhận checkout
              if (contract.sinhVien?.Email) {
                const subject = "[KTX STU] Xác nhận hoàn tất thủ tục chuyển đi";
                const html = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">Xác nhận hoàn tất thủ tục chuyển đi</h2>
                    <p>Chào <strong>${contract.sinhVien.HoTen}</strong>,</p>
                    <p>Hệ thống đã ghi nhận việc hoàn tất thủ tục chuyển đi của bạn.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin-top: 0; color: #374151;">Thông tin chi tiết:</h3>
                      <ul style="margin: 0; padding-left: 20px;">
                        <li><strong>Mã sinh viên:</strong> ${
                          contract.MaSinhVien
                        }</li>
                        <li><strong>Phòng:</strong> ${
                          contract.MaPhong || "N/A"
                        }</li>
                        <li><strong>Ngày kết thúc hợp đồng:</strong> ${today.toLocaleDateString(
                          "vi-VN"
                        )}</li>
                        <li><strong>Ngày hoàn tất thủ tục:</strong> ${new Date().toLocaleDateString(
                          "vi-VN"
                        )}</li>
                      </ul>
                    </div>
                    
                    <p>Cảm ơn bạn đã sử dụng dịch vụ ký túc xá STU. Chúc bạn thành công trong tương lai!</p>
                    
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px;">
                      Trân trọng,<br/>
                      <strong>Phòng Quản lý Ký túc xá STU</strong><br/>
                      Email: ktx@stu.edu.vn | Điện thoại: 0929812000
                    </p>
                  </div>
                `;

                try {
                  await emailService.sendEmail({
                    to: contract.sinhVien.Email,
                    subject,
                    html,
                  });
                  console.log(
                    `📧 Sent checkout confirmation to ${contract.sinhVien.Email}`
                  );
                } catch (err) {
                  console.error(
                    `❌ Failed to send checkout confirmation to ${contract.sinhVien.Email}:`,
                    err.message
                  );
                }
              }

              console.log(
                `✅ Auto checkout successful for ${contract.MaSinhVien}`
              );
            } catch (error) {
              console.error(
                `❌ Auto checkout failed for ${contract.MaSinhVien}:`,
                error
              );

              // Gửi email thông báo lỗi cho admin
              try {
                await emailService.sendEmail({
                  to: "buiquangquy12823@gmail.com",
                  subject: "[KTX STU] Lỗi tự động checkout",
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #dc2626;">Lỗi xử lý checkout tự động</h2>
                      <p>Không thể xử lý checkout tự động cho sinh viên:</p>
                      
                      <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Sinh viên:</strong> ${
                          contract.sinhVien?.HoTen || "N/A"
                        } (${contract.MaSinhVien})</p>
                        <p><strong>Phòng:</strong> ${
                          contract.MaPhong || "N/A"
                        }</p>
                        <p><strong>Giường:</strong> ${
                          contract.MaGiuong || "N/A"
                        }</p>
                        <p><strong>Lỗi:</strong> ${error.message}</p>
                        <p><strong>Thời gian:</strong> ${new Date().toLocaleString(
                          "vi-VN"
                        )}</p>
                      </div>
                      
                      <p><strong>Cần xử lý thủ công:</strong> Vui lòng kiểm tra và thực hiện checkout thủ công cho sinh viên này.</p>
                    </div>
                  `,
                });
                console.log(
                  `📧 Sent checkout failure notice to admin for ${contract.MaSinhVien}`
                );
              } catch (emailErr) {
                console.error(
                  `❌ Failed to send admin notification for ${contract.MaSinhVien}:`,
                  emailErr.message
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
