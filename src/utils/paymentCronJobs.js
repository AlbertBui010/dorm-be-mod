const cron = require("node-cron");
const paymentService = require("../services/paymentService");

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
