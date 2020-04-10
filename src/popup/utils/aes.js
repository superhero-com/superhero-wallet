export default class AES {
  constructor(key) {
    this.algorithm = {
      name: 'AES-CTR',
      counter: Buffer.alloc(16),
      length: 128,
    };
    this.key = key;
    this.BLOCK_SIZE = 16;
  }

  incrementCounter(dataByteLength) {
    this.algorithm.counter.writeUIntBE(
      this.algorithm.counter.readUIntBE(10, 6) + Math.ceil(dataByteLength / this.BLOCK_SIZE),
      10,
      6,
    );
  }

  async encrypt(data) {
    const dataEncrypted = await window.crypto.subtle.encrypt(this.algorithm, this.key, data);
    this.incrementCounter(dataEncrypted.byteLength);
    return dataEncrypted;
  }

  async decrypt(dataEncrypted) {
    const data = await window.crypto.subtle.decrypt(this.algorithm, this.key, dataEncrypted);
    this.incrementCounter(data.byteLength);
    return data;
  }
}
