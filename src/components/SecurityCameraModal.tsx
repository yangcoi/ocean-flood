'use client';

import React, { useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  X,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Clock,
  Sparkles,
  Smartphone,
  Info,
} from 'lucide-react';

export interface ActiveCameraTarget {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  distance_to_hotspot_m: number;
  ttgt_reference_note?: string;
  street_name?: string;
  estimated_depth_cm?: number;
}

export interface SecurityCameraModalProps {
  camera: ActiveCameraTarget | null;
  onClose: () => void;
  onFlyToCamera?: (coords: [number, number]) => void;
}

/**
 * Placeholder cao cấp minh bạch cho Camera An ninh & Giao thông TTGT TP.HCM
 * Đóng băng kết nối stream trực tiếp vì Sở GTVT / Cổng TTGT TP.HCM chưa mở public API stream cho bên thứ ba.
 * Giữ giao diện chuẩn mực, trung thực, chuyên nghiệp và có nút dẫn thẳng về nguồn chính thống.
 */
function OfficialCctvPlaceholder({
  camera,
  lat,
  lng,
  depthCm,
}: {
  camera: ActiveCameraTarget;
  lat: number;
  lng: number;
  depthCm: number;
}) {
  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-700/80 p-5 text-white overflow-hidden shadow-2xl">
      {/* Nền hiệu ứng vi mạch / lưới quét giao thông nhẹ nhàng */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(26,115,232,0.3) 0%, transparent 70%), linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 20px 20px, 20px 20px',
        }}
      />

      {/* Dải trạng thái đầu khung */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
            TRỤ CAMERA TTGT • MÃ: {camera.id}
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black">
          CỔNG TTGT TP.HCM
        </span>
      </div>

      {/* Nội dung thông điệp chính sách API chính thống */}
      <div className="relative z-10 space-y-3.5 my-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
          <Smartphone className="w-7 h-7" />
        </div>

        <div className="text-center space-y-1.5 max-w-md mx-auto">
          <h3 className="text-sm sm:text-base font-black text-white leading-snug">
            Tính năng đang được chuẩn bị kết nối cùng Cổng TTGT TP.HCM
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Hệ thống camera giao thông trực tiếp trên toàn địa bàn hiện do <strong>Trung tâm Quản lý Điều hành Giao thông Đô thị (Sở GTVT TP.HCM)</strong> vận hành độc quyền qua app TTGT và trang web chính thức.
          </p>
          <p className="text-[11px] text-amber-200/90 bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl text-left leading-normal">
            ℹ️ <strong>Cam kết minh bạch:</strong> Ocean Flood không sử dụng luồng video giả lập. Luồng hình ảnh thực tế sẽ được tích hợp chính thức ngay khi Cổng TTGT TP.HCM phát hành cổng API liên thông dữ liệu mở cho cộng đồng.
          </p>
        </div>

        {/* Thông tin vị trí trụ cam được xác thực */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium bg-slate-800/80 p-3 rounded-xl border border-white/10">
          <div>
            <span className="text-slate-400 block text-[10px]">Tọa độ nút giao:</span>
            <span className="font-mono text-emerald-300 font-bold">
              {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Khoảng cách tâm ngập:</span>
            <span className="text-white font-bold">
              Cách ~{camera.distance_to_hotspot_m}m
            </span>
          </div>
          <div className="col-span-2 pt-1 border-t border-white/10 flex items-center justify-between">
            <span className="text-slate-400 text-[10px]">Ước tính mực nước đoạn này:</span>
            <span className="text-red-400 font-bold">~{depthCm}cm</span>
          </div>
        </div>
      </div>

      {/* Nút hành động mở ứng dụng TTGT chính thức */}
      <div className="relative z-10 pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-2">
        <a
          href="https://giaothong.hochiminhcity.gov.vn/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-3 rounded-xl bg-[#1A73E8] hover:bg-blue-600 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition"
        >
          <span>Xem trên Cổng Web TTGT TP.HCM</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <a
          href="https://play.google.com/store/apps/details?id=com.fpt.hcmgis.giaothong"
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-extrabold text-xs flex items-center justify-center gap-1.5 border border-slate-600 transition"
        >
          <span>App TTGT TP.HCM ↗</span>
        </a>
      </div>
    </div>
  );
}

/**
 * Bản đồ con MapLibre GL khóa cứng ngay tại tọa độ cột Camera (Zoom 17)
 * Giúp người dùng xác định chính xác giao lộ đặt camera trên nền bản đồ thật.
 */
function DirectCameraMiniMap({
  lng,
  lat,
  cameraName,
  depthCm,
}: {
  lng: number;
  lat: number;
  cameraName: string;
  depthCm: number;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const miniMap = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [lng, lat],
      zoom: 16.8,
      attributionControl: false,
    });

    const el = document.createElement('div');
    el.innerHTML = `
      <div class="relative flex flex-col items-center">
        <div class="px-2 py-0.5 rounded-full bg-blue-600 text-white font-black text-[10px] shadow-lg border border-white whitespace-nowrap mb-1">
          📍 Trụ Cam TTGT (~${depthCm}cm)
        </div>
        <div class="w-8 h-8 rounded-full bg-slate-900 text-white border-2 border-blue-400 shadow-xl flex items-center justify-center text-sm">
          📹
        </div>
      </div>
    `;

    new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([lng, lat])
      .addTo(miniMap);

    return () => {
      miniMap.remove();
    };
  }, [lng, lat, cameraName, depthCm]);

  return (
    <div className="relative w-full h-56 rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-inner">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[10px] font-bold pointer-events-none flex items-center gap-1">
        <MapPin className="w-3 h-3 text-blue-400" />
        <span>Vị trí cột camera tại nút giao ({lat.toFixed(4)}°N, {lng.toFixed(4)}°E)</span>
      </div>
    </div>
  );
}

/**
 * Hộp thoại Trình xem Trụ Camera An ninh & TTGT TP.HCM
 */
export default function SecurityCameraModal({
  camera,
  onClose,
  onFlyToCamera,
}: SecurityCameraModalProps) {
  const [activeTab, setActiveTab] = useState<'info_placeholder' | 'exact_map'>('info_placeholder');

  if (!camera) return null;

  const [lng, lat] = camera.coordinates;
  const depthCm = camera.estimated_depth_cm ?? 30;

  return (
    <div
      className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-end sm:justify-center p-2.5"
      role="dialog"
      aria-modal="true"
      aria-label={`Camera giao thông ${camera.name}`}
    >
      <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92dvh]">
        {/* 1. HEADER: Định danh Trụ Camera Giao thông */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-3.5 flex items-start justify-between gap-2 border-b border-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                👮 CAMERA TTGT TP.HCM
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/90 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                SẮP RA MẮT STREAM
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                Mã: {camera.id}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-white mt-1.5 leading-snug">
              {camera.name}
            </h2>
            <p className="text-[11px] text-slate-300 font-mono mt-0.5">
              📍 Vị trí nút giao: {lat.toFixed(5)}°N, {lng.toFixed(5)}°E (Cách điểm ngập {camera.distance_to_hotspot_m}m)
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng trình xem Camera"
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 shrink-0 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. TAB CHỌN XEM */}
        <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-100 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => setActiveTab('info_placeholder')}
            className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'info_placeholder'
                ? 'bg-[#1A73E8] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Thông tin &amp; Cổng TTGT</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exact_map')}
            className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'exact_map'
                ? 'bg-[#1A73E8] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Vị trí Trụ trên Bản đồ</span>
          </button>
        </div>

        {/* 3. NỘI DUNG HIỂN THỊ */}
        <div className="p-3.5 space-y-3 overflow-y-auto">
          {activeTab === 'info_placeholder' ? (
            <OfficialCctvPlaceholder
              camera={camera}
              lat={lat}
              lng={lng}
              depthCm={depthCm}
            />
          ) : (
            <DirectCameraMiniMap
              lng={lng}
              lat={lat}
              cameraName={camera.name}
              depthCm={depthCm}
            />
          )}

          {/* Gợi ý đối chiếu nút giao */}
          {camera.ttgt_reference_note && (
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              💡 <strong>Gợi ý tra cứu Cổng TTGT:</strong> {camera.ttgt_reference_note}
            </div>
          )}

          {/* Nút Phóng to Bản đồ chính */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                onFlyToCamera?.(camera.coordinates);
                onClose();
              }}
              className="w-full py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
            >
              <Maximize2 className="w-4 h-4 text-blue-400" />
              <span>Định vị và Phóng to vị trí này trên Bản đồ chính</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
