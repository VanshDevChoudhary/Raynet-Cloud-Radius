import { Radio } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-10 lg:flex">
        <div className="flex items-center gap-2">
          <Radio className="h-8 w-8 text-primary-foreground" />
          <span className="text-2xl font-bold text-primary-foreground">{APP_NAME}</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight text-primary-foreground">
            ISP Billing &<br />
            Bandwidth Management
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Cloud-hosted RADIUS server. Zero infrastructure.
            <br />
            Manage subscribers, plans, billing, and more.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>

      {/* Right side - auth form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Radio className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">{APP_NAME}</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
