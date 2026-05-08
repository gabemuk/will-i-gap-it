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

export function formatVerificationStatus(status: string | null | undefined): string {
  const map: Record<string, string> = {
    unverified: 'Unverified',
    proof_claimed: 'Proof Claimed',
    proof_linked: 'Proof Linked',
    admin_verified: 'Verified',
    disputed: 'Disputed',
  };
  return map[status ?? ''] ?? 'Unverified';
}

export function getVerificationBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case 'proof_claimed':
      return 'bg-amber-900/40 text-amber-400 border border-amber-700/40';
    case 'proof_linked':
      return 'bg-blue-900/40 text-blue-400 border border-blue-700/40';
    case 'admin_verified':
      return 'bg-green-900/40 text-green-400 border border-green-700/40';
    case 'disputed':
      return 'bg-red-900/40 text-red-400 border border-red-700/40';
    default:
      return 'bg-zinc-800 text-zinc-400 border border-zinc-700/40';
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
