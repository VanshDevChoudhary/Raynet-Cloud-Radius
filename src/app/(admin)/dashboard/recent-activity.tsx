"use client";

import { formatDistanceToNow } from "date-fns";
import { Users, CreditCard, FileText, MessageSquare } from "lucide-react";

interface RecentActivity {
  id: string;
  type: "subscriber" | "payment" | "invoice" | "ticket";
  description: string;
  timestamp: Date;
}

const iconMap = {
  subscriber: Users,
  payment: CreditCard,
  invoice: FileText,
  ticket: MessageSquare,
};

const colorMap = {
  subscriber: "text-blue-600 bg-blue-50",
  payment: "text-green-600 bg-green-50",
  invoice: "text-amber-600 bg-amber-50",
  ticket: "text-purple-600 bg-purple-50",
};

export function RecentActivityFeed({
  activities,
}: {
  activities: RecentActivity[];
}) {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground">
          Recent Activity
        </h3>
        <div className="mt-4 flex h-32 items-center justify-center text-sm text-muted-foreground">
          No recent activity
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground">
        Recent Activity
      </h3>
      <div className="mt-4 space-y-3">
        {activities.map((activity) => {
          const Icon = iconMap[activity.type];
          const colors = colorMap[activity.type];

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`rounded-md p-1.5 ${colors}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
