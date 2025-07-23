

const bcrypt = require("bcryptjs");

async function hashPasswrod() {

    const matKhauHash = await bcrypt.hash("123456", 12);
    console.log("Hashed Password:", matKhauHash);
}
console.log("Hashing password...");
hashPasswrod();
