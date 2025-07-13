const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ThanhToan = sequelize.define(
  "ThanhToan",
  {
    MaThanhToan: {
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
    LoaiThanhToan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    HinhThuc: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    ThangNam: {
      type: DataTypes.STRING(7),
      allowNull: true,
    },
    SoTien: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    TrangThai: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    NgayThanhToan: {
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
    tableName: "ThanhToan",
    timestamps: false,
  }
);

module.exports = ThanhToan;
