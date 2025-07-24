const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Giuong = sequelize.define(
  "Giuong",
  {
    MaGiuong: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    MaPhong: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Phong",
        key: "MaPhong",
      },
    },
    SoGiuong: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    DaCoNguoi: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment:
        "Trạng thái giường đã có người hay chưa, true = đã có, false = chưa có",
    },
    MaSinhVienChiEm: {
      type: DataTypes.STRING(10),
      allowNull: true,
      unique: true,
      references: {
        model: "SinhVien",
        key: "MaSinhVien",
      },
    },
    TrangThai: {
      type: DataTypes.ENUM("HOAT_DONG", "BAO_TRI", "NGUNG_HOAT_DONG"),
      allowNull: false,
      defaultValue: "HOAT_DONG",
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
    tableName: "Giuong",
    timestamps: false,
  }
);

module.exports = Giuong;
