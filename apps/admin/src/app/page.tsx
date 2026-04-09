import { Building2, Users, MapPin, CreditCard } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Cooworking Admin</h1>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            SaaS management overview
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Organizations"
            value="0"
            description="Active tenants"
            icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
          />
          <DashboardCard
            title="Locations"
            value="0"
            description="Total coworking spaces"
            icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          />
          <DashboardCard
            title="Users"
            value="0"
            description="Registered users"
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
          />
          <DashboardCard
            title="Subscriptions"
            value="0"
            description="Active SaaS plans"
            icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
      </main>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between pb-2">
        <p className="text-sm font-medium">{title}</p>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
