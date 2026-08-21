const fs = require("fs");
const path = require("path");

function extractPdfXObjectImages() {
  const pdfPath = path.join(__dirname, "../../client/public/Untitled document.pdf");
  const outputDir = path.join(__dirname, "../../frontend from emergent/public/toys");
  const outputDirClient = path.join(__dirname, "../../client/public/toys");

  const buf = fs.readFileSync(pdfPath);
  console.log(`Searching PDF streams in file of length ${buf.length}...`);

  let count = 0;
  let pos = 0;

  while (pos < buf.length) {
    const streamIdx = buf.indexOf("stream", pos);
    if (streamIdx === -1) break;

    // Check if after stream there is \r\n or \n
    let dataStart = streamIdx + 6;
    if (buf[dataStart] === 0x0d && buf[dataStart + 1] === 0x0a) {
      dataStart += 2;
    } else if (buf[dataStart] === 0x0a) {
      dataStart += 1;
    }

    const endStreamIdx = buf.indexOf("endstream", dataStart);
    if (endStreamIdx === -1) break;

    const streamData = buf.subarray(dataStart, endStreamIdx);

    // Check if this stream is a JPEG (starts with FF D8 FF)
    if (streamData.length > 10000 && streamData[0] === 0xff && streamData[1] === 0xd8 && streamData[2] === 0xff) {
      count++;
      const filename = `pdf_toy_${count}.jpg`;
      fs.writeFileSync(path.join(outputDir, filename), streamData);
      fs.writeFileSync(path.join(outputDirClient, filename), streamData);
      console.log(`Extracted JPEG ${filename} (${(streamData.length / 1024).toFixed(1)} KB)`);
    }

    pos = endStreamIdx + 9;
  }

  console.log(`Extracted total ${count} raw stream JPEGs!`);
}

extractPdfXObjectImages();
