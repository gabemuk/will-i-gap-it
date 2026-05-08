export type Drivetrain = 'FWD' | 'RWD' | 'AWD' | '4WD';
export type Transmission = 'Manual' | 'Auto' | 'DCT';
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
}

export interface RaceResult {
  id: string;
  matchup_id: string;
  actual_winner: string;
  actual_gap: string;
  result_notes: string | null;
  proof_type: string;
  prediction_was_correct: boolean | null;
  created_at: string;
}
