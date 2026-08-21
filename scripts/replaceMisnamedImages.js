const fs = require("fs");
const path = require("path");

function replaceImages() {
  const artifactDir = "C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\e22e9237-ccc4-4f2a-b581-84da1ac598cb";
  const frontendDir = path.join(__dirname, "../../frontend from emergent/public/toys");
  const clientDir = path.join(__dirname, "../../client/public/toys");

  const imageMap = {
    "IMG_4917.PNG": "penguin_plushie_2ft_1787073598581.jpg",
    "IMG_4919.PNG": "penguin_plushie_3ft_1787073629646.jpg",
    "IMG_4920.PNG": "giant_white_teddy_4ft_1787073667686.jpg",
    "IMG_4921.PNG": "cuddly_goose_pillow_1787073717139.jpg",
  };

  for (const [targetName, sourceName] of Object.entries(imageMap)) {
    const sourcePath = path.join(artifactDir, sourceName);
    if (!fs.existsSync(sourcePath)) {
      console.error(`Source image not found: ${sourcePath}`);
      continue;
    }

    const destFrontend = path.join(frontendDir, targetName);
    const destClient = path.join(clientDir, targetName);

    fs.copyFileSync(sourcePath, destFrontend);
    fs.copyFileSync(sourcePath, destClient);

    console.log(`Replaced ${targetName} with generated plushie image in both public folders!`);
  }
}

replaceImages();
