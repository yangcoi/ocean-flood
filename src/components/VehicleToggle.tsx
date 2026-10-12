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
      className="absolute right-2.5 top-28 z-20 flex flex-col items-end gap-2 pointer-events-none"
      aria-label="Điều khiển định vị GPS và chú giải bản đồ"
    >
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={onLocateUser}
          title="Định vị vị trí hiện tại của bạn (GPS)"
          aria-label="Định vị vị trí hiện tại của bạn"
          className={`px-3 py-2 rounded-full border shadow-lg flex items-center gap-1.5 text-xs font-extrabold transition active:scale-95 ${
            hasActiveGps
              ? 'bg-[#1A73E8] text-white border-white shadow-blue-500/40'
              : 'bg-white/95 dark:bg-slate-900/95 text-[#1A73E8] dark:text-blue-400 border-slate-200 dark:border-slate-700'
          }`}
        >
          <LocateFixed className={`w-4 h-4 ${hasActiveGps ? 'animate-pulse' : ''}`} />
          <span>{hasActiveGps ? '📍 Đã bật GPS' : '📍 Bật GPS'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleLegend}
          title="Bật/tắt bảng chú giải ký hiệu ngập"
          aria-label="Bật tắt chú giải bản đồ"
          aria-pressed={showLegend}
          className={`w-10 h-10 rounded-full border shadow-lg flex items-center justify-center transition active:scale-95 ${
            showLegend
              ? 'bg-[#1A73E8] text-white border-white'
              : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
