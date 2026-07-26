export interface Player {
  id: string;
  name: string;
}

/** 順位表示用リーグ（Aリーグ / Bリーグ） */
export type DisplayLeague = "A" | "B";

/** 試合振り分け用グループ（A–F）— リーグとは別。D/E/F は追加試合用 */
export type MatchGroup = "A" | "B" | "C" | "D" | "E" | "F";

/** 追加試合の配置モード */
export type AdditionalMatchesMode = "embedded" | "linked";

export interface RoundAdditionalMatches {
  enabled: boolean;
  mode: AdditionalMatchesMode;
  linkedRoundId?: string;
}

/** @deprecated MatchGroup を使用 */
export type LeagueGroup = MatchGroup;

export interface Team {
  id: string;
  teamNumber: number;
  name: string;
  shortName: string;
  color: string;
  imageUrl?: string;
  players: Player[];
  /** 順位表示用リーグ（A / B）。変更可能 */
  displayLeague?: DisplayLeague;
}

/** league=リーグ節（累計に反映） / other=リーグ外の試合（当日のみ・累計から除外） */
export type RoundType = "league" | "other";

/** 節ごとのポイント倍率（X値） */
export interface RoundPointSettings {
  /** 得失P: max(0, 節内得失点差) × X */
  pointDiffMultiplier: number;
  /** 圧勝P: 圧勝点 × X */
  blowoutMultiplier: number;
  /** ジャイキリP: 前節順位で5位以上上位の相手に勝利で1点 × X */
  giantKillerMultiplier: number;
  /** 奮闘P: 奮闘点 × X */
  fightingSpiritMultiplier: number;
  /** 試合回数P: 試合回数 × X */
  matchCountMultiplier: number;
}

export interface Round {
  id: string;
  type: RoundType;
  /** リーグ節の番号（1, 2, 3...） */
  number: number;
  /** 同じ節の2回目以降（1-2節など）。デフォルト1 */
  subNumber: number;
  name: string;
  date?: string;
  /** 開催時間（例: 10:00〜16:00） */
  time?: string;
  venue?: string;
  /** 問い合わせ先 */
  contact?: string;
  /** 備考・その他案内 */
  notes?: string;
  /** 節ごとのポイント倍率 */
  pointSettings?: Partial<RoundPointSettings>;
  /** 保留（非公開・リーグ累計から除外） */
  held?: boolean;
  /** 試合結果入力が終了した節（管理用ラベル・編集は可能） */
  resultsFinished?: boolean;
  /** 追加試合（D/E/F） */
  additionalMatches?: RoundAdditionalMatches;
  /** linked 追加試合の親 Round ID */
  parentRoundId?: string;
  /** この節に参加するチームID */
  participatingTeamIds: string[];
}

export interface RoundTeamAssignment {
  roundId: string;
  teamId: string;
  /** 試合振り分けグループ（A/B/C） */
  group: MatchGroup;
}

export interface Match {
  id: string;
  roundId: string;
  /** 試合振り分けグループ（A/B/C） */
  group: MatchGroup;
  homeTeamId: string;
  awayTeamId: string;
  slotOrder: number;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
}

/** 個人賞の種類 */
export type IndividualAwardKey = "superPlay" | "unique" | "hype";

/** 節×選手の個人賞獲得数・エントリー（順位・試合結果とは独立） */
export interface PlayerRoundAwards {
  roundId: string;
  teamId: string;
  playerId: string;
  /** 欠席 */
  absent?: boolean;
  superPlay: number;
  unique: number;
  /** 盛り上げたでしょう */
  hype: number;
}

/** 公開ページ用：シーズン通算の選手スタッツ */
export interface PlayerSeasonStats {
  playerId: string;
  playerName: string;
  /** 出場回数（エントリーかつ非欠席の節数） */
  appearances: number;
  superPlay: number;
  unique: number;
  hype: number;
}

/** 公開ページ用：出場経験のあるチームごとの選手スタッツ */
export interface TeamPlayerStatsGroup {
  team: Team;
  players: PlayerSeasonStats[];
}

export interface NewsItem {
  id: string;
  date: string;
  category: string;
  title: string;
  content: string;
}

export interface Report {
  id: string;
  date: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
}

export interface StandingsOverride {
  teamId: string;
  displayLeague?: DisplayLeague;
  rankOverride?: number;
  note?: string;
}

export interface LeagueData {
  season: string;
  lastUpdated: string;
  teams: Team[];
  rounds: Round[];
  roundAssignments: RoundTeamAssignment[];
  matches: Match[];
  /** 節ごとの個人賞獲得数 */
  playerAwards: PlayerRoundAwards[];
  news: NewsItem[];
  reports: Report[];
  standingsOverrides: StandingsOverride[];
}

export interface TeamStanding {
  team: Team;
  rank: number;
  /** ランキングポイント（順位決定用） */
  rankingPoints: number;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  winRate: number;
  rankOverride?: number;
  note?: string;
  displayLeague?: DisplayLeague;
  /** ポイント内訳（詳細表示用） */
  pointBreakdown?: TeamPointBreakdown;
  /** 試合履歴（詳細表示用・新しい順） */
  matchHistory?: TeamMatchRecord[];
}

/** 順位詳細モーダル用の試合結果 */
export interface TeamMatchRecord {
  roundLabel: string;
  roundDate?: string;
  isLeagueRound: boolean;
  opponentName: string;
  opponentShortName: string;
  teamScore: number;
  opponentScore: number;
  result: "win" | "loss" | "draw";
}

/** ランキングポイントの内訳 */
export interface TeamPointBreakdown {
  basePoints: number;
  winRatePoints: number;
  pointDiffBonus: number;
  blowoutBonus: number;
  giantKillerBonus: number;
  fightingSpiritBonus: number;
  matchCountBonus: number;
  total: number;
  winRatePercent: number;
  pointDiff: number;
  giantKillerCount: number;
  fightingSpiritCount: number;
  blowoutPointUnits: number;
  matchCount: number;
}

/** アーカイブ用の簡略チーム情報 */
export interface ArchivedTeam {
  teamNumber: number;
  name: string;
  shortName: string;
  color: string;
}

/** アーカイブ用の凍結順位 */
export interface ArchivedStanding {
  rank: number;
  team: ArchivedTeam;
  rankingPoints: number;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  sortOrder: number;
}

/** 過去シーズンのアーカイブ（data/archives/{season}.json） */
export interface SeasonArchive {
  season: string;
  title: string;
  summary?: string;
  finalizedAt: string;
  coverImageUrl?: string;
  standings: {
    leagueA: ArchivedStanding[];
    leagueB: ArchivedStanding[];
  };
  gallery: GalleryImage[];
}

export interface SeasonArchiveSummary {
  season: string;
  title: string;
  summary?: string;
  coverImageUrl?: string;
  finalizedAt: string;
}
