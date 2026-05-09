const zlib = require('node:zlib');

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }

  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crcBuf]);
}

function buildPNGWithTextChunk(keyword, text) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const kw = Buffer.from(keyword, 'ascii');
  const txt = Buffer.from(text, 'utf8');
  const textData = Buffer.concat([kw, Buffer.from([0]), txt]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.from([0, 255, 0, 0]);
  const compressed = zlib.deflateSync(raw);

  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('tEXt', textData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', iend),
  ]);
}

module.exports = { buildPNGWithTextChunk };
