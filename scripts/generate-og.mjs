import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const publicDir = path.join(root, "public");

const iconPath = path.join(publicDir, "pwa-512x512.png");
const outPath = path.join(publicDir, "og.png");

if (!fs.existsSync(iconPath)) {
  console.error(`Icon not found: ${iconPath}`);
  process.exit(1);
}

const WIDTH = 1200;
const HEIGHT = 630;

const bgSvg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1F2D36"/>
      <stop offset="1" stop-color="#0B1217"/>
    </linearGradient>
    <radialGradient id="r" cx="35%" cy="30%" r="85%">
      <stop offset="0" stop-color="#223642" stop-opacity="0.65"/>
      <stop offset="1" stop-color="#0B1217" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#r)"/>
</svg>
`.trim();

const titleSvg = (text) => `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .t { font: 800 64px system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif; fill: #ffffff; }
    .s { font: 500 28px system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif; fill: rgba(255,255,255,0.78); }
  </style>
  <text x="50%" y="84%" text-anchor="middle" class="t">${text}</text>
  <text x="50%" y="92%" text-anchor="middle" class="s">Dashboard financeiro premium</text>
</svg>
`.trim();

const iconSize = 280;
const icon = await sharp(iconPath)
  .resize(iconSize, iconSize, { fit: "contain" })
  .png()
  .toBuffer();

const bg = await sharp(Buffer.from(bgSvg))
  .png()
  .toBuffer();

const composed = sharp(bg)
  .composite([
    {
      input: icon,
      left: Math.round((WIDTH - iconSize) / 2),
      top: Math.round((HEIGHT - iconSize) / 2) - 40,
    },
    {
      input: Buffer.from(titleSvg("FinTrack")),
      left: 0,
      top: 0,
    },
  ])
  .png();

await composed.toFile(outPath);
console.log(`Generated: ${outPath}`);
