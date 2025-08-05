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
      allowNull: false,
      unique: true,
    },
    GiaDienPerKWh: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    GiaNuocPerM3: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    NgayCapNhat: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    NguoiCapNhat: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "DonGiaDienNuoc",
    timestamps: false,
  }
);

module.exports = DonGiaDienNuoc;
