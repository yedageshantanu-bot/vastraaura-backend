const fs = require("fs");
const path = require("path");

function extractAllImagesFromPdf() {
  const pdfPath = path.join(__dirname, "../../client/public/Untitled document.pdf");
  const outputDir = path.join(__dirname, "../../frontend from emergent/public/toys");
  const outputDirClient = path.join(__dirname, "../../client/public/toys");

  const buf = fs.readFileSync(pdfPath);
  console.log(`Reading PDF file (${(buf.length / (1024 * 1024)).toFixed(2)} MB)...`);

  // Extract PNGs
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const pngFooter = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

  let pngCount = 0;
  let offset = 0;
  while (offset < buf.length) {
    const startPng = buf.indexOf(pngHeader, offset);
    if (startPng === -1) break;

    const endPng = buf.indexOf(pngFooter, startPng);
    if (endPng === -1) break;

    const imgBuf = buf.subarray(startPng, endPng + pngFooter.length);
    if (imgBuf.length > 5000) {
      pngCount++;
      const filename = `pdf_extracted_png_${pngCount}.png`;
      fs.writeFileSync(path.join(outputDir, filename), imgBuf);
      fs.writeFileSync(path.join(outputDirClient, filename), imgBuf);
      console.log(`Saved ${filename} (${(imgBuf.length / 1024).toFixed(1)} KB)`);
    }
    offset = endPng + pngFooter.length;
  }

  console.log(`Extracted ${pngCount} PNG images!`);
}

extractAllImagesFromPdf();
