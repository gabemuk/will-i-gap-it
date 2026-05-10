import type { ResultReportReason } from './types';

export const RESULT_REPORT_REASONS: { value: ResultReportReason; label: string }[] = [
  { value: 'fake_result',         label: 'Fake result' },
  { value: 'wrong_cars',          label: 'Wrong cars' },
  { value: 'wrong_winner',        label: 'Wrong winner' },
  { value: 'bad_proof_link',      label: 'Bad proof link' },
  { value: 'private_info_shown',  label: 'Private info shown' },
  { value: 'spam_or_joke',        label: 'Spam or joke' },
  { value: 'unsafe_content',      label: 'Unsafe content' },
  { value: 'duplicate',           label: 'Duplicate' },
  { value: 'other',               label: 'Other' },
];

export function formatReportReason(reason: ResultReportReason): string {
  const found = RESULT_REPORT_REASONS.find((r) => r.value === reason);
  return found ? found.label : reason;
}
