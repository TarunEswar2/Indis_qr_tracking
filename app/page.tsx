import { redirect } from "next/navigation";

// No standalone landing page anymore — the volunteer scanner is the
// front door, and the TopNav (see components/TopNav.tsx) inside /scan,
// /onboarding and /admin lets you switch between the three roles.
export default function Home() {
  redirect("/scan");
}
