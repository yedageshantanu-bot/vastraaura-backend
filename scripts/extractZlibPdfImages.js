const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function extractZlibStreams() {
  const pdfPath = path.join(__dirname, "../../client/public/Untitled document.pdf");
  const outputDir = path.join(__dirname, "../../frontend from emergent/public/toys");
  const outputDirClient = path.join(__dirname, "../../client/public/toys");

  const buf = fs.readFileSync(pdfPath);
  console.log(`Reading PDF of size ${(buf.length / 1024 / 1024).toFixed(2)} MB...`);

  let count = 0;
  let pos = 0;

  while (pos < buf.length) {
    const streamIdx = buf.indexOf("stream", pos);
    if (streamIdx === -1) break;

    let dataStart = streamIdx + 6;
    if (buf[dataStart] === 0x0d && buf[dataStart + 1] === 0x0a) {
      dataStart += 2;
    } else if (buf[dataStart] === 0x0a) {
      dataStart += 1;
    }

    const endStreamIdx = buf.indexOf("endstream", dataStart);
    if (endStreamIdx === -1) break;

    const streamData = buf.subarray(dataStart, endStreamIdx);
    pos = endStreamIdx + 9;

    try {
      const decompressed = zlib.inflateSync(streamData);
      // Check if decompressed data is a JPEG
      const jpegIdx = decompressed.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
      if (jpegIdx !== -1) {
        const endJpeg = decompressed.indexOf(Buffer.from([0xff, 0xd9]), jpegIdx);
        if (endJpeg !== -1) {
          const imgBuf = decompressed.subarray(jpegIdx, endJpeg + 2);
          count++;
          const filename = `pdf_toy_${count}.jpg`;
          fs.writeFileSync(path.join(outputDir, filename), imgBuf);
          fs.writeFileSync(path.join(outputDirClient, filename), imgBuf);
          console.log(`Extracted JPEG ${filename} (${(imgBuf.length / 1024).toFixed(1)} KB)`);
        }
      }

      // Check if decompressed data is a PNG
      const pngIdx = decompressed.indexOf(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      if (pngIdx !== -1) {
        const endPng = decompressed.indexOf(Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]), pngIdx);
        if (endPng !== -1) {
          const imgBuf = decompressed.subarray(pngIdx, endPng + 8);
          count++;
          const filename = `pdf_toy_${count}.png`;
          fs.writeFileSync(path.join(outputDir, filename), imgBuf);
          fs.writeFileSync(path.join(outputDirClient, filename), imgBuf);
          console.log(`Extracted PNG ${filename} (${(imgBuf.length / 1024).toFixed(1)} KB)`);
        }
      }
    } catch (e) {
      // not a zlib stream or corrupt stream
    }
  }

  console.log(`Extracted total ${count} images after zlib inflation!`);
}

extractZlibStreams();
