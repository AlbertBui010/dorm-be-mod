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
      comment: "Giới tính của phòng (Nam/Nữ)",
    },
    GiaThueThang: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    DienTich: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 20.0,
    },
    TrangThai: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "Hoạt động",
    },
    MoTa: {
      type: DataTypes.TEXT,
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
    tableName: "Phong",
    timestamps: false,
  }
);

module.exports = Phong;
