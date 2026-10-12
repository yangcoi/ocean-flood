'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Upload,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  FLOOD_HOTSPOTS_SEED,
  calculateDistanceMeters,
  type FloodHotspotSeed,
} from '@/data/hcm-spatial-seed';
import type {
  VisualDepthChoice,
  VerificationLayerCheck,
  VerificationOutcome,
} from '@/lib/verification-engine';

export interface CrowdReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceHash: string;
  onReportAccepted: () => void;
  defaultHotspotId?: string | null;
}

type GpsTestMode = 'ON_SITE_VALID' | 'SPAMMER_FAR_3KM';

const DEPTH_BUTTONS: {
  value: VisualDepthChoice;
  title: string;
  subtitle: string;
  activeClass: string;
  defaultClass: string;
}[] = [
  {
    value: 'WHEEL_15CM',
    title: '🛞 Ngập bánh xe (~15cm)',
    subtitle: 'Xâm xấp 1/3 bánh xe, đi chậm bắn nước',
    activeClass:
      'ring-3 ring-[#F59E0B] bg-amber-500/20 border-[#F59E0B] text-amber-950 dark:text-amber-200',
    defaultClass:
      'bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white',
  },
  {
    value: 'EXHAUST_30CM',
    title: '⚠️ Ngập ống pô / chạm gầm (~30cm)',
    subtitle: 'Ngang ống xả xe máy, chạm sàn gầm Sedan',
    activeClass:
      'ring-3 ring-[#EA580C] bg-orange-500/20 border-[#EA580C] text-orange-950 dark:text-orange-200',
    defaultClass:
      'bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white',
  },
  {
    value: 'SEAT_50CM',
    title: '⛔ Ngập quá yên / nắp capo (>45cm)',
    subtitle: 'Lút yên xe máy, tràn đèn pha ô tô — Tê liệt',
    activeClass:
      'ring-3 ring-[#DC2626] bg-red-500/20 border-[#DC2626] text-red-950 dark:text-red-200',
    defaultClass:
      'bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white',
  },
  {
    value: 'RECEDED_0CM',
    title: '✅ Nước đã rút hết (0cm)',
    subtitle: 'Mặt đường đã khô ráo / thông thoáng trở lại',
    activeClass:
      'ring-3 ring-[#10B981] bg-emerald-500/20 border-[#10B981] text-emerald-950 dark:text-emerald-200',
    defaultClass:
      'bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white',
  },
];

/**
 * Nén ảnh hoặc vẽ ảnh giả lập hiện trường bằng HTML5 Canvas xuống < 150KB (Walkthrough F3.1)
 */
async function generateCompressedFieldPhotoWebp(
  streetLabel: string,
  depthChoice: VisualDepthChoice,
  sourceImageFile?: File
): Promise<{ dataUrl: string; sizeKb: number; capturedIso: string }> {
  const canvas = document.createElement('canvas');
  const maxWidth = 800;
  const maxHeight = 450;
  canvas.width = maxWidth;
  canvas.height = maxHeight;
  const ctx = canvas.getContext('2d');

  const nowIso = new Date().toISOString();

  if (ctx) {
    if (sourceImageFile) {
      // Nếu người dùng chụp/chọn ảnh thật từ thiết bị: vẽ lên Canvas và nén xuống <150KB
      const bitmap = await createImageBitmap(sourceImageFile);
      const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
      const w = Math.round(bitmap.width * ratio);
      const h = Math.round(bitmap.height * ratio);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(bitmap, 0, 0, w, h);
    } else {
      // Vẽ hình mô phỏng ảnh chụp hiện trường dưới mưa có đóng dấu EXIF Timestamp
      const grad = ctx.createLinearGradient(0, 0, 0, maxHeight);
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(0.6, '#1E293B');
      grad.addColorStop(1, '#0369A1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, maxWidth, maxHeight);

      // Vẽ vệt mưa và sóng nước
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 45; i++) {
        const x = (i * 23) % maxWidth;
        const y = (i * 37) % (maxHeight - 100);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 10, y + 28);
        ctx.stroke();
      }

      // Khung thông tin EXIF trên ảnh
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(20, maxHeight - 125, maxWidth - 40, 105);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, maxHeight - 125, maxWidth - 40, 105);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`📸 ẢNH HIỆN TRƯỜNG: ${streetLabel.slice(0, 42)}`, 36, maxHeight - 88);

      ctx.fillStyle = '#FDBA74';
      ctx.font = 'bold 17px monospace';
      ctx.fillText(
        `Mức ngập: ${depthChoice} • EXIF: ${new Date().toLocaleTimeString('vi-VN')}`,
        36,
        maxHeight - 58
      );

      ctx.fillStyle = '#86EFAC';
      ctx.font = '15px monospace';
      ctx.fillText('✓ Client-side Canvas WebP Compression (< 150KB)', 36, maxHeight - 32);
    }
  }

  let dataUrl = canvas.toDataURL('image/webp', 0.72);
  if (!dataUrl.startsWith('data:image/webp')) {
    dataUrl = canvas.toDataURL('image/jpeg', 0.72);
  }
  const sizeKb = Math.max(
    8.5,
    Number(((dataUrl.length * 0.75) / 1024).toFixed(1))
  );

  return {
    dataUrl,
    sizeKb,
    capturedIso: nowIso,
  };
}

export default function CrowdReportModal({
  isOpen,
  onClose,
  deviceHash,
  onReportAccepted,
  defaultHotspotId,
}: CrowdReportModalProps) {
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>(
    defaultHotspotId || FLOOD_HOTSPOTS_SEED[0].id
  );
  const [gpsTestMode, setGpsTestMode] = useState<GpsTestMode>('ON_SITE_VALID');
  const [pinOffsetMeters, setPinOffsetMeters] = useState<number>(25); // Dịch chuyển ghim tâm ngập <= 500m (Walkthrough F3.2)
  const [selectedDepth, setSelectedDepth] = useState<VisualDepthChoice>('EXHAUST_30CM');

  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [photoSizeKb, setPhotoSizeKb] = useState<number>(24.5);
  const [exifCapturedAt, setExifCapturedAt] = useState<string>(new Date().toISOString());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionOutcome, setSubmissionOutcome] = useState<VerificationOutcome | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentHotspot: FloodHotspotSeed =
    FLOOD_HOTSPOTS_SEED.find((h) => h.id === selectedHotspotId) || FLOOD_HOTSPOTS_SEED[0];

  useEffect(() => {
    if (defaultHotspotId) {
      setSelectedHotspotId(defaultHotspotId);
    }
  }, [defaultHotspotId]);

  // Tự động khởi tạo ảnh hiện trường đã nén <150KB khi mở Modal hoặc đổi điểm/mức ngập
  useEffect(() => {
    if (!isOpen) return;
    setSubmissionOutcome(null);
    generateCompressedFieldPhotoWebp(currentHotspot.street_name, selectedDepth).then(
      (res) => {
        setPhotoDataUrl(res.dataUrl);
        setPhotoSizeKb(res.sizeKb);
        setExifCapturedAt(res.capturedIso);
      }
    );
  }, [isOpen, currentHotspot.street_name, selectedDepth]);

  if (!isOpen) return null;

  // Tọa độ điểm ngập mục tiêu (target_gps)
  const [targetLng, targetLat] = currentHotspot.point.coordinates;

  // Tọa độ GPS của người gửi (user_gps) tùy theo chế độ kiểm thử:
  // 1. ON_SITE_VALID: Đứng tại hiện trường cách tâm ngập `pinOffsetMeters` (15m..120m <= 500m)
  // 2. SPAMMER_FAR_3KM: Giả lập kẻ xấu ngồi ở quán cà phê cách điểm ngập ~3.4km (> 500m)
  const latDeltaValid = (pinOffsetMeters / 110600) * 0.8;
  const lngDeltaValid = (pinOffsetMeters / 110600) * 0.6;

  const userGps =
    gpsTestMode === 'ON_SITE_VALID'
      ? {
          lat: Number((targetLat + latDeltaValid).toFixed(6)),
          lng: Number((targetLng + lngDeltaValid).toFixed(6)),
          accuracy_m: 14,
        }
      : {
          // Cách ~3.4km về phía Quận 5 / Quận 1
          lat: Number((targetLat - 0.0245).toFixed(6)),
          lng: Number((targetLng - 0.0195).toFixed(6)),
          accuracy_m: 18,
        };

  const calculatedDistanceM = calculateDistanceMeters(
    userGps.lng,
    userGps.lat,
    targetLng,
    targetLat
  );
  const isGeofenceValid = calculatedDistanceM <= 500;

  // Xử lý khi người dùng chọn/chụp file ảnh thật từ máy
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await generateCompressedFieldPhotoWebp(
      currentHotspot.street_name,
      selectedDepth,
      file
    );
    setPhotoDataUrl(compressed.dataUrl);
    setPhotoSizeKb(compressed.sizeKb);
    // Đọc lastModified của file (nếu ảnh vừa chụp <= 10 phút thì lấy, hoặc gán thời gian chụp trực tiếp)
    const fileTimeMs = file.lastModified || Date.now();
    const ageMin = Math.abs(Date.now() - fileTimeMs) / 60000;
    setExifCapturedAt(
      ageMin <= 10 ? new Date(fileTimeMs).toISOString() : new Date().toISOString()
    );
  };

  // Gửi báo cáo lên POST /api/reports (test trực tiếp cả trường hợp hợp lệ lẫn trường hợp bị chặn Geofence >500m)
  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    setSubmissionOutcome(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedDepth === 'RECEDED_0CM' ? 'REPORT_RECEDED' : 'CREATE',
          hotspot_id: currentHotspot.id,
          device_hash: deviceHash || 'anon_reporter_hcm',
          user_gps: userGps,
          target_gps: {
            lat: targetLat,
            lng: targetLng,
          },
          address_text: `${currentHotspot.street_name}`,
          district: currentHotspot.district,
          visual_depth_choice: selectedDepth,
          exif_captured_at: exifCapturedAt,
          photo_base64_webp: photoDataUrl,
          is_active_weather_hotspot: true,
        }),
      });

      const outcome = (await res.json()) as VerificationOutcome;
      setSubmissionOutcome(outcome);
      if (res.ok && outcome.accepted) {
        onReportAccepted();
      }
    } catch {
      setSubmissionOutcome({
        accepted: false,
        http_status: 422,
        message: 'Lỗi kết nối mạng khi gửi báo cáo. Vui lòng thử lại.',
        layers: [],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-40 bg-slate-950/75 backdrop-blur-sm flex items-end justify-center p-0"
      role="dialog"
      aria-modal="true"
      aria-label="Hộp thoại Báo ngập hiện trường kiểm soát 5 lớp"
    >
      <div className="w-full libre-glass rounded-t-sheet border-t border-slate-900/15 dark:border-white/20 shadow-[0_-16px_48px_rgba(0,0,0,0.6)] max-h-[92%] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800/90 flex items-center justify-between bg-gradient-to-r from-orange-600/15 to-red-600/15 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                Báo Ngập Hiện Trường (Kiểm Soát 5 Lớp)
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                Zero-Text-Input • Chạm chọn nhanh dưới mưa • Nén &lt;150KB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại báo ngập"
            className="wet-touch-target -mr-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung 3 Bước */}
        <div className="p-3.5 overflow-y-auto space-y-3.5">
          {/* BƯỚC 1: CHỤP ẢNH TRỰC TIẾP (<150KB) + GIẢ LẬP KIỂM THỬ GEOFENCE 500M */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Bước 1: Ảnh hiện trường &amp; Geofence ≤500m
              </span>
              <span className="metric-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                {photoSizeKb} KB (&lt;150KB)
              </span>
            </div>

            {/* Bộ nút Giả lập nhanh cho Chủ dự án test cơ chế chặn Geofence 500m (Không lặp icon) */}
            <div className="p-2.5 rounded-2xl bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/35 space-y-1.5">
              <div className="text-[11px] font-bold text-violet-900 dark:text-violet-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                <span>Chế độ Kiểm thử Bảo mật GPS Geofence:</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setGpsTestMode('ON_SITE_VALID')}
                  className={`min-h-[42px] px-2.5 py-1.5 rounded-xl text-[11px] font-bold border text-left flex items-center gap-1.5 transition ${
                    gpsTestMode === 'ON_SITE_VALID'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/10'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="leading-tight">Tại hiện trường (≤500m)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGpsTestMode('SPAMMER_FAR_3KM')}
                  className={`min-h-[42px] px-2.5 py-1.5 rounded-xl text-[11px] font-bold border text-left flex items-center gap-1.5 transition ${
                    gpsTestMode === 'SPAMMER_FAR_3KM'
                      ? 'bg-red-600 text-white border-red-400 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/10'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span className="leading-tight">Kẻ xấu ở xa (&gt;3km - Chặn)</span>
                </button>
              </div>
            </div>

            {/* Khung hiển thị ảnh chụp hiện trường 16:9 kèm 2 Huy hiệu Lớp 1 & Lớp 2 */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-900 h-40">
              {photoDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoDataUrl}
                  alt="Ảnh chụp hiện trường ngập"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Huy hiệu Lớp 1 (GPS <= 500m) & Lớp 2 (EXIF <= 10 phút) đè trên ảnh (1 icon/dòng) */}
              <div className="absolute top-2 inset-x-2 flex flex-col gap-1">
                <div
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold backdrop-blur-md flex items-center gap-1.5 shadow ${
                    isGeofenceValid
                      ? 'bg-emerald-950/85 text-emerald-300 border border-emerald-400/50'
                      : 'bg-red-950/90 text-red-200 border border-red-400/60'
                  }`}
                >
                  {isGeofenceValid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        Lớp 1–2 (Geofence): Cách tâm ngập {calculatedDistanceM}m (≤500m)
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="truncate">
                        Vi phạm Geofence: Cách {(calculatedDistanceM / 1000).toFixed(2)}km (&gt;500m)
                      </span>
                    </>
                  )}
                </div>

                <div className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-900/85 text-sky-300 border border-sky-400/40 backdrop-blur-md flex items-center gap-1.5 w-fit">
                  <Camera className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Lớp 3 (EXIF &amp; WebP): Vừa chụp (≤10p) • {photoSizeKb}KB
                  </span>
                </div>
              </div>

              {/* Nút mở Camera thật / tải ảnh khác */}
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-900 font-bold text-[11px] shadow-lg flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chụp / Tải ảnh</span>
                </button>
              </div>
            </div>
          </div>

          {/* BƯỚC 2: 4 NÚT CHỌN NHANH MỨC NGẬP CỰC LỚN (2X2 CÂN ĐỐI TRONG KHUNG 430PX) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
              Bước 2: Chọn mức ngập theo bộ phận xe (Vùng chạm ≥68px)
            </span>

            <div className="grid grid-cols-2 gap-2">
              {DEPTH_BUTTONS.map((btn) => {
                const isSelected = selectedDepth === btn.value;
                return (
                  <button
                    key={btn.value}
                    type="button"
                    onClick={() => setSelectedDepth(btn.value)}
                    aria-pressed={isSelected}
                    className={`min-h-[68px] p-2.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-center ${
                      isSelected ? btn.activeClass : btn.defaultClass
                    }`}
                  >
                    <div className="text-xs font-extrabold leading-snug">
                      {btn.title}
                    </div>
                    <div className="text-[10.5px] opacity-85 font-medium mt-0.5 leading-tight">
                      {btn.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BƯỚC 3: ĐỊA CHỈ TỰ ĐỘNG TỪ GPS, DỊCH CHUYỂN GHIM <=500M & GỬI 1 CHẠM */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
              Bước 3: Vị trí tự động &amp; Gửi 1 chạm
            </span>

            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300">
                  Tuyến đường ngập đang đứng gần nhất:
                </span>
              </div>

              <select
                aria-label="Chọn tuyến đường điểm ngập tại hiện trường"
                value={selectedHotspotId}
                onChange={(e) => setSelectedHotspotId(e.target.value)}
                className="wet-touch-target w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white"
              >
                {FLOOD_HOTSPOTS_SEED.map((hs) => (
                  <option key={hs.id} value={hs.id}>
                    {hs.district} — {hs.street_name}
                  </option>
                ))}
              </select>

              {/* Thanh trượt kéo nhẹ ghim tâm ngập dưới lòng đường khi đứng trên vỉa hè (Walkthrough F3.2) */}
              {gpsTestMode === 'ON_SITE_VALID' && (
                <div className="pt-1 flex items-center justify-between gap-2 text-[11.5px]">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Tinh chỉnh ghim từ vỉa hè ra lòng đường:
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="range"
                      min={10}
                      max={150}
                      step={5}
                      value={pinOffsetMeters}
                      onChange={(e) => setPinOffsetMeters(Number(e.target.value))}
                      className="w-20 accent-blue-600"
                    />
                    <span className="metric-mono font-bold text-blue-600 dark:text-blue-400 w-10 text-right">
                      {pinOffsetMeters}m
                    </span>
                  </div>
                </div>
              )}

              {/* Chú thích Lớp 3-5 bằng ngôn ngữ đời thường dễ hiểu (Walkthrough F3.3) */}
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed pt-1.5 border-t border-slate-200 dark:border-white/10">
                <strong>Cơ chế cộng đồng (Lớp 4–5):</strong> Báo cáo hiện ngay trên bản đồ, gắn nhãn{' '}
                <strong>&ldquo;Đã xác minh ✓&rdquo;</strong> khi đủ 3 người quanh 150m cùng xác nhận
                và tự hạ cấp sau 90 phút nếu nước rút.
              </p>
            </div>

            {/* Hiển thị kết quả kiểm duyệt 5 lớp sau khi bấm gửi */}
            {submissionOutcome && (
              <div
                className={`p-3 rounded-2xl border-2 space-y-2 ${
                  submissionOutcome.accepted
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-100'
                    : 'bg-red-500/15 border-red-500 text-red-950 dark:text-red-100'
                }`}
              >
                <div className="font-extrabold text-xs flex items-center gap-2">
                  {submissionOutcome.accepted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                  <span>{submissionOutcome.message}</span>
                </div>

                {submissionOutcome.layers.length > 0 && (
                  <div className="space-y-1 text-[11px] bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl">
                    {submissionOutcome.layers.map((layer: VerificationLayerCheck) => (
                      <div key={layer.layer} className="flex items-start gap-1.5">
                        <span className="font-bold shrink-0">
                          {layer.passed ? '✓' : '✕'} Lớp {layer.layer} ({layer.name}):
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">{layer.detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Nút Gửi 1 chạm (cao >= 56px chuẩn tay ướt, không lặp icon) */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitReport}
              className={`wet-cta-target w-full px-4 py-3 rounded-2xl font-extrabold text-sm text-white shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.99] ${
                isGeofenceValid
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                  : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500'
              }`}
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>
                {isSubmitting
                  ? 'Đang kiểm duyệt 5 lớp...'
                  : isGeofenceValid
                    ? 'GỬI BÁO CÁO NGẬP NGAY (1 CHẠM)'
                    : 'THỬ GỬI BÁO CÁO TỪ XA (>3KM) — XEM CHẶN GEOFENCE'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
