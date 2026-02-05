"use client";

import Link from "next/link";
import { 
  Users, 
  Heart, 
  Package, 
  Truck, 
  Settings, 
  MoreHorizontal, 
  Mail,
  Calendar as CalendarIcon
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { SenegalMap } from "@/components/senegal-map";

export function QuickLaunchpad() {
  const items = [
    { label: "Donneurs", icon: Users, href: "/donneurs" },
    { label: "Nouveau Don", icon: Heart, href: "/dons/nouveau" },
    { label: "Stock", icon: Package, href: "/stock" },
    { label: "Commandes", icon: Truck, href: "/distribution" },
    { label: "Paramètres", icon: Settings, href: "/admin/roles" },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
           <span className="border border-gray-300 rounded px-1 text-xs">-</span> Quick Launchpad
        </h2>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      <div className="p-8 flex justify-around items-center h-[200px]">
        {items.map((item) => (
          <Link 
            key={item.label} 
            href={item.href}
            className="flex flex-col items-center gap-3 group"
          >
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <item.icon className="h-8 w-8" />
            </div>
            <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CalendarWidget() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
           <span className="border border-gray-300 rounded px-1 text-xs">-</span> Today's Calendar
        </h2>
        <div className="flex items-center gap-2">
            <button className="bg-[#00a8b3] text-white text-xs px-2 py-1 rounded">New Event</button>
            <button className="text-blue-500 text-xs">My Calendar</button>
            <MoreHorizontal className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex gap-4">
            <div className="flex flex-col items-center w-12 pt-2">
                <span className="text-xs font-semibold text-gray-500">Fri</span>
                <span className="text-2xl font-bold text-gray-800">31</span>
            </div>
            <div className="flex-1 relative h-[180px] border-l border-gray-200 pl-4">
                 {/* Timeline lines */}
                 {[5, 6, 7, 8].map(hour => (
                    <div key={hour} className="absolute w-full border-t border-dashed border-gray-100" style={{ top: `${(hour-5)*60}px` }}>
                        <span className="absolute -left-12 -top-2 text-xs text-gray-400">{hour}:00 AM</span>
                    </div>
                 ))}
                 
                 {/* Event */}
                 <div className="absolute top-2 left-4 right-0 bg-[#e74c3c] text-white p-2 rounded text-sm font-medium shadow-sm">
                    Standup meeting
                 </div>
                 
                 {/* Current time line */}
                 <div className="absolute top-[80px] w-full border-t border-red-400 z-10"></div>
            </div>
        </div>
      </div>
    </div>
  );
}

export function RecentOrders() {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
             <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="border border-gray-300 rounded px-1 text-xs">-</span> Dernières Commandes
                </h2>
                <div className="flex items-center gap-2">
                     <button className="text-blue-500 text-xs font-medium">View All</button>
                     <MoreHorizontal className="h-5 w-5 text-gray-400" />
                </div>
            </div>
            
            <div className="border-b border-gray-200">
                <div className="flex px-4">
                    <button className="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700">Validées</button>
                    <button className="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700">Servies</button>
                    <button className="px-4 py-3 text-sm font-medium text-gray-800 border-b-2 border-gray-800">En attente <span className="ml-1 bg-orange-400 text-white text-[10px] px-1.5 py-0.5 rounded-full">15</span></button>
                </div>
            </div>
            
            <div className="bg-gray-600 text-white text-xs font-medium py-2 px-4 grid grid-cols-12 gap-4">
                <div className="col-span-3">DATE</div>
                <div className="col-span-4">HOPITAL</div>
                <div className="col-span-5">STATUT</div>
            </div>
            
            <div className="divide-y divide-gray-100">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 grid grid-cols-12 gap-4 text-sm hover:bg-gray-50">
                        <div className="col-span-3 text-gray-500">
                            <div>Mar 27, 2025</div>
                            <div className="text-xs">7:25 AM</div>
                        </div>
                        <div className="col-span-4 font-medium text-gray-800">
                            Hôpital Principal
                            <div className="text-xs text-gray-500 font-normal">Dr. Ndiaye</div>
                        </div>
                        <div className="col-span-5 text-gray-600">
                            <span className="font-medium text-gray-900">Urgent - A+</span>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                Commande urgente pour bloc opératoire. Besoin de 3 CGR A+ et 2 PFC.
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StockDistribution() {
    const data = [
        { name: 'O+', value: 400, color: '#3b82f6' },
        { name: 'A+', value: 300, color: '#ef4444' },
        { name: 'B+', value: 300, color: '#22c55e' },
        { name: 'AB+', value: 200, color: '#eab308' },
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="border border-gray-300 rounded px-1 text-xs">-</span> Stock par Groupe
                </h2>
                <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-[250px] w-full p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
                <div className="text-center text-sm text-gray-500 mt-[-10px]">
                    Total: 1200 Poches
                </div>
            </div>
        </div>
    );
}

export function MapWidget() {
    // Données simulées pour la démo UI
    const MOCK_REGION_DATA = {
        "Dakar": 1450,
        "Thiès": 890,
        "Saint-Louis": 450,
        "Diourbel": 320,
        "Ziguinchor": 280,
        "Kaolack": 210,
        "Tambacounda": 180,
        "Louga": 150,
        "Kolda": 120,
        "Fatick": 110,
        "Matam": 90,
        "Kaffrine": 80,
        "Sédhiou": 60,
        "Kédougou": 40
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="border border-gray-300 rounded px-1 text-xs">-</span> Répartition des Donneurs
                </h2>
                <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </div>
            <div className="p-4 h-[400px] flex items-center justify-center">
                <SenegalMap data={MOCK_REGION_DATA} />
            </div>
        </div>
    );
}
