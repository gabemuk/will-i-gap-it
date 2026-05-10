import Link from 'next/link';
import PageShell from '@/components/PageShell';

export const metadata = {
  title: 'Contact – Will I Gap It?',
  description: 'Feedback, bugs, privacy concerns, and takedown requests.',
};

export default function ContactPage() {
  return (
    <PageShell variant="light" maxWidth="max-w-2xl">

      <div className="mb-8">
        <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight text-zinc-900">
          Contact
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Feedback, bugs, privacy concerns, and takedown requests.
        </p>
      </div>

      <div className="space-y-4">

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
            Get in touch
          </h2>
          <p className="text-zinc-600 text-sm leading-relaxed">
            For feedback, bugs, privacy concerns, or takedown requests, contact the
            Will I Gap It team.
          </p>
          <p className="text-zinc-600 text-sm mt-3">
            For feedback, bugs, or prediction issues, email{' '}
            <a
              href="mailto:gabemuk@bu.edu"
              className="text-[var(--color-accent)] hover:text-orange-600 transition-colors underline underline-offset-2"
            >
              gabemuk@bu.edu
            </a>.
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
            Privacy &amp; takedown requests
          </h2>
          <p className="text-zinc-600 text-sm leading-relaxed">
            If you have a privacy concern or need a result or proof link removed, include the
            share link or result page link if possible so we can find it quickly.
          </p>
          <p className="text-zinc-600 text-sm leading-relaxed mt-2">
            Do not send license plates, addresses, phone numbers, or private personal
            information in your message. Just describe what needs to be removed and why.
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
            Bug reports &amp; feedback
          </h2>
          <p className="text-zinc-600 text-sm leading-relaxed">
            Found something broken or have an idea for the app? We want to hear it.
            Describe what happened and what you expected, and include your browser and
            device if it seems relevant.
          </p>
        </div>

      </div>

      <div className="mt-10 pt-6 border-t border-zinc-200 flex flex-wrap gap-4 justify-center">
        <Link href="/" className="text-xs text-zinc-500 hover:text-[var(--color-accent)] transition-colors underline underline-offset-2">
          Back to Calculator
        </Link>
        <Link href="/privacy" className="text-xs text-zinc-500 hover:text-[var(--color-accent)] transition-colors underline underline-offset-2">
          Privacy
        </Link>
        <Link href="/terms" className="text-xs text-zinc-500 hover:text-[var(--color-accent)] transition-colors underline underline-offset-2">
          Terms
        </Link>
      </div>

    </PageShell>
  );
}
