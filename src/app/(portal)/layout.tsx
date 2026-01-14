import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | My ISP Portal",
    default: "Subscriber Portal",
  },
  description: "Manage your internet subscription",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
