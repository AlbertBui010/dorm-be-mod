const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DonGiaDienNuoc = sequelize.define(
  "DonGiaDienNuoc",
  {
    MaDonGia: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    NgayApDung: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    GiaDienPerKWh: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    GiaNuocPerM3: {
      type: DataTypes.DECIMAL(10, 2),
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
    tableName: "DonGiaDienNuoc",
    timestamps: false,
  }
);

module.exports = DonGiaDienNuoc;
