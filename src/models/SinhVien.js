const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { STUDENT_STATUS } = require("../constants/sinhvien");

const SinhVien = sequelize.define(
  "SinhVien",
  {
    MaSinhVien: {
      type: DataTypes.STRING(10),
      primaryKey: true,
    },
    HoTen: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    NgaySinh: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    GioiTinh: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    SoDienThoai: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    Email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    EmailDaXacThuc: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    MaXacThucEmail: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    MatKhau: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    MaResetMatKhau: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    NgayHetHanResetMatKhau: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    TrangThai: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: STUDENT_STATUS.DANG_KY,
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
    tableName: "SinhVien",
    timestamps: false,
  }
);

module.exports = SinhVien;
