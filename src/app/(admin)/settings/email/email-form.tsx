"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { saveEmailConfig, deleteEmailConfig, testEmailConnection, sendTestEmail } from "./actions";
import { TestTube, Mail, Trash2 } from "lucide-react";
import type { EmailConfig } from "@/generated/prisma";

interface EmailConfigFormProps {
  config: EmailConfig | null;
}

export function EmailConfigForm({ config }: EmailConfigFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testSubject, setTestSubject] = useState("Test Email from CloudRadius");
  const [testBody, setTestBody] = useState("This is a test email to verify your SMTP configuration.");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await saveEmailConfig(formData);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTestingConnection(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await testEmailConnection(formData);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to test connection");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      const result = await deleteEmailConfig();

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to delete configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !testSubject || !testBody) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const result = await sendTestEmail(testEmail, testSubject, testBody);

      if (result.success) {
        toast.success(result.message);
        setShowTestDialog(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to send test email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        {/* SMTP Host */}
        <div className="space-y-2">
          <Label htmlFor="smtpHost">
            SMTP Host <span className="text-destructive">*</span>
          </Label>
          <Input
            id="smtpHost"
            name="smtpHost"
            placeholder="smtp.example.com"
            defaultValue={config?.smtpHost}
            required
          />
        </div>

        {/* SMTP Port */}
        <div className="space-y-2">
          <Label htmlFor="smtpPort">
            SMTP Port <span className="text-destructive">*</span>
          </Label>
          <Input
            id="smtpPort"
            name="smtpPort"
            type="number"
            placeholder="587"
            defaultValue={config?.smtpPort}
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* SMTP User */}
        <div className="space-y-2">
          <Label htmlFor="smtpUser">
            SMTP Username <span className="text-destructive">*</span>
          </Label>
          <Input
            id="smtpUser"
            name="smtpUser"
            type="email"
            placeholder="your-email@example.com"
            defaultValue={config?.smtpUser}
            required
          />
        </div>

        {/* SMTP Password */}
        <div className="space-y-2">
          <Label htmlFor="smtpPassword">
            SMTP Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="smtpPassword"
            name="smtpPassword"
            type="password"
            placeholder="Enter your password"
            defaultValue={config?.smtpPassword}
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* From Email */}
        <div className="space-y-2">
          <Label htmlFor="fromEmail">
            From Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fromEmail"
            name="fromEmail"
            type="email"
            placeholder="noreply@yourcompany.com"
            defaultValue={config?.fromEmail}
            required
          />
        </div>

        {/* From Name */}
        <div className="space-y-2">
          <Label htmlFor="fromName">
            From Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fromName"
            name="fromName"
            placeholder="Your Company Name"
            defaultValue={config?.fromName}
            required
          />
        </div>
      </div>

      {/* Switches */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="useTls">Use TLS/SSL</Label>
          <p className="text-sm text-muted-foreground">
            Enable TLS encryption for secure email transmission
          </p>
        </div>
        <Switch
          id="useTls"
          name="useTls"
          defaultChecked={config?.useTls ?? true}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="isActive">Active</Label>
          <p className="text-sm text-muted-foreground">
            Enable or disable email notifications
          </p>
        </div>
        <Switch
          id="isActive"
          name="isActive"
          defaultChecked={config?.isActive ?? true}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : config ? "Update Configuration" : "Save Configuration"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            const form = e.currentTarget.closest("form");
            if (form) handleTestConnection(new Event("submit") as any);
          }}
          disabled={testingConnection}
        >
          <TestTube className="h-4 w-4 mr-2" />
          {testingConnection ? "Testing..." : "Test Connection"}
        </Button>

        {config && (
          <>
            <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Test Email</DialogTitle>
                  <DialogDescription>
                    Send a test email to verify your configuration is working correctly.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="testEmail">Recipient Email</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      placeholder="test@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="testSubject">Subject</Label>
                    <Input
                      id="testSubject"
                      placeholder="Test Email"
                      value={testSubject}
                      onChange={(e) => setTestSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="testBody">Message</Label>
                    <Textarea
                      id="testBody"
                      placeholder="Enter test message"
                      value={testBody}
                      onChange={(e) => setTestBody(e.target.value)}
                      rows={4}
                    />
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
                  <Button onClick={handleSendTestEmail} disabled={loading}>
                    {loading ? "Sending..." : "Send Test Email"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Configuration
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Email Configuration</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete your email configuration? Email
                    notifications will stop until you configure SMTP settings again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </form>
  );
}
