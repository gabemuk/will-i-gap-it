import type { CarInput } from './types';

/**
 * normalizeText
 *
 * Converts a raw string into a stable hyphenated key segment:
 * - trim & lowercase
 * - remove common punctuation that should not split builds: , . / \ _ ( ) [ ] { }
 * - collapse multiple spaces into one
 * - convert spaces to hyphens
 * - remove duplicate hyphens
 * - trim leading/trailing hyphens
 */
export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[,./\\_()\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Abbreviation pairs applied in order after base normalization.
 * Longer/more-specific patterns must come before shorter ones.
 */
const TRIM_ABBREVIATIONS: [RegExp, string][] = [
  [/\bcompetition-package\b/g, 'competition'],
  [/\bperformance-package\b/g, 'performance'],
  [/\bcomp\b/g, 'competition'],
  [/\bpp1\b/g, 'performance-package-1'],
  [/\bpp2\b/g, 'performance-package-2'],
];

/**
 * normalizeTrim
 *
 * Same base cleanup as normalizeText, plus expands common abbreviations
 * so that "comp", "Comp", and "Competition" all resolve to "competition".
 *
 * Examples:
 *   "comp"                  -> "competition"
 *   "Competition Package"   -> "competition"
 *   "Competition (Coupe)"   -> "competition-coupe"
 *   "PP1"                   -> "performance-package-1"
 */
export function normalizeTrim(value: string): string {
  let s = normalizeText(value);
  for (const [pattern, replacement] of TRIM_ABBREVIATIONS) {
    s = s.replace(pattern, replacement);
  }
  return s;
}

/**
 * getBuildKey
 *
 * Returns a stable, pipe-delimited key for grouping builds regardless of
 * capitalization, spacing, or common abbreviations.
 *
 * Format: year|normalized-make|normalized-model|normalized-trim
 * If trim is empty, the last segment is "base".
 *
 * Examples:
 *   { year: 2011, make: "BMW",   model: "M3",    trim: "Competition (Coupe)" }
 *     -> "2011|bmw|m3|competition-coupe"
 *
 *   { year: 2011, make: "bmw",   model: "m3",    trim: "comp" }
 *     -> "2011|bmw|m3|competition"
 *
 *   { year: 2016, make: "Ford",  model: "Focus", trim: "RS" }
 *     -> "2016|ford|focus|rs"
 *
 *   { year: 2020, make: "Honda", model: "Civic",  trim: "" }
 *     -> "2020|honda|civic|base"
 */
export function getBuildKey(car: CarInput): string {
  const year = car.year !== '' ? String(car.year) : 'unknown';
  const make = normalizeText(car.make) || 'unknown';
  const model = normalizeText(car.model) || 'unknown';
  const trim = car.trim.trim() ? (normalizeTrim(car.trim) || 'base') : 'base';
  return `${year}|${make}|${model}|${trim}`;
}

/**
 * getBuildDisplayLabel
 *
 * Returns a clean, human-readable label: "year make model trim"
 * Strips extra whitespace but does not alter casing or abbreviations.
 * Falls back to "Car" if all fields are empty.
 */
export function getBuildDisplayLabel(car: CarInput): string {
  const parts: string[] = [];
  if (car.year !== '') parts.push(String(car.year));
  if (car.make.trim()) parts.push(car.make.trim());
  if (car.model.trim()) parts.push(car.model.trim());
  if (car.trim.trim()) parts.push(car.trim.trim());
  return parts.join(' ').replace(/\s+/g, ' ').trim() || 'Car';
}
