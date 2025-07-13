const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChiSoDienNuoc = sequelize.define(
  "ChiSoDienNuoc",
  {
    MaChiSo: {
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
    ThangNam: {
      type: DataTypes.STRING(7),
      allowNull: true,
    },
    SoDienCu: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    SoDienMoi: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    SoNuocCu: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    SoNuocMoi: {
      type: DataTypes.INTEGER,
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
    tableName: "ChiSoDienNuoc",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["MaPhong", "ThangNam"],
      },
    ],
  }
);

module.exports = ChiSoDienNuoc;
