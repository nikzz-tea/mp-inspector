export interface MatchResponse {
  match: Match;
  events: MatchEvent[];
  users: User[];
  first_event_id: number;
  latest_event_id: number;
  current_game_id: number | null;
}

export interface MatchDetails {
  match: Match;
  beatmaps: BeatmapPlayed[];
}

export interface BeatmapPlayed {
  id: number;
  beatmapId: number;
  startTime: string | null;
  endTime: string | null;
  startTimeLabel: string;
  mode: string;
  teamType: string;
  mods: string[];
  title: string;
  artist: string;
  creator: string;
  difficultyName: string;
  difficultyRating: number;
  scores: PlayerScore[];
}

type Rank = 'XH' | 'X' | 'SH' | 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface PlayerScore {
  userId: number;
  username: string;
  team: 'blue' | 'red' | 'none' | string;
  score: number;
  accuracy: number;
  maxCombo: number;
  rank: Rank;
  passed: boolean;
  mods: string[];
  statistics: ScoreStatistics;
}

export interface Match {
  id: number;
  start_time: string | null;
  end_time: string | null;
  name: string;
}

export interface MatchEvent {
  id: number;
  detail: {
    type:
      | 'match-created'
      | 'match-disbanded'
      | 'host-changed'
      | 'player-joined'
      | 'player-left'
      | 'player-kicked'
      | 'other'
      | string;
    text?: string;
  };
  timestamp: string;
  user_id: number | null;
  game?: Game | null;
}

export interface User {
  id: number;
  username: string;
  avatar_url: string;
  country_code: string;
  country: {
    code: string;
    name: string;
  };
}

export interface Game {
  id: number;
  beatmap_id: number;
  start_time: string | null;
  end_time: string | null;
  match_id: number;
  mode: string;
  mode_int: number;
  scoring_type: string;
  team_type: string;
  mods: string[];
  beatmap: Beatmap;
  scores: Score[];
}

export interface Score {
  accuracy: number;
  best_id: number | null;
  max_combo: number;
  mods: string[];
  passed: boolean;
  perfect: boolean;
  rank: Rank;
  score: number;
  statistics: ScoreStatistics;
  user_id: number;
  match: {
    slot: number;
    team: 'blue' | 'red' | 'none' | string;
    pass: boolean;
  };
}

export interface ScoreStatistics {
  count_100: number;
  count_300: number;
  count_50: number;
  count_geki: number;
  count_katu: number;
  count_miss: number;
}

export interface Beatmap {
  id: number;
  beatmapset_id: number;
  difficulty_rating: number;
  mode: string;
  status: string;
  version: string;
  beatmapset: {
    artist: string;
    artist_unicode: string;
    title: string;
    title_unicode: string;
    creator: string;
    id: number;
    status: string;
  };
}
