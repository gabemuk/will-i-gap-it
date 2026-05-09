export type Drivetrain = 'FWD' | 'RWD' | 'AWD' | '4WD';

export type Transmission =
  | 'Manual'
  | 'Auto'
  | 'DCT'
  | 'Single-speed / EV'
  | 'CVT'
  | 'Unknown';

export type TireType =
  | 'All-season'
  | 'Summer'
  | 'Performance summer'
  | 'Winter'
  | 'Drag radial'
  | 'Slick';

export type RaceType = 'dig' | '40 roll' | '60 roll' | '60-130' | 'quarter mile';
export type PowerType = 'Wheel HP' | 'Crank HP' | 'Estimated HP';
export type Fuel = 'Pump gas' | 'E85' | 'Race gas' | 'Flex fuel' | 'Unknown';

export type Aspiration =
  | 'Naturally aspirated'
  | 'Turbo'
  | 'Supercharged'
  | 'Twin-turbo'
  | 'Procharged'
  | 'Nitrous'
  | 'Electric / None'
  | 'Unknown';

export type PowertrainType =
  | 'Gas'
  | 'Diesel'
  | 'Hybrid'
  | 'Electric'
  | 'Unknown';

export type ElectricMotorCount =
  | 'None'
  | '1 motor'
  | '2 motors'
  | '3 motors'
  | '4+ motors'
  | 'Unknown';

export type HybridLayout =
  | 'Mild hybrid'
  | 'Traditional hybrid'
  | 'Plug-in hybrid'
  | 'Performance hybrid'
  | 'Unknown';

export interface CarInput {
  // Vehicle identity
  make: string;
  model: string;
  year: number | '';
  trim: string;
  // Power
  horsepower: number | '';
  powerType: PowerType;
  torque: number | '';
  weight: number | '';
  aspiration: Aspiration;
  fuel: Fuel;
  // Setup
  drivetrain: Drivetrain;
  transmission: Transmission;
  tire: TireType;
  // Known times
  zeroToSixty: number | '';
  sixtyToOneThirty: number | '';
  quarterMile: number | '';
  trapSpeed: number | '';
  // Notes
  mods: string;
  // EV / Hybrid / Powertrain (optional - old saved rows may not have these)
  powertrainType?: PowertrainType;
  engineSize?: string;
  electricMotorCount?: ElectricMotorCount;
  hybridLayout?: HybridLayout;
}

export interface CompareResult {
  winner: 'Car A' | 'Car B' | 'Too close';
  estimatedGap: string;
  confidence: 'Low' | 'Medium' | 'High';
  explanation: string;
  neededAdvantage: string;
}

// Database row types (Supabase)

export interface SavedMatchup {
  id: string;
  share_code: string;
  car_a: CarInput;
  car_b: CarInput;
  race_type: RaceType;
  prediction: CompareResult;
  created_at: string;
  user_id?: string | null;
  // Learning / build-key columns (added in learning_foundation migration)
  car_a_build_key?: string | null;
  car_b_build_key?: string | null;
  prediction_version?: string | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  created_at?: string;
  updated_at?: string;
}

export type VerificationStatus =
  | 'unverified'
  | 'proof_claimed'
  | 'proof_linked'
  | 'admin_verified'
  | 'disputed';

export interface RaceResult {
  id: string;
  matchup_id: string;
  actual_winner: string;
  actual_gap: string;
  result_notes: string | null;
  proof_type: string;
  proof_url: string | null;
  verification_status: VerificationStatus | null;
  prediction_was_correct: boolean | null;
  created_at: string;
  user_id?: string | null;
  // Learning / quality columns (added in learning_foundation migration)
  // Optional so existing rows without these columns remain compatible.
  quality_score?: number | null;
  learning_weight?: number | null;
  review_status?: string | null;
  hidden_from_learning?: boolean | null;
  hidden_from_leaderboard?: boolean | null;
  dispute_count?: number | null;
}

export interface MatchupSummary {
  share_code: string;
  car_a: CarInput;
  car_b: CarInput;
  race_type: RaceType;
  prediction: CompareResult;
}

export interface ResultWithMatchup extends RaceResult {
  matchups: MatchupSummary | null;
}
