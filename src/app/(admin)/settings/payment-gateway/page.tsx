import { requireTenantId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PaymentGatewayForm } from "./gateway-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Payment Gateway Settings",
};

export default async function PaymentGatewayPage() {
  const tenantId = await requireTenantId();

  const gateways = await prisma.paymentGateway.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  const webhookUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}`;
  const razorpayWebhookUrl = `${webhookUrl}/api/webhooks/razorpay`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payment Gateway</h1>
        <p className="text-sm text-muted-foreground">
          Configure online payment gateways for your ISP
        </p>
      </div>

      {/* Webhook URL Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Razorpay Webhook URL:</p>
            <div className="flex items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 text-sm">
                {razorpayWebhookUrl}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(razorpayWebhookUrl);
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add this URL to your Razorpay Dashboard → Settings → Webhooks
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Existing Gateways */}
      {gateways.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Configured Gateways</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {gateways.map((gateway) => (
              <Card key={gateway.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {gateway.name}
                        <Badge
                          variant={
                            gateway.status === "ACTIVE" ? "default" : "secondary"
                          }
                        >
                          {gateway.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {gateway.provider} •{" "}
                        {gateway.isTestMode ? "Test Mode" : "Live Mode"}
                      </CardDescription>
                    </div>
                    {gateway.status === "ACTIVE" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">API Key</span>
                      <span className="font-mono text-xs">
                        {gateway.apiKey.slice(0, 8)}...{gateway.apiKey.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>
                        {new Date(gateway.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add New Gateway Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {gateways.length > 0 ? "Add New Gateway" : "Configure Payment Gateway"}
          </CardTitle>
          <CardDescription>
            Enter your payment gateway credentials. Currently supports Razorpay.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentGatewayForm />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <h4 className="text-sm font-semibold">For Razorpay:</h4>
          <ol className="text-sm">
            <li>
              Go to{" "}
              <a
                href="https://dashboard.razorpay.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Razorpay Dashboard
              </a>
            </li>
            <li>Navigate to Settings → API Keys</li>
            <li>Copy your Key ID and Key Secret</li>
            <li>Paste them in the form above</li>
            <li>For webhooks: Settings → Webhooks → Add New Webhook</li>
            <li>
              Use the webhook URL shown above and select events: payment.captured,
              payment.failed
            </li>
            <li>Copy the webhook secret and add it to the form</li>
          </ol>
          <div className="mt-4 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Test Mode vs Live Mode
            </p>
            <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
              Start with Test Mode to try payments with test cards. Switch to Live
              Mode only after testing is complete and you have production API keys.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
