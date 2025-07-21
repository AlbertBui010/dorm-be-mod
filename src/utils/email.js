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
        "Xác thực email đăng ký ký túc xá - Trường Đại học Công Nghệ Sài Gòn",
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
      subject: "Đăng ký ký túc xá hoàn tất - Trường Đại học Công Nghệ Sài Gòn",
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
            
            <p>Cảm ơn bạn đã đăng ký ở ký túc xá <strong>Trường Đại học Công Nghệ Sài Gòn</strong>.</p>
            
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
            Trường Đại học Công Nghệ Sài Gòn<br>
            📧 Email: ktx@stu.edu.vn | ☎️ Hotline: 0929812000</p>
            
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
            
            <p>Bạn đã hoàn tất quá trình đăng ký ở ký túc xá <strong>Trường Đại học Công Nghệ Sài Gòn</strong>.</p>
            
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
            Trường Đại học Công Nghệ Sài Gòn<br>
            📧 Email: ktx@stu.edu.vn | ☎️ Hotline: 0929812000<br>
            🏠 Địa chỉ: 180 Cao Lỗ, Phường 4, Quận 8, TP HCM</p>
            
            <p>Cảm ơn bạn đã tin tướng và lựa chọn ký túc xá của chúng tôi!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Gửi email thông báo duyệt đăng ký
   */
  async sendApprovalEmail({
    email,
    hoTen,
    maSinhVien,
    maPhong, // Tên phòng (SoPhong)
    maGiuong, // Số giường (SoGiuong)
    ngayNhanPhong,
  }) {
    const loginLink = `${process.env.FRONTEND_URL}/login`;

    const emailOptions = {
      to: email,
      subject:
        "✅ Đăng ký ký túc xá đã được duyệt - Trường Đại học Công Nghệ Sài Gòn",
      html: this.getApprovalEmailTemplate(
        hoTen,
        maSinhVien,
        maPhong, // Tên phòng
        maGiuong, // Số giường
        ngayNhanPhong,
        loginLink
      ),
    };

    return await this.sendEmail(emailOptions);
  }

  /**
   * Gửi email thông báo từ chối đăng ký
   */
  async sendRejectionEmail({ email, hoTen, lyDoTuChoi }) {
    const emailOptions = {
      to: email,
      subject:
        "❌ Đăng ký ký túc xá không được duyệt - Trường Đại học Công Nghệ Sài Gòn",
      html: this.getRejectionEmailTemplate(hoTen, lyDoTuChoi),
    };

    return await this.sendEmail(emailOptions);
  }

  /**
   * Template email duyệt đăng ký
   */
  getApprovalEmailTemplate(
    hoTen,
    maSinhVien,
    tenPhong, // Tên phòng (ví dụ: A303)
    soGiuong, // Số giường (ví dụ: G01)
    ngayNhanPhong,
    loginLink
  ) {
    const formattedDate = new Date(ngayNhanPhong).toLocaleDateString("vi-VN");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đăng ký ký túc xá được duyệt</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .info-box { background-color: #dcfce7; border: 1px solid #059669; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 6px; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Chúc mừng! Đăng ký được duyệt</h1>
          </div>
          
          <div class="content">
            <p>Kính chào <strong>${hoTen}</strong>,</p>
            
            <p>Chúng tôi vui mừng thông báo rằng đăng ký ký túc xá của bạn đã được <strong>DUYỆT THÀNH CÔNG</strong>!</p>
            
            <div class="info-box">
              <h3>📋 Thông tin phòng ở được phân bổ:</h3>
              <ul>
                <li><strong>Mã sinh viên:</strong> ${maSinhVien}</li>
                <li><strong>Phòng:</strong> ${tenPhong}</li>
                <li><strong>Giường:</strong> ${soGiuong}</li>
                <li><strong>Ngày nhận phòng:</strong> ${formattedDate}</li>
              </ul>
            </div>
            
            <p>Bạn có thể đăng nhập vào hệ thống để xem chi tiết và theo dõi thông tin thanh toán:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginLink}" class="button">🔑 Đăng nhập hệ thống</a>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>📝 Các bước tiếp theo:</strong></p>
              <ol style="margin: 10px 0 0 0; color: #92400e;">
                <li>Thanh toán tiền phòng theo hướng dẫn</li>
                <li>Chuẩn bị giấy tờ cần thiết</li>
                <li>Đến nhận phòng đúng thời gian</li>
                <li>Tuân thủ nội quy ký túc xá</li>
              </ol>
            </div>
            
            <p><strong>🏠 Địa chỉ ký túc xá:</strong><br>
            180 Cao Lỗ, Phường 4, Quận 8, TP HCM</p>
            
            <p><strong>📞 Liên hệ hỗ trợ:</strong><br>
            - Hotline: 0929812000<br>
            - Email: ktx@stu.edu.vn</p>
          </div>
          
          <div class="footer">
            <p><strong>🏢 Phòng Quản lý Ký túc xá</strong><br>
            Trường Đại học Công Nghệ Sài Gòn<br>
            Chúc bạn có những trải nghiệm tuyệt vời tại ký túc xá!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template email từ chối đăng ký
   */
  getRejectionEmailTemplate(hoTen, lyDoTuChoi) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thông báo từ chối đăng ký</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background-color: #fecaca; border: 1px solid #dc2626; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .contact-box { background-color: #dbeafe; border: 1px solid #2563eb; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 6px; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Thông báo về đăng ký ký túc xá</h1>
          </div>
          
          <div class="content">
            <p>Kính chào <strong>${hoTen}</strong>,</p>
            
            <p>Chúng tôi xin thông báo rằng đăng ký ký túc xá của bạn không được duyệt trong đợt này.</p>
            
            <div class="info-box">
              <h3>📝 Lý do không duyệt:</h3>
              <p>${lyDoTuChoi}</p>
            </div>
            
            <p>Chúng tôi rất tiếc về quyết định này. Bạn có thể:</p>
            <ul>
              <li>🔄 Đăng ký lại trong đợt tiếp theo</li>
              <li>📞 Liên hệ để được tư vấn và hỗ trợ</li>
              <li>📝 Cập nhật thông tin để phù hợp hơn với yêu cầu</li>
            </ul>
            
            <div class="contact-box">
              <p style="margin: 0; color: #1e40af;"><strong>📞 Thông tin liên hệ:</strong></p>
              <ul style="margin: 10px 0 0 0; color: #1e40af;">
                <li>Hotline: 0929812000</li>
                <li>Email: ktx@stu.edu.vn</li>
                <li>Địa chỉ: 180 Cao Lỗ, Phường 4, Quận 8, TP HCM</li>
                <li>Giờ làm việc: 8:00 - 17:00 (Thứ 2 - Thứ 6)</li>
              </ul>
            </div>
            
            <p>Cảm ơn bạn đã quan tâm đến ký túc xá của chúng tôi. Chúng tôi hy vọng sẽ có cơ hội phục vụ bạn trong tương lai.</p>
          </div>
          
          <div class="footer">
            <p><strong>🏢 Phòng Quản lý Ký túc xá</strong><br>
            Trường Đại học Công Nghệ Sài Gòn<br>
            Cảm ơn bạn đã hiểu và thông cảm!</p>
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
  sendApprovalEmail: ({
    email,
    hoTen,
    maSinhVien,
    maPhong,
    maGiuong,
    ngayNhanPhong,
  }) =>
    emailService.sendApprovalEmail({
      email,
      hoTen,
      maSinhVien,
      maPhong,
      maGiuong,
      ngayNhanPhong,
    }),
  sendRejectionEmail: ({ email, hoTen, lyDoTuChoi }) =>
    emailService.sendRejectionEmail({ email, hoTen, lyDoTuChoi }),
};
