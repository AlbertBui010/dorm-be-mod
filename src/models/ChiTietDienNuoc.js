const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChiTietDienNuoc = sequelize.define(
  "ChiTietDienNuoc",
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    MaChiSo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "ChiSoDienNuoc",
        key: "MaChiSo",
      },
    },
    MaSinhVien: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: "SinhVien",
        key: "MaSinhVien",
      },
    },
    SoNgayO: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    TienDien: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    TienNuoc: {
      type: DataTypes.DECIMAL(10, 2),
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
    tableName: "ChiTietDienNuoc",
    timestamps: false,
  }
);

module.exports = ChiTietDienNuoc;
