import type { MatchGroup } from "@/types";

export const PRIMARY_MATCH_GROUPS: MatchGroup[] = ["A", "B", "C"];
export const ADDITIONAL_MATCH_GROUPS: MatchGroup[] = ["D", "E", "F"];
export const ALL_MATCH_GROUPS: MatchGroup[] = [
  ...PRIMARY_MATCH_GROUPS,
  ...ADDITIONAL_MATCH_GROUPS,
];

export function isPrimaryMatchGroup(group: MatchGroup): boolean {
  return PRIMARY_MATCH_GROUPS.includes(group);
}

export function isAdditionalMatchGroup(group: MatchGroup): boolean {
  return ADDITIONAL_MATCH_GROUPS.includes(group);
}

export function getMatchGroupBadgeTone(group: MatchGroup): "blue" | "red" | "green" | "purple" | "orange" | "teal" {
  switch (group) {
    case "B":
      return "red";
    case "C":
      return "green";
    case "D":
      return "purple";
    case "E":
      return "orange";
    case "F":
      return "teal";
    default:
      return "blue";
  }
}
