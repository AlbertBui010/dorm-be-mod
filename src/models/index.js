const sequelize = require("../config/database");

// Import models
const NhanVien = require("./NhanVien");
const SinhVien = require("./SinhVien");
const Phong = require("./Phong");
const Giuong = require("./Giuong");
const DangKy = require("./DangKy");
const LichSuOPhong = require("./LichSuOPhong");
const DonGiaDienNuoc = require("./DonGiaDienNuoc");
const ChiSoDienNuoc = require("./ChiSoDienNuoc");
const ChiTietDienNuoc = require("./ChiTietDienNuoc");
const ThanhToan = require("./ThanhToan");
const YeuCauChuyenPhong = require("./YeuCauChuyenPhong");
const LyDoTuChoi = require("./LyDoTuChoi");

// Define associations
// Phong - Giuong (One to Many)
Phong.hasMany(Giuong, { foreignKey: "MaPhong", as: "Giuongs" });
Giuong.belongsTo(Phong, { foreignKey: "MaPhong", as: "Phong" });

// SinhVien - Giuong (One to One)
SinhVien.hasOne(Giuong, { foreignKey: "MaSinhVienChiEm", as: "Giuong" });
Giuong.belongsTo(SinhVien, { foreignKey: "MaSinhVienChiEm", as: "SinhVien" });

// SinhVien - DangKy (One to Many)
SinhVien.hasMany(DangKy, { foreignKey: "MaSinhVien", as: "dangKys" });
DangKy.belongsTo(SinhVien, { foreignKey: "MaSinhVien", as: "sinhVien" });

// Thêm association ngược cho SinhVien để có thể lấy đăng ký hiện tại
SinhVien.hasOne(DangKy, { foreignKey: "MaSinhVien", as: "dangKyS" });

// Phong - DangKy (One to Many)
Phong.hasMany(DangKy, { foreignKey: "MaPhong", as: "DangKys" });
DangKy.belongsTo(Phong, { foreignKey: "MaPhong", as: "Phong" });

// Giuong - DangKy (One to Many)
Giuong.hasMany(DangKy, { foreignKey: "MaGiuong", as: "DangKys" });
DangKy.belongsTo(Giuong, { foreignKey: "MaGiuong", as: "Giuong" });

// SinhVien - LichSuOPhong (One to Many)
SinhVien.hasMany(LichSuOPhong, {
  foreignKey: "MaSinhVien",
  as: "LichSuOPhongs",
});
LichSuOPhong.belongsTo(SinhVien, { foreignKey: "MaSinhVien", as: "SinhVien" });

// Phong - LichSuOPhong (One to Many)
Phong.hasMany(LichSuOPhong, { foreignKey: "MaPhong", as: "LichSuOPhongs" });
LichSuOPhong.belongsTo(Phong, { foreignKey: "MaPhong", as: "Phong" });

// Phong - ChiSoDienNuoc (One to Many)
Phong.hasMany(ChiSoDienNuoc, { foreignKey: "MaPhong", as: "ChiSoDienNuocs" });
ChiSoDienNuoc.belongsTo(Phong, { foreignKey: "MaPhong", as: "Phong" });

// ChiSoDienNuoc - ChiTietDienNuoc (One to Many)
ChiSoDienNuoc.hasMany(ChiTietDienNuoc, {
  foreignKey: "MaChiSo",
  as: "ChiTietDienNuocs",
});
ChiTietDienNuoc.belongsTo(ChiSoDienNuoc, {
  foreignKey: "MaChiSo",
  as: "ChiSoDienNuoc",
});

// SinhVien - ChiTietDienNuoc (One to Many)
SinhVien.hasMany(ChiTietDienNuoc, {
  foreignKey: "MaSinhVien",
  as: "ChiTietDienNuocs",
});
ChiTietDienNuoc.belongsTo(SinhVien, {
  foreignKey: "MaSinhVien",
  as: "SinhVien",
});

// SinhVien - ThanhToan (One to Many)
SinhVien.hasMany(ThanhToan, { foreignKey: "MaSinhVien", as: "ThanhToans" });
ThanhToan.belongsTo(SinhVien, { foreignKey: "MaSinhVien", as: "SinhVien" });

// Phong - ThanhToan (One to Many)
Phong.hasMany(ThanhToan, { foreignKey: "MaPhong", as: "ThanhToans" });
ThanhToan.belongsTo(Phong, { foreignKey: "MaPhong", as: "Phong" });

// SinhVien - YeuCauChuyenPhong (One to Many)
SinhVien.hasMany(YeuCauChuyenPhong, {
  foreignKey: "MaSinhVien",
  as: "YeuCauChuyenPhongs",
});
YeuCauChuyenPhong.belongsTo(SinhVien, {
  foreignKey: "MaSinhVien",
  as: "SinhVien",
});

// Phong - YeuCauChuyenPhong (One to Many)
Phong.hasMany(YeuCauChuyenPhong, {
  foreignKey: "MaPhongMoi",
  as: "YeuCauChuyenPhongs",
});
YeuCauChuyenPhong.belongsTo(Phong, {
  foreignKey: "MaPhongMoi",
  as: "PhongMoi",
});

module.exports = {
  sequelize,
  NhanVien,
  SinhVien,
  Phong,
  Giuong,
  DangKy,
  LichSuOPhong,
  DonGiaDienNuoc,
  ChiSoDienNuoc,
  ChiTietDienNuoc,
  ThanhToan,
  YeuCauChuyenPhong,
};
