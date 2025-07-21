const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const YeuCauChuyenPhong = sequelize.define(
  "YeuCauChuyenPhong",
  {
    MaYeuCau: {
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
    LyDo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    NgayYeuCau: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    MaPhongMoi: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Phong",
        key: "MaPhong",
      },
    },
    TrangThai: {
      type: DataTypes.STRING(20),
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
    tableName: "YeuCauChuyenPhong",
    timestamps: false,
  }
);

module.exports = YeuCauChuyenPhong;
