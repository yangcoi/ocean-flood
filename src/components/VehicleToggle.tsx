'use client';

import React from 'react';
import { LocateFixed, Layers } from 'lucide-react';
import type { VehicleType } from '@/lib/routing-engine';

export interface VehicleToggleProps {
  vehicleType: VehicleType;
  onChangeVehicle: (type: VehicleType) => void;
  onLocateUser: () => void;
  showLegend: boolean;
  onToggleLegend: () => void;
}

/**
 * Cụm nút điều khiển bản đồ nổi bên phải (Định vị GPS & Chú giải bản đồ CVD-Safe)
 * Tinh gọn chuẩn Apple Maps / LibreUIUX, nhường không gian cho Bản đồ Vector (>86% viewport)
 * (Công tắc chuyển đổi Xe máy / Ô tô đã được tích hợp đồng nhất vào Thanh điều khiển đáy Bottom Command Dock)
 */
export default function VehicleToggle({
  onLocateUser,
  showLegend,
  onToggleLegend,
}: VehicleToggleProps) {
  return (
    <aside
      className="absolute right-3 bottom-36 z-20 flex flex-col items-end gap-2 pointer-events-none"
      aria-label="Điều khiển định vị GPS và chú giải bản đồ"
    >
      <div className="pointer-events-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={onLocateUser}
          title="Định vị vị trí hiện tại của bạn (GPS)"
          aria-label="Định vị vị trí hiện tại của bạn"
          className="w-11 h-11 rounded-2xl libre-glass border border-slate-200/80 dark:border-white/15 shadow-xl flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-500/15 active:scale-95 transition"
        >
          <LocateFixed className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onToggleLegend}
          title="Bật/tắt bảng chú giải ký hiệu ngập & Camera TTGT"
          aria-label="Bật tắt chú giải bản đồ"
          aria-pressed={showLegend}
          className={`w-11 h-11 rounded-2xl libre-glass border shadow-xl flex items-center justify-center transition active:scale-95 ${
            showLegend
              ? 'bg-blue-600 text-white border-blue-400'
              : 'border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-500/15'
          }`}
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
