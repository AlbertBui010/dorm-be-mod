const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Cấu hình email transporter
      this.transporter = nodemailer.createTransport({
        host:
          process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com",
        port: process.env.EMAIL_PORT || process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER || process.env.SMTP_USER,
          pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASS,
        },
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.error("Email transporter verification failed:", error);
          // Trong development mode, có thể bỏ qua lỗi này
          if (process.env.NODE_ENV === "development") {
            console.log("Development mode: Email verification skipped");
          }
        } else {
          console.log("Email server is ready to take our messages");
        }
      });
    } catch (error) {
      console.error("Failed to initialize email transporter:", error);
      // Trong development mode, không crash ứng dụng
      if (process.env.NODE_ENV === "development") {
        console.log(
          "Development mode: Email transporter initialization failed but continuing..."
        );
      }
    }
  }

  /**
   * Gửi email
   * @param {Object} emailOptions - Tùy chọn email
   * @param {string} emailOptions.to - Email người nhận
   * @param {string} emailOptions.subject - Tiêu đề email
   * @param {string} emailOptions.text - Nội dung text thuần
   * @param {string} emailOptions.html - Nội dung HTML
   * @param {string} emailOptions.from - Email người gửi (optional)
   */
  async sendEmail(emailOptions) {
    try {
      if (!this.transporter) {
        console.warn(
          "Email transporter not initialized, attempting to reinitialize..."
        );
        this.initializeTransporter();

        // Nếu vẫn không có transporter và đang ở development mode, simulate việc gửi email
        if (!this.transporter && process.env.NODE_ENV === "development") {
          console.log("Development mode: Email sending simulated");
          return {
            success: true,
            messageId: "dev-mode-" + Date.now(),
            message: "Email đã được gửi thành công (Development mode).",
          };
        }

        if (!this.transporter) {
          throw new Error("Email transporter not initialized");
        }
      }

      const mailOptions = {
        from:
          emailOptions.from ||
          process.env.EMAIL_USER ||
          process.env.SMTP_FROM ||
          process.env.SMTP_USER,
        to: emailOptions.to,
        subject: emailOptions.subject,
        text: emailOptions.text,
        html: emailOptions.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        message: "Email đã được gửi thành công.",
      };
    } catch (error) {
      console.error("Failed to send email:", error);

      // Trong môi trường development, có thể bỏ qua lỗi email
      if (process.env.NODE_ENV === "development") {
        console.log("Development mode: Email sending simulated");
        return {
          success: true,
          messageId: "dev-mode-" + Date.now(),
          message: "Email đã được gửi thành công (Development mode).",
        };
      }

      throw new Error(`Không thể gửi email: ${error.message}`);
    }
  }

  /**
   * Gửi email xác thực đăng ký
   */
  async sendVerificationEmail(to, userName, verificationToken) {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const emailOptions = {
      to: to,
      subject:
        "Xác thực email đăng ký ký túc xá - Trường Đại học Sư phạm Kỹ thuật",
      html: this.getVerificationEmailTemplate(
        userName,
        verificationLink,
        verificationToken
      ),
    };

    return await this.sendEmail(emailOptions);
  }

  /**
   * Gửi email thông báo mật khẩu đã được thiết lập
   */
  async sendPasswordSetupConfirmation(to, userName, maSinhVien) {
    const loginLink = `${process.env.FRONTEND_URL}/login`;

    const emailOptions = {
      to: to,
      subject: "Đăng ký ký túc xá hoàn tất - Trường Đại học Sư phạm Kỹ thuật",
      html: this.getPasswordSetupConfirmationTemplate(
        userName,
        maSinhVien,
        loginLink
      ),
    };

    return await this.sendEmail(emailOptions);
  }

  /**
   * Template email xác thực
   */
  getVerificationEmailTemplate(userName, verificationLink, token) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác thực email đăng ký ký túc xá</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .button:hover { background-color: #1d4ed8; }
          .token-box { background-color: #e5e7eb; padding: 15px; border-radius: 6px; margin: 15px 0; word-break: break-all; font-family: monospace; }
          .footer { margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          .logo { font-size: 24px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏢 Ký túc xá STU</div>
            <h1 style="margin: 10px 0 0 0; font-size: 20px;">Xác thực email đăng ký</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #2563eb; margin-top: 0;">Xin chào ${userName}!</h2>
            
            <p>Cảm ơn bạn đã đăng ký ở ký túc xá <strong>Trường Đại học Sư phạm Kỹ thuật</strong>.</p>
            
            <p>Để hoàn tất quá trình đăng ký, vui lòng xác thực email của bạn bằng cách nhấp vào nút bên dưới:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button">✅ Xác thực Email</a>
            </div>
            
            <p>Hoặc bạn có thể copy đường link sau vào trình duyệt:</p>
            <div class="token-box">${verificationLink}</div>
            
            <p><strong>Mã xác thực của bạn:</strong></p>
            <div class="token-box">${token}</div>
            
            <div style="background-color: #fef3cd; border: 1px solid #facc15; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>⚠️ Lưu ý quan trọng:</strong></p>
              <ul style="margin: 10px 0 0 0; color: #92400e;">
                <li>Link xác thực này sẽ hết hạn sau <strong>24 giờ</strong></li>
                <li>Sau khi xác thực email, bạn sẽ cần thiết lập mật khẩu</li>
                <li>Đăng ký của bạn sẽ được chuyển sang trạng thái "CHỜ DUYỆT"</li>
              </ul>
            </div>
            
            <p>Sau khi xác thực email thành công, bạn sẽ có thể:</p>
            <ul>
              <li>🔑 Thiết lập mật khẩu cho tài khoản</li>
              <li>🏠 Theo dõi tình trạng đăng ký phòng</li>
              <li>📧 Nhận thông báo về kết quả phê duyệt</li>
            </ul>
          </div>
          
          <div class="footer">
            <p><strong>🏢 Phòng Quản lý Ký túc xá</strong><br>
            Trường Đại học Sư phạm Kỹ thuật TP.HCM<br>
            📧 Email: ktx@stu.edu.vn | ☎️ Hotline: (028) 3896 1234</p>
            
            <p>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi để được hỗ trợ.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template email xác nhận thiết lập mật khẩu
   */
  getPasswordSetupConfirmationTemplate(userName, maSinhVien, loginLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đăng ký ký túc xá hoàn tất</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .button:hover { background-color: #15803d; }
          .info-box { background-color: #dcfce7; border: 1px solid #16a34a; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          .logo { font-size: 24px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏢 Ký túc xá STU</div>
            <h1 style="margin: 10px 0 0 0; font-size: 20px;">🎉 Đăng ký hoàn tất!</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #16a34a; margin-top: 0;">Chúc mừng ${userName}!</h2>
            
            <p>Bạn đã hoàn tất quá trình đăng ký ở ký túc xá <strong>Trường Đại học Sư phạm Kỹ thuật</strong>.</p>
            
            <div class="info-box">
              <p style="margin: 0;"><strong>📋 Thông tin tài khoản của bạn:</strong></p>
              <ul style="margin: 10px 0 0 0;">
                <li><strong>Mã sinh viên:</strong> ${maSinhVien}</li>
                <li><strong>Họ tên:</strong> ${userName}</li>
                <li><strong>Trạng thái:</strong> Chờ duyệt</li>
              </ul>
            </div>
            
            <p>Bây giờ bạn có thể đăng nhập vào hệ thống để theo dõi tình trạng đăng ký:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginLink}" class="button">🔑 Đăng nhập ngay</a>
            </div>
            
            <div style="background-color: #dbeafe; border: 1px solid #2563eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;"><strong>📝 Các bước tiếp theo:</strong></p>
              <ol style="margin: 10px 0 0 0; color: #1e40af;">
                <li>Đăng ký của bạn đang trong trạng thái <strong>"CHỜ DUYỆT"</strong></li>
                <li>Phòng Quản lý Ký túc xá sẽ xem xét và phê duyệt đăng ký</li>
                <li>Bạn sẽ nhận được email thông báo kết quả</li>
                <li>Nếu được duyệt, bạn sẽ được hướng dẫn làm thủ tục nhận phòng</li>
              </ol>
            </div>
            
            <p>Trong thời gian chờ duyệt, bạn có thể:</p>
            <ul>
              <li>🔍 Theo dõi tình trạng đăng ký trên hệ thống</li>
              <li>📝 Cập nhật thông tin cá nhân (nếu cần)</li>
              <li>📞 Liên hệ Phòng Quản lý nếu có thắc mắc</li>
            </ul>
          </div>
          
          <div class="footer">
            <p><strong>🏢 Phòng Quản lý Ký túc xá</strong><br>
            Trường Đại học Sư phạm Kỹ thuật TP.HCM<br>
            📧 Email: ktx@stu.edu.vn | ☎️ Hotline: (028) 3896 1234<br>
            🏠 Địa chỉ: 1 Võ Văn Ngân, Thủ Đức, TP.HCM</p>
            
            <p>Cảm ơn bạn đã tin tướng và lựa chọn ký túc xá của chúng tôi!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Khởi tạo service
const emailService = new EmailService();

// Export các method để sử dụng
module.exports = {
  sendEmail: (emailOptions) => emailService.sendEmail(emailOptions),
  sendVerificationEmail: (to, userName, token) =>
    emailService.sendVerificationEmail(to, userName, token),
  sendPasswordSetupConfirmation: (to, userName, maSinhVien) =>
    emailService.sendPasswordSetupConfirmation(to, userName, maSinhVien),
};
