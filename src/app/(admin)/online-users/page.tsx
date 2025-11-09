import { requireTenantUser } from "@/lib/session";
import { radiusService } from "@/services/radius.service";
import { OnlineUsersTable } from "./online-users-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Online Users",
};

export default async function OnlineUsersPage() {
  const user = await requireTenantUser();

  if (!user.tenantSlug) {
    return <div>No tenant context</div>;
  }

  const onlineUsers = await radiusService.getOnlineUsers(user.tenantSlug);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Online Users</h1>
          <p className="text-muted-foreground">
            Monitor currently connected subscribers in real-time
          </p>
        </div>
        <Card className="w-48">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Currently Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineUsers.length}</div>
            <p className="text-xs text-muted-foreground">Active sessions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Real-time list of subscribers currently connected to the network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnlineUsersTable data={onlineUsers} />
        </CardContent>
      </Card>
    </div>
  );
}
