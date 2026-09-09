#!/usr/bin/env node
/**
 * qr_generation/batch-generate.js
 *
 * Generates one designer QR code per row of an attendees CSV (matching the
 * `serial_code` column used by the INDIS Supabase table / test-attendees.csv).
 *
 * Usage:
 *   node batch-generate.js <attendees.csv> <outDir> [--logo path] [--dark #hex] [...same options as generate-qr.js]
 *
 * Example:
 *   node batch-generate.js ../test-attendees.csv ./qr_output --logo mask.png --dark "#1b5e3c"
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

function main() {
  const [csvPath, outDir, ...rest] = process.argv.slice(2);
  if (!csvPath || !outDir) {
    console.error(
      "Usage: node batch-generate.js <attendees.csv> <outDir> [--logo path] [--dark #hex] ..."
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
  const header = raw[0].split(",").map((h) => h.trim());
  const codeIdx = header.indexOf("serial_code");
  if (codeIdx === -1) {
    console.error(`Column "serial_code" not found in CSV header: ${header.join(", ")}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  let count = 0;
  for (const line of raw.slice(1)) {
    if (!line.trim()) continue;
    const cols = line.split(",");
    const code = (cols[codeIdx] || "").trim();
    if (!code) continue;
    const outPath = path.join(outDir, `${code}.png`);
    execFileSync("node", [path.join(__dirname, "generate-qr.js"), code, outPath, ...rest], {
      stdio: "inherit",
    });
    count++;
  }
  console.log(`\nDone — generated ${count} QR codes into ${outDir}`);
}

main();
