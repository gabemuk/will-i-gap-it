import Link from 'next/link';
import PageShell from '@/components/PageShell';
import GarageCard from '@/components/GarageCard';

export const metadata = {
  title: 'Contact – Will I Gap It?',
  description: 'Feedback, bugs, privacy concerns, and takedown requests.',
};

export default function ContactPage() {
  return (
    <PageShell maxWidth="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-1">Contact</h1>
        <p className="text-zinc-400 text-sm">
          Feedback, bugs, privacy concerns, and takedown requests.
        </p>
      </div>

      <div className="space-y-5">

        <GarageCard>
          <h2 className="text-sm font-black text-orange-500 uppercase tracking-wide mb-3">
            Get in touch
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            For feedback, bugs, privacy concerns, or takedown requests, contact the
            Will I Gap It team.
          </p>
          <p className="text-zinc-500 text-sm mt-3 italic">
            Contact email coming soon.
          </p>
        </GarageCard>

        <GarageCard>
          <h2 className="text-sm font-black text-orange-500 uppercase tracking-wide mb-3">
            Privacy &amp; takedown requests
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            If you have a privacy concern or need a result or proof link removed, include the
            share link or result page link if possible so we can find it quickly.
          </p>
          <p className="text-zinc-300 text-sm leading-relaxed mt-2">
            Do not send license plates, addresses, phone numbers, or private personal
            information in your message. Just describe what needs to be removed and why.
          </p>
        </GarageCard>

        <GarageCard>
          <h2 className="text-sm font-black text-orange-500 uppercase tracking-wide mb-3">
            Bug reports &amp; feedback
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Found something broken or have an idea for the app? We want to hear it.
            Describe what happened and what you expected, and include your browser and
            device if it seems relevant.
          </p>
        </GarageCard>

      </div>

      <div className="mt-10 pt-6 border-t border-zinc-800/60 flex flex-wrap gap-4 justify-center">
        <Link href="/" className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2">
          Back to Calculator
        </Link>
        <Link href="/privacy" className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2">
          Privacy
        </Link>
        <Link href="/terms" className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2">
          Terms
        </Link>
      </div>
    </PageShell>
  );
}
