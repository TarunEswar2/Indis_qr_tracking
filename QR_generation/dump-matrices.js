#!/usr/bin/env node
/**
 * qr_generation/dump-matrices.js
 *
 * Step 1 of 2 for the printed badge QRs. Reads a CSV with a `serial_code`
 * column and writes every code's raw QR module matrix to a single JSON
 * file, which render-badges.py then draws.
 *
 * Splitting it this way keeps the QR encoding in the `qrcode` library
 * (pure JS, already vendored here) while the actual image compositing —
 * transparency + the Open Sans label — happens in Pillow, which handles
 * text far better than sharp does.
 *
 * ECC level M is deliberate: it keeps every ID in this dataset at QR
 * version 1 (21x21 modules), so every printed badge has an identical
 * module grid. Level Q would push the 18-character IDs (INDIS-OR-... etc.)
 * up to version 2 (25x25) while leaving the 14-character ones at 21,
 * giving two visibly different badge densities. There's no center logo on
 * these anymore, so M's 15% recovery budget is plenty.
 *
 * Usage:
 *   node dump-matrices.js <codes.csv> <out.json>
 */
const QRCode = require("qrcode");
const fs = require("fs");

const [csvPath, outPath] = process.argv.slice(2);
if (!csvPath || !outPath) {
  console.error("Usage: node dump-matrices.js <codes.csv> <out.json>");
  process.exit(1);
}

const lines = fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
const header = lines[0].split(",").map((h) => h.trim());
const idx = header.indexOf("serial_code");
if (idx === -1) {
  console.error(`Column "serial_code" not found in: ${header.join(", ")}`);
  process.exit(1);
}
// serial_code must be column 0 — names/affiliations in this data contain
// commas, and this split is naive. prepare step writes it first for that reason.
if (idx !== 0) {
  console.error("serial_code must be the first column (later columns may contain commas).");
  process.exit(1);
}

const out = {};
const sizes = {};
for (const line of lines.slice(1)) {
  if (!line.trim()) continue;
  const code = (line.split(",")[idx] || "").trim();
  if (!code) continue;
  if (out[code]) continue;
  const qr = QRCode.create(code, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  let bits = "";
  for (let i = 0; i < n * n; i++) bits += qr.modules.data[i] ? "1" : "0";
  out[code] = { size: n, bits };
  sizes[n] = (sizes[n] || 0) + 1;
}

fs.writeFileSync(outPath, JSON.stringify(out));
console.log(`Wrote ${Object.keys(out).length} matrices to ${outPath}`);
console.log(`Module grid sizes: ${JSON.stringify(sizes)}`);
