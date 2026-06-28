import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

/**
 * Protect every route except:
 *   /              — landing page
 *   /login         — auth
 *   /register      — auth
 *   /pricing       — public marketing
 *   /api/auth/*    — NextAuth callbacks
 *   /api/register  — account creation (pre-auth)
 *   /api/stripe/webhook — Stripe (signature-verified, no session)
 *   /_next/*       — Next.js static assets
 *   /favicon.ico   — browser icon
 */
export const config = {
  matcher: [
    "/((?!$|_next|favicon\\.ico|login|register|pricing|api/auth|api/stripe/webhook|api/register).*)",
  ],
};
