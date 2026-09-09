#!/usr/bin/env node
/**
 * qr_generation/generate-qr.js
 *
 * Generates a "designer" QR code for a given attendee serial code: a real,
 * scannable QR (encoded at error-correction level H) with a custom module
 * color and an optional logo/artwork composited into the center — the same
 * look as the printed conference badge (colored modules + a center graphic).
 *
 * Usage:
 *   node generate-qr.js <id> <output.png> [options]
 *
 * Options:
 *   --logo <path>        PNG/JPG to place in the center (optional)
 *   --dark <hex>         Module color, e.g. "#1b5e3c" (default black)
 *   --light <hex>        Background color (default white)
 *   --size <px>          Output image size in pixels (default 800)
 *   --logo-scale <0-1>   Logo width as a fraction of QR width (default 0.28)
 *
 * Example (matches the sample badge's dark-green style):
 *   node generate-qr.js ICORD25IN519 out.png --logo mask.png --dark "#1b5e3c"
 *
 * Uses `qrcode` (pure JS, no native build step) for the QR itself and
 * `sharp` (ships prebuilt binaries — no Python/Visual Studio needed) only
 * for compositing the optional logo on top.
 */

const QRCode = require("qrcode");
const sharp = require("sharp");
const fs = require("fs");

function parseArgs(argv) {
  const [id, output, ...rest] = argv;
  const opts = { dark: "#000000", light: "#ffffff", size: 800, logoScale: 0.28, logo: null };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--logo") opts.logo = rest[++i];
    else if (a === "--dark") opts.dark = rest[++i];
    else if (a === "--light") opts.light = rest[++i];
    else if (a === "--size") opts.size = parseInt(rest[++i], 10);
    else if (a === "--logo-scale") opts.logoScale = parseFloat(rest[++i]);
  }
  return { id, output, opts };
}

async function main() {
  const { id, output, opts } = parseArgs(process.argv.slice(2));
  if (!id || !output) {
    console.error(
      "Usage: node generate-qr.js <id> <output.png> [--logo path] [--dark #hex] [--light #hex] [--size px] [--logo-scale 0-1]"
    );
    process.exit(1);
  }

  if (opts.logo && opts.logoScale > 0.3) {
    console.warn(
      `Warning: --logo-scale ${opts.logoScale} is above the safe ~0.30 cap for error-correction level H — the code may stop scanning. Recommend 0.28 or lower.`
    );
  }

  // ECC level H (30% error-correction budget) is what makes it safe to
  // cover part of the center with a logo without breaking the scan.
  const qrBuffer = await QRCode.toBuffer(id, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 1,
    width: opts.size,
    color: {
      dark: opts.dark,
      light: opts.light,
    },
  });

  if (!opts.logo) {
    fs.writeFileSync(output, qrBuffer);
    console.log(`Wrote ${output}`);
    return;
  }

  const logoW = Math.round(opts.size * opts.logoScale);
  const pad = Math.round(opts.size * 0.02);

  // Resize the logo to fit the target width, preserving aspect ratio.
  const resizedLogo = await sharp(opts.logo).resize({ width: logoW }).toBuffer();
  const logoMeta = await sharp(resizedLogo).metadata();
  const logoH = logoMeta.height;

  // White backing plate behind the logo so it reads cleanly against the QR.
  const backing = await sharp({
    create: {
      width: logoW + pad * 2,
      height: logoH + pad * 2,
      channels: 4,
      background: opts.light,
    },
  })
    .composite([{ input: resizedLogo, left: pad, top: pad }])
    .png()
    .toBuffer();

  const backingMeta = await sharp(backing).metadata();
  const left = Math.round((opts.size - backingMeta.width) / 2);
  const top = Math.round((opts.size - backingMeta.height) / 2);

  const finalBuffer = await sharp(qrBuffer)
    .composite([{ input: backing, left, top }])
    .png()
    .toBuffer();

  fs.writeFileSync(output, finalBuffer);
  console.log(`Wrote ${output}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
