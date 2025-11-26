import CryptoJS from "crypto-js";

const secretKey = CryptoJS.enc.Utf8.parse('1234567890123456'); // 16 bytes = AES-128
const iv = CryptoJS.enc.Utf8.parse('6543210987654321'); // Also 16 bytes

const dataEncrypt = (text: string): string =>{
  const encrypted = CryptoJS.AES.encrypt(text, secretKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString(); // Base64 encoded
}

 const dataDecrypt = (encryptedText: string): string =>{
  const decrypted = CryptoJS.AES.decrypt(encryptedText, secretKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}


export { dataEncrypt, dataDecrypt };
