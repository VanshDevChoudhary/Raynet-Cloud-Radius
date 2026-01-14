import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/portal-session";
import { PortalNav } from "../portal-nav";

export default async function AuthenticatedPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");

  return (
    <div className="min-h-screen bg-background">
      <PortalNav subscriberName={session.name} />
      <main className="mx-auto max-w-lg px-4 py-6">{children}</main>
    </div>
  );
}
