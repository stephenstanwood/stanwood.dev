#!/usr/bin/env node
/**
 * process-sonoma-data.mjs
 *
 * Processes real CA DOJ OpenJustice CSVs into compact JSON for the Sonoma DA Dashboard.
 * Reads from ~/Projects/stanwood.dev/raw-data/ (gitignored).
 * Outputs to src/data/sonoma/ (committed).
 *
 * Required CSVs:
 *   OnlineArrestData1980-2024.csv
 *   OnlineArrestDispoData1980-2024.csv
 *   Crimes_and_Clearances_with_Arson-1985-2024.csv
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// raw-data lives in the main repo root, not the worktree
const rawDir = join(__dirname, "..", "..", "..", "..", "raw-data");
const outDir = join(__dirname, "..", "src", "data", "sonoma");
mkdirSync(outDir, { recursive: true });

const TARGET_COUNTIES = ["Sonoma County", "Marin County", "Napa County", "Mendocino County"];
const COUNTY_KEYS = { "Sonoma County": "sonoma", "Marin County": "marin", "Napa County": "napa", "Mendocino County": "mendocino" };

function parseCSV(filename) {
  const raw = readFileSync(join(rawDir, filename), "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    // Handle quoted fields
    const values = [];
    let current = "";
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { values.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = values[i] || ""; });
    return obj;
  });
}

function num(v) { return parseInt(v) || 0; }

// ---------------------------------------------------------------------------
// 1. Arrests by year (aggregated across demographics per county)
// ---------------------------------------------------------------------------
function processArrests() {
  console.log("Processing arrests...");
  const rows = parseCSV("OnlineArrestData1980-2024.csv");
  const result = {};

  for (const county of TARGET_COUNTIES) {
    const key = COUNTY_KEYS[county];
    const countyRows = rows.filter((r) => r.COUNTY === county);
    const byYear = {};

    for (const r of countyRows) {
      const year = num(r.YEAR);
      if (year < 2005) continue; // Focus on last 20 years
      if (!byYear[year]) byYear[year] = { year, felony: 0, misdemeanor: 0, status: 0, violent: 0, property: 0, drug: 0, sex: 0, other: 0, total: 0 };
      const y = byYear[year];
      y.felony += num(r.F_TOTAL);
      y.misdemeanor += num(r.M_TOTAL);
      y.status += num(r.S_TOTAL);
      y.violent += num(r.VIOLENT);
      y.property += num(r.PROPERTY);
      y.drug += num(r.F_DRUGOFF);
      y.sex += num(r.F_SEXOFF);
      y.other += num(r.F_ALLOTHER);
    }

    // Compute totals
    for (const y of Object.values(byYear)) {
      y.total = y.felony + y.misdemeanor + y.status;
    }

    result[key] = Object.values(byYear).sort((a, b) => a.year - b.year);
  }

  return result;
}

// ---------------------------------------------------------------------------
// 2. Dispositions by year (aggregated across demographics per county)
// ---------------------------------------------------------------------------
function processDispositions() {
  console.log("Processing dispositions...");
  const rows = parseCSV("OnlineArrestDispoData1980-2024.csv");
  const result = {};

  for (const county of TARGET_COUNTIES) {
    const key = COUNTY_KEYS[county];
    const countyRows = rows.filter((r) => r.COUNTY === county);
    const byYear = {};

    for (const r of countyRows) {
      const year = num(r.YEAR);
      if (year < 2005) continue;
      if (!byYear[year]) byYear[year] = { year, complaintSought: 0, released: 0, toOtherAgency: 0, withinDepartment: 0, juvenileProbation: 0, total: 0 };
      const y = byYear[year];
      const total = num(r.F_TOTAL) + num(r.M_TOTAL) + num(r.S_TOTAL);
      const code = r.ARREST_DISP_CODE;

      if (code === "Complaint Sought") y.complaintSought += total;
      else if (code === "Released") y.released += total;
      else if (code === "To Other Agency") y.toOtherAgency += total;
      else if (code === "Within Department") y.withinDepartment += total;
      else if (code === "Juvenile Probation") y.juvenileProbation += total;
    }

    for (const y of Object.values(byYear)) {
      y.total = y.complaintSought + y.released + y.toOtherAgency + y.withinDepartment + y.juvenileProbation;
    }

    result[key] = Object.values(byYear).sort((a, b) => a.year - b.year);
  }

  return result;
}

// ---------------------------------------------------------------------------
// 3. Crimes & Clearances by year (aggregated across agencies per county)
// ---------------------------------------------------------------------------
function processCrimes() {
  console.log("Processing crimes & clearances...");
  const rows = parseCSV("Crimes_and_Clearances_with_Arson-1985-2024.csv");
  const result = {};

  for (const county of TARGET_COUNTIES) {
    const key = COUNTY_KEYS[county];
    // County column contains the full county name; NCICCode has agency names
    const countyRows = rows.filter((r) => r.County === county);
    const byYear = {};

    for (const r of countyRows) {
      const year = num(r.Year);
      if (year < 2005) continue;
      if (!byYear[year]) byYear[year] = {
        year, totalViolent: 0, homicide: 0, rape: 0, robbery: 0, aggAssault: 0,
        totalProperty: 0, burglary: 0, vehicleTheft: 0, larcenyTheft: 0,
        violentCleared: 0, propertyCleared: 0,
      };
      const y = byYear[year];
      y.totalViolent += num(r.Violent_sum);
      y.homicide += num(r.Homicide_sum);
      y.rape += num(r.ForRape_sum);
      y.robbery += num(r.Robbery_sum);
      y.aggAssault += num(r.AggAssault_sum);
      y.totalProperty += num(r.Property_sum);
      y.burglary += num(r.Burglary_sum);
      y.vehicleTheft += num(r.VehicleTheft_sum);
      y.larcenyTheft += num(r.LTtotal_sum);
      y.violentCleared += num(r.ViolentClr_sum);
      y.propertyCleared += num(r.PropertyClr_sum);
    }

    result[key] = Object.values(byYear).sort((a, b) => a.year - b.year);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const arrests = processArrests();
const dispositions = processDispositions();
const crimes = processCrimes();

writeFileSync(join(outDir, "arrests-by-year.json"), JSON.stringify(arrests, null, 2));
writeFileSync(join(outDir, "dispositions-by-year.json"), JSON.stringify(dispositions, null, 2));
writeFileSync(join(outDir, "crimes-by-year.json"), JSON.stringify(crimes, null, 2));

// Print summary
for (const [name, data] of [["arrests", arrests], ["dispositions", dispositions], ["crimes", crimes]]) {
  console.log(`\n${name}-by-year.json:`);
  for (const [county, years] of Object.entries(data)) {
    const latest = years[years.length - 1];
    console.log(`  ${county}: ${years.length} years (${years[0]?.year}-${latest?.year}), latest total: ${latest?.total ?? "N/A"}`);
  }
}
console.log(`\nOutput: ${outDir}`);
