import { captivePortalService } from "@/services/captive-portal.service";
import { notFound } from "next/navigation";
import { HotspotLoginForm } from "./login-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const data = await captivePortalService.getConfigBySlug(tenantSlug);
  return {
    title: data?.config?.welcomeTitle || `${data?.tenant.name || "WiFi"} Login`,
  };
}

export default async function HotspotLoginPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const data = await captivePortalService.getConfigBySlug(tenantSlug);

  if (!data) notFound();

  const config = data.config;

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        backgroundColor: config?.primaryColor || "#2563eb",
        backgroundImage: config?.backgroundUrl
          ? `url(${config.backgroundUrl})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
          {/* Logo */}
          <div className="mb-6 text-center">
            {config?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.logoUrl}
                alt={data.tenant.name}
                className="mx-auto mb-3 h-16 w-auto"
              />
            ) : (
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                {data.tenant.name.charAt(0)}
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {config?.welcomeTitle || "Welcome to WiFi"}
            </h1>
            {config?.welcomeMessage && (
              <p className="mt-2 text-sm text-gray-600">
                {config.welcomeMessage}
              </p>
            )}
          </div>

          <HotspotLoginForm
            tenantSlug={tenantSlug}
            enableUserPass={config?.enableUserPassLogin ?? true}
            enableOtp={config?.enableOtpLogin ?? true}
            enableVoucher={config?.enableVoucherLogin ?? true}
            termsOfService={config?.termsOfService || null}
            redirectUrl={config?.redirectUrl || null}
            primaryColor={config?.primaryColor || "#2563eb"}
          />

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-400">
            Powered by CloudRadius
          </div>
        </div>
      </div>
    </div>
  );
}
