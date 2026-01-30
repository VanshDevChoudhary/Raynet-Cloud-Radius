import { requireTenantId } from "@/lib/session";
import { smsService } from "@/services/sms/sms.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, MessageSquare } from "lucide-react";
import { SmsGatewayForm } from "./gateway-form";
import { SmsGatewayActions } from "./gateway-actions";

export const metadata = {
  title: "SMS Gateway Settings",
  description: "Configure SMS gateways for sending notifications",
};

export default async function SmsGatewaySettingsPage() {
  const tenantId = await requireTenantId();
  const gateways = await smsService.getAll(tenantId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Gateway Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure SMS gateways for sending notifications to subscribers
          </p>
        </div>
        <SmsGatewayForm>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Gateway
          </Button>
        </SmsGatewayForm>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Setup Instructions
          </CardTitle>
          <CardDescription>
            How to configure SMS gateways for your ISP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Supported Providers</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                <strong>MSG91</strong> - Popular Indian SMS gateway. Get API key from{" "}
                <a
                  href="https://msg91.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  msg91.com
                </a>
              </li>
              <li>
                <strong>Textlocal</strong> - Reliable Indian SMS service. Get API key from{" "}
                <a
                  href="https://www.textlocal.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  textlocal.in
                </a>
              </li>
              <li>
                <strong>Twilio</strong> - International SMS gateway. Get credentials from{" "}
                <a
                  href="https://www.twilio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  twilio.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Sender ID Requirements</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Must be 6 characters (letters and numbers only)</li>
              <li>Must be registered with your SMS provider</li>
              <li>Example: MYISP, NETSP, BBHOME</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Automatic Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Once configured, SMS notifications will be sent automatically for:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-1">
              <li>Plan expiry reminders (3 days, 1 day, on expiry)</li>
              <li>Payment confirmations</li>
              <li>Plan activations</li>
              <li>OTP for hotspot login</li>
              <li>FUP limit reached alerts</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Gateway Cards */}
      {gateways.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No SMS Gateway Configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add an SMS gateway to start sending automated notifications to your subscribers.
            </p>
            <SmsGatewayForm>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Gateway
              </Button>
            </SmsGatewayForm>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {gateways.map((gateway) => (
            <Card key={gateway.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>{gateway.name}</CardTitle>
                    <Badge variant={gateway.status === "ACTIVE" ? "default" : "secondary"}>
                      {gateway.status}
                    </Badge>
                    <Badge variant="outline">{gateway.provider}</Badge>
                  </div>
                  <SmsGatewayActions gateway={gateway} />
                </div>
                <CardDescription>
                  Sender ID: {gateway.senderId} • Created{" "}
                  {new Date(gateway.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">API Key:</span>
                    <p className="font-mono">
                      {gateway.apiKey.substring(0, 20)}...
                    </p>
                  </div>
                  {gateway.apiUrl && (
                    <div>
                      <span className="text-muted-foreground">API URL:</span>
                      <p className="truncate">{gateway.apiUrl}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
