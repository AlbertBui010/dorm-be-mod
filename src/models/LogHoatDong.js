const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LogHoatDong = sequelize.define(
  "LogHoatDong",
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    MaSinhVien: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: "SinhVien",
        key: "MaSinhVien",
      },
    },
    MaNguoiDungTacDong: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    HanhDong: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    ChiTiet: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ThoiGian: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "LogHoatDong",
    timestamps: false,
  }
);

module.exports = LogHoatDong;
