import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPageClient from "@/components/landing/LandingPageClient";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/inventory");

  return <LandingPageClient />;
}
