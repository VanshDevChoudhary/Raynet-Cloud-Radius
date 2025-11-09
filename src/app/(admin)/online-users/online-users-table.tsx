"use client";

import { useState } from "react";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { columns } from "./columns";
import { disconnectUserAction, cleanupStaleSessionsAction } from "./actions";
import { toast } from "sonner";
import type { RadAcct } from "@/generated/prisma";
import { Power, RefreshCw, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function OnlineUsersTable({ data }: { data: RadAcct[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [disconnectUser, setDisconnectUser] = useState<{
    username: string;
    nasIp: string;
  } | null>(null);

  async function handleDisconnect(username: string, nasIp: string) {
    setLoading(username);
    setDisconnectUser(null);

    try {
      const result = await disconnectUserAction(username, nasIp);

      if (result.success) {
        toast.success("User disconnected successfully");
        // Refresh page to update list
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to disconnect user");
      }
    } catch (error) {
      toast.error("Failed to disconnect user");
    } finally {
      setLoading(null);
    }
  }

  const enhancedColumns = [
    ...columns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: RadAcct } }) => (
        <Button
          size="sm"
          variant="destructive"
          disabled={loading === row.original.username}
          onClick={() =>
            setDisconnectUser({
              username: row.original.username,
              nasIp: row.original.nasipaddress,
            })
          }
        >
          <Power className="h-4 w-4 mr-1" />
          {loading === row.original.username ? "Disconnecting..." : "Disconnect"}
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {data.length} active session{data.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={cleaning}
              onClick={async () => {
                setCleaning(true);
                try {
                  const result = await cleanupStaleSessionsAction();
                  if (result.success) {
                    toast.success(`Cleaned ${result.cleaned || 0} stale sessions`);
                    window.location.reload();
                  } else {
                    toast.error(result.error || "Failed to cleanup");
                  }
                } catch {
                  toast.error("Failed to cleanup stale sessions");
                } finally {
                  setCleaning(false);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {cleaning ? "Cleaning..." : "Clean Stale"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <DataTable columns={enhancedColumns} data={data} />
      </div>

      <AlertDialog open={!!disconnectUser} onOpenChange={() => setDisconnectUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately terminate the session for{" "}
              <strong>{disconnectUser?.username.split("_").slice(1).join("_")}</strong>.
              The user will need to reconnect to access the network.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                disconnectUser &&
                handleDisconnect(disconnectUser.username, disconnectUser.nasIp)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
