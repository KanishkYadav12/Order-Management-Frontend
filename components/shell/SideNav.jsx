"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CookingPot,
  Receipt,
  Settings,
  UserRoundCog,
  Building2,
  LayoutGrid,
  Sparkles,
  UtensilsCrossed,
  Tags,
  Carrot,
  BadgePercent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/auth/useAuth";

/**
 * Navigation.
 *
 * Ordered by how often an owner actually opens each screen, not by category
 * neatness — the dashboard is the first thing they want on arriving, so it is
 * the first thing in the list.
 *
 * `footer` items pin to the bottom. Settings and Profile are opened a few
 * times a year; sitting them in the main flow gave them the same weight as
 * the kitchen board.
 */
const buildNav = ({ hotelId, isSuperAdmin }) => {
  if (isSuperAdmin) {
    return {
      groups: [
        {
          heading: null,
          items: [
            { title: "Overview", icon: LayoutDashboard, href: "/admin-dashboard" },
            { title: "Restaurants", icon: Building2, href: "/admin-dashboard/owners" },
          ],
        },
      ],
      footer: [{ title: "Profile", icon: UserRoundCog, href: "/dashboard/profile" }],
    };
  }

  return {
    groups: [
      {
        heading: null,
        items: [
          { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
          {
            title: "Live orders",
            icon: CookingPot,
            href: hotelId ? `/order-page/${hotelId}` : "/order-page",
          },
          { title: "Floor", icon: LayoutGrid, href: "/dashboard/configuration/tables" },
          { title: "Bills", icon: Receipt, href: "/dashboard/bills" },
          { title: "Insights", icon: Sparkles, href: "/dashboard/assistant" },
        ],
      },
      {
        heading: "Menu",
        items: [
          { title: "Dishes", icon: UtensilsCrossed, href: "/dashboard/configuration/dishes" },
          { title: "Categories", icon: Tags, href: "/dashboard/configuration/categories" },
          { title: "Ingredients", icon: Carrot, href: "/dashboard/configuration/ingredients" },
          { title: "Offers", icon: BadgePercent, href: "/dashboard/configuration/offers" },
        ],
      },
    ],
    footer: [
      { title: "My restaurant", icon: Building2, href: "/dashboard/hotel" },
      { title: "Settings", icon: Settings, href: "/dashboard/configuration" },
      { title: "Profile", icon: UserRoundCog, href: "/dashboard/profile" },
    ],
  };
};

function NavLink({ item, active, onNavigate }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-sm transition-colors",
        // A tighter focus ring than the global one: at nav width the default
        // 2px ring plus 2px offset reads as a heavy box around the item.
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0",
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {active && (
        <span
          className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-primary"
          aria-hidden="true"
        />
      )}
      <item.icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
        aria-hidden="true"
      />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

export default function SideNav({ onNavigate }) {
  const pathname = usePathname();
  const { hotelId, isSuperAdmin, role } = useAuth();

  const { groups, footer } = buildNav({ hotelId, isSuperAdmin });

  /**
   * Exactly one link is ever active: the one whose href is the longest prefix
   * of the current path. A plain "starts with" test lit up every ancestor, so
   * on the Dishes page both Dishes and Settings appeared selected.
   */
  const activeHref = [...groups.flatMap((g) => g.items), ...footer]
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 py-3 custom-scrollbar">
        {groups.map((group, index) => (
          <div key={group.heading ?? `group-${index}`}>
            {group.heading && (
              <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                {group.heading}
              </p>
            )}
            <ul className="space-y-px">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    active={item.href === activeHref}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}

        {!role && <p className="px-2.5 text-sm text-muted-foreground">Loading…</p>}
      </nav>

      <div className="border-t px-2.5 py-2">
        <ul className="space-y-px">
          {footer.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                active={item.href === activeHref}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
