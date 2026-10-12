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

export default function VehicleToggle({
  vehicleType,
  onChangeVehicle,
  onLocateUser,
  showLegend,
  onToggleLegend,
}: VehicleToggleProps) {
  return (
    <aside
      className="fixed right-3 bottom-24 z-20 flex flex-col items-end gap-2.5 pointer-events-none"
      aria-label="Công tắc chuyển phương tiện và điều khiển bản đồ"
    >
      {/* Công tắc Kép Xe máy (>=20cm) vs Ô tô (>=25cm + Phóng chữ +12%) */}
      <div className="pointer-events-auto libre-glass rounded-2xl p-1.5 border border-slate-900/10 dark:border-white/15 shadow-xl flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onChangeVehicle('motorcycle')}
          aria-pressed={vehicleType === 'motorcycle'}
          title="Chế độ Xe máy: Cảnh báo từ 20cm (ngang ống pô / sàn xe tay ga)"
          className={`wet-touch-target w-16 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all font-bold ${
            vehicleType === 'motorcycle'
              ? 'bg-[#0284C7] text-white shadow-md ring-2 ring-sky-300 dark:ring-sky-500 scale-[1.02]'
              : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <span className="text-lg leading-none" role="img" aria-label="Xe máy">
            🏍️
          </span>
          <span className="text-[11px] leading-tight">Xe máy</span>
          <span
            className={`text-[9px] metric-mono leading-none ${
              vehicleType === 'motorcycle'
                ? 'text-sky-100 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            ≥20cm
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChangeVehicle('car')}
          aria-pressed={vehicleType === 'car'}
          title="Chế độ Ô tô: Cảnh báo từ 25cm (chạm gầm Sedan), khóa hẻm nhỏ & tự động phóng chữ +12% cho khoảng cách taplo"
          className={`wet-touch-target w-16 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all font-bold ${
            vehicleType === 'car'
              ? 'bg-[#2563EB] text-white shadow-md ring-2 ring-blue-300 dark:ring-blue-500 scale-[1.02]'
              : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <span className="text-lg leading-none" role="img" aria-label="Ô tô">
            🚗
          </span>
          <span className="text-[11px] leading-tight">Ô tô</span>
          <span
            className={`text-[9px] metric-mono leading-none ${
              vehicleType === 'car'
                ? 'text-blue-100 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            ≥25cm • +12%
          </span>
        </button>
      </div>

      {/* Cụm nút Định vị GPS & Chú giải bản đồ (Chuẩn vùng chạm tay ướt >= 48x48px) */}
      <div className="pointer-events-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={onLocateUser}
          title="Định vị vị trí hiện tại của bạn (GPS)"
          aria-label="Định vị vị trí hiện tại của bạn"
          className="wet-touch-target w-12 h-12 rounded-2xl libre-glass border border-slate-900/10 dark:border-white/15 shadow-lg flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 active:scale-95 transition"
        >
          <LocateFixed className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onToggleLegend}
          title="Bật/tắt bảng chú giải ký hiệu ngập & lộ trình (CVD-Safe Legend)"
          aria-label="Bật tắt chú giải bản đồ"
          aria-pressed={showLegend}
          className={`wet-touch-target w-12 h-12 rounded-2xl libre-glass border shadow-lg flex items-center justify-center transition ${
            showLegend
              ? 'bg-blue-600 text-white border-blue-400'
              : 'border-slate-900/10 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-500/10'
          }`}
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
