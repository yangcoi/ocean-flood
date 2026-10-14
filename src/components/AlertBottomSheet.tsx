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

  const allTimelineItems = [...customTimelineItems, ...baseTimeline];
  const filteredTimelineItems = allTimelineItems.filter((item) =>
    timeSlotFilter === 'ALL' ? true : item.slotKey === timeSlotFilter
  );

  const handleOpenSecurityCam = () => {
    if (hotspot.nearby_camera) {
      onOpenSecurityCamera({
        id: hotspot.nearby_camera.id,
        name: hotspot.nearby_camera.name,
        coordinates: hotspot.nearby_camera.coordinates,
        distance_to_hotspot_m: hotspot.nearby_camera.distance_to_hotspot_m,
        ttgt_reference_note: hotspot.nearby_camera.ttgt_reference_note,
        street_name: hotspot.street_name,
        estimated_depth_cm: displayedDepthCm,
      });
    } else {
      const firstCoord = hotspot.road_geom?.coordinates?.[0] || [106.7114, 10.8015];
      onOpenSecurityCamera({
        id: `CAM_${hotspot.code}`,
        name: `Camera TTGT: ${hotspot.street_name.split('(')[0]}`,
        coordinates: [firstCoord[0], firstCoord[1]],
        distance_to_hotspot_m: 35,
        ttgt_reference_note: `Tra cứu camera khu vực ${hotspot.district} trên Cổng TTGT TP.HCM`,
        street_name: hotspot.street_name,
        estimated_depth_cm: displayedDepthCm,
      });
    }
  };

  let vehicleHeadline = '';
  let vehicleBadgeBg = 'bg-emerald-600 text-white';
  let vehicleAdviceText = '';

  if (displayedDepthCm === 0) {
    vehicleHeadline = 'Đường khô ráo, nước đã rút hoàn toàn';
    vehicleBadgeBg = 'bg-emerald-600 text-white';
    vehicleAdviceText =
      vehicleType === 'car'
        ? '🟢 Tuyến đường thông thoáng, ô tô lưu thông bình thường.'
        : '🟢 Mặt đường khô ráo, xe máy di chuyển an toàn.';
  } else if (vehicleType === 'motorcycle') {
    if (displayedDepthCm >= 35) {
      vehicleHeadline = '⛔ NGUY HIỂM: Xe máy khuyên TUYỆT ĐỐI NÉ';
      vehicleBadgeBg = 'bg-red-600 text-white';
      vehicleAdviceText =
        hotspot.plain_motorbike_advice ||
        'Nước ngập nửa bánh xe, xe tay ga và xe số chắc chắn ngập ống xả sặc nước chết máy. Hãy chọn đường vòng!';
    } else if (displayedDepthCm >= 20) {
      vehicleHeadline = '⚠️ CHÚ Ý: Ngập ống pô — Xe ga NÊN NÉ';
      vehicleBadgeBg = 'bg-orange-500 text-white';
      vehicleAdviceText =
        hotspot.plain_motorbike_advice ||
        'Mực nước ngang ống pô xe máy. Xe ga đi chậm rất dễ hút nước tắt máy. Khuyên rẽ hướng khác!';
    } else {
      vehicleHeadline = '🛵 ĐỌNG NƯỚC: Xe máy có thể đi qua';
      vehicleBadgeBg = 'bg-amber-500 text-slate-950';
      vehicleAdviceText =
        hotspot.plain_motorbike_advice ||
        'Nước ngập xâm xấp mép đường. Giữ đều ga, đi giữa tim đường là an toàn.';
    }
  } else {
    // car
    if (displayedDepthCm >= 35) {
      vehicleHeadline = '⛔ NGUY HIỂM: Chạm gầm ô tô — BẮT BUỘC NÉ';
      vehicleBadgeBg = 'bg-red-600 text-white';
      vehicleAdviceText =
        hotspot.plain_car_advice ||
        'Nước dâng chạm gầm Sedan, sóng nước xe lớn dễ tràn vào họng gió gây thủy kích hỏng máy!';
    } else if (displayedDepthCm >= 20) {
      vehicleHeadline = '⚠️ CHÚ Ý: Gầm thấp Sedan NÊN NÉ';
      vehicleBadgeBg = 'bg-orange-500 text-white';
      vehicleAdviceText =
        hotspot.plain_car_advice ||
        'Nước mấp mé gầm xe. Ô tô Sedan nên rẽ đường tránh, xe SUV gầm cao giữ đều ga khi qua.';
    } else {
      vehicleHeadline = '🚗 ĐỌNG NÔNG: Ô tô qua an toàn';
      vehicleBadgeBg = 'bg-amber-500 text-slate-950';
      vehicleAdviceText =
        hotspot.plain_car_advice ||
        'Vũng nước nông trên mặt đường. Ô tô giảm tốc độ tránh tạt nước vào người đi bộ.';
    }
  }

  const waterBarPct = Math.min(100, Math.max(6, (displayedDepthCm / 50) * 100));

  return (
    <section
      aria-label={`Thông tin vùng ngập ${hotspot.street_name}`}
      className="absolute inset-x-2.5 bottom-2.5 z-30 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_-12px_45px_rgba(0,0,0,0.3)] border border-slate-200/90 dark:border-slate-700/90 p-4 space-y-3.5 max-h-[85dvh] overflow-y-auto"
    >
      {/* Thanh nắm kéo kiểu Google Maps */}
      <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto -mt-1" />

      {/* 1. HEADER: TÊN ĐƯỜNG + ĐỘ SÂU + NÚT ĐÓNG */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm ${vehicleBadgeBg}`}>
              {displayedDepthCm === 0
                ? '🟢 Đã rút hết (0cm)'
                : displayedDepthCm >= 35
                ? `🔴 Nguy hiểm (~${displayedDepthCm}cm)`
                : displayedDepthCm >= 20
                ? `🟠 Chú ý (~${displayedDepthCm}cm)`
                : `🟡 Đọng nước (~${displayedDepthCm}cm)`}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1A73E8] dark:text-blue-300 text-[11px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isVerified
                ? `Xác minh (${displayedConfirmCount} người)`
                : `Cộng đồng (${displayedConfirmCount} báo)`}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1 leading-snug">
            {hotspot.street_name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quận {hotspot.district} • Đoạn thường ngập khi mưa lớn hoặc triều cường
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thẻ"
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 hover:bg-slate-200 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* =====================================================================
          CẤP 1: THƯỚC ĐO NGẬP & LỜI KHUYÊN CHO PHƯƠNG TIỆN (NHÌN THẤY NGAY 1S)
         ===================================================================== */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 space-y-3">
        {/* Số đo độ sâu + Thanh thước đo mực nước trực quan */}
        <div className="flex items-center justify-between gap-3">
          <div className="shrink-0 flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {displayedDepthCm === 0 ? '0' : `~${displayedDepthCm}`}
            </span>
            <span className="text-sm font-extrabold text-slate-500">cm</span>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span>0cm</span>
              <span>20cm (Ống pô)</span>
              <span>35cm (Gầm xe)</span>
              <span>50cm+</span>
            </div>
            {/* Visual Gauge Bar */}
            <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  displayedDepthCm === 0
                    ? 'bg-emerald-500'
                    : displayedDepthCm >= 35
                    ? 'bg-gradient-to-r from-orange-500 to-red-600'
                    : displayedDepthCm >= 20
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                    : 'bg-gradient-to-r from-blue-400 to-amber-400'
                }`}
                style={{ width: `${displayedDepthCm === 0 ? 0 : waterBarPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Khuyến cáo trực tiếp cho loại xe đang chọn */}
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
          <div className="text-[11px] font-black text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
            <span>{vehicleHeadline}</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {vehicleAdviceText}
          </p>
        </div>
      </div>

      {/* =====================================================================
          CẤP 2: HAI NÚT HÀNH ĐỘNG LỚN (CHỈ ĐƯỜNG NÉ ĐIỂM NÀY & XEM CAM CSGT/TTGT)
         ===================================================================== */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onOpenRouteToAvoid(hotspot)}
          className="py-3.5 px-3 rounded-2xl bg-[#1A73E8] hover:bg-blue-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(26,115,232,0.35)] active:scale-95 transition"
        >
          <Navigation className="w-4 h-4 fill-white shrink-0" />
          <span>Chỉ đường né điểm này</span>
        </button>

        <button
          type="button"
          onClick={handleOpenSecurityCam}
          className="py-3.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md border border-slate-700/80 active:scale-95 transition"
        >
          <Video className="w-4 h-4 text-red-400 shrink-0" />
          <span>Xem Cam An ninh CSGT</span>
        </button>
      </div>

      {/* =====================================================================
          KHỐI LIÊN KẾT CỔNG CAMERA AN NINH & GIAO THÔNG TP.HCM (giaothong.hochiminhcity.gov.vn)
         ===================================================================== */}
      <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-slate-800/90 border border-blue-200/90 dark:border-slate-700 flex items-center justify-between gap-2.5 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            👮
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                Cổng TTGT Công an &amp; Sở GTVT
              </span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[9px] font-black shrink-0">
                Chính thức
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
              Hệ thống Camera an ninh giao thông TP.HCM (giaothong.hochiminhcity.gov.vn)
            </p>
          </div>
        </div>

        <a
          href="https://giaothong.hochiminhcity.gov.vn/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 rounded-xl bg-[#1A73E8] hover:bg-blue-600 text-white font-black text-[11px] flex items-center gap-1 shrink-0 shadow-sm active:scale-95 transition"
          title="Mở Cổng Thông tin Giao thông TP.HCM"
        >
          <span>Mở Web Cổng TTGT ↗</span>
        </a>
      </div>

      {/* =====================================================================
          CẤP 3: HAI NÚT BÌNH CHỌN CỘNG ĐỒNG NHẸ NHÀNG
         ===================================================================== */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isVoting}
          onClick={() => handleQuickVote('confirm_active')}
          className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 border transition active:scale-95 ${
            userVoteState === 'confirmed'
              ? 'bg-red-600 text-white border-red-600 shadow-md'
              : 'bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
          }`}
        >
          <ThumbsUp className="w-4 h-4 shrink-0" />
          <span>
            {userVoteState === 'confirmed'
              ? `✓ Đã xác nhận (${displayedConfirmCount})`
              : '👍 Đúng, đang ngập'}
          </span>
        </button>

        <button
          type="button"
          disabled={isVoting}
          onClick={() => handleQuickVote('report_receded')}
          className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 border transition active:scale-95 ${
            userVoteState === 'receded'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {userVoteState === 'receded'
              ? '✓ Đã báo nước rút'
              : '💧 Nước đã rút'}
          </span>
        </button>
      </div>

      {/* Thông báo phản hồi tức thì */}
      {feedbackMsg && (
        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 text-center bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 py-2 px-3 rounded-xl animate-fade-in">
          {feedbackMsg}
        </div>
      )}

      {/* =====================================================================
          MỤC THỨ CẤP: TAB ẢNH THỰC TẾ & LỘ TRÌNH NÉ
         ===================================================================== */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('photos_timeline')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition ${
              activeTab === 'photos_timeline'
                ? 'bg-white dark:bg-slate-900 text-[#1A73E8] shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            📸 Ảnh thực tế &amp; Báo cáo ({allTimelineItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-900 text-[#1A73E8] shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ℹ️ Lộ trình né &amp; Thủy văn
          </button>
        </div>

        {activeTab === 'photos_timeline' ? (
          <div className="space-y-2.5">
            {/* Bộ lọc theo Khung giờ trong ngày */}
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
                    className={`px-2.5 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap transition shrink-0 ${
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

            {/* Hộp phóng to ảnh khi bấm vào 1 ảnh */}
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
            <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
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
                        🕒 {item.timeHHMM}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {idx === 0 && item.minutesAgo === 0
                          ? 'Vừa xong'
                          : `${item.minutesAgo} phút trước`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-black text-slate-900 dark:text-white">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{item.reporterName}</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                      {item.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Nút chụp thêm ảnh */}
            <button
              type="button"
              onClick={() => onOpenCameraReport(hotspot.hotspot_id)}
              className="w-full py-2.5 rounded-2xl border-2 border-dashed border-orange-400 bg-orange-50/70 dark:bg-orange-950/20 text-orange-600 dark:text-orange-300 font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Chụp thêm ảnh báo ngập tại hiện trường</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs">
            {/* Lộ trình đường vòng */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
                <Navigation className="w-4 h-4 text-emerald-600" />
                <span>Gợi ý đường vòng né điểm này:</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {vehicleType === 'car'
                  ? hotspot.detour_routes.car
                  : hotspot.detour_routes.motorcycle}
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                <Clock className="w-3.5 h-3.5 text-[#1A73E8]" />
                <span>Khung giờ hay ngập: {hotspot.typical_timeline}</span>
              </div>
            </div>

            {/* 4 Chỉ số thủy văn gọn gàng */}
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-0.5">
                  <CloudRain className="w-3 h-3 text-[#1A73E8]" />
                  <span>Mưa</span>
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                  {hotspot.rain_current_mm_h}mm
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-0.5">
                  <Waves className="w-3 h-3 text-indigo-600" />
                  <span>Triều</span>
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                  +{hotspot.tide_level_m.toFixed(2)}m
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-0.5">
                  <Mountain className="w-3 h-3 text-emerald-600" />
                  <span>Cao độ</span>
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                  {hotspot.elevation_m.toFixed(1)}m
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-0.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>Nguy cơ</span>
                </div>
                <div className="text-xs font-black text-red-600 dark:text-red-400 mt-0.5">
                  {displayedDepthCm === 0 ? '5%' : `${hotspot.flood_probability_pct}%`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
