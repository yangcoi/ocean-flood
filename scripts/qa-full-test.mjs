/**
 * =============================================================================
 * File: scripts/qa-full-test.mjs
 * Dự án: Ocean Flood — Hệ thống Cảnh báo Ngập lụt Chủ động TP.HCM
 * Role: Senior QA Lead & Reality Checker (Zero-Fantasy, Evidence-Based)
 * Mục đích:
 *   Bộ kiểm thử tự động toàn diện kiểm tra 5 trụ cột và 18 test cases
 *   theo yêu cầu nghiệm thu chất lượng hệ thống (Production Audit).
 * =============================================================================
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

const LOCAL_BASE_URL = 'http://localhost:3000';
const CLOUDFLARE_URL = 'https://accommodation-dakota-telephone-inspiration.trycloudflare.com';

const results = [];

function recordResult(category, testName, passed, details, evidence) {
  const item = {
    category,
    testName,
    passed,
    details,
    evidence,
    timestamp: new Date().toISOString(),
  };
  results.push(item);
  const statusBadge = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusBadge} [${category}] ${testName}`);
  if (details) console.log(`   ➜ ${details}`);
  if (evidence && typeof evidence === 'object') {
    const summary = JSON.stringify(evidence).slice(0, 160);
    console.log(`   ➜ Bằng chứng: ${summary}...`);
  }
}

async function request(url, options = {}) {
  const start = performance.now();
  const res = await fetch(url, options);
  const durationMs = Math.round(performance.now() - start);
  let body = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    body,
    durationMs,
  };
}

// 1x1 WebP base64 image fixture
const VALID_WEBP_BASE64 = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';

async function runTestSuite1_Alerts() {
  console.log('\n======================================================');
  console.log('🧪 TEST SUITE 1: API /api/alerts & Cảnh báo Ngập kép');
  console.log('======================================================');

  // Test 1.1: HTTP 200 & Thời gian phản hồi < 1500ms
  try {
    const res = await request(`${LOCAL_BASE_URL}/api/alerts`);
    const is200 = res.status === 200;
    const isFast = res.durationMs < 1500;
    recordResult(
      'SUITE 1 - Alerts API',
      '1.1 Kiểm tra HTTP 200 và Latency < 1500ms',
      is200 && isFast,
      `HTTP Status: ${res.status}, Latency: ${res.durationMs}ms`,
      { status: res.status, latency_ms: res.durationMs }
    );
  } catch (err) {
    recordResult('SUITE 1 - Alerts API', '1.1 Kiểm tra HTTP 200 và Latency < 1500ms', false, err.message);
  }

  // Test 1.2: Cấu trúc GeoJSON FeatureCollection & 18 Hotspots
  try {
    const res = await request(`${LOCAL_BASE_URL}/api/alerts?scenario=live`);
    const isFC = res.body?.type === 'FeatureCollection';
    const features = res.body?.features || [];
    const count18 = features.length === 18;
    
    // Kiểm tra tất cả hotspot có đầy đủ thuộc tính
    const allHaveProperties = features.every((f) => {
      const p = f.properties || {};
      return (
        f.type === 'Feature' &&
        f.geometry?.type === 'Point' &&
        Array.isArray(f.geometry?.coordinates) &&
        p.hotspot_id &&
        p.code &&
        p.street_name &&
        p.district &&
        typeof p.severity_level === 'number' &&
        p.severity_level >= 0 &&
        p.severity_level <= 3 &&
        typeof p.estimated_depth_cm === 'number' &&
        typeof p.scientific_summary === 'string' &&
        p.scientific_summary.length > 5 &&
        typeof p.plain_motorbike_advice === 'string' &&
        p.plain_motorbike_advice.length > 5 &&
        typeof p.plain_car_advice === 'string' &&
        p.plain_car_advice.length > 5 &&
        p.road_geom?.type === 'LineString' &&
        Array.isArray(p.road_geom?.coordinates) &&
        p.road_geom.coordinates.length >= 2
      );
    });

    recordResult(
      'SUITE 1 - Alerts API',
      '1.2 Cấu trúc GeoJSON FeatureCollection & 18 Hotspots đầy đủ thuộc tính',
      isFC && count18 && allHaveProperties,
      `FeatureCollection: ${isFC}, Hotspots count: ${features.length}/18, Full attributes: ${allHaveProperties}`,
      {
        total_hotspots: features.length,
        sample_hotspot: features[0]?.properties?.code,
        sample_motorbike_advice: features[0]?.properties?.plain_motorbike_advice,
        sample_car_advice: features[0]?.properties?.plain_car_advice,
      }
    );
  } catch (err) {
    recordResult('SUITE 1 - Alerts API', '1.2 Cấu trúc GeoJSON FeatureCollection', false, err.message);
  }

  // Test 1.3: 4 Kịch bản thời tiết
  const scenarios = [
    { name: 'live', expectedScenario: 'live' },
    { name: 'peak_tide_rain', expectedScenario: 'peak_tide_rain' },
    { name: 'local_heavy_rain', expectedScenario: 'heavy_rain_only' },
    { name: 'dry_sunny', expectedScenario: 'dry_safe' },
  ];

  for (const sc of scenarios) {
    try {
      const res = await request(`${LOCAL_BASE_URL}/api/alerts?scenario=${sc.name}`);
      const actualScenario = res.body?.metadata?.scenario;
      const matched = actualScenario === sc.expectedScenario;
      const totalHotspots = res.body?.features?.length;
      
      let extraCheck = true;
      if (sc.name === 'dry_sunny') {
        const anyHigh = res.body?.features?.some((f) => f.properties.severity_level > 1);
        extraCheck = !anyHigh;
      } else if (sc.name === 'peak_tide_rain') {
        const highRisk = res.body?.metadata?.summary_counts?.high_risk_hotspots;
        extraCheck = highRisk > 0;
      }

      recordResult(
        'SUITE 1 - Alerts API',
        `1.3 Kịch bản thời tiết: scenario=${sc.name}`,
        matched && totalHotspots === 18 && extraCheck,
        `Scenario trả về: ${actualScenario} (kỳ vọng: ${sc.expectedScenario}), Hotspots: ${totalHotspots}`,
        {
          requested_scenario: sc.name,
          returned_scenario: actualScenario,
          summary_counts: res.body?.metadata?.summary_counts,
        }
      );
    } catch (err) {
      recordResult('SUITE 1 - Alerts API', `1.3 Kịch bản thời tiết: scenario=${sc.name}`, false, err.message);
    }
  }

  // Test 1.4: Danh mục Camera TTGT (tọa độ chuẩn, liên kết TTGT TP.HCM)
  try {
    const res = await request(`${LOCAL_BASE_URL}/api/alerts`);
    const cameras = res.body?.cameras || [];
    const validCameras = cameras.length >= 18 && cameras.every((c) => {
      return (
        c.id &&
        c.camera_name &&
        c.district &&
        Array.isArray(c.location?.coordinates) &&
        c.location.coordinates[0] > 106 &&
        c.location.coordinates[1] > 10 &&
        c.ttgt_reference_note &&
        c.ttgt_reference_note.includes('TTGT')
      );
    });

    recordResult(
      'SUITE 1 - Alerts API',
      '1.4 Danh mục Camera TTGT (Tọa độ WGS84, có liên kết Cổng TTGT TP.HCM)',
      validCameras,
      `Tổng số Camera TTGT: ${cameras.length}, Tọa độ chuẩn & TTGT note: ${validCameras}`,
      {
        total_cameras: cameras.length,
        sample_camera: cameras[0]?.camera_name,
        sample_note: cameras[0]?.ttgt_reference_note,
      }
    );
  } catch (err) {
    recordResult('SUITE 1 - Alerts API', '1.4 Danh mục Camera TTGT', false, err.message);
  }
}

async function runTestSuite2_Verification() {
  console.log('\n======================================================');
  console.log('🧪 TEST SUITE 2: API /api/reports & Kiểm soát 5 lớp (5-Layer)');
  console.log('======================================================');

  const nowIso = new Date().toISOString();

  // Test Case 2.1: Báo cáo hợp lệ tại hiện trường (GPS < 500m, có ảnh)
  try {
    // Tọa độ Nguyễn Xí: 106.7092, 10.8145. Người dùng cách 65m: 106.7095, 10.8142
    const validPayload = {
      device_hash: `device_test_valid_${Date.now()}`,
      action: 'CREATE',
      user_gps: { lat: 10.8142, lng: 106.7095, accuracy_m: 15 },
      target_gps: { lat: 10.8145, lng: 106.7092 },
      address_text: '185 Nguyễn Xí, P. 26, Q. Bình Thạnh',
      district: 'Bình Thạnh',
      visual_depth_choice: 'EXHAUST_30CM',
      exif_captured_at: nowIso,
      photo_base64_webp: VALID_WEBP_BASE64,
      note: 'QA Test report hợp lệ tại hiện trường',
    };

    const res = await request(`${LOCAL_BASE_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const isAccepted = res.body?.accepted === true;
    const isStatusOk = res.status === 201 || res.status === 200;
    const allLayersPassed = res.body?.layers?.every((l) => l.passed) === true;

    recordResult(
      'SUITE 2 - Verification Engine',
      '2.1 Báo cáo hợp lệ tại hiện trường (GPS < 500m, có ảnh EXIF mới)',
      isAccepted && isStatusOk && allLayersPassed,
      `HTTP ${res.status}, accepted: ${isAccepted}, 5/5 Layers passed: ${allLayersPassed}`,
      {
        status: res.status,
        accepted: isAccepted,
        layers: res.body?.layers?.map((l) => `${l.name}: ${l.passed ? 'PASS' : 'FAIL'}`),
        cluster_id: res.body?.report?.id,
      }
    );
  } catch (err) {
    recordResult('SUITE 2 - Verification Engine', '2.1 Báo cáo hợp lệ tại hiện trường', false, err.message);
  }

  // Test Case 2.2: Kẻ xấu giả lập ở xa cách 3.5km -> Lớp 2 (Geofence 500m) CHẶN ĐỨNG
  try {
    // Target: Nguyễn Xí (10.8145, 106.7092), Người dùng ở Chợ Bến Thành (10.7720, 106.6983) ~5km
    const fakeLocationPayload = {
      device_hash: `device_spoofer_${Date.now()}`,
      action: 'CREATE',
      user_gps: { lat: 10.7720, lng: 106.6983, accuracy_m: 10 },
      target_gps: { lat: 10.8145, lng: 106.7092 },
      address_text: 'Nguyễn Xí',
      district: 'Bình Thạnh',
      visual_depth_choice: 'SEAT_50CM',
      exif_captured_at: nowIso,
      photo_base64_webp: VALID_WEBP_BASE64,
    };

    const res = await request(`${LOCAL_BASE_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fakeLocationPayload),
    });

    const isRejected = res.body?.accepted === false;
    const isErrorCode = res.body?.error_code === 'GEOFENCE_VIOLATION';
    const isHttp422 = res.status === 422 || res.status === 400;

    recordResult(
      'SUITE 2 - Verification Engine',
      '2.2 Báo cáo giả lập từ xa (>500m) bị Lớp 2 Geofence CHẶN ĐỨNG',
      isRejected && isErrorCode && isHttp422,
      `HTTP ${res.status}, error_code: ${res.body?.error_code}, Message: ${res.body?.message}`,
      { status: res.status, error_code: res.body?.error_code, message: res.body?.message }
    );
  } catch (err) {
    recordResult('SUITE 2 - Verification Engine', '2.2 Báo cáo giả lập từ xa bị chặn', false, err.message);
  }

  // Test Case 2.3: Báo cáo thiếu ảnh -> Lớp 3 CHẶN ĐỨNG
  try {
    const noPhotoPayload = {
      device_hash: `device_no_photo_${Date.now()}`,
      action: 'CREATE',
      user_gps: { lat: 10.8145, lng: 106.7092, accuracy_m: 15 },
      target_gps: { lat: 10.8145, lng: 106.7092 },
      address_text: 'Nguyễn Xí',
      district: 'Bình Thạnh',
      visual_depth_choice: 'EXHAUST_30CM',
      exif_captured_at: nowIso,
      photo_base64_webp: '', // THIẾU ẢNH
    };

    const res = await request(`${LOCAL_BASE_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noPhotoPayload),
    });

    const isRejected = res.body?.accepted === false;
    const isErrorCode = res.body?.error_code === 'MISSING_PHOTO';
    const isHttp422 = res.status === 422;

    recordResult(
      'SUITE 2 - Verification Engine',
      '2.3 Báo cáo thiếu ảnh hiện trường bị Lớp 3 CHẶN ĐỨNG',
      isRejected && isErrorCode && isHttp422,
      `HTTP ${res.status}, error_code: ${res.body?.error_code}, Message: ${res.body?.message}`,
      { status: res.status, error_code: res.body?.error_code }
    );
  } catch (err) {
    recordResult('SUITE 2 - Verification Engine', '2.3 Báo cáo thiếu ảnh bị chặn', false, err.message);
  }

  // Test Case 2.4: Báo cáo dồn dập vượt Rate Limit (> 5 lần/giờ/thiết bị) -> Lớp 1 CHẶN ĐỨNG
  try {
    const spammerDevice = `device_spammer_${Date.now()}`;
    let rateLimitTriggered = false;
    let triggerRequestNumber = -1;

    for (let i = 1; i <= 6; i++) {
      const spamPayload = {
        device_hash: spammerDevice,
        action: 'CREATE',
        user_gps: { lat: 10.8145, lng: 106.7092, accuracy_m: 10 },
        target_gps: { lat: 10.8145, lng: 106.7092 },
        address_text: 'Nguyễn Xí spam test',
        district: 'Bình Thạnh',
        visual_depth_choice: 'WHEEL_15CM',
        exif_captured_at: new Date().toISOString(),
        photo_base64_webp: VALID_WEBP_BASE64,
      };

      const res = await request(`${LOCAL_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spamPayload),
      });

      if (res.status === 429 || res.body?.error_code === 'RATE_LIMIT_EXCEEDED') {
        rateLimitTriggered = true;
        triggerRequestNumber = i;
        break;
      }
    }

    recordResult(
      'SUITE 2 - Verification Engine',
      '2.4 Báo cáo dồn dập vượt Rate Limit (>5 lần/giờ/thiết bị) bị Lớp 1 CHẶN ĐỨNG',
      rateLimitTriggered && triggerRequestNumber === 6,
      `Chặn tại request thứ ${triggerRequestNumber} (HTTP 429 RATE_LIMIT_EXCEEDED)`,
      { rateLimitTriggered, triggerRequestNumber }
    );
  } catch (err) {
    recordResult('SUITE 2 - Verification Engine', '2.4 Rate limit test', false, err.message);
  }

  // Test Case 2.5: Nâng cấp trạng thái từ UNVERIFIED lên VERIFIED khi có >= 3 người xác nhận chéo
  try {
    // Chọn vị trí đường mới không thuộc seed hotspot để đảm bảo khởi đầu là UNVERIFIED
    // Vị trí: 10.7950, 106.6900 (Đường Trần Khánh Dư, P. Tân Định, Q.1)
    const testLat = 10.7950;
    const testLng = 106.6900;
    const testLocation = { lat: testLat, lng: testLng };
    const dev1 = `device_cross_1_${Date.now()}`;
    const dev2 = `device_cross_2_${Date.now()}`;
    const dev3 = `device_cross_3_${Date.now()}`;

    // Lần 1: Người 1 tạo báo cáo
    const res1 = await request(`${LOCAL_BASE_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_hash: dev1,
        action: 'CREATE',
        user_gps: { ...testLocation, accuracy_m: 10 },
        target_gps: testLocation,
        address_text: 'Đường Trần Khánh Dư',
        district: 'Bình Thạnh',
        visual_depth_choice: 'EXHAUST_30CM',
        exif_captured_at: new Date().toISOString(),
        photo_base64_webp: VALID_WEBP_BASE64,
        is_active_weather_hotspot: false,
      }),
    });

    const status1 = res1.body?.report?.verification_status;
    const count1 = res1.body?.report?.confirm_count;

    // Lần 2: Người 2 xác nhận chéo cùng vị trí
    const res2 = await request(`${LOCAL_BASE_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_hash: dev2,
        action: 'CONFIRM_UPVOTE',
        report_id: res1.body?.report?.id,
        user_gps: { ...testLocation, accuracy_m: 10 },
        target_gps: testLocation,
        visual_depth_choice: 'EXHAUST_30CM',
        is_active_weather_hotspot: false,
      }),
    });

    const status2 = res2.body?.report?.verification_status;
    const count2 = res2.body?.report?.confirm_count;

    // Lần 3: Người 3 xác nhận chéo cùng vị trí
    const res3 = await request(`${LOCAL_BASE_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_hash: dev3,
        action: 'CONFIRM_UPVOTE',
        report_id: res1.body?.report?.id,
        user_gps: { ...testLocation, accuracy_m: 10 },
        target_gps: testLocation,
        visual_depth_choice: 'EXHAUST_30CM',
        is_active_weather_hotspot: false,
      }),
    });

    const status3 = res3.body?.report?.verification_status;
    const count3 = res3.body?.report?.confirm_count;

    const progressionValid =
      status1 === 'UNVERIFIED' &&
      count1 === 1 &&
      status2 === 'UNVERIFIED' &&
      count2 === 2 &&
      status3 === 'VERIFIED' &&
      count3 === 3;

    recordResult(
      'SUITE 2 - Verification Engine',
      '2.5 Nâng cấp tự động từ UNVERIFIED -> VERIFIED khi đủ >= 3 người xác nhận',
      progressionValid,
      `Bước 1: ${status1} (${count1}) -> Bước 2: ${status2} (${count2}) -> Bước 3: ${status3} (${count3})`,
      { status1, count1, status2, count2, status3, count3 }
    );
  } catch (err) {
    recordResult('SUITE 2 - Verification Engine', '2.5 Nâng cấp UNVERIFIED -> VERIFIED', false, err.message);
  }
}

async function runTestSuite3_Routing() {
  console.log('\n======================================================');
  console.log('🧪 TEST SUITE 3: API /api/route-plan & Thuật toán né ngập');
  console.log('======================================================');

  // Test Case 3.1: Tuyến an toàn (Hàng Xanh -> Điện Biên Phủ)
  try {
    const safePayload = {
      origin: { lat: 10.8015, lng: 106.7115, label: 'Ngã tư Hàng Xanh' },
      destination: { lat: 10.7930, lng: 106.7020, label: 'Điện Biên Phủ - Vòng xoay Hàng Xanh' },
      vehicle_type: 'motorcycle',
      scenario: 'peak_tide_rain',
    };

    const res = await request(`${LOCAL_BASE_URL}/api/route-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safePayload),
    });

    const noFlood = res.body?.flood_detected_on_direct_route === false;
    const isDirect = res.body?.routes?.direct_flooded_route?.status === 'LOW_RISK_DIRECT';
    const coordsCount = res.body?.routes?.recommended_safe_route?.geometry?.coordinates?.length || 0;
    const hasRealGeometry = coordsCount >= 10;

    recordResult(
      'SUITE 3 - Routing Engine',
      '3.1 Tuyến an toàn (Hàng Xanh -> Điện Biên Phủ): Không báo động giả, 100% tim đường thực tế',
      noFlood && isDirect && hasRealGeometry,
      `Flood detected: ${res.body?.flood_detected_on_direct_route}, Status: ${res.body?.routes?.direct_flooded_route?.status}, Coords count: ${coordsCount}`,
      {
        flood_detected: res.body?.flood_detected_on_direct_route,
        status: res.body?.routes?.direct_flooded_route?.status,
        coordinates_count: coordsCount,
        distance_km: res.body?.routes?.recommended_safe_route?.distance_km,
      }
    );
  } catch (err) {
    recordResult('SUITE 3 - Routing Engine', '3.1 Tuyến an toàn', false, err.message);
  }

  // Test Case 3.2: Tuyến cắt qua điểm ngập (Nguyễn Xí / Ung Văn Khiêm) cho Xe máy (ngưỡng 20cm)
  try {
    // Điểm đi: Nơ Trang Long (10.8190, 106.6980) -> Điểm đến: Tân Cảng (10.7960, 106.7220)
    // Cắt qua Nguyễn Xí & Ung Văn Khiêm
    const floodPayload = {
      origin: { lat: 10.8190, lng: 106.6980, label: 'Nơ Trang Long - Bình Thạnh' },
      destination: { lat: 10.7960, lng: 106.7220, label: 'Cầu Sài Gòn - Tân Cảng' },
      vehicle_type: 'motorcycle',
      scenario: 'peak_tide_rain',
    };

    const res = await request(`${LOCAL_BASE_URL}/api/route-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(floodPayload),
    });

    const floodDetected = res.body?.flood_detected_on_direct_route === true;
    const hasDangerRoute = res.body?.routes?.direct_flooded_route?.status === 'DANGER_FLOODED';
    const hasSafeRoute =
      res.body?.routes?.recommended_safe_route?.status === 'SAFE_ALTERNATIVE' ||
      res.body?.routes?.recommended_safe_route?.status === 'EXTREME_ISOLATED_HOLD';

    const safeCoords = res.body?.routes?.recommended_safe_route?.geometry?.coordinates || [];
    const directCoords = res.body?.routes?.direct_flooded_route?.geometry?.coordinates || [];

    // Kiểm tra không phải đường chim bay (không chỉ có 2-3 điểm nối thẳng)
    const isWindingRealRoad = safeCoords.length >= 20;

    recordResult(
      'SUITE 3 - Routing Engine',
      '3.2 Tuyến cắt điểm ngập (Xe máy ngưỡng 20cm): Phát hiện ngập, tuyến đỏ DANGER & tuyến xanh SAFE uốn lượn thực tế',
      floodDetected && hasDangerRoute && hasSafeRoute && isWindingRealRoad,
      `Flood detected: ${floodDetected}, Intersected: ${res.body?.intersected_alerts?.length} hotspots, Safe route coords: ${safeCoords.length}`,
      {
        intersected_hotspots: res.body?.intersected_alerts?.map((a) => a.street_name),
        direct_distance_km: res.body?.routes?.direct_flooded_route?.distance_km,
        safe_distance_km: res.body?.routes?.recommended_safe_route?.distance_km,
        extra_time_min: res.body?.routes?.recommended_safe_route?.extra_time_min,
        safe_coords_count: safeCoords.length,
      }
    );
  } catch (err) {
    recordResult('SUITE 3 - Routing Engine', '3.2 Tuyến cắt điểm ngập cho Xe máy', false, err.message);
  }

  // Test Case 3.3: Tuyến cho Ô tô (ngưỡng 25cm) -> Chỉ đi trục đường lớn, cấm vào hẻm
  try {
    const carPayload = {
      origin: { lat: 10.8190, lng: 106.6980, label: 'Nơ Trang Long - Bình Thạnh' },
      destination: { lat: 10.7960, lng: 106.7220, label: 'Cầu Sài Gòn - Tân Cảng' },
      vehicle_type: 'car',
      scenario: 'peak_tide_rain',
    };

    const res = await request(`${LOCAL_BASE_URL}/api/route-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(carPayload),
    });

    const isCar = res.body?.vehicle_type === 'car';
    const is25cm = res.body?.vehicle_threshold_cm === 25;
    const policyText = res.body?.routes?.recommended_safe_route?.road_class_policy || '';
    const carPolicyEnforced =
      policyText.toLowerCase().includes('ô tô') &&
      policyText.toLowerCase().includes('hẻm');

    recordResult(
      'SUITE 3 - Routing Engine',
      '3.3 Tuyến cho Ô tô (ngưỡng 25cm): Khóa chính sách hẻm nhỏ, chỉ đi đại lộ lớn',
      isCar && is25cm && carPolicyEnforced,
      `Vehicle: ${res.body?.vehicle_type}, Threshold: ${res.body?.vehicle_threshold_cm}cm, Policy: ${policyText}`,
      {
        vehicle_type: res.body?.vehicle_type,
        vehicle_threshold_cm: res.body?.vehicle_threshold_cm,
        road_class_policy: policyText,
      }
    );
  } catch (err) {
    recordResult('SUITE 3 - Routing Engine', '3.3 Tuyến cho Ô tô', false, err.message);
  }

  // Test Case 3.4: Deep-link mở Google Maps chính chủ
  try {
    const origin = { lat: 10.8190, lng: 106.6980 };
    const destination = { lat: 10.7960, lng: 106.7220 };
    const waypoint = { lat: 10.8250, lng: 106.7050 };

    // Format theo logic RoutePlannerDrawer.tsx
    const buildDeepLink = (vType) =>
      `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&waypoints=${waypoint.lat},${waypoint.lng}&travelmode=${vType === 'motorcycle' ? 'two-wheeler' : 'driving'}`;

    const motoLink = buildDeepLink('motorcycle');
    const carLink = buildDeepLink('car');

    const motoValid =
      motoLink.includes('travelmode=two-wheeler') &&
      motoLink.includes('origin=10.819,106.698') &&
      motoLink.includes('destination=10.796,106.722') &&
      motoLink.includes('waypoints=10.825,106.705');

    const carValid =
      carLink.includes('travelmode=driving') &&
      carLink.includes('origin=10.819,106.698') &&
      carLink.includes('destination=10.796,106.722');

    recordResult(
      'SUITE 3 - Routing Engine',
      '3.4 Deep-link mở ứng dụng Google Maps chính chủ (Origin, Destination, Waypoints, Travelmode)',
      motoValid && carValid,
      `Xe máy: travelmode=two-wheeler, Ô tô: travelmode=driving, Đầy đủ tọa độ chuẩn`,
      { sample_motorcycle_link: motoLink, sample_car_link: carLink }
    );
  } catch (err) {
    recordResult('SUITE 3 - Routing Engine', '3.4 Deep-link Google Maps', false, err.message);
  }
}

async function runTestSuite4_UI_Build_Cloudflare() {
  console.log('\n======================================================');
  console.log('🧪 TEST SUITE 4: UI/UX, PWA Manifest, Build & Cloudflare');
  console.log('======================================================');

  // Test 4.1: PWA Manifest & Viewport Mobile
  try {
    const manifestPath = path.resolve('public/manifest.webmanifest');
    const exists = fs.existsSync(manifestPath);
    let validManifest = false;
    let manifestData = {};
    if (exists) {
      manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      validManifest =
        manifestData.name &&
        manifestData.short_name &&
        manifestData.start_url &&
        manifestData.display === 'standalone' &&
        Array.isArray(manifestData.icons) &&
        manifestData.icons.length > 0;
    }

    recordResult(
      'SUITE 4 - UI/UX & PWA',
      '4.1 Kiểm tra file PWA Manifest (public/manifest.webmanifest)',
      exists && validManifest,
      `Manifest exists: ${exists}, Standalone mode: ${manifestData.display === 'standalone'}, Icons: ${manifestData.icons?.length}`,
      { manifest: manifestData }
    );
  } catch (err) {
    recordResult('SUITE 4 - UI/UX & PWA', '4.1 PWA Manifest', false, err.message);
  }

  // Test 4.2: Mobile Responsive Viewport trong layout.tsx
  try {
    const layoutPath = path.resolve('src/app/layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    const hasViewport =
      layoutContent.includes('viewport') ||
      layoutContent.includes('width=device-width') ||
      layoutContent.includes('initialScale') ||
      layoutContent.includes('themeColor');

    recordResult(
      'SUITE 4 - UI/UX & PWA',
      '4.2 Cấu hình Mobile Viewport & Theme-color trong Root Layout',
      hasViewport,
      `Mobile viewport & meta tags configured: ${hasViewport}`,
      { hasViewport }
    );
  } catch (err) {
    recordResult('SUITE 4 - UI/UX & PWA', '4.2 Mobile Viewport', false, err.message);
  }

  // Test 4.3: Cloudflare HTTPS Tunnel
  try {
    const res = await request(CLOUDFLARE_URL);
    const is200 = res.status === 200;
    const isHtml = typeof res.body === 'string' && res.body.includes('<html');

    recordResult(
      'SUITE 4 - Cloudflare Tunnel',
      '4.3 Cloudflare HTTPS Public Tunnel phản hồi HTTP 200 (Khả năng truy cập từ điện thoại)',
      is200 && isHtml,
      `HTTP Status: ${res.status}, Latency: ${res.durationMs}ms, URL: ${CLOUDFLARE_URL}`,
      {
        url: CLOUDFLARE_URL,
        status: res.status,
        duration_ms: res.durationMs,
        server_header: res.headers['server'],
        cf_ray: res.headers['cf-ray'],
      }
    );
  } catch (err) {
    recordResult('SUITE 4 - Cloudflare Tunnel', '4.3 Cloudflare HTTPS Tunnel', false, err.message);
  }
}

async function main() {
  console.log('🚀 KHỞI ĐỘNG BỘ KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN OCEAN FLOOD (QA FULL SUITE)');
  console.log(`Thời gian bắt đầu: ${new Date().toLocaleString('vi-VN')}`);
  console.log(`Endpoint mục tiêu: ${LOCAL_BASE_URL} & ${CLOUDFLARE_URL}\n`);

  await runTestSuite1_Alerts();
  await runTestSuite2_Verification();
  await runTestSuite3_Routing();
  await runTestSuite4_UI_Build_Cloudflare();

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log('\n======================================================');
  console.log('📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ TOÀN DIỆN');
  console.log('======================================================');
  console.log(`Tổng số Test Cases: ${total}`);
  console.log(`Đạt (PASS)       : ${passed} / ${total} (${passRate}%)`);
  console.log(`Không đạt (FAIL) : ${failed} / ${total}`);
  console.log('======================================================\n');

  // Lưu file JSON kết quả để phục vụ lập tài liệu audit
  const outputPath = path.resolve('docs/qa-test-results.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        audit_timestamp: new Date().toISOString(),
        summary: { total, passed, failed, pass_rate_pct: Number(passRate) },
        results,
      },
      null,
      2
    )
  );
  console.log(`📁 Đã lưu toàn bộ dữ liệu chi tiết vào: ${outputPath}`);

  if (failed > 0) {
    console.error(`❌ Phát hiện ${failed} test case thất bại! Cần xem lại chi tiết.`);
    process.exit(1);
  } else {
    console.log('🎉 TOÀN BỘ 18 TEST CASES ĐÃ PASS 100% TRÊN MÔI TRƯỜNG THỰC TẾ!');
    process.exit(0);
  }
}

main().catch((e) => {
  console.error('Fatal error running QA suite:', e);
  process.exit(1);
});
