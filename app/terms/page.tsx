import Link from 'next/link';
import PageShell from '@/components/PageShell';
import GarageCard from '@/components/GarageCard';

export const metadata = {
  title: 'Terms – Will I Gap It?',
  description: 'Plain-language rules for using Will I Gap It.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-black text-orange-500 uppercase tracking-wide mb-2">
        {title}
      </h2>
      <div className="text-zinc-300 text-sm leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <PageShell maxWidth="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-1">Terms</h1>
        <p className="text-zinc-400 text-sm">
          Plain-language rules for using Will I Gap It.
        </p>
      </div>

      <div className="space-y-5">

        <GarageCard>
          <Section title="Closed-course use">
            <p>
              Will I Gap It is built for informational, entertainment, educational, and
              closed-course comparison purposes only. It is a stats-based calculator,
              not a race-coordination or street-racing tool.
            </p>
            <p>
              You are responsible for obeying all applicable laws, safety rules, and track
              regulations wherever you drive. The app does not encourage, organize, or
              facilitate street racing, illegal driving, or unsafe activity of any kind.
            </p>
          </Section>
        </GarageCard>

        <GarageCard>
          <Section title="Prediction accuracy">
            <p>
              All predictions are estimates based on the stats you enter. They are not
              guarantees. Real outcomes depend on driver skill, road or track conditions,
              tire type and condition, surface grip, ambient temperature, altitude, fuel load,
              tune state, vehicle maintenance, reaction time, and many other factors the
              calculator cannot see.
            </p>
            <p>
              Do not rely on this app for safety-critical decisions. It is a fun comparison
              tool, not a performance certification.
            </p>
          </Section>
        </GarageCard>

        <GarageCard>
          <Section title="User-submitted content">
            <p>
              When you submit a community result, you are responsible for what you submit.
              Submitted results may be unverified, disputed, incomplete, or inaccurate.
              The community can see submitted results on public pages.
            </p>
            <p>
              Do not submit private info, license plates, VINs, exact locations, or any
              content you do not have the rights to share. Keep it to build specs, race type,
              and general outcome details.
            </p>
          </Section>
        </GarageCard>

        <GarageCard>
          <Section title="Proof links">
            <p>
              Proof links are optional and point to external third-party platforms. You are
              responsible for what your proof link contains. Do not submit links that include
              license plates, faces, addresses, exact meetup locations, or other private or
              identifying information.
            </p>
            <p>
              The app may remove or stop displaying proof links that violate these terms,
              contain abusive content, or are inappropriate for the community.
            </p>
          </Section>
        </GarageCard>

        <GarageCard>
          <Section title="What not to submit">
            <p>The following are not welcome and may be removed:</p>
            <ul className="list-none space-y-1 mt-1">
              {[
                'Real names of people who did not consent to being named',
                'License plate numbers',
                'Vehicle Identification Numbers (VINs)',
                'Home or business addresses',
                'Exact meetup or race locations',
                'Threats, harassment, or targeted abuse',
                'Illegal or harmful content',
                'Spam, fake submissions, or bot-generated results',
                'Private or identifying information about other people (doxxing)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5 shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>
        </GarageCard>

        <GarageCard>
          <Section title="No betting or race coordination">
            <p>
              Will I Gap It does not provide betting, wagering, matchmaking, or race-coordination
              features. Do not use the app to arrange unsafe or illegal driving activity.
              Any such use is entirely your own responsibility and is outside the intended
              purpose of the app.
            </p>
          </Section>
        </GarageCard>

        <GarageCard>
          <Section title="Moderation">
            <p>
              Future versions of the app may hide, remove, dispute, or down-rank submitted
              results that are abusive, fake, unsafe, privacy-violating, or otherwise
              inconsistent with these terms. Verification status on submitted results may
              change over time as the community grows.
            </p>
          </Section>
        </GarageCard>

        <GarageCard glow>
          <Section title="Use at your own risk">
            <p>
              Will I Gap It is provided as-is, for free, with no warranties. We make no
              guarantee of accuracy, uptime, availability, or fitness for any specific purpose.
              By using the app, you accept that predictions are estimates, submitted results
              are community-sourced and unverified, and you are responsible for your own
              driving decisions and actions.
            </p>
            <p className="text-zinc-500 text-xs mt-3">
              For closed-course and track comparison only.
            </p>
          </Section>
        </GarageCard>

      </div>

      <div className="mt-10 pt-6 border-t border-zinc-800/60 flex flex-wrap gap-4 justify-center">
        <Link href="/" className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2">
          Back to Calculator
        </Link>
        <Link href="/privacy" className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2">
          Privacy
        </Link>
        <Link href="/contact" className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2">
          Contact
        </Link>
      </div>
    </PageShell>
  );
}
