import CryptoJS from "crypto-js";

export function decryptString(value: string, pin: string) {
    const decrypted = CryptoJS.AES.decrypt(value, pin).toString(CryptoJS.enc.Utf8);
    return decrypted;
}

export function encryptString(value: string, pin: string) {
    const encrypted = CryptoJS.AES.encrypt(value, pin).toString();
    return encrypted;
}