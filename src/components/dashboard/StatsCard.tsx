"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variantStyles = {
    default: {
        bg: "bg-gradient-to-br from-slate-500 to-slate-600",
        iconBg: "bg-slate-400/20",
    },
    success: {
        bg: "bg-gradient-to-br from-emerald-500 to-green-600",
        iconBg: "bg-emerald-400/20",
    },
    warning: {
        bg: "bg-gradient-to-br from-amber-500 to-orange-600",
        iconBg: "bg-amber-400/20",
    },
    danger: {
        bg: "bg-gradient-to-br from-red-500 to-rose-600",
        iconBg: "bg-red-400/20",
    },
    info: {
        bg: "bg-gradient-to-br from-blue-500 to-purple-600",
        iconBg: "bg-blue-400/20",
    },
};

export function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    variant = "default",
}: StatsCardProps) {
    const styles = variantStyles[variant];

    return (
        <Card
            className={cn(
                "overflow-hidden text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                styles.bg
            )}
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-white/80">{title}</p>
                        <p className="mt-2 text-3xl font-bold">{value}</p>
                        {description && (
                            <p className="mt-1 text-sm text-white/70">{description}</p>
                        )}
                        {trend && (
                            <div
                                className={cn(
                                    "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                    trend.isPositive
                                        ? "bg-emerald-400/20 text-emerald-100"
                                        : "bg-red-400/20 text-red-100"
                                )}
                            >
                                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </div>
                        )}
                    </div>
                    <div className={cn("rounded-full p-3", styles.iconBg)}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
