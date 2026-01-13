import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const publicDir = path.join(root, "public");

const iconPath = path.join(publicDir, "pwa-512x512.png");
if (!fs.existsSync(iconPath)) {
  console.error(`Icon not found: ${iconPath}`);
  process.exit(1);
}

const SIZE = 64; // good source size; browsers downscale as needed

const ringSvg = ({ stroke, opacity }) => `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect
    x="1" y="1" width="${SIZE - 2}" height="${SIZE - 2}"
    rx="${Math.round(SIZE * 0.22)}"
    fill="none"
    stroke="${stroke}"
    stroke-opacity="${opacity}"
    stroke-width="2"
  />
</svg>
`.trim();

async function generate(outName, ring) {
  const outPath = path.join(publicDir, outName);

  const base = await sharp(iconPath)
    .resize(SIZE, SIZE, { fit: "cover" })
    .png()
    .toBuffer();

  const withRing = sharp(base).composite([
    {
      input: Buffer.from(ringSvg(ring)),
      top: 0,
      left: 0,
    },
  ]);

  await withRing.png().toFile(outPath);
  console.log(`Generated: ${outPath}`);
}

await generate("favicon-light.png", { stroke: "#000000", opacity: 0.22 });
await generate("favicon-dark.png", { stroke: "#FFFFFF", opacity: 0.22 });
