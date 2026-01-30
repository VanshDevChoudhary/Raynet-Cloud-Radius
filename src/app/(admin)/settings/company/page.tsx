import { requireTenantUser } from "@/lib/session";
import { authorize } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { CompanyForm } from "./company-form";

export const metadata = { title: "Company Profile" };

export default async function CompanyPage() {
  const user = await requireTenantUser();
  authorize(user.role, "settings", "view");

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId! },
    select: { id: true, name: true, slug: true, domain: true, logo: true, settings: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Company Profile</h1>
        <p className="text-sm text-muted-foreground">Update your ISP business information</p>
      </div>
      <CompanyForm tenant={JSON.parse(JSON.stringify(tenant))} />
    </div>
  );
}
