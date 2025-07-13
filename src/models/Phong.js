const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Phong = sequelize.define(
  "Phong",
  {
    MaPhong: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    SoPhong: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    SucChua: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    SoLuongHienTai: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    LoaiPhong: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    GiaThueThang: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
    tableName: "Phong",
    timestamps: false,
  }
);

module.exports = Phong;
