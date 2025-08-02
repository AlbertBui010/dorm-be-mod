-- Migration: Add reset password fields to SinhVien table
-- Date: 2024-01-XX
-- Description: Add fields for password reset functionality

-- Add MaResetMatKhau column
ALTER TABLE SinhVien 
ADD COLUMN MaResetMatKhau VARCHAR(255) NULL;

-- Add NgayHetHanResetMatKhau column  
ALTER TABLE SinhVien 
ADD COLUMN NgayHetHanResetMatKhau DATETIME NULL;

-- Add index for better performance when searching by reset token
CREATE INDEX idx_sinhvien_reset_token ON SinhVien(MaResetMatKhau);

-- Add index for better performance when checking token expiry
CREATE INDEX idx_sinhvien_reset_expiry ON SinhVien(NgayHetHanResetMatKhau); 