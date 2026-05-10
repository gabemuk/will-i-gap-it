import { CompareResult } from '@/lib/types';

interface Props {
  result: CompareResult;
  carAName: string;
  carBName: string;
}

const confidenceMeta = {
  High:   { dot: 'bg-[var(--color-success)]', text: 'text-[var(--color-success)]', label: 'High' },
  Medium: { dot: 'bg-[var(--color-caution)]', text: 'text-[var(--color-caution)]', label: 'Moderate' },
  Low:    { dot: 'bg-[var(--color-danger)]',  text: 'text-[var(--color-danger)]',  label: 'Low' },
};

export default function ResultCard({ result, carAName, carBName }: Props) {
  const winnerLabel =
    result.winner === 'Car A' ? carAName :
    result.winner === 'Car B' ? carBName : null;

  const isTooClose = result.winner === 'Too close';
  const conf = confidenceMeta[result.confidence] ?? confidenceMeta.Low;

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-zinc-200 shadow-[0_4px_32px_rgba(0,0,0,0.08)]">

      {/* Top accent bar — orange for winner, amber for too close */}
      <div className={`h-1 w-full ${isTooClose ? 'bg-amber-400' : 'bg-[var(--color-accent)]'}`} />

      {/* Header: label + confidence */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100">
        <span className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Estimated Result
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${conf.dot}`} />
          <span className={`text-xs font-semibold ${conf.text}`}>
            {conf.label} Confidence
          </span>
        </div>
      </div>

      {/* Winner — dominant section */}
      <div className="px-5 pt-5 pb-4 border-b border-zinc-100">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
          {isTooClose ? 'Verdict' : 'Likely Winner'}
        </p>
        {isTooClose ? (
          <p className="font-display font-bold text-3xl sm:text-4xl text-amber-500 uppercase tracking-wide leading-none">
            Too Close to Call
          </p>
        ) : (
          <p className="font-display font-bold text-3xl sm:text-4xl uppercase tracking-wide leading-none">
            <span className="text-[var(--color-accent)]">{result.winner}</span>
            <span className="text-zinc-300 mx-2">—</span>
            <span className="text-zinc-900">{winnerLabel}</span>
          </p>
        )}
      </div>

      {/* Data row: estimated gap + confidence level */}
      <div className="grid grid-cols-2 border-b border-zinc-100">
        <div className="px-5 py-4 border-r border-zinc-100">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
            Estimated Gap
          </p>
          <p className="font-mono text-2xl font-semibold text-zinc-900 leading-none">
            {result.estimatedGap}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
            Confidence
          </p>
          <p className={`font-display font-bold text-2xl leading-none ${conf.text}`}>
            {conf.label}
          </p>
        </div>
      </div>

      {/* Analysis */}
      <div className="px-5 py-4 border-b border-zinc-100">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
          Analysis
        </p>
        <p className="text-sm text-zinc-600 leading-relaxed">
          {result.explanation}
        </p>
      </div>

      {/* To close the gap */}
      <div className="px-5 py-4">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
          To Close the Gap
        </p>
        <p className="text-sm text-zinc-600 leading-relaxed">
          {result.neededAdvantage}
        </p>
      </div>

    </div>
  );
}
