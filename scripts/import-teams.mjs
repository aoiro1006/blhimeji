#!/usr/bin/env node
/**
 * data/team-names.txt（1行1チーム名）から league.json のチーム一覧を再生成します。
 *
 * 使い方:
 *   node scripts/import-teams.mjs
 *
 * 既存の節・試合・ニュースは保持しますが、
 * チームIDが変わるため roundAssignments / matches はクリアされます。
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const namesFile = join(root, "data", "team-names.txt");
const leagueFile = join(root, "data", "league.json");

const COLORS = [
  "#1a4d8f", "#e63946", "#2a9d8f", "#f4a261", "#6a4c93", "#1982c4",
  "#8ac926", "#ffca3a", "#9b5de5", "#00bbf9", "#f15bb5", "#8338ec",
  "#3d5a80", "#ee6c4d", "#06d6a0", "#ef476f", "#118ab2", "#073b4c",
];

function makeShortName(name, seen) {
  const count = seen.get(name) ?? 0;
  seen.set(name, count + 1);
  if (count === 0) {
    return name.length <= 8 ? name : name.slice(0, 8);
  }
  const suffix = ["②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"][count - 1] ?? `${count + 1}`;
  const base = name.length <= 6 ? name : name.slice(0, 6);
  return `${base}${suffix}`;
}

function buildTeams(names) {
  const seen = new Map();
  const half = Math.ceil(names.length / 2);

  return names.map((name, i) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const num = i + 1;
    return {
      id: randomUUID(),
      teamNumber: num,
      name: trimmed,
      shortName: makeShortName(trimmed, seen),
      color: COLORS[i % COLORS.length],
      imageUrl: "",
      players: [],
      displayLeague: num <= half ? "A" : "B",
    };
  }).filter(Boolean);
}

const rawNames = readFileSync(namesFile, "utf-8")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean);

if (rawNames.length === 0) {
  console.error("team-names.txt にチーム名がありません");
  process.exit(1);
}

const data = JSON.parse(readFileSync(leagueFile, "utf-8"));
const teams = buildTeams(rawNames);

data.teams = teams;
data.lastUpdated = new Date().toISOString();
data.roundAssignments = [];
data.matches = [];
data.standingsOverrides = [];

for (const round of data.rounds ?? []) {
  round.participatingTeamIds = [];
}

writeFileSync(leagueFile, JSON.stringify(data, null, 2), "utf-8");

console.log(`✓ ${teams.length} チームを登録しました（Aリーグ: ${Math.ceil(teams.length / 2)} / Bリーグ: ${Math.floor(teams.length / 2)}）`);
console.log("  ※ 組み合わせ・試合データはクリア済み。管理画面から節を設定してください。");
