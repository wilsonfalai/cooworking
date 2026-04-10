import { Building2, Users, MapPin, CreditCard } from "lucide-react";

export default function DashboardPage() {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da plataforma SaaS
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Organizações"
          value="0"
          description="Tenants ativos"
          icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
        />
        <DashboardCard
          title="Locais"
          value="0"
          description="Espaços de coworking"
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
        />
        <DashboardCard
          title="Usuários"
          value="0"
          description="Usuários cadastrados"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <DashboardCard
          title="Assinaturas"
          value="0"
          description="Planos SaaS ativos"
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
    </>
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
