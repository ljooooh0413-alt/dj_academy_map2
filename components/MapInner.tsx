'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Academy, FavoriteItem, RouteResult } from '@/types/academy';

interface MapInnerProps {
  academies: Academy[];
  favorites: FavoriteItem[];
  selectedAcademy: Academy | null;
  userCoords: [number, number] | null;
  departureCoords?: [number, number] | null;
  center: [number, number];
  zoom: number;
  activeRoute: RouteResult | null;
  onSelectAcademy: (academy: Academy) => void;
  onFindRoute: (academy: Academy) => void;
  onToggleFavorite: (academy: Academy) => void;
  onMapClick?: (coords: [number, number]) => void;
}

// Marker Icon Generator
function createMarkerIcon(color: string, isFav: boolean, isSelected: boolean) {
  const size = isSelected ? 34 : 26;
  const pinSvg = isFav
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#f59e0b" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.25));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="#ffffff"></circle></svg>`;

  return L.divIcon({
    html: pinSvg,
    className: 'custom-leaflet-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export default function MapInner({
  academies,
  favorites,
  selectedAcademy,
  userCoords,
  departureCoords,
  center,
  zoom,
  activeRoute,
  onSelectAcademy,
  onFindRoute,
  onToggleFavorite,
  onMapClick,
}: MapInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const departureMarkerRef = useRef<L.Marker | null>(null);

  // Set of favorited academy IDs
  const favIds = new Set(favorites.map((f) => f.academyId));

  // 1. Initialize Map instance once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
    });

    // High quality OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const routeGroup = L.layerGroup().addTo(map);

    markersLayerRef.current = markersGroup;
    routeLayerRef.current = routeGroup;
    mapRef.current = map;

    // Click handler on map
    map.on('click', (e) => {
      if (onMapClick) {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Update Map Center & Zoom when region changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom, { animate: true });
  }, [center, zoom]);

  // 3. User Location Pulsating Marker (GPS)
  useEffect(() => {
    if (!mapRef.current) return;

    if (userCoords) {
      const userDotIcon = L.divIcon({
        html: '<div class="user-pulse-dot" title="내 위치"></div>',
        className: 'user-marker-icon',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker(userCoords, { icon: userDotIcon, zIndexOffset: 200 })
          .bindTooltip('내 GPS 위치', { direction: 'top', offset: [0, -8] })
          .addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLatLng(userCoords);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userCoords]);

  // 4. Departure Pin (when user selects custom start point on map)
  useEffect(() => {
    if (!mapRef.current) return;

    if (departureCoords && (!userCoords || (departureCoords[0] !== userCoords[0] && departureCoords[1] !== userCoords[1]))) {
      const depIcon = L.divIcon({
        html: `<div style="background:#10b981; color:#fff; width:28px; height:28px; border-radius:50%; border:2px solid #fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; box-shadow:0 3px 8px rgba(0,0,0,0.35);">출발</div>`,
        className: 'custom-dep-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      if (!departureMarkerRef.current) {
        departureMarkerRef.current = L.marker(departureCoords, { icon: depIcon, zIndexOffset: 800 })
          .bindTooltip('지정된 출발지', { direction: 'top', offset: [0, -10] })
          .addTo(mapRef.current);
      } else {
        departureMarkerRef.current.setLatLng(departureCoords);
      }
    } else if (departureMarkerRef.current) {
      departureMarkerRef.current.remove();
      departureMarkerRef.current = null;
    }
  }, [departureCoords, userCoords]);

  // 5. Render Academy Markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    academies.forEach((academy) => {
      const isFav = favIds.has(academy.id);
      const isSelected = selectedAcademy?.id === academy.id;

      // Color coding by category
      let pinColor = '#2563eb'; // blue for general/admission
      if (academy.realmName.includes('국제화') || academy.courseName.includes('영어') || academy.courseName.includes('어학')) {
        pinColor = '#059669'; // emerald
      } else if (academy.realmName.includes('예능') || academy.courseName.includes('음악') || academy.courseName.includes('미술')) {
        pinColor = '#9333ea'; // purple
      } else if (academy.realmName.includes('직업') || academy.courseName.includes('코딩')) {
        pinColor = '#d97706'; // amber
      }

      const icon = createMarkerIcon(pinColor, isFav, isSelected);

      const marker = L.marker([academy.lat, academy.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : isFav ? 500 : 0,
      });

      // Custom Popup HTML
      const popupHtml = `
        <div style="min-width: 220px; max-width: 260px; font-family: inherit;">
          <div style="background-color: #f8fafc; padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-size: 11px; font-weight: 600; color: #2563eb; margin-bottom: 2px;">
              ${academy.realmName} · ${academy.courseName}
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.3;">
              ${academy.name}
            </div>
          </div>
          <div style="padding: 10px 14px; font-size: 12px; color: #475569;">
            <div style="margin-bottom: 6px; line-height: 1.4;">${academy.roadAddress}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 10px;">${academy.tuition || academy.tel}</div>
            <div style="display: flex; gap: 6px;">
              <button id="popup-route-${academy.id}" style="flex: 1; padding: 6px 10px; background-color: #2563eb; color: #ffffff; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
                길찾기
              </button>
              <button id="popup-fav-${academy.id}" style="padding: 6px 10px; background-color: ${isFav ? '#fef3c7' : '#f1f5f9'}; color: ${isFav ? '#b45309' : '#334155'}; border: 1px solid ${isFav ? '#fde68a' : '#cbd5e1'}; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
                ${isFav ? '★ 해제' : '☆ 저장'}
              </button>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        offset: [0, -4],
      });

      marker.on('popupopen', () => {
        onSelectAcademy(academy);

        const routeBtn = document.getElementById(`popup-route-${academy.id}`);
        if (routeBtn) {
          routeBtn.onclick = (e) => {
            e.stopPropagation();
            onFindRoute(academy);
          };
        }

        const favBtn = document.getElementById(`popup-fav-${academy.id}`);
        if (favBtn) {
          favBtn.onclick = (e) => {
            e.stopPropagation();
            onToggleFavorite(academy);
          };
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academies, favorites, selectedAcademy]);

  // 6. Focus selected academy
  useEffect(() => {
    if (!mapRef.current || !selectedAcademy) return;
    mapRef.current.setView([selectedAcademy.lat, selectedAcademy.lng], 16, { animate: true });
  }, [selectedAcademy]);

  // 7. Draw Route Polyline strictly along map roads
  useEffect(() => {
    if (!mapRef.current || !routeLayerRef.current) return;

    routeLayerRef.current.clearLayers();

    if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 0) {
      const coords = activeRoute.coordinates;

      // Glow outline for contrast against all map backgrounds (buildings, parks, roads)
      const glowPolyline = L.polyline(coords, {
        color: '#ffffff',
        weight: 8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // Core route stroke - Solid and smooth road path
      const mainColor = activeRoute.mode === 'car' ? '#0284c7' : '#4f46e5';
      const mainPolyline = L.polyline(coords, {
        color: mainColor,
        weight: 5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      });

      routeLayerRef.current.addLayer(glowPolyline);
      routeLayerRef.current.addLayer(mainPolyline);

      // Start pin (출발지)
      const startCoord = coords[0];
      const startIcon = L.divIcon({
        html: `<div style="background:#10b981; color:#fff; width:26px; height:26px; border-radius:50%; border:2px solid #fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; box-shadow:0 3px 8px rgba(0,0,0,0.35);">출발</div>`,
        className: 'route-start-icon',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const startMarker = L.marker(startCoord, { icon: startIcon, zIndexOffset: 900 })
        .bindTooltip(`출발: ${activeRoute.startName || '출발지'}`, { direction: 'top', offset: [0, -10] });
      routeLayerRef.current.addLayer(startMarker);

      // End pin (학원 도착지)
      const endCoord = coords[coords.length - 1];
      const endIcon = L.divIcon({
        html: `<div style="background:#ef4444; color:#fff; width:26px; height:26px; border-radius:50%; border:2px solid #fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; box-shadow:0 3px 8px rgba(0,0,0,0.35);">도착</div>`,
        className: 'route-end-icon',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const endMarker = L.marker(endCoord, { icon: endIcon, zIndexOffset: 950 })
        .bindTooltip(`도착: ${activeRoute.endName || '목적지'}`, { direction: 'top', offset: [0, -10] });
      routeLayerRef.current.addLayer(endMarker);

      // Smoothly fit map view to cover the entire road route
      try {
        const bounds = glowPolyline.getBounds();
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, {
            padding: [60, 60],
            maxZoom: 16,
            animate: true,
          });
        }
      } catch (err) {
        console.warn('Could not fit bounds on route:', err);
      }
    }
  }, [activeRoute]);

  return <div ref={mapContainerRef} className="w-full h-full relative" />;
}
