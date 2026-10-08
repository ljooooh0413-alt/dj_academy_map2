import { NextRequest, NextResponse } from 'next/server';
import { RouteResult, RouteStep, TravelMode } from '@/types/academy';

// Calculate geodesic distance between two points in meters
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Korean maneuver direction translation
function translateManeuver(modifier?: string, name?: string): string {
  const street = name && name.trim() ? `(${name.trim()})` : '';
  const dirMap: Record<string, string> = {
    'sharp right': '급우회전',
    right: '우회전',
    'slight right': '오른쪽 도로 진행',
    straight: '직진',
    'slight left': '왼쪽 도로 진행',
    left: '좌회전',
    'sharp left': '급좌회전',
    'u-turn': '유턴',
  };

  if (!modifier) return `${street || '도로'} 방면으로 진행`;
  const koreanDir = dirMap[modifier] || modifier;
  return `${koreanDir} ${street}`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { startX, startY, endX, endY, mode = 'pedestrian', startName = '출발지', endName = '도착지' } = body;

    let numStartX = parseFloat(startX);
    let numStartY = parseFloat(startY);
    let numEndX = parseFloat(endX);
    let numEndY = parseFloat(endY);

    if (isNaN(numStartX) || isNaN(numStartY) || isNaN(numEndX) || isNaN(numEndY)) {
      return NextResponse.json(
        { success: false, error: '유효한 위경도 좌표가 필요합니다.' },
        { status: 400 }
      );
    }

    // Auto-detect and fix swapped lat/lng (Korea longitude ~124..132, latitude ~33..39)
    if (numStartX < 50 && numStartY > 100) {
      const temp = numStartX;
      numStartX = numStartY;
      numStartY = temp;
    }
    if (numEndX < 50 && numEndY > 100) {
      const temp = numEndX;
      numEndX = numEndY;
      numEndY = temp;
    }

    const travelMode: TravelMode = mode === 'car' ? 'car' : 'pedestrian';
    const tmapApiKey = process.env.TMAP_SERVER_API_KEY || process.env.NEXT_PUBLIC_TMAP_APPKEY;

    // -------------------------------------------------------------------------
    // Provider 1: SK Open API TMAP (if valid API Key is provided)
    // -------------------------------------------------------------------------
    if (tmapApiKey && !tmapApiKey.includes('your_tmap')) {
      try {
        const isPedestrian = travelMode === 'pedestrian';
        const tmapUrl = isPedestrian
          ? 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json'
          : 'https://apis.openapi.sk.com/tmap/routes?version=1&format=json';

        const tmapPayload = isPedestrian
          ? {
              startX: numStartX.toString(),
              startY: numStartY.toString(),
              endX: numEndX.toString(),
              endY: numEndY.toString(),
              reqCoordType: 'WGS84GEO',
              resCoordType: 'WGS84GEO',
              startName: encodeURIComponent(startName),
              endName: encodeURIComponent(endName),
            }
          : {
              startX: numStartX.toString(),
              startY: numStartY.toString(),
              endX: numEndX.toString(),
              endY: numEndY.toString(),
              reqCoordType: 'WGS84GEO',
              resCoordType: 'WGS84GEO',
            };

        const tmapRes = await fetch(tmapUrl, {
          method: 'POST',
          headers: {
            appKey: tmapApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tmapPayload),
          signal: AbortSignal.timeout(5000),
        });

        if (tmapRes.ok) {
          const data = await tmapRes.json();
          if (data.features && data.features.length > 0) {
            const coordinates: [number, number][] = [];
            const steps: RouteStep[] = [];
            let totalDistance = 0;
            let totalDuration = 0;

            const firstProp = data.features[0].properties;
            if (firstProp) {
              totalDistance = firstProp.totalDistance || 0;
              totalDuration = firstProp.totalTime || 0;
            }

            for (const feat of data.features) {
              if (feat.geometry?.type === 'LineString' && Array.isArray(feat.geometry.coordinates)) {
                for (const coord of feat.geometry.coordinates) {
                  // TMAP GeoJSON is [lng, lat] -> convert to [lat, lng] for Leaflet
                  coordinates.push([coord[1], coord[0]]);
                }
              }
              if (feat.properties?.description) {
                steps.push({
                  instruction: feat.properties.description,
                  distance: feat.properties.distance || 0,
                  duration: feat.properties.time || 0,
                });
              }
            }

            if (coordinates.length > 1) {
              const result: RouteResult = {
                mode: travelMode,
                distance: totalDistance,
                duration: totalDuration,
                coordinates,
                steps: steps.length > 0 ? steps.slice(0, 20) : [
                  { instruction: '출발지에서 경로 시작', distance: 0, duration: 0 },
                  { instruction: `도착지 (${endName}) 도착`, distance: totalDistance, duration: totalDuration },
                ],
                source: 'tmap',
                startName,
                endName,
              };
              return NextResponse.json({ success: true, route: result });
            }
          }
        }
      } catch (tmapErr) {
        console.warn('TMAP route request failed, falling back to OSM Road Network:', tmapErr);
      }
    }

    // -------------------------------------------------------------------------
    // Provider 2 & 3: High-Precision OpenStreetMap Road Routing Engines
    // -------------------------------------------------------------------------
    // Try multiple reliable endpoints in sequence
    // For pedestrian in Korea, we prefer driving/foot profiles that strictly adhere to real roads
    const endpointProfiles = travelMode === 'pedestrian'
      ? [
          { url: `https://router.project-osrm.org/route/v1/foot/${numStartX},${numStartY};${numEndX},${numEndY}?overview=full&geometries=geojson&steps=true`, isFoot: true },
          { url: `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${numStartX},${numStartY};${numEndX},${numEndY}?overview=full&geometries=geojson&steps=true`, isFoot: true },
          // If pure foot route is disconnected by highways or lack of sidewalk tags, fall back to car road geometry with walking speeds
          { url: `https://router.project-osrm.org/route/v1/driving/${numStartX},${numStartY};${numEndX},${numEndY}?overview=full&geometries=geojson&steps=true`, isFoot: false },
        ]
      : [
          { url: `https://router.project-osrm.org/route/v1/driving/${numStartX},${numStartY};${numEndX},${numEndY}?overview=full&geometries=geojson&steps=true`, isFoot: false },
          { url: `https://routing.openstreetmap.de/routed-car/route/v1/driving/${numStartX},${numStartY};${numEndX},${numEndY}?overview=full&geometries=geojson&steps=true`, isFoot: false },
        ];

    for (const ep of endpointProfiles) {
      try {
        const osrmRes = await fetch(ep.url, {
          signal: AbortSignal.timeout(4500),
          headers: { 'User-Agent': 'EduMap-Korea/1.0' },
        });

        if (osrmRes.ok) {
          const osrmData = await osrmRes.json();
          if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
            const routeObj = osrmData.routes[0];
            const rawCoords: [number, number][] = routeObj.geometry?.coordinates || [];

            if (rawCoords.length >= 2) {
              // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
              const coordinates: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

              const routeDistance = Math.round(routeObj.distance);
              // Walking speed ~ 4.5 km/h (75 m/min = 1.25 m/s), Driving duration from engine
              let routeDuration = Math.round(routeObj.duration);
              if (travelMode === 'pedestrian' && !ep.isFoot) {
                // If using driving road geometry for walking, recalculate walking duration
                routeDuration = Math.round(routeDistance / 1.2);
              }

              const steps: RouteStep[] = [];
              if (routeObj.legs && routeObj.legs[0]?.steps) {
                for (const step of routeObj.legs[0].steps) {
                  const maneuver = step.maneuver;
                  let instruction = '';

                  if (maneuver?.type === 'depart') {
                    instruction = `출발하여 ${step.name ? `(${step.name})` : '도로'} 방면으로 이동`;
                  } else if (maneuver?.type === 'arrive') {
                    instruction = `도착지 (${endName}) 도착`;
                  } else {
                    const dirText = translateManeuver(maneuver?.modifier, step.name);
                    instruction = `${dirText} 후 ${Math.round(step.distance)}m 진행`;
                  }

                  steps.push({
                    instruction,
                    distance: Math.round(step.distance),
                    duration: Math.round(step.duration),
                  });
                }
              }

              const result: RouteResult = {
                mode: travelMode,
                distance: routeDistance,
                duration: routeDuration,
                coordinates,
                steps: steps.length > 0 ? steps.slice(0, 25) : [
                  { instruction: '출발지에서 경로 시작', distance: 0, duration: 0 },
                  { instruction: `도로를 따라 ${routeDistance}m 이동`, distance: routeDistance, duration: routeDuration },
                  { instruction: `도착지 (${endName}) 부근 도착`, distance: 0, duration: 0 },
                ],
                source: 'osrm',
                startName,
                endName,
              };

              return NextResponse.json({ success: true, route: result });
            }
          }
        }
      } catch (err) {
        console.warn(`Routing endpoint ${ep.url.split('/')[2]} failed, trying next...`, err);
      }
    }

    // -------------------------------------------------------------------------
    // Fallback: If external routing is completely unreachable, generate
    // multi-point continuous straight path with real distance and speed
    // -------------------------------------------------------------------------
    const distMeters = calculateHaversineDistance(numStartY, numStartX, numEndY, numEndX);
    const estDistance = Math.round(distMeters * 1.25);
    const estDuration = travelMode === 'pedestrian'
      ? Math.round(estDistance / 1.2)
      : Math.round(estDistance / 8.5);

    // Provide clean start-to-end direct line
    const fallbackCoords: [number, number][] = [
      [numStartY, numStartX],
      [numEndY, numEndX],
    ];

    const result: RouteResult = {
      mode: travelMode,
      distance: estDistance,
      duration: estDuration,
      coordinates: fallbackCoords,
      steps: [
        { instruction: `출발지 (${startName})에서 이동 시작`, distance: 0, duration: 0 },
        { instruction: `목적지 (${endName}) 방면으로 약 ${estDistance}m 이동`, distance: estDistance, duration: estDuration },
        { instruction: `목적지 (${endName}) 도착`, distance: 0, duration: 0 },
      ],
      source: 'fallback',
      startName,
      endName,
      warning: '네트워크 상태로 인해 직선 기준 경로로 연결되었습니다.',
    };

    return NextResponse.json({ success: true, route: result });
  } catch (error) {
    console.error('Route API handler error:', error);
    return NextResponse.json(
      { success: false, error: '경로 탐색 처리 중 문제가 발생했습니다.' },
      { status: 500 }
    );
  }
}
