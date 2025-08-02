#!/usr/bin/env node

/**
 * Script nhanh để reset database (dành cho development)
 * Xóa tất cả dữ liệu và reset sequences
 *
 * Cách sử dụng:
 * node scripts/reset-db-quick.js
 */

const { sequelize } = require("../src/models");

async function quickReset() {
  try {
    console.log("🔄 Bắt đầu reset database...");

    // Lấy danh sách tất cả các bảng
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`📋 Tìm thấy ${tables.length} bảng`);

    // Bắt đầu transaction
    const transaction = await sequelize.transaction();

    try {
      // Vô hiệu hóa foreign key constraints
      await sequelize.query("SET session_replication_role = replica;", {
        transaction,
      });

      // Xóa tất cả dữ liệu từ tất cả các bảng
      for (const table of tables) {
        try {
          await sequelize.query(
            `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`,
            { transaction }
          );
          console.log(`✅ Đã xóa bảng ${table}`);
        } catch (error) {
          console.log(`⚠️  Không thể truncate ${table}: ${error.message}`);
          // Thử DELETE thay thế
          try {
            await sequelize.query(`DELETE FROM "${table}";`, { transaction });
            console.log(`✅ Đã xóa dữ liệu từ ${table} (DELETE)`);
          } catch (deleteError) {
            console.log(`❌ Không thể xóa ${table}: ${deleteError.message}`);
          }
        }
      }

      // Kích hoạt lại foreign key constraints
      await sequelize.query("SET session_replication_role = DEFAULT;", {
        transaction,
      });

      await transaction.commit();

      console.log();
      console.log("🎉 Reset database thành công!");
      console.log("✨ Tất cả dữ liệu đã được xóa và sequences đã được reset");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("💥 Lỗi khi reset database:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Chạy script
quickReset();
