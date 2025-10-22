/**
 * Modules block
 */
const crypto = require("crypto");

/**
 * Encrypt to SHA-256
 * @param {string} data  String to encrypt
 * @return {string} Encrypted string
 */
function encryptSHA256(data) {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}

let n = 0;

console.log("Поиск ключа начат!");

while (1 === 1) {
  const CRYPTED = encryptSHA256(`${n}`);
  if (
    CRYPTED.match(
      /47cc4fa0e4c9269826a661d31fdb87123012e88959bbbd459e35bb0636499b9d/,
    )
  ) {
    console.log(n, "n");
    console.log(CRYPTED);
    // break;
  }
  n++;
}
