import type { Round, RoundPointSettings } from "@/types";

export const BASE_PARTICIPATION_POINTS = 300;

export const DEFAULT_ROUND_POINT_SETTINGS: RoundPointSettings = {
  pointDiffMultiplier: 2,
  blowoutMultiplier: 1,
  giantKillerMultiplier: 1,
  fightingSpiritMultiplier: 1,
  matchCountMultiplier: 1,
};

export function getRoundPointSettings(round: Round): RoundPointSettings {
  return { ...DEFAULT_ROUND_POINT_SETTINGS, ...round.pointSettings };
}
