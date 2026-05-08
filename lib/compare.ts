import { CarInput, CompareResult, RaceType } from './types';

// Car name helper
export function getCarLabel(car: CarInput): string {
  const parts: string[] = [];
  if (car.year !== '') parts.push(String(car.year));
  if (car.make.trim()) parts.push(car.make.trim());
  if (car.model.trim()) parts.push(car.model.trim());
  if (car.trim.trim()) parts.push(car.trim.trim());
  return parts.join(' ') || 'Car';
}

// Wheel HP conversion from crank HP
const crankToWheel: Record<string, number> = {
  FWD: 0.88,
  RWD: 0.85,
  AWD: 0.78,
  '4WD': 0.75,
};

function getWheelHP(car: CarInput): number {
  const hp = car.horsepower as number;
  if (car.powerType === 'Crank HP') {
    return hp * (crankToWheel[car.drivetrain] ?? 0.85);
  }
  return hp;
}

// Multiplier tables
const drivetrainMult: Record<'dig' | 'roll', Record<string, number>> = {
  dig:  { AWD: 1.08, '4WD': 1.06, RWD: 1.00, FWD: 0.95 },
  roll: { AWD: 1.03, '4WD': 1.01, RWD: 1.02, FWD: 0.97 },
};

const tireMult: Record<'dig' | 'roll', Record<string, number>> = {
  dig: {
    Slick: 1.12,
    'Drag radial': 1.08,
    'Performance summer': 1.04,
    Summer: 1.03,
    'All-season': 1.00,
    Winter: 0.90,
  },
  roll: {
    Slick: 1.05,
    'Drag radial': 1.04,
    'Performance summer': 1.03,
    Summer: 1.02,
    'All-season': 1.00,
    Winter: 0.90,
  },
};

// Single-speed / EV: small consistency bonus (no shift hesitation).
// CVT: very slight penalty. Unknown: neutral.
const transMult: Record<'dig' | 'roll', Record<string, number>> = {
  dig:  { DCT: 1.04, 'Single-speed / EV': 1.03, Auto: 0.98, Manual: 0.99, CVT: 0.97, Unknown: 1.00 },
  roll: { DCT: 1.02, 'Single-speed / EV': 1.01, Auto: 1.00, Manual: 1.01, CVT: 0.99, Unknown: 1.00 },
};

// Torque bonus for dig and 40-roll races
function torqueFactor(car: CarInput): number {
  if (car.torque === '' || car.weight === '') return 1.0;
  const tpk = (car.torque as number) / ((car.weight as number) / 1000);
  const factor = 1 + (tpk - 300) * 0.00006;
  return Math.max(0.98, Math.min(1.02, factor));
}

// Small consistency bonus for electric and performance-hybrid powertrains.
// These are minor adjustments only - HP/weight/tire/drivetrain remain dominant.
function powertrainBonus(car: CarInput, category: 'dig' | 'roll'): number {
  let bonus = 1.0;

  const isElectric =
    car.powertrainType === 'Electric' ||
    car.transmission === 'Single-speed / EV';

  const isPerformanceHybrid =
    car.powertrainType === 'Hybrid' &&
    car.hybridLayout === 'Performance hybrid';

  if (isElectric) {
    // Instant torque delivery - small consistency bonus off the line
    if (category === 'dig') bonus *= 1.02;
    else bonus *= 1.01;
  } else if (isPerformanceHybrid) {
    // Electric motor assist at low speed
    if (category === 'dig') bonus *= 1.01;
  }
  // Mild hybrid, Traditional hybrid, Plug-in hybrid: neutral
  // Gas, Diesel, Unknown: neutral

  // Electric motor count: very small traction/torque-distribution bonus for dig only
  if (category === 'dig') {
    const motorCount = car.electricMotorCount;
    if (motorCount === '2 motors') bonus *= 1.005;
    else if (motorCount === '3 motors' || motorCount === '4+ motors') bonus *= 1.01;
  }

  return bonus;
}

// Score computation
function computeScore(
  car: CarInput,
  category: 'dig' | 'roll',
  applyTorque: boolean,
): number {
  const whp = getWheelHP(car);
  const wt = car.weight as number;
  const ptw = whp / (wt / 1000);
  const tf = applyTorque ? torqueFactor(car) : 1.0;
  const pb = powertrainBonus(car, category);
  return (
    ptw *
    (drivetrainMult[category][car.drivetrain] ?? 1.0) *
    (tireMult[category][car.tire] ?? 1.0) *
    (transMult[category][car.transmission] ?? 1.0) *
    tf *
    pb
  );
}

// Gap description helpers
function gapByPercent(pct: number): string {
  const abs = Math.abs(pct);
  if (abs < 2)  return 'less than half a car length';
  if (abs < 5)  return 'roughly 1-2 car lengths';
  if (abs < 10) return '3-5 car lengths';
  if (abs < 20) return '5-8 car lengths';
  return '8+ car lengths';
}

function gapByTime(seconds: number): string {
  const abs = Math.abs(seconds);
  if (abs < 0.3) return 'less than a car length';
  if (abs < 0.8) return 'roughly 1-3 car lengths';
  if (abs < 1.5) return '4-6 car lengths';
  return '6+ car lengths';
}

// Confidence helpers
function lowerConfidence(c: 'Low' | 'Medium' | 'High'): 'Low' | 'Medium' | 'High' {
  if (c === 'High') return 'Medium';
  return 'Low';
}

function hasEstimatedHP(carA: CarInput, carB: CarInput): boolean {
  return carA.powerType === 'Estimated HP' || carB.powerType === 'Estimated HP';
}

// Main export
export function compareCars(
  carA: CarInput,
  carB: CarInput,
  raceType: RaceType,
): CompareResult {
  const nameA = getCarLabel(carA);
  const nameB = getCarLabel(carB);

  // 1. Dig race with known 0-60 times for both
  if (
    raceType === 'dig' &&
    carA.zeroToSixty !== '' &&
    carB.zeroToSixty !== ''
  ) {
    const tA = carA.zeroToSixty as number;
    const tB = carB.zeroToSixty as number;
    const diff = tB - tA;

    if (Math.abs(diff) < 0.2) {
      return {
        winner: 'Too close',
        estimatedGap: 'less than a car length',
        confidence: 'High',
        explanation: `Both cars show nearly identical 0-60 times (${nameA}: ${tA}s, ${nameB}: ${tB}s). This dig is too close to call with confidence.`,
        neededAdvantage: 'Either car could win — launch execution, tires, and conditions will decide it.',
      };
    }

    const winner = diff > 0 ? 'Car A' : 'Car B';
    const winnerName = diff > 0 ? nameA : nameB;
    const loserName  = diff > 0 ? nameB : nameA;
    const gap = gapByTime(diff);
    let confidence: 'Low' | 'Medium' | 'High' = 'High';
    if (hasEstimatedHP(carA, carB)) confidence = lowerConfidence(confidence);

    return {
      winner,
      estimatedGap: gap,
      confidence,
      explanation: `Based on known 0-60 times (${nameA}: ${tA}s, ${nameB}: ${tB}s), ${winnerName} is likely ~${Math.abs(diff).toFixed(2)}s faster off the line — an estimated ${gap}.`,
      neededAdvantage: `${loserName} would need to cut ~${Math.abs(diff).toFixed(2)}s from its 0-60 to be competitive.`,
    };
  }

  // 2. 60-130 with known times
  if (
    raceType === '60-130' &&
    carA.sixtyToOneThirty !== '' &&
    carB.sixtyToOneThirty !== ''
  ) {
    const tA = carA.sixtyToOneThirty as number;
    const tB = carB.sixtyToOneThirty as number;
    const diff = tB - tA;

    if (Math.abs(diff) < 0.3) {
      return {
        winner: 'Too close',
        estimatedGap: 'less than a car length',
        confidence: 'High',
        explanation: `Both cars show nearly identical 60-130 times (${nameA}: ${tA}s, ${nameB}: ${tB}s). This race is too close to call with confidence.`,
        neededAdvantage: 'Either car could win — conditions and driver will decide it.',
      };
    }

    const winner = diff > 0 ? 'Car A' : 'Car B';
    const winnerName = diff > 0 ? nameA : nameB;
    const loserName  = diff > 0 ? nameB : nameA;
    const gap = gapByTime(diff);

    return {
      winner,
      estimatedGap: gap,
      confidence: 'High',
      explanation: `Based on known 60-130 times (${nameA}: ${tA}s, ${nameB}: ${tB}s), ${winnerName} is likely ~${Math.abs(diff).toFixed(2)}s faster through that range — an estimated ${gap}.`,
      neededAdvantage: `${loserName} would need to cut ~${Math.abs(diff).toFixed(2)}s from its 60-130 time to be competitive.`,
    };
  }

  // 3. Quarter-mile with known times
  if (
    raceType === 'quarter mile' &&
    carA.quarterMile !== '' &&
    carB.quarterMile !== ''
  ) {
    const tA = carA.quarterMile as number;
    const tB = carB.quarterMile as number;
    const diff = tB - tA;

    if (Math.abs(diff) < 0.2) {
      return {
        winner: 'Too close',
        estimatedGap: 'less than a car length',
        confidence: 'High',
        explanation: `Quarter-mile times are nearly identical (${nameA}: ${tA}s, ${nameB}: ${tB}s). Either car could win on a given day.`,
        neededAdvantage: 'Either car could win — reaction time, grip, and conditions will decide it.',
      };
    }

    const winner = diff > 0 ? 'Car A' : 'Car B';
    const winnerName = diff > 0 ? nameA : nameB;
    const loserName  = diff > 0 ? nameB : nameA;
    const gap = gapByTime(diff);

    return {
      winner,
      estimatedGap: gap,
      confidence: 'High',
      explanation: `Based on known quarter-mile times (${nameA}: ${tA}s, ${nameB}: ${tB}s), ${winnerName} is estimated to win by ~${Math.abs(diff).toFixed(2)}s — approximately ${gap}.`,
      neededAdvantage: `${loserName} would need to cut ~${Math.abs(diff).toFixed(2)}s from its quarter-mile to close this gap.`,
    };
  }

  // 4. Roll races with known trap speeds
  const isRoll =
    raceType === '40 roll' || raceType === '60 roll' || raceType === '60-130';

  if (isRoll && carA.trapSpeed !== '' && carB.trapSpeed !== '') {
    const spA = carA.trapSpeed as number;
    const spB = carB.trapSpeed as number;
    const diff = spA - spB;

    if (Math.abs(diff) < 2) {
      return {
        winner: 'Too close',
        estimatedGap: 'less than 1 car length',
        confidence: 'Medium',
        explanation: `Trap speeds are within 2 mph of each other (${nameA}: ${spA} mph, ${nameB}: ${spB} mph). This roll race is likely very close. Confidence is medium — trap speed is a proxy, not a direct roll measurement.`,
        neededAdvantage: 'Either car could win — driver skill and conditions will be the deciding factor.',
      };
    }

    const winner = diff > 0 ? 'Car A' : 'Car B';
    const winnerName = diff > 0 ? nameA : nameB;
    const loserName  = diff > 0 ? nameB : nameA;
    const gapStr = Math.abs(diff) >= 5 ? '3-5 car lengths' : '1-2 car lengths';
    let confidence: 'Low' | 'Medium' | 'High' = 'Medium';
    if (hasEstimatedHP(carA, carB)) confidence = lowerConfidence(confidence);

    return {
      winner,
      estimatedGap: gapStr,
      confidence,
      explanation: `Based on trap speeds (${nameA}: ${spA} mph, ${nameB}: ${spB} mph), ${winnerName} carries ~${Math.abs(diff).toFixed(0)} more mph at top end — a useful proxy for roll race performance. Results are estimated and confidence is ${confidence.toLowerCase()}.`,
      neededAdvantage: `${loserName} would likely need ~${Math.abs(diff).toFixed(0)} more mph of top-end speed to be competitive.`,
    };
  }

  // 5. Score-based fallback (hp/weight + multipliers)
  const category: 'dig' | 'roll' =
    raceType === 'dig' || raceType === 'quarter mile' ? 'dig' : 'roll';
  const applyTorque =
    raceType === 'dig' || raceType === '40 roll' || raceType === 'quarter mile';

  const scoreA = computeScore(carA, category, applyTorque);
  const scoreB = computeScore(carB, category, applyTorque);

  const hasPartialData =
    carA.zeroToSixty !== '' ||
    carB.zeroToSixty !== '' ||
    carA.sixtyToOneThirty !== '' ||
    carB.sixtyToOneThirty !== '' ||
    carA.quarterMile !== '' ||
    carB.quarterMile !== '' ||
    carA.trapSpeed !== '' ||
    carB.trapSpeed !== '';

  let confidence: 'Low' | 'Medium' | 'High' = hasPartialData ? 'Medium' : 'Low';
  if (hasEstimatedHP(carA, carB)) confidence = lowerConfidence(confidence);

  const pctDiff = ((scoreA - scoreB) / scoreB) * 100;

  const whpA = getWheelHP(carA);
  const wtA  = carA.weight as number;
  const whpB = getWheelHP(carB);
  const wtB  = carB.weight as number;
  const ptwA = (whpA / (wtA / 1000)).toFixed(1);
  const ptwB = (whpB / (wtB / 1000)).toFixed(1);

  if (Math.abs(pctDiff) < 2) {
    return {
      winner: 'Too close',
      estimatedGap: 'likely less than half a car length',
      confidence,
      explanation: `Estimated performance scores are very close (${scoreA.toFixed(1)} vs ${scoreB.toFixed(1)}). Wheel power-to-weight: ${nameA} ${ptwA} whp/klb, ${nameB} ${ptwB} whp/klb. Based on these stats alone this matchup is too close to call. Confidence is ${confidence.toLowerCase()} — entering known performance times will improve the estimate.`,
      neededAdvantage: 'Either car could win — real-world results will depend on driver, tires, and conditions.',
    };
  }

  const winner = pctDiff > 0 ? 'Car A' : 'Car B';
  const winnerName = pctDiff > 0 ? nameA : nameB;
  const loserName  = pctDiff > 0 ? nameB : nameA;
  const loserCar   = pctDiff > 0 ? carB   : carA;
  const gap = gapByPercent(pctDiff);
  const hpNeeded = Math.round(
    (Math.abs(pctDiff) / 100) * getWheelHP(loserCar),
  );

  return {
    winner,
    estimatedGap: gap,
    confidence,
    explanation: `Based on the provided stats, ${winnerName} likely holds a ~${Math.abs(pctDiff).toFixed(1)}% estimated performance advantage for a ${raceType} race. Wheel power-to-weight: ${nameA} ${ptwA} whp/klb vs ${nameB} ${ptwB} whp/klb. Drivetrain, tire, and transmission factors are applied. Results are estimated — confidence is ${confidence.toLowerCase()}.`,
    neededAdvantage: `${loserName} would likely need approximately ${hpNeeded} more wheel horsepower (or an equivalent weight reduction) to close this gap.`,
  };
}
