// The online demo (Vercel) — never the shop's real POS, which runs on the counter PC.
//
// On Vercel the app always runs as a demo: a pre-built demo database is bundled with each deployment
// and copied to the server's temporary storage on first use (see src/server/db/client.ts). It resets
// to this starting point whenever Vercel starts a fresh server.
//
// Demo PINs are deliberately public: the demo sign-in screen shows them so a visitor can just tap and
// go. They exist only in the demo database. Never use them for a real shop install.

/** Server-side only (VERCEL is not exposed to the browser). */
export const IS_DEMO = process.env.DEMO_MODE === '1' || process.env.VERCEL === '1';

export const DEMO_PINS = {
  owner: '2468',
  staff: '1357',
} as const;
