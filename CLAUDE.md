@AGENTS.md
You are working on a Next.js TypeScript Tailwind web app called “Will I Gap It?”

Project goal:
Build a stats-based closed-course car matchup calculator. Users enter two car builds, choose a race type, and receive an estimated winner, gap, confidence level, and needed advantage.

Coding rules:
- Use modern Next.js App Router patterns.
- Use TypeScript everywhere.
- Use Tailwind CSS for styling.
- Keep components small, readable, and easy to modify.
- Prefer simple, explicit logic over clever abstractions.
- Do not add unnecessary packages.
- Do not add authentication, databases, APIs, Firebase, Supabase, or external services unless explicitly asked.
- Do not rewrite the entire project unless necessary.
- Preserve existing file structure unless a clear improvement is needed.
- Make sure `npm run build` passes after changes.
- Fix TypeScript and lint errors before reporting done.

Product rules:
- Frame the app as a closed-course / track comparison tool.
- Do not create features for street racing coordination, betting, location matching, or finding races.
- Prediction language must avoid fake certainty. Use terms like “estimated,” “likely,” and “based on provided stats.”
- Always include a disclaimer that results are estimates for closed-course and track comparison only.

MVP priorities:
1. Manual car input calculator.
2. Clean responsive UI.
3. Comparison algorithm.
4. Result card.
5. Save matchup feature later.
6. “Did You Gap It?” actual result submission later.
7. Leaderboard later.
8. Car make/model/trim autofill later.

Code style:
- Shared types go in `lib/types.ts`.
- Comparison logic goes in `lib/compare.ts`.
- Reusable UI components go in `components/`.
- Keep form state simple.
- Use controlled React inputs.
- Validate required fields before comparison.
- Optional performance fields may be blank.

UI style:
- Dark automotive look.
- Card-based layout.
- Red or orange accent color.
- Mobile responsive.
- Avoid default-template appearance.
- Prioritize clarity over visual gimmicks.

Do not add:
- user accounts
- leaderboard
- database
- file uploads
- AI features
- maps
- payments
- external APIs
- car image generation
unless explicitly requested.