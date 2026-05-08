import { CompareResult } from '@/lib/types';

interface Props {
  result: CompareResult;
  carAName: string;
  carBName: string;
}

export default function ResultCard({ result, carAName, carBName }: Props) {
  const winnerLabel =
    result.winner === 'Car A'
      ? carAName
      : result.winner === 'Car B'
        ? carBName
        : null;

  const confidenceColor =
    result.confidence === 'High'
      ? 'text-green-400'
      : result.confidence === 'Medium'
        ? 'text-orange-400'
        : 'text-yellow-400';

  const confidenceBadgeBg =
    result.confidence === 'High'
      ? 'bg-green-900/40 border-green-700/50'
      : result.confidence === 'Medium'
        ? 'bg-orange-900/40 border-orange-700/50'
        : 'bg-yellow-900/30 border-yellow-700/40';

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-5">
        Result
      </h3>

      {/* Winner banner */}
      <div className="mb-6">
        <p className="text-xs text-zinc-500 mb-1">
          {result.winner === 'Too close' ? 'Verdict' : 'Likely winner'}
        </p>
        {result.winner === 'Too close' ? (
          <p className="text-3xl font-bold text-yellow-400">Too Close to Call</p>
        ) : (
          <p className="text-3xl font-bold text-orange-500">
            {result.winner} —{' '}
            <span className="text-white">{winnerLabel}</span>
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 mb-1">Estimated Gap</p>
          <p className="text-sm font-semibold text-white leading-snug">
            {result.estimatedGap}
          </p>
        </div>
        <div className={`rounded-lg p-4 border ${confidenceBadgeBg}`}>
          <p className="text-xs text-zinc-500 mb-1">Confidence</p>
          <p className={`text-sm font-bold ${confidenceColor}`}>
            {result.confidence}
          </p>
        </div>
      </div>

      {/* Analysis */}
      <div className="mb-5">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
          Analysis
        </p>
        <p className="text-sm text-zinc-300 leading-relaxed">
          {result.explanation}
        </p>
      </div>

      {/* To close the gap */}
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
          To Close the Gap
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {result.neededAdvantage}
        </p>
      </div>
    </div>
  );
}
