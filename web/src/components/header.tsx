"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Settings, Plus } from "lucide-react";

export function Header({ user }: { user: any }) {
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean) || [];
  // Handle root dashboard case
  const title = segments.length > 0 ? segments[segments.length - 1] : "Dashboard";
  
  // Format title (remove hyphens, capitalize)
  const formattedTitle = title
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("bo.autoRefreshEnabled") !== "false";
  });
  const settingsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!settingsRef.current) return;
      if (event.target instanceof Node && settingsRef.current.contains(event.target)) return;
      setSettingsOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const updateAutoRefresh = (enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("bo.autoRefreshEnabled", enabled ? "true" : "false");
      window.dispatchEvent(new CustomEvent("bo:autoRefreshChanged", { detail: { enabled } }));
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-700">
          <span className="text-gray-600">Dashboards</span> <span className="mx-2">/</span> <span className="text-gray-900">{formattedTitle}</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-gray-700">Dashboards:</span>
                <div className="relative">
                    <select className="appearance-none bg-white border border-gray-300 text-gray-700 py-1 pl-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm">
                        <option>{formattedTitle}</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>
            
            <button className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium shadow-sm transition-colors">
                <Plus className="h-4 w-4 text-gray-600" />
                Add widget
            </button>

            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen((open) => !open)}
                title={user?.displayName ? `Paramètres - ${user.displayName}` : "Paramètres"}
                className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium shadow-sm transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-600" />
                Paramètres
              </button>
              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 shadow-lg">
                  <div className="flex items-center justify-between gap-3">
                    <span>Rafraîchissement auto</span>
                    <input
                      type="checkbox"
                      checked={autoRefreshEnabled}
                      onChange={(e) => updateAutoRefresh(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Active ou désactive la mise à jour en arrière-plan.
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
      
      <h1 className="text-3xl font-normal text-gray-900">{formattedTitle}</h1>
    </header>
  );
}
