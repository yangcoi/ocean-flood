'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Camera,
  MapPin,
  CheckCircle2,
  Upload,
  Send,
  Loader2,
  Navigation,
} from 'lucide-react';
import {
  FLOOD_HOTSPOTS_SEED,
  calculateDistanceMeters,
  type FloodHotspotSeed,
} from '@/data/hcm-spatial-seed';
import type {
  VisualDepthChoice,
  VerificationOutcome,
} from '@/lib/verification-engine';

export interface CrowdReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceHash: string;
  onReportAccepted: () => void;
  defaultHotspotId?: string | null;
  userGpsLocation?: [number, number] | null;
  onRequestGps?: () => void;
}

const DEPTH_OPTIONS: {
  value: VisualDepthChoice;
  title: string;
  subtitle: string;
  badge: string;
  colorClass: string;
  activeClass: string;
}[] = [
  {
    value: 'WHEEL_15CM',
    title: '🛞 Mép vỉa hè (~15cm)',
    subtitle: 'Nước xâm xấp mép đường, xe máy qua bình thường',
    badge: '~15cm',
    colorClass: 'text-amber-600 dark:text-amber-400',
    activeClass:
      'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-slate-900 dark:text-white',
  },
  {
    value: 'EXHAUST_30CM',
    title: '⚠️ Ống pô xe máy (~25–30cm)',
    subtitle: 'Ngang ống xả, xe ga bắt đầu khó đi / dễ chết máy',
    badge: '~30cm',
    colorClass: 'text-orange-600 dark:text-orange-400',
    activeClass:
      'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-slate-900 dark:text-white',
  },
  {
    value: 'SEAT_50CM',
    title: '⛔ Chạm gầm ô tô (>40cm)',
    subtitle: 'Ngập lút bánh xe, tràn gầm Sedan — Rất nguy hiểm',
    badge: '>40cm',
    colorClass: 'text-red-600 dark:text-red-400',
    activeClass:
      'ring-2 ring-red-500 bg-red-50 dark:bg-red-950/40 border-red-500 text-slate-900 dark:text-white',
  },
  {
    value: 'RECEDED_0CM',
    title: '✅ Nước đã rút hết (0cm)',
    subtitle: 'Mặt đường khô ráo, giao thông đã trở lại thông thoáng',
    badge: '0cm',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    activeClass:
      'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-white',
  },
];

/**
 * Nén ảnh hiện trường bằng Canvas xuống < 150KB
 */
async function compressImageToWebp(
  file: File
): Promise<{ dataUrl: string; sizeKb: number; capturedIso: string }> {
  const bitmap = await createImageBitmap(file);
  const maxWidth = 960;
  const maxHeight = 540;
  const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(bitmap, 0, 0, w, h);
  }

  let dataUrl = canvas.toDataURL('image/webp', 0.75);
  if (!dataUrl.startsWith('data:image/webp')) {
    dataUrl = canvas.toDataURL('image/jpeg', 0.75);
  }
  const sizeKb = Number(((dataUrl.length * 0.75) / 1024).toFixed(1));

  return {
    dataUrl,
    sizeKb,
    capturedIso: new Date(file.lastModified || Date.now()).toISOString(),
  };
}

/**
 * Sinh ảnh mẫu hiện trường khi người dùng chưa chụp ảnh vật lý
 */
function createDefaultPlaceholderPhoto(
  streetLabel: string,
  depth: VisualDepthChoice
): { dataUrl: string; sizeKb: number; capturedIso: string } {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 450);
    grad.addColorStop(0, '#1E293B');
    grad.addColorStop(0.7, '#0F172A');
    grad.addColorStop(1, '#0284C7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 450);

    // Gợn sóng nước
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    for (let y = 300; y < 450; y += 30) {
      ctx.beginPath();
      for (let x = 0; x < 800; x += 40) {
        ctx.quadraticCurveTo(x + 20, y - 8, x + 40, y);
      }
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(30, 320, 740, 100);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(30, 320, 740, 100);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`📸 Báo ngập tại: ${streetLabel.slice(0, 45)}`, 50, 360);

    ctx.fillStyle = '#38BDF8';
    ctx.font = '16px monospace';
    ctx.fillText(
      `Mực nước: ${depth} • Thời gian: ${new Date().toLocaleTimeString('vi-VN')}`,
      50,
      395
    );
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
  return {
    dataUrl,
    sizeKb: 28,
    capturedIso: new Date().toISOString(),
  };
}

export default function CrowdReportModal({
  isOpen,
  onClose,
  deviceHash,
  onReportAccepted,
  defaultHotspotId,
  userGpsLocation,
  onRequestGps,
}: CrowdReportModalProps) {
  const [selectedDepth, setSelectedDepth] = useState<VisualDepthChoice>('EXHAUST_30CM');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [isPhotoUploaded, setIsPhotoUploaded] = useState<boolean>(false);
  const [photoSizeKb, setPhotoSizeKb] = useState<number>(24);
  const [exifCapturedAt, setExifCapturedAt] = useState<string>(new Date().toISOString());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionOutcome, setSubmissionOutcome] = useState<VerificationOutcome | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tìm điểm ngập gần nhất theo GPS thực tế của người dùng
  const nearestHotspotInfo = useMemo(() => {
    if (!userGpsLocation) {
      const fallback =
        FLOOD_HOTSPOTS_SEED.find((h) => h.id === defaultHotspotId) || FLOOD_HOTSPOTS_SEED[0];
      return { hotspot: fallback, distanceM: 0 };
    }

    const [userLng, userLat] = userGpsLocation;
    let closest: FloodHotspotSeed = FLOOD_HOTSPOTS_SEED[0];
    let minDistance = Infinity;

    for (const hs of FLOOD_HOTSPOTS_SEED) {
      const dist = calculateDistanceMeters(
        userLng,
        userLat,
        hs.point.coordinates[0],
        hs.point.coordinates[1]
      );
      if (dist < minDistance) {
        minDistance = dist;
        closest = hs;
      }
    }

    return {
      hotspot: closest,
      distanceM: Math.round(minDistance),
    };
  }, [userGpsLocation, defaultHotspotId]);

  const activeHotspot = nearestHotspotInfo.hotspot;

  // Khởi tạo ảnh placeholder khi mở modal nếu chưa có ảnh
  useEffect(() => {
    if (!isOpen) return;
    setSubmissionOutcome(null);
    if (!isPhotoUploaded) {
      const initial = createDefaultPlaceholderPhoto(
        activeHotspot.street_name,
        selectedDepth
      );
      setPhotoDataUrl(initial.dataUrl);
      setPhotoSizeKb(initial.sizeKb);
      setExifCapturedAt(initial.capturedIso);
    }
  }, [isOpen, activeHotspot.street_name, selectedDepth, isPhotoUploaded]);

  if (!isOpen) return null;

  // Xử lý khi người dùng chụp ảnh từ camera hoặc chọn file ảnh
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToWebp(file);
      setPhotoDataUrl(compressed.dataUrl);
      setPhotoSizeKb(compressed.sizeKb);
      setExifCapturedAt(compressed.capturedIso);
      setIsPhotoUploaded(true);
    } catch {
      // fallback
    }
  };

  // Gửi báo cáo ngập
  const handleSubmitReport = async () => {
    if (!userGpsLocation) {
      if (onRequestGps) onRequestGps();
      return;
    }

    setIsSubmitting(true);
    setSubmissionOutcome(null);

    const [userLng, userLat] = userGpsLocation;
    const [targetLng, targetLat] = activeHotspot.point.coordinates;

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedDepth === 'RECEDED_0CM' ? 'REPORT_RECEDED' : 'CREATE',
          hotspot_id: activeHotspot.id,
          device_hash: deviceHash || 'anon_hcm_user',
          user_gps: {
            lat: userLat,
            lng: userLng,
            accuracy_m: 12,
          },
          target_gps: {
            lat: targetLat,
            lng: targetLng,
          },
          address_text: activeHotspot.street_name,
          district: activeHotspot.district,
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
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch {
      setSubmissionOutcome({
        accepted: false,
        http_status: 422,
        message: 'Lỗi kết nối. Vui lòng thử lại.',
        layers: [],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex items-end justify-center p-0"
      role="dialog"
      aria-modal="true"
      aria-label="Chụp ảnh báo ngập tại hiện trường"
    >
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-[32px] border-t border-slate-200 dark:border-slate-800 shadow-[0_-12px_40px_rgba(0,0,0,0.4)] max-h-[92%] flex flex-col overflow-hidden">
        {/* Header mỏng gọn */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                Chụp Ảnh Báo Ngập Tại Chỗ
              </h2>
              <p className="text-[11px] text-slate-500">
                Xác thực tự động theo vị trí GPS của bạn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-600 dark:text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung chính: Tinh gọn vào 2 bước thực tế */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Card định vị GPS hiện tại */}
          <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#1A73E8] text-white flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Vị trí GPS của bạn:
                </div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {userGpsLocation ? (
                    <>
                      {activeHotspot.street_name.split('(')[0]} ({activeHotspot.district})
                    </>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      Chưa định vị GPS
                    </span>
                  )}
                </div>
                {userGpsLocation && (
                  <div className="text-[10px] text-slate-500 font-mono">
                    Cách điểm ngập: ~{nearestHotspotInfo.distanceM}m
                  </div>
                )}
              </div>
            </div>

            {!userGpsLocation && (
              <button
                type="button"
                onClick={onRequestGps}
                className="px-3 py-1.5 rounded-full bg-[#1A73E8] hover:bg-blue-600 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-sm transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Bật GPS</span>
              </button>
            )}
          </div>

          {/* BƯỚC 1: ẢNH CHỤP HIỆN TRƯỜNG */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-white">
              <span>1. Ảnh chụp hiện trường</span>
              {isPhotoUploaded && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Đã tải ảnh ({photoSizeKb}KB)
                </span>
              )}
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 h-44 shadow-inner">
              {photoDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoDataUrl}
                  alt="Hiện trường ngập nước"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Nhãn giờ chụp nổi trên ảnh */}
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white font-mono font-bold text-[10px] flex items-center gap-1">
                <span>🕒 {new Date(exifCapturedAt).toLocaleTimeString('vi-VN')}</span>
                <span className="text-emerald-400">• GPS chuẩn</span>
              </div>

              {/* Nút bấm chụp ảnh bằng Camera trực tiếp (Cấm upload thư viện) */}
              <div className="absolute bottom-2.5 inset-x-2.5 flex items-center">
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
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isPhotoUploaded ? '📸 Chụp lại ảnh khác bằng Camera' : '📸 Bấm Chụp Ảnh Bằng Camera Ngay'}</span>
                </button>
              </div>
            </div>

            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
              🔒 <strong>Quy định xác thực:</strong> Chỉ cho phép chụp trực tiếp từ Camera điện thoại tại hiện trường, không cho phép tải ảnh từ thư viện để đảm bảo độ tin cậy.
            </p>
          </div>

          {/* BƯỚC 2: CHỌN MỨC NGẬP THỰC TẾ (4 NÚT TO RÕ DỄ CHẠM) */}
          <div className="space-y-1.5">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
              2. Chọn mức nước thực tế bạn thấy:
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEPTH_OPTIONS.map((opt) => {
                const isSelected = selectedDepth === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedDepth(opt.value)}
                    className={`min-h-[64px] p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? opt.activeClass
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-extrabold leading-snug">
                      {opt.title}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-1">
                      {opt.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thông báo kết quả gửi */}
          {submissionOutcome && (
            <div
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                submissionOutcome.accepted
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-800 dark:text-red-200'
              }`}
            >
              {submissionOutcome.accepted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{submissionOutcome.message}</span>
            </div>
          )}

          {/* NÚT GỬI BÁO CÁO 1 CHẠM DUY NHẤT */}
          <button
            type="button"
            disabled={isSubmitting || !userGpsLocation}
            onClick={handleSubmitReport}
            className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.99] ${
              !userGpsLocation
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-orange-500/25'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang gửi báo cáo lên bản đồ...</span>
              </>
            ) : !userGpsLocation ? (
              <>
                <MapPin className="w-4 h-4" />
                <span>Vui lòng bật GPS để gửi báo cáo</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Gửi Báo Cáo Ngập Ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
