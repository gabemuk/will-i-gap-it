export function formatRaceType(raceType: string): string {
  const map: Record<string, string> = {
    dig: 'Dig Race',
    '40 roll': '40 Roll',
    '60 roll': '60 Roll',
    '60-130': '60-130',
    'quarter mile': 'Quarter Mile',
  };
  return map[raceType] ?? raceType;
}

export function formatProofType(proofType: string): string {
  const map: Record<string, string> = {
    none: 'None',
    video: 'Video',
    dragy: 'Dragy',
    time_slip: 'Time Slip',
    dyno_sheet: 'Dyno Sheet',
  };
  return map[proofType] ?? proofType;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
