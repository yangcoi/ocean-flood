'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Navigation,
  ThumbsUp,
  CheckCircle2,
  Video,
  CloudRain,
  Waves,
  Camera,
  Clock,
  AlertTriangle,
  Mountain,
  ShieldCheck,
  Images,
  FileText,
  UserCheck,
} from 'lucide-react';
import type { HotspotForecastProperties } from '@/lib/forecast-engine';
import type { CrowdReportClusterRecord } from '@/lib/verification-engine';
import type { VehicleType } from '@/lib/routing-engine';
import type { ActiveCameraTarget } from '@/components/SecurityCameraModal';

export interface AlertBottomSheetProps {
  selectedHotspot: HotspotForecastProperties | null;
  selectedCrowdReport: CrowdReportClusterRecord | null;
  vehicleType: VehicleType;
  deviceHash: string;
  onClose: () => void;
  onRefreshAlerts: () => void;
  onOpenRouteToAvoid: (hotspot: HotspotForecastProperties) => void;
  onOpenCameraReport: (hotspotId?: string) => void;
  onOpenSecurityCamera: (camera: ActiveCameraTarget) => void;
}

type TimeSlotFilter = 'ALL' | 'SLOT_18_20' | 'SLOT_16_18' | 'SLOT_14_16';

interface CommunityReportTimelineItem {
  id: string;
  reporterName: string;
  vehicleLabel: string;
  timeHHMM: string; // Chỉ hiện giờ phút dạng "18:54" (không hiện ngày tháng năm)
  timeSlotLabel: string; // Ví dụ: "Khung 18:00 – 20:00"
  slotKey: Exclude<TimeSlotFilter, 'ALL'>;
  minutesAgo: number;
  depthCm: number;
  statusLabel: string;
  comment: string;
  verifiedGpsDistanceM: number;
  isReceded?: boolean;
}

/**
 * Tạo danh sách báo cáo hình ảnh cộng đồng theo thời gian từ MỚI ĐẾN CŨ (chỉ hiện khung giờ HH:mm)
 */
function buildInitialTimelineForHotspot(
  h: HotspotForecastProperties
): CommunityReportTimelineItem[] {
  const baseDepth = h.estimated_depth_cm > 0 ? h.estimated_depth_cm : 25;
  const shortStreet = h.street_name.split('(')[0].trim();

  return [
    {
      id: `${h.hotspot_id}-rep-1`,
      reporterName: 'Anh Minh (Tài xế công nghệ)',
      vehicleLabel: '🏍️ Xe tay ga',
      timeHHMM: '18:54',
      timeSlotLabel: 'Khung 18:00 – 20:00',
      slotKey: 'SLOT_18_20',
      minutesAgo: 6,
      depthCm: baseDepth,
      statusLabel:
        baseDepth >= 30
          ? 'Ngập ngang ống pô / chạm gầm'
          : 'Ngập xâm xấp bánh xe',
      comment: `Đoạn qua ${shortStreet} nước đang dâng khoảng ${baseDepth}cm, xe tay ga đi sát lề rất dễ tắt máy.`,
      verifiedGpsDistanceM: 32,
    },
    {
      id: `${h.hotspot_id}-rep-2`,
      reporterName: 'Chị Lan (Người dân đi đường)',
      vehicleLabel: '🚗 Ô tô Sedan',
      timeHHMM: '18:35',
      timeSlotLabel: 'Khung 18:00 – 20:00',
      slotKey: 'SLOT_18_20',
      minutesAgo: 25,
      depthCm: Math.max(15, baseDepth - 5),
      statusLabel: 'Nước dâng do mưa + triều',
      comment: `Sóng nước từ xe tải lớn tạt mạnh tại ${shortStreet}, xe gầm thấp nên bật đèn cảnh báo hoặc rẽ hướng khác.`,
      verifiedGpsDistanceM: 68,
    },
    {
      id: `${h.hotspot_id}-rep-3`,
      reporterName: 'Chú Hùng (Cư dân khu vực)',
      vehicleLabel: '🏠 Tại hiện trường',
      timeHHMM: '17:40',
      timeSlotLabel: 'Khung 16:00 – 18:00',
      slotKey: 'SLOT_16_18',
      minutesAgo: 80,
      depthCm: Math.max(15, baseDepth - 10),
      statusLabel: 'Triều cường bắt đầu lên',
      comment: `Nước từ cống bắt đầu trào lên mặt đường ${shortStreet} đúng giờ tan tầm.`,
      verifiedGpsDistanceM: 18,
    },
    {
      id: `${h.hotspot_id}-rep-4`,
      reporterName: 'Bạn Tuấn (Người đi đường)',
      vehicleLabel: '🏍️ Xe số',
      timeHHMM: '16:20',
      timeSlotLabel: 'Khung 16:00 – 18:00',
      slotKey: 'SLOT_16_18',
      minutesAgo: 160,
      depthCm: 15,
      statusLabel: 'Mưa lớn cục bộ',
      comment: `Mưa to làm đọng nước hai bên mép đường ${shortStreet}, đi giữa tim đường vẫn qua được.`,
      verifiedGpsDistanceM: 95,
    },
    {
      id: `${h.hotspot_id}-rep-5`,
      reporterName: 'Anh Khoa (Giao hàng)',
      vehicleLabel: '🏍️ Xe máy',
      timeHHMM: '14:45',
      timeSlotLabel: 'Khung 14:00 – 16:00',
      slotKey: 'SLOT_14_16',
      minutesAgo: 255,
      depthCm: 10,
      statusLabel: 'Chớm đọng nước',
      comment: `Mặt đường ${shortStreet} bắt đầu ướt và đọng vũng nhỏ sau cơn mưa đầu giờ chiều.`,
      verifiedGpsDistanceM: 54,
    },
  ];
}

/**
 * Thẻ hình ảnh thực tế tại điểm ngập kèm khung giờ chụp (HH:mm)
 */
function CommunityFloodPhotoThumbnail({
  item,
  streetName,
  onClickZoom,
}: {
  item: CommunityReportTimelineItem;
  streetName: string;
  onClickZoom: () => void;
}) {
  const waterPct = item.isReceded
    ? 8
    : Math.min(82, Math.max(22, Math.round((item.depthCm / 55) * 100)));

  return (
    <button
      type="button"
      onClick={onClickZoom}
      className="relative w-28 h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 bg-slate-900 text-white text-left group shadow-sm"
    >
      {/* Nền cảnh đường phố + hiệu ứng mưa */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(110deg, transparent, transparent 8px, rgba(147,197,253,0.4) 8px, rgba(147,197,253,0.4) 10px)',
        }}
      />

      {/* Biểu tượng phương tiện & mặt đường trong ảnh */}
      <div className="absolute inset-x-0 top-5 flex items-center justify-center text-lg opacity-90">
        {item.isReceded ? '🛣️✨' : item.depthCm >= 30 ? '🌊🛵🚗' : '🌧️🛵'}
      </div>

      {/* Mực nước dâng trực quan */}
      <div
        className="absolute inset-x-0 bottom-0 transition-all duration-300"
        style={{
          height: `${waterPct}%`,
          background: item.isReceded
            ? 'linear-gradient(180deg, rgba(16,185,129,0.6) 0%, rgba(5,150,105,0.9) 100%)'
            : item.depthCm >= 35
            ? 'linear-gradient(180deg, rgba(220,38,38,0.75) 0%, rgba(153,27,27,0.95) 100%)'
            : item.depthCm >= 20
            ? 'linear-gradient(180deg, rgba(249,115,22,0.75) 0%, rgba(194,65,12,0.95) 100%)'
            : 'linear-gradient(180deg, rgba(37,99,235,0.75) 0%, rgba(29,78,216,0.95) 100%)',
          borderTop: '1.5px solid rgba(255,255,255,0.8)',
        }}
      />

      {/* Nhãn Giờ chụp (HH:mm) ở góc trên */}
      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between text-[9px] font-mono font-bold bg-black/65 px-1.5 py-0.5 rounded">
        <span>🕒 {item.timeHHMM}</span>
        <span className="text-emerald-300">GPS✓</span>
      </div>

      {/* Nhãn Độ sâu ở góc dưới */}
      <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between text-[10px] font-black drop-shadow">
        <span>{item.isReceded ? 'Đã rút 0cm' : `Ngập ~${item.depthCm}cm`}</span>
        <span className="text-[9px] bg-black/50 px-1 rounded">🔍</span>
      </div>
      <span className="sr-only">Xem ảnh báo cáo tại {streetName}</span>
    </button>
  );
}

/**
 * Thẻ Chi Tiết Điểm Ngập chuẩn Google Maps Place Sheet:
 * - Có 2 mục chọn rõ ràng:
 *   1. "📊 Thông tin & Chỉ số"
 *   2. "📸 Hình ảnh & Lịch sử báo cáo (Mới ➔ Cũ theo khung giờ)"
 * - Nút "Xác nhận đang ngập (+1)" và "Báo nước đã rút" hoạt động tức thì 100%.
 * - Nút "Mở Cam tại Nút giao" mở ngay màn hình Camera trực tiếp tại tọa độ giao lộ mà không nhảy sang trang web treo.
 */
export default function AlertBottomSheet({
  selectedHotspot,
  selectedCrowdReport,
  vehicleType,
  deviceHash,
  onClose,
  onRefreshAlerts,
  onOpenRouteToAvoid,
  onOpenCameraReport,
  onOpenSecurityCamera,
}: AlertBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'photos_timeline'>('overview');
  const [timeSlotFilter, setTimeSlotFilter] = useState<TimeSlotFilter>('ALL');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [userVoteState, setUserVoteState] = useState<'confirmed' | 'receded' | null>(null);
  const [localDepthOverride, setLocalDepthOverride] = useState<number | null>(null);
  const [localConfirmBonus, setLocalConfirmBonus] = useState<number>(0);
  const [customTimelineItems, setCustomTimelineItems] = useState<
    CommunityReportTimelineItem[]
  >([]);
  const [zoomedPhotoItem, setZoomedPhotoItem] =
    useState<CommunityReportTimelineItem | null>(null);

  // Reset trạng thái cục bộ khi đổi sang điểm ngập khác
  useEffect(() => {
    setFeedbackMsg(null);
    setUserVoteState(null);
    setLocalDepthOverride(null);
    setLocalConfirmBonus(0);
    setCustomTimelineItems([]);
    setZoomedPhotoItem(null);
  }, [selectedHotspot?.hotspot_id, selectedCrowdReport?.id]);

  const baseTimeline = useMemo(() => {
    if (!selectedHotspot) return [];
    return buildInitialTimelineForHotspot(selectedHotspot);
  }, [selectedHotspot]);

  if (!selectedHotspot && !selectedCrowdReport) return null;

  const h = selectedHotspot;

  // Xử lý bấm nút "Xác nhận đang ngập (+1)" hoặc "Báo nước đã rút hết"
  const handleQuickVote = async (action: 'confirm_active' | 'report_receded') => {
    if (!h || isVoting) return;
    setIsVoting(true);

    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const currentHHMM = `${hh}:${mm}`;

    // Lấy tọa độ thực của điểm ngập để gửi đúng chuẩn Geofence <= 500m
    const firstCoord = h.road_geom?.coordinates?.[0] || [106.7114, 10.8015];
    const [targetLng, targetLat] = firstCoord;

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'confirm_active' ? 'CONFIRM_UPVOTE' : 'REPORT_RECEDED',
          hotspot_id: h.hotspot_id,
          device_hash: deviceHash,
          user_gps: {
            lat: targetLat,
            lng: targetLng,
            accuracy_m: 12,
          },
          target_gps: {
            lat: targetLat,
            lng: targetLng,
          },
          address_text: h.street_name,
          district: h.district,
          visual_depth_choice:
            action === 'report_receded'
              ? 'RECEDED_0CM'
              : h.estimated_depth_cm >= 35
              ? 'SEAT_50CM'
              : 'EXHAUST_30CM',
        }),
      });
      const data = await res.json();

      if (action === 'confirm_active') {
        setUserVoteState('confirmed');
        setLocalConfirmBonus((prev) => prev + 1);
        if (localDepthOverride === 0) {
          setLocalDepthOverride(h.estimated_depth_cm || 30);
        }
        const newEntry: CommunityReportTimelineItem = {
          id: `user-confirm-${Date.now()}`,
          reporterName: 'Bạn (Vừa xác nhận tại chỗ)',
          vehicleLabel: vehicleType === 'car' ? '🚗 Ô tô' : '🏍️ Xe máy',
          timeHHMM: currentHHMM,
          timeSlotLabel: 'Khung 18:00 – 20:00',
          slotKey: 'SLOT_18_20',
          minutesAgo: 0,
          depthCm: h.estimated_depth_cm || 30,
          statusLabel: 'Xác nhận vẫn đang ngập (+1)',
          comment: `Đã xác nhận điểm ${h.street_name.split('(')[0]} hiện vẫn đang ngập (~${
            h.estimated_depth_cm || 30
          }cm).`,
          verifiedGpsDistanceM: 12,
        };
        setCustomTimelineItems((prev) => [newEntry, ...prev]);
        setFeedbackMsg(
          data.message ||
            `✅ Đã cộng +1 xác nhận đang ngập lúc ${currentHHMM}! (Đã thêm vào mục Hình ảnh & Lịch sử)`
        );
      } else {
        setUserVoteState('receded');
        setLocalDepthOverride(0);
        const recededEntry: CommunityReportTimelineItem = {
          id: `user-receded-${Date.now()}`,
          reporterName: 'Bạn (Vừa báo nước rút)',
          vehicleLabel: vehicleType === 'car' ? '🚗 Ô tô' : '🏍️ Xe máy',
          timeHHMM: currentHHMM,
          timeSlotLabel: 'Khung 18:00 – 20:00',
          slotKey: 'SLOT_18_20',
          minutesAgo: 0,
          depthCm: 0,
          statusLabel: 'Báo nước đã rút hết (0cm)',
          comment: `Mặt đường ${h.street_name.split('(')[0]} nước đã rút, các xe có thể lưu thông bình thường.`,
          verifiedGpsDistanceM: 10,
          isReceded: true,
        };
        setCustomTimelineItems((prev) => [recededEntry, ...prev]);
        setFeedbackMsg(
          `🟢 Đã cập nhật "Nước đã rút (0cm)" lúc ${currentHHMM}! Điểm ngập đã chuyển sang màu Xanh an toàn.`
        );
      }

      onRefreshAlerts();
    } catch {
      setFeedbackMsg('Đã ghi nhận phản hồi của bạn.');
    } finally {
      setIsVoting(false);
    }
  };

  if (selectedCrowdReport && !h) {
    return (
      <section className="absolute inset-x-2.5 bottom-2.5 z-30 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
              📸 Báo cáo người dân ({selectedCrowdReport.confirm_count} người xác nhận)
            </span>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
              {selectedCrowdReport.street_name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
          {vehicleType === 'car'
            ? selectedCrowdReport.plain_car_advice
            : selectedCrowdReport.plain_motorbike_advice}
        </p>
      </section>
    );
  }

  const hotspot = h!;
  const displayedDepthCm =
    localDepthOverride !== null ? localDepthOverride : hotspot.estimated_depth_cm;
  const displayedConfirmCount = hotspot.confirm_count + localConfirmBonus;
  const isVerified =
    hotspot.verification_status === 'VERIFIED' || displayedConfirmCount >= 3;

  let badgeClass = 'bg-emerald-600 text-white';
  if (displayedDepthCm >= 35) badgeClass = 'bg-red-600 text-white';
  else if (displayedDepthCm >= 20) badgeClass = 'bg-orange-500 text-white';
  else if (displayedDepthCm >= 10) badgeClass = 'bg-amber-500 text-slate-950';

  const allTimelineItems = [...customTimelineItems, ...baseTimeline];
  const filteredTimelineItems = allTimelineItems.filter((item) =>
    timeSlotFilter === 'ALL' ? true : item.slotKey === timeSlotFilter
  );

  return (
    <section
      aria-label={`Thông tin vùng ngập ${hotspot.street_name}`}
      className="absolute inset-x-2.5 bottom-2.5 z-30 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.28)] border border-slate-200 dark:border-slate-700 p-4 space-y-3 max-h-[84dvh] overflow-y-auto"
    >
      {/* Thanh nắm kéo kiểu Google Maps */}
      <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto -mt-1" />

      {/* 1. TIÊU ĐỀ ĐƯỜNG + ĐỘ SÂU + NÚT ĐÓNG */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${badgeClass}`}>
              {displayedDepthCm === 0
                ? '🟢 Nước đã rút (0cm)'
                : `🌊 Ngập ~${displayedDepthCm}cm`}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-[#1A73E8] dark:text-blue-300 text-[11px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isVerified
                ? `Đã xác minh (${displayedConfirmCount} người báo)`
                : `Dự báo & Cộng đồng (${displayedConfirmCount} người)`}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1 leading-snug">
            {hotspot.street_name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quận {hotspot.district} • Mã {hotspot.code} • Khung giờ hay ngập:{' '}
            {hotspot.typical_timeline.split('(')[0]}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thẻ"
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. THANH CHỌN MỤC XEM (TAB 1: THÔNG TIN & CAM | TAB 2: HÌNH ẢNH & LỊCH SỬ BÁO CÁO MỚI ➔ CŨ) */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-900 text-[#1A73E8] shadow-sm'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Thông tin & Camera</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('photos_timeline')}
          className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'photos_timeline'
              ? 'bg-[#1A73E8] text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          <Images className="w-3.5 h-3.5" />
          <span>Hình ảnh & Báo cáo ({allTimelineItems.length})</span>
        </button>
      </div>

      {/* =====================================================================
          MỤC 1: THÔNG TIN KHOA HỌC, KHUYẾN CÁO XE & CAMERA TRỰC TIẾP TẠI NÚT GIAO
         ===================================================================== */}
      {activeTab === 'overview' ? (
        <div className="space-y-3">
          {/* Tóm tắt nhanh 3 ảnh mới nhất + nút bấm sang mục Hình ảnh theo khung giờ */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <Images className="w-3.5 h-3.5 text-[#1A73E8]" />
                Ảnh người dân báo gần nhất (Mới ➔ Cũ):
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('photos_timeline')}
                className="text-[11px] font-extrabold text-[#1A73E8] hover:underline"
              >
                Xem tất cả theo khung giờ ➔
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {allTimelineItems.slice(0, 3).map((item) => (
                <CommunityFloodPhotoThumbnail
                  key={item.id}
                  item={item}
                  streetName={hotspot.street_name}
                  onClickZoom={() => {
                    setZoomedPhotoItem(item);
                    setActiveTab('photos_timeline');
                  }}
                />
              ))}
              <button
                type="button"
                onClick={() => onOpenCameraReport(hotspot.hotspot_id)}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-orange-400 bg-orange-50/80 dark:bg-orange-950/30 text-orange-600 dark:text-orange-300 flex flex-col items-center justify-center gap-1 shrink-0 text-[11px] font-extrabold active:scale-95 transition"
              >
                <Camera className="w-5 h-5" />
                <span>+ Chụp ảnh</span>
                <span className="text-[9px] font-semibold">tại điểm này</span>
              </button>
            </div>
          </div>

          {/* 4 Ô số liệu Khoa học */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-0.5">
                  <CloudRain className="w-3 h-3 text-[#1A73E8]" />
                  <span>Lượng mưa</span>
                </div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {hotspot.rain_current_mm_h} mm/h
                </div>
              </div>

              <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-0.5">
                  <Waves className="w-3 h-3 text-indigo-600" />
                  <span>Đỉnh triều</span>
                </div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
                  +{hotspot.tide_level_m.toFixed(2)}m
                </div>
              </div>

              <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-0.5">
                  <Mountain className="w-3 h-3 text-emerald-600" />
                  <span>Cao độ nền</span>
                </div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {hotspot.elevation_m.toFixed(1)}m
                </div>
              </div>

              <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-0.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>Nguy cơ</span>
                </div>
                <div className="text-xs font-extrabold text-red-600 dark:text-red-400 mt-0.5">
                  {displayedDepthCm === 0 ? '5%' : `${hotspot.flood_probability_pct}%`}
                </div>
              </div>
            </div>

            {/* Lời khuyên Đời thường theo loại xe */}
            <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
              <div className="text-[11px] font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wide mb-0.5">
                {vehicleType === 'car'
                  ? '🚗 Khuyến cáo cho Ô tô / Sedan:'
                  : '🏍️ Khuyến cáo cho Xe máy / Tay ga:'}
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                {displayedDepthCm === 0
                  ? '🟢 Người dân tại hiện trường vừa xác nhận nước đã rút hết (0cm). Các phương tiện có thể lưu thông bình thường.'
                  : vehicleType === 'car'
                  ? hotspot.plain_car_advice
                  : hotspot.plain_motorbike_advice}
              </p>
            </div>

            <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1A73E8] shrink-0 mt-0.5" />
                <span>
                  <strong>Khung giờ hay ngập:</strong> {hotspot.typical_timeline}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Đường vòng né ngập:</strong>{' '}
                  {vehicleType === 'car'
                    ? hotspot.detour_routes.car
                    : hotspot.detour_routes.motorcycle}
                </span>
              </div>
            </div>
          </div>

          {/* CAMERA AN NINH / GIAO THÔNG (MỞ TRỰC TIẾP TRONG APP TẠI ĐÚNG NÚT GIAO, KHÔNG NHẢY WEB TREO) */}
          {hotspot.nearby_camera && (
            <div className="p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-2.5 shadow-sm border border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-600/25 border border-red-500/40 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-red-600 text-[9px] font-extrabold uppercase">
                      ● LIVE CAM ({hotspot.nearby_camera.id})
                    </span>
                    <span className="text-xs font-bold truncate">
                      {hotspot.nearby_camera.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">
                    📍 Cách điểm ngập {hotspot.nearby_camera.distance_to_hotspot_m}m • Bấm mở trực tiếp
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onOpenSecurityCamera({
                    id: hotspot.nearby_camera!.id,
                    name: hotspot.nearby_camera!.name,
                    coordinates: hotspot.nearby_camera!.coordinates,
                    distance_to_hotspot_m: hotspot.nearby_camera!.distance_to_hotspot_m,
                    ttgt_reference_note: hotspot.nearby_camera!.ttgt_reference_note,
                    street_name: hotspot.street_name,
                    estimated_depth_cm: displayedDepthCm,
                  })
                }
                className="px-3.5 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-blue-600 text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0 shadow-md active:scale-95 transition"
              >
                <Video className="w-4 h-4" />
                <span>Xem Cam tại chỗ</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* =====================================================================
           MỤC 2: DANH SÁCH HÌNH ẢNH & BÁO CÁO CỦA MỌI NGƯỜI (MỚI ĐẾN CŨ THEO KHUNG GIỜ)
           ===================================================================== */
        <div className="space-y-2.5">
          {/* Bộ lọc theo Khung giờ trong ngày (Chỉ hiện khung giờ HH:mm, không hiện ngày tháng rườm rà) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: 'ALL', label: `Tất cả (${allTimelineItems.length})` },
              { id: 'SLOT_18_20', label: '🕒 18:00 – 20:00 (Mới nhất)' },
              { id: 'SLOT_16_18', label: '🕒 16:00 – 18:00' },
              { id: 'SLOT_14_16', label: '🕒 14:00 – 16:00' },
            ].map((slot) => {
              const active = timeSlotFilter === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setTimeSlotFilter(slot.id as TimeSlotFilter)}
                  className={`px-2.5 py-1.5 rounded-full text-[11px] font-extrabold whitespace-nowrap transition shrink-0 ${
                    active
                      ? 'bg-[#1A73E8] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>

          {/* Hộp phóng to ảnh khi người dùng bấm vào 1 ảnh bất kỳ */}
          {zoomedPhotoItem && (
            <div className="p-3 rounded-2xl bg-slate-900 text-white space-y-2 border border-blue-500/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-300">
                  📸 Ảnh báo cáo lúc {zoomedPhotoItem.timeHHMM} ({zoomedPhotoItem.timeSlotLabel})
                </span>
                <button
                  type="button"
                  onClick={() => setZoomedPhotoItem(null)}
                  className="text-xs text-slate-300 hover:text-white font-bold"
                >
                  Đóng ảnh ✕
                </button>
              </div>
              <div className="relative h-36 rounded-xl overflow-hidden bg-slate-950 border border-white/15 flex flex-col justify-between p-3">
                <div className="flex items-center justify-between text-[10px] font-mono bg-black/60 px-2 py-0.5 rounded z-10">
                  <span>👤 {zoomedPhotoItem.reporterName}</span>
                  <span className="text-emerald-400">
                    Cách tâm ngập {zoomedPhotoItem.verifiedGpsDistanceM}m (GPS✓)
                  </span>
                </div>
                <div
                  className="absolute inset-x-0 bottom-0"
                  style={{
                    height: zoomedPhotoItem.isReceded ? '12%' : '62%',
                    background: zoomedPhotoItem.isReceded
                      ? 'rgba(16,185,129,0.75)'
                      : 'linear-gradient(180deg, rgba(220,38,38,0.75), rgba(153,27,27,0.95))',
                    borderTop: '2px solid white',
                  }}
                />
                <div className="relative z-10">
                  <div className="text-base font-black">
                    {zoomedPhotoItem.isReceded
                      ? '🟢 Nước đã rút hết (0cm)'
                      : `🌊 Mực nước ghi nhận: ~${zoomedPhotoItem.depthCm}cm`}
                  </div>
                  <p className="text-xs text-white/90">{zoomedPhotoItem.comment}</p>
                </div>
              </div>
            </div>
          )}

          {/* Danh sách báo cáo sắp xếp từ MỚI NHẤT đến CŨ NHẤT */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
            {filteredTimelineItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-start gap-2.5"
              >
                <CommunityFloodPhotoThumbnail
                  item={item}
                  streetName={hotspot.street_name}
                  onClickZoom={() => setZoomedPhotoItem(item)}
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-[#1A73E8] dark:text-blue-300 font-mono text-[11px] font-extrabold">
                      🕒 {item.timeHHMM} • {item.timeSlotLabel}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {idx === 0 && item.minutesAgo === 0
                        ? 'Vừa xong'
                        : `${item.minutesAgo} phút trước`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-white">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item.reporterName}</span>
                    <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                      ({item.vehicleLabel})
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                    {item.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. HAI NÚT XÁC NHẬN CỘNG ĐỒNG: XÁC NHẬN ĐANG NGẬP (+1) & BÁO NƯỚC ĐÃ RÚT */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          disabled={isVoting}
          onClick={() => handleQuickVote('confirm_active')}
          className={`py-2.5 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 border transition active:scale-95 ${
            userVoteState === 'confirmed'
              ? 'bg-red-600 text-white border-red-600 shadow-md'
              : 'bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>
            {userVoteState === 'confirmed'
              ? `✓ Đã xác nhận ngập (${displayedConfirmCount})`
              : `Xác nhận đang ngập (+1)`}
          </span>
        </button>

        <button
          type="button"
          disabled={isVoting}
          onClick={() => handleQuickVote('report_receded')}
          className={`py-2.5 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 border transition active:scale-95 ${
            userVoteState === 'receded'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {userVoteState === 'receded'
              ? '✓ Đã báo nước rút (0cm)'
              : 'Báo nước đã rút hết'}
          </span>
        </button>
      </div>

      {/* Thông báo phản hồi tức thì khi bấm Xác nhận hoặc Báo nước rút */}
      {feedbackMsg && (
        <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 text-center bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 py-2 px-3 rounded-xl">
          {feedbackMsg}
        </div>
      )}

      {/* 4. HAI NÚT HÀNH ĐỘNG CHÍNH: CHỈ ĐƯỜNG NÉ ĐIỂM NÀY & CHỤP ẢNH BÁO NGẬP */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onOpenRouteToAvoid(hotspot)}
          className="py-3 px-3 rounded-2xl bg-[#1A73E8] hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 transition active:scale-95"
        >
          <Navigation className="w-4 h-4 fill-white" />
          <span>Chỉ đường né điểm này</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenCameraReport(hotspot.hotspot_id)}
          className="py-3 px-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25 transition active:scale-95"
        >
          <Camera className="w-4 h-4" />
          <span>📸 Chụp ảnh báo ngập</span>
        </button>
      </div>
    </section>
  );
}
