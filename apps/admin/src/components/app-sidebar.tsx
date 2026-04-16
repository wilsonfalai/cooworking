"use client"

import * as React from "react"

import { useAuth } from "@/contexts/auth-context"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  ShieldCheckIcon,
  LayoutDashboardIcon,
  BuildingIcon,
  MapPinIcon,
  UsersIcon,
  Settings2Icon,
} from "lucide-react"

const teams = [
  {
    name: "Cooworking Admin",
    logo: <ShieldCheckIcon />,
    plan: "Platform",
  },
]

const baseNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
    isActive: true,
    items: [],
  },
  {
    title: "Locais",
    url: "/locations",
    icon: <MapPinIcon />,
    items: [{ title: "Listar", url: "/locations" }],
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: <Settings2Icon />,
    items: [],
  },
]

const platformAdminNavItems = [
  {
    title: "Organizações",
    url: "/organizations",
    icon: <BuildingIcon />,
    items: [{ title: "Listar", url: "/organizations" }],
  },
  {
    title: "Usuários",
    url: "/users",
    icon: <UsersIcon />,
    items: [{ title: "Listar", url: "/users" }],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, organization } = useAuth()

  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN"

  const collaboratorOrgItem = organization
    ? [
        {
          title: "Meu Cooworking",
          url: `/organizations/${organization.id}`,
          icon: <BuildingIcon />,
          items: [],
        },
      ]
    : []

  const navItems = isPlatformAdmin
    ? [baseNavItems[0], ...platformAdminNavItems, ...baseNavItems.slice(1)]
    : [baseNavItems[0], ...collaboratorOrgItem, ...baseNavItems.slice(1)]

  const sidebarUser = {
    name: user?.name ?? "",
    email: user?.email ?? "",
    avatar: user?.image ?? "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
