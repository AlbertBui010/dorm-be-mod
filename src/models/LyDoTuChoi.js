//D:\new_LVTN\dorm-be-mod2\dorm-be-mod\src\models\LyDoTuChoi.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LyDoTuChoi = sequelize.define(
  "LyDoTuChoi",
  {
    MaLyDo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    NoiDung: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "LyDoTuChoi",
    timestamps: false,
  }
);

module.exports = LyDoTuChoi;
