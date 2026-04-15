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

const data = {
  teams: [
    {
      name: "Cooworking Admin",
      logo: <ShieldCheckIcon />,
      plan: "Platform",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
      isActive: true,
      items: [],
    },
    {
      title: "Organizações",
      url: "/organizations",
      icon: <BuildingIcon />,
      items: [
        { title: "Listar", url: "/organizations" },
      ],
    },
    {
      title: "Locais",
      url: "/locations",
      icon: <MapPinIcon />,
      items: [
        { title: "Listar", url: "/locations" },
      ],
    },
    {
      title: "Usuários",
      url: "/users",
      icon: <UsersIcon />,
      items: [
        { title: "Listar", url: "/users" },
      ],
    },
    {
      title: "Configurações",
      url: "/settings",
      icon: <Settings2Icon />,
      items: [],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const sidebarUser = {
    name: user?.name ?? "",
    email: user?.email ?? "",
    avatar: user?.image ?? "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
