#!/usr/bin/env node
/**
 * ローカル data/*.json を Supabase app_documents へ投入する。
 *
 * 必要環境変数:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * 使い方: node scripts/seed-app-documents.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function upsert(documentKey, documentType, season, payload) {
  const { error } = await supabase.from("app_documents").upsert(
    {
      document_key: documentKey,
      document_type: documentType,
      season,
      payload,
      version: 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "document_key" }
  );
  if (error) throw error;
  console.log(`upserted: ${documentKey}`);
}

async function main() {
  const league = JSON.parse(await fs.readFile(path.join(dataDir, "league.json"), "utf-8"));
  await upsert("league", "league", null, league);

  try {
    const site = JSON.parse(await fs.readFile(path.join(dataDir, "site.json"), "utf-8"));
    await upsert("site", "site", null, site);
  } catch {
    console.log("skip: site.json なし");
  }

  const archivesDir = path.join(dataDir, "archives");
  try {
    const files = await fs.readdir(archivesDir);
    for (const file of files.filter((f) => f.endsWith(".json"))) {
      const season = file.replace(/\.json$/, "");
      const archive = JSON.parse(
        await fs.readFile(path.join(archivesDir, file), "utf-8")
      );
      await upsert(`archive_${season}`, "archive", season, archive);
    }
  } catch {
    console.log("skip: archives なし");
  }

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
