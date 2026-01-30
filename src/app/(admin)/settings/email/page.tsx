import { requireTenantId } from "@/lib/session";
import { emailService } from "@/services/email.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Server, AlertCircle } from "lucide-react";
import { EmailConfigForm } from "./email-form";

export const metadata = {
  title: "Email Settings",
  description: "Configure SMTP settings for sending email notifications",
};

export default async function EmailSettingsPage() {
  const tenantId = await requireTenantId();
  const emailConfig = await emailService.getConfig(tenantId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Email Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure SMTP settings for sending email notifications to subscribers
        </p>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            SMTP Configuration Guide
          </CardTitle>
          <CardDescription>How to set up email notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Common SMTP Providers</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Gmail</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Host: smtp.gmail.com</li>
                  <li>Port: 587 (TLS) or 465 (SSL)</li>
                  <li>
                    Enable 2FA and use{" "}
                    <a
                      href="https://support.google.com/accounts/answer/185833"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      App Password
                    </a>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Outlook/Office 365</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Host: smtp-mail.outlook.com</li>
                  <li>Port: 587 (TLS)</li>
                  <li>Use your email and password</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">SendGrid</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Host: smtp.sendgrid.net</li>
                  <li>Port: 587</li>
                  <li>User: apikey</li>
                  <li>Password: Your API key</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Mailgun</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Host: smtp.mailgun.org</li>
                  <li>Port: 587</li>
                  <li>Get credentials from dashboard</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Security Note</p>
              <p className="text-amber-800 dark:text-amber-200">
                Your SMTP credentials are stored securely in the database. Use app-specific passwords
                when available. Never share your SMTP credentials publicly.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Automatic Email Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Once configured, email notifications will be sent automatically for:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-1">
              <li>Plan expiry reminders (3 days, 1 day, on expiry)</li>
              <li>Payment confirmations with invoice details</li>
              <li>Plan activation welcome emails</li>
              <li>Payment due reminders</li>
              <li>FUP limit reached alerts</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                SMTP Configuration
              </CardTitle>
              {emailConfig && (
                <Badge variant={emailConfig.isActive ? "default" : "secondary"}>
                  {emailConfig.isActive ? "Active" : "Inactive"}
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            {emailConfig
              ? "Your email configuration is set up. You can update it below."
              : "Configure your SMTP settings to start sending email notifications."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailConfigForm config={emailConfig} />
        </CardContent>
      </Card>
    </div>
  );
}
