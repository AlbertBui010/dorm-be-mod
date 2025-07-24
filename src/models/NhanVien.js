const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { NHAN_VIEN_TRANG_THAI } = require("../constants/nhanVien");

const NhanVien = sequelize.define(
  "NhanVien",
  {
    MaNhanVien: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    TenDangNhap: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    MatKhau: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    HoTen: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    Email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    SoDienThoai: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    VaiTro: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    TrangThai: {
      type: DataTypes.STRING(20),
      enum: Object.values(NHAN_VIEN_TRANG_THAI),
      defaultValue: NHAN_VIEN_TRANG_THAI.HOAT_DONG,
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
    tableName: "NhanVien",
    timestamps: false,
  }
);

module.exports = NhanVien;
