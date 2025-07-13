const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LichSuOPhong = sequelize.define(
  "LichSuOPhong",
  {
    ID: {
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
      allowNull: false,
      references: {
        model: "Phong",
        key: "MaPhong",
      },
    },
    NgayBatDau: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    NgayKetThuc: {
      type: DataTypes.DATEONLY,
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
    tableName: "LichSuOPhong",
    timestamps: false,
  }
);

module.exports = LichSuOPhong;
