const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DangKy = sequelize.define(
  "DangKy",
  {
    MaDangKy: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    MaSinhVien: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: "SinhVien",
        key: "MaSinhVien",
      },
    },
    MaPhong: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Phong",
        key: "MaPhong",
      },
    },
    MaGiuong: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Giuong",
        key: "MaGiuong",
      },
    },
    NgayDangKy: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    NgayNhanPhong: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    NgayKetThucHopDong: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    NguyenVong: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Nguyện vọng của sinh viên khi đăng ký",
    },
    TrangThai: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    NgayTao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    NguoiTao: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    NgayCapNhat: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    NguoiCapNhat: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "DangKy",
    timestamps: false,
  }
);

module.exports = DangKy;
