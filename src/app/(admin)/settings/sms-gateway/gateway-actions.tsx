"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Edit, Trash2, TestTube, Power, Wallet } from "lucide-react";
import { toast } from "sonner";
import { deleteSmsGateway, toggleSmsGatewayStatus, testSmsGateway, getGatewayBalance } from "./actions";
import { SmsGatewayForm } from "./gateway-form";
import type { SmsGateway } from "@/generated/prisma";

interface SmsGatewayActionsProps {
  gateway: SmsGateway;
}

export function SmsGatewayActions({ gateway }: SmsGatewayActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("This is a test message from CloudRadius.");

  const handleToggleStatus = async () => {
    setLoading(true);
    const newStatus = gateway.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      const result = await toggleSmsGatewayStatus(gateway.id, newStatus);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to toggle gateway status");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      const result = await deleteSmsGateway(gateway.id);

      if (result.success) {
        toast.success(result.message);
        setShowDeleteDialog(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to delete gateway");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone || !testMessage) {
      toast.error("Please enter phone number and message");
      return;
    }

    setLoading(true);

    try {
      const result = await testSmsGateway(gateway.id, testPhone, testMessage);

      if (result.success) {
        toast.success(result.message);
        setShowTestDialog(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to send test SMS");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBalance = async () => {
    setLoading(true);

    try {
      const result = await getGatewayBalance();

      if (result.success && result.balance !== undefined) {
        toast.success(`Current balance: ${result.balance}`);
      } else {
        toast.error(result.message || "Balance not available");
      }
    } catch (error) {
      toast.error("Failed to fetch balance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <DropdownMenuSeparator />

          <SmsGatewayForm gateway={gateway}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          </SmsGatewayForm>

          <DropdownMenuItem onClick={handleToggleStatus} disabled={loading}>
            <Power className="h-4 w-4 mr-2" />
            {gateway.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowTestDialog(true)}>
            <TestTube className="h-4 w-4 mr-2" />
            Test Gateway
          </DropdownMenuItem>

          {gateway.status === "ACTIVE" && (
            <DropdownMenuItem onClick={handleCheckBalance} disabled={loading}>
              <Wallet className="h-4 w-4 mr-2" />
              Check Balance
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SMS Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {gateway.name}? This action cannot be undone.
              Automated notifications will not be sent until you configure another gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test SMS Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test SMS Gateway</DialogTitle>
            <DialogDescription>
              Send a test SMS to verify your gateway configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testPhone">Phone Number</Label>
              <Input
                id="testPhone"
                type="tel"
                placeholder="+919876543210"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +91 for India)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testMessage">Message</Label>
              <Textarea
                id="testMessage"
                placeholder="Enter test message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                {testMessage.length}/160 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTestDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleTest} disabled={loading}>
              {loading ? "Sending..." : "Send Test SMS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
