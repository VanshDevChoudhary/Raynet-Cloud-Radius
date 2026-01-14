import { PortalLoginForm } from "./login-form";

export const metadata = { title: "Login" };

export default function PortalLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Subscriber Portal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Login to manage your subscription
          </p>
        </div>
        <PortalLoginForm />
      </div>
    </div>
  );
}
