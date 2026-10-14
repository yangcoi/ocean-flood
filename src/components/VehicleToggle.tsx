'use client';

import React from 'react';
import { LocateFixed, Layers } from 'lucide-react';
import type { VehicleType } from '@/lib/routing-engine';

export interface VehicleToggleProps {
  vehicleType: VehicleType;
  onChangeVehicle: (type: VehicleType) => void;
  onLocateUser: () => void;
  hasActiveGps?: boolean;
  showLegend: boolean;
  onToggleLegend: () => void;
}

/**
 * Cụm nút điều khiển nổi bên phải bản đồ:
 * - Nút "📍 Định vị GPS" rõ ràng, hiển thị trạng thái đang bật GPS xanh dương nổi bật.
 * - Nút "Chú giải" bật/tắt bảng màu mức ngập.
 */
export default function VehicleToggle({
  onLocateUser,
  hasActiveGps = false,
  showLegend,
  onToggleLegend,
}: VehicleToggleProps) {
  return (
    <aside
      className="absolute right-3 top-28 z-20 flex flex-col items-end gap-2.5 pointer-events-none"
      aria-label="Điều khiển định vị GPS và chú giải bản đồ"
    >
      <div className="pointer-events-auto flex flex-col items-center gap-2">
        {/* Nút tròn Định vị GPS kiểu Google Maps */}
        <button
          type="button"
          onClick={onLocateUser}
          title={hasActiveGps ? 'GPS đang bật (Tâm vị trí của bạn)' : 'Bật định vị GPS vị trí hiện tại'}
          aria-label="Định vị GPS vị trí hiện tại"
          className={`w-11 h-11 rounded-full shadow-[0_3px_12px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all duration-200 active:scale-90 ${
            hasActiveGps
              ? 'bg-[#1A73E8] text-white ring-4 ring-blue-500/30'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:text-[#1A73E8]'
          }`}
        >
          <LocateFixed className={`w-5 h-5 ${hasActiveGps ? 'animate-pulse' : ''}`} />
        </button>

        {/* Nút tròn Chú giải lớp bản đồ kiểu Google Maps */}
        <button
          type="button"
          onClick={onToggleLegend}
          title="Bật/tắt bảng chú giải mức ngập"
          aria-label="Bật tắt chú giải mức ngập"
          aria-pressed={showLegend}
          className={`w-11 h-11 rounded-full shadow-[0_3px_12px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all duration-200 active:scale-90 ${
            showLegend
              ? 'bg-[#1A73E8] text-white ring-4 ring-blue-500/30'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:text-[#1A73E8]'
          }`}
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
