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
  Settings2Icon,
} from "lucide-react"

const teams = [
  {
    name: "Cooworking Admin",
    logo: <ShieldCheckIcon />,
    plan: "Platform",
  },
]

const navItems = [
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, organization } = useAuth()

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

  const allNavItems = [navItems[0], ...collaboratorOrgItem, ...navItems.slice(1)]

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
        <NavMain items={allNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
