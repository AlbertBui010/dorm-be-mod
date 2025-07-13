const PayOS = require("@payos/node");
require("dotenv").config();

// Kiểm tra các biến môi trường PayOS
console.log("[PayOS] CLIENT_ID  :", process.env.PAYOS_CLIENT_ID);
console.log(
  "[PayOS] API_KEY    :",
  process.env.PAYOS_API_KEY ? "SET" : "NOT_SET"
);
console.log(
  "[PayOS] CHECKSUM   :",
  process.env.PAYOS_CHECKSUM_KEY ? "SET" : "NOT_SET"
);

// Khởi tạo PayOS với 3 tham số
const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

module.exports = payos;
