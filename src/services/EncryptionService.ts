import 'react-native-get-random-values';
import CryptoJS from 'crypto-js';
import {storage} from './StorageService';
import DeviceInfo from 'react-native-device-info';

const ENCRYPTION_KEY_STORAGE_KEY = 'app_master_encryption_key';

class EncryptionService {
  private masterKey: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {return;}

    // Try to load existing key from MMKV
    const existingKey = storage.getString(ENCRYPTION_KEY_STORAGE_KEY);

    if (existingKey) {
      this.masterKey = existingKey;
    } else {
      // Generate a new key based on device ID and some random entropy
      const deviceId = await DeviceInfo.getUniqueId();
      
      let entropy: string;
      let salt: any;
      try {
        entropy = CryptoJS.lib.WordArray.random(128 / 8).toString();
        salt = CryptoJS.lib.WordArray.random(128 / 8);
      } catch (e) {
        console.warn('Native crypto failed, using fallback entropy for hackathon prototype');
        entropy = Math.random().toString(36).substring(2) + Date.now().toString(36);
        salt = CryptoJS.enc.Utf8.parse(Math.random().toString(36).substring(2));
      }

      // Use PBKDF2 to derive a strong 256-bit key (32 bytes)
      const key256Bits = CryptoJS.PBKDF2(deviceId + entropy, salt, {
        keySize: 256 / 32,
        iterations: 1000,
      });

      this.masterKey = key256Bits.toString();
      storage.set(ENCRYPTION_KEY_STORAGE_KEY, this.masterKey);
    }

    this.isInitialized = true;
  }

  private ensureInitialized() {
    if (!this.isInitialized || !this.masterKey) {
      throw new Error('EncryptionService not initialized');
    }
  }

  encryptString(plaintext: string): string {
    this.ensureInitialized();
    let iv: any;
    try {
      iv = CryptoJS.lib.WordArray.random(128 / 8);
    } catch (e) {
      iv = CryptoJS.enc.Utf8.parse(Math.random().toString(36).substring(2, 18).padEnd(16, '0'));
    }
    const encrypted = CryptoJS.AES.encrypt(
      plaintext,
      CryptoJS.enc.Hex.parse(this.masterKey!),
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      },
    );
    // Combine IV and Ciphertext for storage
    const ivHex = iv.toString(CryptoJS.enc.Hex);
    const ciphertextBase64 = encrypted.toString();
    return `${ivHex}:${ciphertextBase64}`;
  }

  decryptString(encryptedPayload: string): string {
    this.ensureInitialized();
    const parts = encryptedPayload.split(':');
    if (parts.length !== 2) {throw new Error('Invalid encrypted payload format');}

    const ivHex = parts[0];
    const ciphertextBase64 = parts[1];

    const decrypted = CryptoJS.AES.decrypt(
      ciphertextBase64,
      CryptoJS.enc.Hex.parse(this.masterKey!),
      {
        iv: CryptoJS.enc.Hex.parse(ivHex),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      },
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  // Helper to encrypt Float32Array
  encryptEmbedding(embedding: Float32Array): string {
    const array = Array.from(embedding);
    const jsonStr = JSON.stringify(array);
    return this.encryptString(jsonStr);
  }

  // Helper to decrypt Float32Array
  decryptEmbedding(encryptedPayload: string): Float32Array {
    const jsonStr = this.decryptString(encryptedPayload);
    const array = JSON.parse(jsonStr) as number[];
    return new Float32Array(array);
  }

  // Add HMAC for tamper detection
  generateHMAC(payload: string): string {
    this.ensureInitialized();
    return CryptoJS.HmacSHA256(payload, this.masterKey!).toString(
      CryptoJS.enc.Hex,
    );
  }

  verifyHMAC(payload: string, hmac: string): boolean {
    const computed = this.generateHMAC(payload);
    return computed === hmac;
  }
}

export const encryptionService = new EncryptionService();
