"use client";

import { Badge } from "@/components/ui/badge";

interface PortalSubscriber {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  username: string;
  status: string;
  address: string | null;
}

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  EXPIRED: "bg-red-100 text-red-800",
  DISABLED: "bg-gray-100 text-gray-800",
  SUSPENDED: "bg-amber-100 text-amber-800",
  TRIAL: "bg-blue-100 text-blue-800",
};

export function PortalProfileClient({
  profile,
}: {
  profile: PortalSubscriber;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Profile</h2>

      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <ProfileField label="Username" value={profile.username} />
        <ProfileField label="Full Name" value={profile.name} />
        <ProfileField label="Phone" value={profile.phone} />
        <ProfileField label="Email" value={profile.email ?? "-"} />
        <ProfileField label="Address" value={profile.address ?? "-"} />
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm font-medium text-muted-foreground">Status</span>
          <Badge className={statusColor[profile.status] ?? ""} variant="outline">
            {profile.status}
          </Badge>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Contact your ISP to update your profile details.
      </p>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
