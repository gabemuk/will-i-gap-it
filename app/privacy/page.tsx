import Link from 'next/link';
import PageShell from '@/components/PageShell';
import GarageCard from '@/components/GarageCard';

export const metadata = {
  title: 'Privacy – Will I Gap It?',
  description: 'Built to compare builds without exposing personal info.',
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

export default function PrivacyPage() {
  return (
    <PageShell maxWidth="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-1">Privacy</h1>
        <p className="text-zinc-400 text-sm">
          Built to compare builds without exposing personal info.
        </p>
      </div>

      <div className="space-y-5">

        <GarageCard>
          <Section title="What we collect">
            <p>
              When you save or share a matchup, we store the car and build details you entered,
              the race type, the predicted outcome, and a share code. Nothing else is required.
            </p>
            <p>
              When you submit a community result, we store the actual winner, actual gap,
              proof type, proof status, an optional proof link, and any notes you choose to add.
            </p>
            <p>
              If you are signed in, your Supabase Auth user ID may be attached to matchups and
              submitted results so your account can display My Matchups and My Results.
              Your email is handled separately by Supabase Auth and is used only for
              login and account recovery — it is not stored alongside your matchup data.
            </p>
          </Section>
        </GarageCard>

        <GarageCard>
          <Section title="What we do not ask for">
            <p>We do not ask for and do not want:</p>
            <ul className="list-none space-y-1 mt-1">
              {[
                'Real names',
                'Phone numbers',
                'Home or business addresses',
                'Vehicle Identification Numbers (VINs)',
                'License plates',
                'Exact race or meetup locations',
                'Direct video uploads (not supported right now)',
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
          <Section title="Public information">
            <p>
              Submitted community results may appear on the Recent Results and Leaderboard pages.
              Public result data may include car and build info, race type, actual winner, gap,
              proof status, an optional proof link, and your display name if you are signed in
              and have set one.
            </p>
            <p>
              Your email address is never shown publicly. Anonymous submissions may appear
              as community-submitted results with no name attached.
            </p>
          </Section>
        </GarageCard>

        <GarageCard>
          <Section title="Proof links">
            <p>
              Proof links are completely optional. If you add one, it may point to a
              third-party platform such as YouTube, Instagram, TikTok, Dragy, Google Drive,
              or similar. We do not control the privacy policies of those platforms.
            </p>
            <p>
              Before sharing any proof link, blur or crop out license plates, faces,
              street signs, locations, and any other identifying details. Do not submit
              links that contain private or personal information.
            </p>
          </Section>
        </GarageCard>

        <GarageCard>
          <Section title="Account email">
            <p>
              If you create an account, your email is used only for magic-link login and
              account recovery. It stays private inside Supabase Auth and is never shown
              on any public page.
            </p>
            <p>
              Your public identity is your display name only. You can change your display name
              at any time from your account page. You are not required to set one.
            </p>
          </Section>
        </GarageCard>

        <GarageCard>
          <Section title="Anonymous use">
            <p>
              You can compare builds, save and share matchups, and submit community results
              without creating an account. Anonymous matchups and results are stored with a
              null user ID and are not tied to any account.
            </p>
            <p>
              Creating an account later does not automatically claim or link your previous
              anonymous activity.
            </p>
          </Section>
        </GarageCard>

        <GarageCard>
          <Section title="Data safety">
            <p>
              We collect only what is needed to make the feature work. We are not in the
              business of selling or sharing your data with advertisers or third parties.
            </p>
            <p>
              Like any web app, we cannot guarantee absolute security. Only share build and
              result details you are comfortable having visible publicly. Keep personal and
              identifying details out of proof links, notes, and display names.
            </p>
          </Section>
        </GarageCard>

      </div>

      <div className="mt-10 pt-6 border-t border-zinc-800/60 flex flex-wrap gap-4 justify-center">
        <Link href="/" className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2">
          Back to Calculator
        </Link>
        <Link href="/terms" className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2">
          Terms
        </Link>
        <Link href="/contact" className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2">
          Contact
        </Link>
      </div>
    </PageShell>
  );
}
