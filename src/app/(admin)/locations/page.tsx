import { requireTenantId } from "@/lib/session";
import { locationService } from "@/services/location.service";
import { LocationTree } from "./location-tree";

export const metadata = {
  title: "Locations",
};

export default async function LocationsPage() {
  const tenantId = await requireTenantId();
  const [tree, allLocations] = await Promise.all([
    locationService.getTree(tenantId),
    locationService.listAll(tenantId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Locations</h1>
        <p className="text-sm text-muted-foreground">
          Manage location hierarchy: Region &rarr; City &rarr; Area
        </p>
      </div>

      <LocationTree tree={JSON.parse(JSON.stringify(tree))} allLocations={allLocations} />
    </div>
  );
}
