"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Inbox, Settings } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Leads Manager", href: "/leads", icon: Users },
    { name: "Inbox & Replies", href: "/inbox", icon: Inbox },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-slate-900 text-slate-300 min-h-screen p-4 flex flex-col shadow-xl">
            <div className="mb-8 mt-4 px-4 text-white font-bold tracking-tight text-xl leading-snug">
                Waypoint<br /> <span className="font-light text-slate-400">Franchise Advisors</span>
            </div>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto px-4 py-4 border-t border-slate-800 text-xs text-slate-500">
                AntiGravity System v1.0
            </div>
        </div>
    );
}
