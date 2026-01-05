import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = path.resolve(process.cwd());
const publicDir = path.join(projectRoot, "public");

const inputSvgPath = path.join(publicDir, "logo.svg");

async function ensureFileExists(filePath) {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`Missing required file: ${filePath}`);
  }
}

async function renderPng({ size, outFile }) {
  const svgBuffer = await fs.readFile(inputSvgPath);

  // Higher density makes SVG strokes render crisply when rasterized.
  const png = await sharp(svgBuffer, { density: 512 })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const outPath = path.join(publicDir, outFile);
  await fs.writeFile(outPath, png);
  return outPath;
}

async function main() {
  await ensureFileExists(inputSvgPath);

  const outputs = await Promise.all([
    renderPng({ size: 192, outFile: "pwa-192x192.png" }),
    renderPng({ size: 512, outFile: "pwa-512x512.png" }),
    renderPng({ size: 180, outFile: "apple-touch-icon.png" }),
  ]);

  // eslint-disable-next-line no-console
  console.log("Generated icons:\n" + outputs.map((p) => `- ${p}`).join("\n"));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
