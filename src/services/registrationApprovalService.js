const { Op } = require("sequelize");
const sequelize = require("../config/database");
const DangKy = require("../models/DangKy");
const SinhVien = require("../models/SinhVien");
const Phong = require("../models/Phong");
const Giuong = require("../models/Giuong");
const LichSuOPhong = require("../models/LichSuOPhong");
const ThanhToan = require("../models/ThanhToan");
const emailService = require("../utils/email");
const { PHONG_STATUS } = require("../constants/phong");
const { GIUONG_STATUS } = require("../constants/giuong");
const { REGISTRATION_STATUS } = require("../constants/dangky");
const { STUDENT_STATUS } = require("../constants/sinhvien");
const { STUDENT_ROOM_HISTORY } = require("../constants/LichSuOPhong");
class RegistrationApprovalService {
  /**
   * Tính toán số tiền phòng theo quy tắc mới
   * Tính dựa trên ngày bắt đầu ở và ngày kết thúc ở
   * Hệ số tháng: Từ ngày 15 trở đi = 0.5, Trước ngày 15 = 1.0
   * Một quý = 3.0 (cộng tổng)
   */
  calculateRoomFee(giaThueThang, ngayBatDau, ngayKetThuc) {
    const ngayBD = new Date(ngayBatDau);
    const ngayKT = new Date(ngayKetThuc);

    let tongTien = 0;
    let chiTietTinhToan = [];

    // Tính từng tháng từ ngày bắt đầu đến ngày kết thúc
    let currentDate = new Date(ngayBD);

    while (currentDate <= ngayKT) {
      const ngayTrongThang = currentDate.getDate();
      const thang = currentDate.getMonth() + 1;
      const nam = currentDate.getFullYear();

      // Tính hệ số tháng dựa vào ngày nhận phòng trong tháng
      const heSoThang = ngayTrongThang >= 15 ? 0.5 : 1.0;

      // Tính tiền cho tháng này
      const tienThang = giaThueThang * heSoThang;
      tongTien += tienThang;

      chiTietTinhToan.push({
        thang: `${String(thang).padStart(2, "0")}/${nam}`,
        ngayTrongThang,
        heSoThang,
        tienThang: Math.round(tienThang),
        tinhToan: `${giaThueThang} × ${heSoThang} = ${tienThang}`,
      });

      // Chuyển sang tháng tiếp theo
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(1); // Đặt về ngày 1 của tháng tiếp theo
    }

    return {
      soTien: Math.round(tongTien),
      tongSoThang: chiTietTinhToan.length,
      giaThueThang,
      chiTiet: {
        ngayBatDau: ngayBD.toISOString().split("T")[0],
        ngayKetThuc: ngayKT.toISOString().split("T")[0],
        chiTietTheoThang: chiTietTinhToan,
        tongTien: Math.round(tongTien),
      },
    };
  }

  /**
   * Lấy danh sách đăng ký chờ duyệt
   */
  async getPendingRegistrations({
    page = 1,
    limit = 10,
    search,
    gioiTinh,
    nguyenVong,
    trangThai,
  }) {
    try {
      const offset = (page - 1) * limit;
      const whereConditions = {};

      // Sửa logic filter trạng thái
      if (trangThai) {
        if (trangThai.includes(",")) {
          whereConditions.TrangThai = { [Op.in]: trangThai.split(",") };
        } else {
          whereConditions.TrangThai = trangThai;
        }
      } else {
        whereConditions.TrangThai = REGISTRATION_STATUS.CHO_DUYET;
      }

      // Điều kiện tìm kiếm cho SinhVien
      const sinhVienWhere = {};
      if (search) {
        sinhVienWhere[Op.or] = [
          { HoTen: { [Op.iLike]: `%${search}%` } },
          { Email: { [Op.iLike]: `%${search}%` } },
          { MaSinhVien: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (gioiTinh) {
        sinhVienWhere.GioiTinh = gioiTinh;
      }

      if (nguyenVong) {
        whereConditions.NguyenVong = nguyenVong;
      }

      const { count, rows } = await DangKy.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: SinhVien,
            as: "sinhVien",
            where: sinhVienWhere,
            attributes: [
              "MaSinhVien",
              "HoTen",
              "Email",
              "NgaySinh",
              "GioiTinh",
              "SoDienThoai",
            ],
            required: true,
          },
        ],
        limit,
        offset,
        order: [["NgayTao", "ASC"]],
        attributes: [
          "MaDangKy",
          "MaSinhVien",
          "NgayNhanPhong",
          "NguyenVong",
          "TrangThai",
          "NgayTao",
          "NgayKetThucHopDong",
        ],
      });

      // Format lại data để trả về flat structure
      const formattedRows = rows.map((row) => ({
        MaDangKy: row.MaDangKy,
        MaSinhVien: row.MaSinhVien,
        Email: row.sinhVien?.Email,
        HoTen: row.sinhVien?.HoTen,
        NgaySinh: row.sinhVien?.NgaySinh,
        GioiTinh: row.sinhVien?.GioiTinh,
        SoDienThoai: row.sinhVien?.SoDienThoai,
        NgayNhanPhong: row.NgayNhanPhong,
        NguyenVong: row.NguyenVong,
        TrangThai: row.TrangThai,
        NgayTao: row.NgayTao,
        NgayKetThucHopDong: row.NgayKetThucHopDong,
      }));

      return {
        success: true,
        data: {
          registrations: formattedRows,
          pagination: {
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
          },
        },
        message: "Lấy danh sách đăng ký thành công",
      };
    } catch (error) {
      console.error("Error in getPendingRegistrations:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi lấy danh sách đăng ký",
        errors: [error.message],
      };
    }
  }

  /**
   * Lấy thống kê tổng quan
   */
  async getRegistrationStats() {
    try {
      const [
        totalPending,
        totalApproved,
        totalRejected,
        genderStats,
        nguyenVongStats,
      ] = await Promise.all([
        DangKy.count({ where: { TrangThai: REGISTRATION_STATUS.CHO_DUYET } }),
        DangKy.count({ where: { TrangThai: REGISTRATION_STATUS.DA_DUYET } }),
        DangKy.count({ where: { TrangThai: REGISTRATION_STATUS.DA_TU_CHOI } }),
        // Gender stats từ SinhVien join với DangKy
        sequelize.query(
          `
          SELECT sv."GioiTinh", COUNT(*) as count
          FROM "DangKy" dk
          JOIN "SinhVien" sv ON dk."MaSinhVien" = sv."MaSinhVien"
          WHERE dk."TrangThai" = 'CHO_DUYET'
          GROUP BY sv."GioiTinh"
        `,
          { type: sequelize.QueryTypes.SELECT }
        ),
        DangKy.findAll({
          where: { TrangThai: REGISTRATION_STATUS.CHO_DUYET },
          attributes: [
            "NguyenVong",
            [sequelize.fn("COUNT", sequelize.col("MaDangKy")), "count"],
          ],
          group: ["NguyenVong"],
          raw: true,
        }),
      ]);

      // Format gender stats
      const formattedGenderStats = genderStats.reduce(
        (acc, item) => {
          if (item.GioiTinh === "Nam") acc.male = parseInt(item.count);
          if (item.GioiTinh === "Nữ") acc.female = parseInt(item.count);
          return acc;
        },
        { male: 0, female: 0 }
      );

      return {
        success: true,
        data: {
          totalPending,
          totalApproved,
          totalRejected,
          genderStats: formattedGenderStats,
          nguyenVongStats: nguyenVongStats.reduce((acc, item) => {
            acc[item.NguyenVong] = parseInt(item.count);
            return acc;
          }, {}),
        },
        message: "Lấy thống kê thành công",
      };
    } catch (error) {
      console.error("Error in getRegistrationStats:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi lấy thống kê",
        errors: [error.message],
      };
    }
  }

  /**
   * Lấy chi tiết đăng ký
   */
  async getRegistrationDetail(maDangKy) {
    try {
      const registration = await DangKy.findByPk(maDangKy, {
        include: [
          {
            model: SinhVien,
            as: "sinhVien",
            attributes: [
              "MaSinhVien",
              "HoTen",
              "Email",
              "NgaySinh",
              "GioiTinh",
              "SoDienThoai",
            ],
          },
        ],
      });

      if (!registration) {
        return { success: false, message: "Không tìm thấy đăng ký" };
      }

      let soPhong = null,
        soGiuong = null;
      if (
        registration.TrangThai === REGISTRATION_STATUS.DA_DUYET &&
        registration.sinhVien
      ) {
        // Tìm giường của sinh viên này
        const giuong = await Giuong.findOne({
          where: { MaSinhVienChiEm: registration.MaSinhVien },
          include: [{ model: Phong, as: "Phong", attributes: ["SoPhong"] }],
        });
        if (giuong) {
          soPhong = giuong.Phong?.SoPhong || null;
          soGiuong = giuong.SoGiuong || null;
        }
      }

      const formattedData = {
        MaDangKy: registration.MaDangKy,
        MaSinhVien: registration.MaSinhVien,
        Email: registration.sinhVien?.Email,
        HoTen: registration.sinhVien?.HoTen,
        NgaySinh: registration.sinhVien?.NgaySinh,
        GioiTinh: registration.sinhVien?.GioiTinh,
        SoDienThoai: registration.sinhVien?.SoDienThoai,
        NgayNhanPhong: registration.NgayNhanPhong,
        NguyenVong: registration.NguyenVong,
        TrangThai: registration.TrangThai,
        NgayTao: registration.NgayTao,
        NgayKetThucHopDong: registration.NgayKetThucHopDong,
        Phong: soPhong,
        Giuong: soGiuong,
        LyDoTuChoi: registration.LyDoTuChoi || null,
      };

      return {
        success: true,
        data: formattedData,
        message: "Lấy chi tiết đăng ký thành công",
      };
    } catch (error) {
      console.error("Error in getRegistrationDetail:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi lấy chi tiết đăng ký",
        errors: [error.message],
      };
    }
  }

  /**
   * Tìm phòng có sẵn cho đăng ký
   */
  async findAvailableRooms(maDangKy, { page = 1, limit = 10 }) {
    try {
      const registration = await DangKy.findByPk(maDangKy, {
        include: [
          {
            model: SinhVien,
            as: "sinhVien",
            attributes: ["GioiTinh"],
          },
        ],
      });

      if (!registration) {
        return {
          success: false,
          message: "Không tìm thấy đăng ký",
        };
      }

      const offset = (page - 1) * limit;
      const gioiTinh = registration.sinhVien?.GioiTinh;

      // Tìm TẤT CẢ phòng phù hợp với giới tính (không chỉ phòng có giường trống)
      const { count, rows } = await Phong.findAndCountAll({
        where: {
          LoaiPhong: gioiTinh === "Nam" ? "Nam" : "Nữ",
          TrangThai: PHONG_STATUS.HOAT_DONG,
        },
        include: [
          {
            model: Giuong,
            as: "Giuongs",
            required: false, // LEFT JOIN để lấy tất cả phòng
          },
        ],
        limit,
        offset,
        order: [["MaPhong", "ASC"]],
      });

      // Tính số giường trống cho mỗi phòng và thông tin chi tiết
      const roomsWithAvailableBeds = rows
        .map((room) => {
          const allBeds = room.Giuongs || [];

          // Lọc giường trống và giường đã có người có trạng thái hoạt động
          const emptyBeds = allBeds.filter(
            (bed) =>
              (bed.DaCoNguoi === false || bed.DaCoNguoi === null) &&
              bed.TrangThai === GIUONG_STATUS.HOAT_DONG
          );
          const occupiedBeds = allBeds.filter(
            (bed) =>
              bed.DaCoNguoi === true &&
              bed.TrangThai === GIUONG_STATUS.HOAT_DONG
          );

          return {
            ...room.toJSON(),
            availableBeds: emptyBeds.length, // Số giường trống
            occupiedBeds: occupiedBeds.length, // Số giường đã có người
            totalBeds: room.SucChua, // Tổng số giường theo thiết kế phòng
            actualBeds: allBeds.length, // Số giường thực tế có trong phòng
            occupancyRate:
              room.SucChua > 0
                ? Math.round((occupiedBeds.length / room.SucChua) * 100)
                : 0, // % sử dụng
            // Thông tin chi tiết các giường trống
            emptyBedDetails: emptyBeds.map((bed) => ({
              MaGiuong: bed.MaGiuong,
              SoGiuong: bed.SoGiuong,
              TenGiuong: bed.TenGiuong || `Giường ${bed.SoGiuong}`,
            })),
            // Thông tin chi tiết các giường đã có người
            occupiedBedDetails: occupiedBeds.map((bed) => ({
              MaGiuong: bed.MaGiuong,
              SoGiuong: bed.SoGiuong,
              TenGiuong: bed.TenGiuong || `Giường ${bed.SoGiuong}`,
              MaSinhVienChiEm: bed.MaSinhVienChiEm,
            })),
          };
        })
        .filter((room) => room.availableBeds > 0); // Chỉ hiển thị phòng có ít nhất 1 giường trống

      return {
        success: true,
        data: {
          rooms: roomsWithAvailableBeds,
          pagination: {
            total: roomsWithAvailableBeds.length, // Số phòng thực tế có giường trống
            totalPages: Math.ceil(roomsWithAvailableBeds.length / limit),
            currentPage: page,
            limit,
            totalRoomsInDB: count, // Tổng số phòng trong DB (để tham khảo)
          },
        },
        message: `Tìm được ${roomsWithAvailableBeds.length} phòng có giường trống`,
      };
    } catch (error) {
      console.error("Error in findAvailableRooms:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi tìm phòng",
        errors: [error.message],
      };
    }
  }

  /**
   * Duyệt đăng ký
   */
  async approveRegistration({
    maDangKy,
    maPhong,
    maGiuong,
    nguoiDuyet,
    ghiChu,
  }) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Kiểm tra đăng ký tồn tại và đang chờ duyệt
      const registration = await DangKy.findByPk(maDangKy, {
        include: [
          {
            model: SinhVien,
            as: "sinhVien",
            attributes: [
              "MaSinhVien",
              "HoTen",
              "Email",
              "GioiTinh",
              "NgaySinh",
              "SoDienThoai",
            ],
          },
        ],
        transaction,
      });

      if (!registration) {
        await transaction.rollback();
        return {
          success: false,
          message: "Không tìm thấy đăng ký",
        };
      }

      if (registration.TrangThai !== REGISTRATION_STATUS.CHO_DUYET) {
        await transaction.rollback();
        return {
          success: false,
          message: "Đăng ký không ở trạng thái chờ duyệt",
        };
      }

      // 2. Kiểm tra giường có sẵn và phù hợp
      const bed = await Giuong.findOne({
        where: {
          MaGiuong: maGiuong,
          MaPhong: maPhong,
          DaCoNguoi: false, // Kiểm tra giường trống qua DaCoNguoi
          TrangThai: GIUONG_STATUS.HOAT_DONG,
        },
        include: [
          {
            model: Phong,
            as: "Phong", // Đúng alias theo định nghĩa trong models/index.js
            where: {
              LoaiPhong:
                registration.sinhVien.GioiTinh === "Nam" ? "Nam" : "Nữ",
            },
          },
        ],
        transaction,
      });

      if (!bed) {
        await transaction.rollback();
        return {
          success: false,
          message: "Giường không có sẵn hoặc không phù hợp với giới tính",
        };
      }

      // 3. Cập nhật thông tin sinh viên
      await registration.sinhVien.update(
        {
          MaPhong: maPhong,
          MaGiuong: maGiuong,
          TrangThai: STUDENT_STATUS.CHO_NHAN_PHONG,
          NgayCapNhat: new Date(),
          NguoiCapNhat: nguoiDuyet,
        },
        { transaction }
      );

      // 4. Cập nhật trạng thái giường
      await bed.update(
        {
          DaCoNguoi: true, // Đánh dấu giường đã có người
          MaSinhVienChiEm: registration.MaSinhVien, // Gán sinh viên vào giường
          NgayCapNhat: new Date(),
          NguoiCapNhat: nguoiDuyet,
        },
        { transaction }
      );

      // 5. Cập nhật số lượng hiện tại trong phòng
      const room = await Phong.findByPk(maPhong, { transaction });
      await room.update(
        {
          SoLuongHienTai: room.SoLuongHienTai + 1,
          NgayCapNhat: new Date(),
          NguoiCapNhat: nguoiDuyet,
        },
        { transaction }
      );

      // 6. Tạo lịch sử ở phòng
      await LichSuOPhong.create(
        {
          MaSinhVien: registration.MaSinhVien,
          MaPhong: maPhong,
          NgayBatDau: registration.NgayNhanPhong,
          TrangThai: STUDENT_ROOM_HISTORY.CHO_NHAN_PHONG,
          NgayTao: new Date(),
          NguoiTao: nguoiDuyet,
        },
        { transaction }
      );

      // 7. Tính toán và tạo hóa đơn thanh toán tiền phòng
      let feeCalculation = null;
      if (registration.NgayKetThucHopDong) {
        // Lấy giá thuê tháng của phòng
        const giaThueThang = parseFloat(room.GiaThueThang);

        // Tính toán tiền phòng dựa trên ngày bắt đầu và kết thúc hợp đồng
        feeCalculation = this.calculateRoomFee(
          giaThueThang,
          registration.NgayNhanPhong,
          registration.NgayKetThucHopDong
        );

        const ngayNhanPhong = new Date(registration.NgayNhanPhong);
        const thangNam = `${String(ngayNhanPhong.getMonth() + 1).padStart(
          2,
          "0"
        )}/${ngayNhanPhong.getFullYear()}`;

        await ThanhToan.create(
          {
            MaSinhVien: registration.MaSinhVien,
            MaPhong: maPhong,
            LoaiThanhToan: "TIEN_PHONG",
            HinhThuc: "CHUYEN_KHOAN",
            ThangNam: thangNam,
            SoTien: feeCalculation.soTien,
            TrangThai: "CHUA_THANH_TOAN",
            NgayTao: new Date(),
            NguoiTao: nguoiDuyet,
          },
          { transaction }
        );
      }

      // 8. Cập nhật trạng thái đăng ký với thông tin phòng và giường
      console.log(
        `📋 [APPROVAL] Updating registration ${maDangKy} with room ${maPhong} and bed ${maGiuong}`
      );

      await registration.update(
        {
          MaPhong: maPhong, // ✅ THÊM: Cập nhật mã phòng
          MaGiuong: maGiuong, // ✅ THÊM: Cập nhật mã giường
          TrangThai: REGISTRATION_STATUS.DA_DUYET,
          NgayTao: new Date(),
          NguoiTao: nguoiDuyet,
        },
        { transaction }
      );

      console.log(
        `✅ [APPROVAL] Registration updated successfully with MaPhong: ${maPhong}, MaGiuong: ${maGiuong}`
      );

      await transaction.commit();

      // 9. Gửi email thông báo
      try {
        await emailService.sendApprovalEmail({
          email: registration.sinhVien.Email,
          hoTen: registration.sinhVien.HoTen,
          maSinhVien: registration.MaSinhVien,
          maPhong: room.SoPhong, // Gửi tên phòng thay vì mã
          maGiuong: bed.SoGiuong, // Gửi số giường thay vì mã
          ngayNhanPhong: registration.NgayNhanPhong,
        });
      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
        // Không rollback transaction vì đăng ký đã được duyệt thành công
      }

      return {
        success: true,
        data: {
          registration: registration.toJSON(),
          student: registration.sinhVien.toJSON(),
          room: room.toJSON(),
          bed: bed.toJSON(),
          feeCalculation,
        },
        message: "Duyệt đăng ký thành công",
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Error in approveRegistration:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi duyệt đăng ký",
        errors: [error.message],
      };
    }
  }

  /**
   * Từ chối đăng ký
   */
  async rejectRegistration({ maDangKy, lyDoTuChoi, nguoiDuyet }) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Kiểm tra đăng ký tồn tại và đang chờ duyệt
      const registration = await DangKy.findByPk(maDangKy, {
        include: [
          {
            model: SinhVien,
            as: "sinhVien",
            attributes: ["Email", "HoTen"],
          },
        ],
        transaction,
      });

      if (!registration) {
        await transaction.rollback();
        return {
          success: false,
          message: "Không tìm thấy đăng ký",
        };
      }

      if (registration.TrangThai !== REGISTRATION_STATUS.CHO_DUYET) {
        await transaction.rollback();
        return {
          success: false,
          message: "Đăng ký không ở trạng thái chờ duyệt",
        };
      }

      // 2. Cập nhật trạng thái đăng ký
      await registration.update(
        {
          TrangThai: REGISTRATION_STATUS.DA_TU_CHOI,
          NgayTao: new Date(),
          NguoiTao: nguoiDuyet,
        },
        { transaction }
      );

      await transaction.commit();

      // 3. Gửi email thông báo
      try {
        await emailService.sendRejectionEmail({
          email: registration.sinhVien.Email,
          hoTen: registration.sinhVien.HoTen,
          lyDoTuChoi: lyDoTuChoi,
        });
      } catch (emailError) {
        console.error("Error sending rejection email:", emailError);
        // Không rollback transaction vì từ chối đăng ký đã thành công
      }

      return {
        success: true,
        data: registration.toJSON(),
        message: "Từ chối đăng ký thành công",
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Error in rejectRegistration:", error);
      return {
        success: false,
        message: "Có lỗi xảy ra khi từ chối đăng ký",
        errors: [error.message],
      };
    }
  }
}

module.exports = new RegistrationApprovalService();
