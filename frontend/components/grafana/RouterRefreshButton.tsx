"use client";

import { useRouter } from "next/navigation";
import { PanelRefreshButton } from "@/components/grafana/PanelRefreshButton";

/** Re-fetch server components (`page.tsx`) without blocking the refresh control */
export function RouterRefreshButton() {
  const router = useRouter();

  return (
    <PanelRefreshButton
      onClick={() => router.refresh()}
      ariaLabel="Reload this section from the server"
    />
  );
}
