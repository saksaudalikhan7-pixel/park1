"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AutoRefreshProps {
    intervalMs?: number;
}

/**
 * AutoRefresh Component
 * 
 * Automatically refreshes the current route (Server Components) at a given interval.
 * This keeps the dashboard data fresh without full page reloads.
 */
export function AutoRefresh({ intervalMs = 30000 }: AutoRefreshProps) {
    const router = useRouter();

    useEffect(() => {
        const intervalId = setInterval(() => {
            router.refresh();
        }, intervalMs);

        return () => clearInterval(intervalId);
    }, [router, intervalMs]);

    return null; // Render nothing
}
