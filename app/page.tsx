'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Map from '@/components/Map';
import RoutePanel from '@/components/RoutePanel';
import AcademyDetailModal from '@/components/AcademyDetailModal';
import AuthModal from '@/components/AuthModal';
import SettingsModal from '@/components/SettingsModal';
import { Academy, FavoriteItem, RouteResult, TravelMode } from '@/types/academy';
import { REGIONS_DATA } from '@/lib/data/sampleAcademies';
import {
  getLocalFavorites,
  toggleLocalFavorite,
  fetchRemoteFavorites,
  addRemoteFavorite,
  removeRemoteFavorite,
  syncFavoritesOnLogin,
  getSupabaseClient,
} from '@/lib/supabase';

export default function HomePage() {
  // Region & Filter State
  const [selectedOfcdc, setSelectedOfcdc] = useState<string>('G10'); // Default to Daejeon
  const [selectedZone, setSelectedZone] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

  // Data State
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoadingAcademies, setIsLoadingAcademies] = useState<boolean>(true);

  // Active Selection & Modals
  const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // User & Geolocation & Departure
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [departureCoords, setDepartureCoords] = useState<[number, number] | null>(null);
  const [departureName, setDepartureName] = useState<string>('내 현재 위치');
  const [isPickingDeparture, setIsPickingDeparture] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Route & Navigation State
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [routeAcademy, setRouteAcademy] = useState<Academy | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('pedestrian');
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);

  // Map View State
  const currentRegion = REGIONS_DATA.find((r) => r.code === selectedOfcdc) || REGIONS_DATA[0];
  const [mapCenter, setMapCenter] = useState<[number, number]>(currentRegion.defaultCenter);
  const [mapZoom, setMapZoom] = useState<number>(14);

  // 1. Initial Geolocation Detection (async callback only)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserCoords(coords);
          setDepartureCoords(coords);
          setDepartureName('내 GPS 현재 위치');
        },
        (err) => {
          console.log('GPS not available, using region center default:', err.message);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    }
  }, []);

  // 2. Initial Auth & Favorites Loading
  useEffect(() => {
    let isCancelled = false;
    const initAuthAndFavorites = async () => {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data: { session } } = await client.auth.getSession();
          if (session?.user && !isCancelled) {
            setUserEmail(session.user.email || null);
            setUserId(session.user.id);
            const remoteFavs = await fetchRemoteFavorites(session.user.id);
            if (!isCancelled) setFavorites(remoteFavs);
            return;
          }
        } catch (err) {
          console.warn('Session check error:', err);
        }
      }
      if (!isCancelled) {
        setFavorites(getLocalFavorites());
      }
    };

    initAuthAndFavorites();
    return () => {
      isCancelled = true;
    };
  }, []);

  // 3. Fetch Academies when region, zone, category, or search changes
  useEffect(() => {
    let isMounted = true;

    const loadAcademies = async () => {
      setIsLoadingAcademies(true);
      try {
        const params = new URLSearchParams({
          ofcdcCode: selectedOfcdc,
          zone: selectedZone,
          query: searchQuery,
          realm: selectedCategory,
        });

        const res = await fetch(`/api/academies?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.academies) {
            setAcademies(data.academies);
          }
        }
      } catch (err) {
        console.error('Failed to load academies:', err);
      } finally {
        if (isMounted) {
          setIsLoadingAcademies(false);
        }
      }
    };

    loadAcademies();
    return () => {
      isMounted = false;
    };
  }, [selectedOfcdc, selectedZone, searchQuery, selectedCategory]);

  // Update map center when region changes
  const handleSelectOfcdc = (code: string) => {
    setSelectedOfcdc(code);
    const reg = REGIONS_DATA.find((r) => r.code === code);
    if (reg) {
      setMapCenter(reg.defaultCenter);
      setMapZoom(14);
      setDepartureCoords(reg.defaultCenter);
      setDepartureName(`${reg.name.replace('교육청', '')} 중심`);
    }
    setActiveRoute(null);
    setRouteAcademy(null);
  };

  // 4. Precise Road Route Navigation
  const handleFindRoute = useCallback(async (
    academy: Academy,
    mode: TravelMode = travelMode,
    customStart?: [number, number],
    customStartName?: string
  ) => {
    setIsLoadingRoute(true);
    setRouteAcademy(academy);
    setTravelMode(mode);

    // Determine actual departure coordinates
    const startPt = customStart || departureCoords || userCoords || currentRegion.defaultCenter;
    const startLabel = customStartName || departureName || (userCoords ? '내 위치' : '출발지');

    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startX: startPt[1], // lng
          startY: startPt[0], // lat
          endX: academy.lng,  // lng
          endY: academy.lat,  // lat
          mode,
          startName: startLabel,
          endName: academy.name,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.route) {
          setActiveRoute(json.route);
        } else {
          console.warn('Route API error, response was not successful');
        }
      } else {
        console.warn('Route request failed status:', response.status);
      }
    } catch (err) {
      console.error('Route calculation network error:', err);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [departureCoords, userCoords, currentRegion, departureName, travelMode]);

  // 5. Change Travel Mode (Walk <-> Car)
  const handleChangeTravelMode = (newMode: TravelMode) => {
    if (routeAcademy) {
      handleFindRoute(routeAcademy, newMode);
    }
  };

  // 6. Map Click Handler for Setting Departure on Roads
  const handleMapClick = (coords: [number, number]) => {
    if (isPickingDeparture) {
      setDepartureCoords(coords);
      setDepartureName('지도에서 직접 지정한 출발지');
      setIsPickingDeparture(false);

      if (routeAcademy) {
        handleFindRoute(routeAcademy, travelMode, coords, '지도 지정 출발지');
      }
    }
  };

  // 7. Favorite Toggle with Hybrid Storage Sync
  const handleToggleFavorite = async (academy: Academy) => {
    const isCurrentlyFav = favorites.some((f) => f.academyId === academy.id);

    if (userId) {
      if (isCurrentlyFav) {
        setFavorites((prev) => prev.filter((f) => f.academyId !== academy.id));
        await removeRemoteFavorite(userId, academy.id);
      } else {
        const added = await addRemoteFavorite(userId, academy);
        if (added) {
          setFavorites((prev) => [added, ...prev]);
        }
      }
    } else {
      const { favorites: updated } = toggleLocalFavorite(academy);
      setFavorites(updated);
    }
  };

  // 8. Locate Me Button (GPS)
  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) {
      alert('브라우저가 위치 정보를 지원하지 않습니다.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(coords);
        setDepartureCoords(coords);
        setDepartureName('내 GPS 현재 위치');
        setMapCenter(coords);
        setMapZoom(16);
        setIsLocating(false);

        // If an academy is already selected for routing, refresh route from new position
        if (routeAcademy) {
          handleFindRoute(routeAcademy, travelMode, coords, '내 GPS 현재 위치');
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        setMapCenter(currentRegion.defaultCenter);
      },
      { timeout: 7000 }
    );
  };

  // 9. Auth State Handlers
  const handleLoginSuccess = async (email: string, uId: string) => {
    setUserEmail(email);
    setUserId(uId);
    const mergedFavs = await syncFavoritesOnLogin(uId);
    setFavorites(mergedFavs);
  };

  const handleLogout = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setUserEmail(null);
    setUserId(null);
    setFavorites(getLocalFavorites());
  };

  const isSelectedFav = selectedAcademy
    ? favorites.some((f) => f.academyId === selectedAcademy.id)
    : false;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* 1. Header */}
      <Header
        selectedOfcdc={selectedOfcdc}
        onSelectOfcdc={handleSelectOfcdc}
        selectedZone={selectedZone}
        onSelectZone={setSelectedZone}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        favoritesCount={favorites.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userEmail={userEmail}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
      />

      {/* 2. Main Content Layout (Sidebar + Map) */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          academies={academies}
          favorites={favorites}
          selectedAcademyId={selectedAcademy?.id || null}
          onSelectAcademy={(academy) => {
            setSelectedAcademy(academy);
            setMapCenter([academy.lat, academy.lng]);
            setMapZoom(16);
          }}
          onFindRoute={(academy) => {
            setSelectedAcademy(academy);
            handleFindRoute(academy);
          }}
          onToggleFavorite={handleToggleFavorite}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          userCoords={userCoords}
          isLoading={isLoadingAcademies}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Map Area */}
        <main className="flex-1 relative h-[50vh] md:h-full">
          {/* Visual indicator when user is picking departure on map */}
          {isPickingDeparture && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
              <span>📍 지도의 원하는 도로/위치를 클릭하여 출발지로 지정하세요</span>
              <button
                onClick={() => setIsPickingDeparture(false)}
                className="ml-2 text-emerald-200 hover:text-white underline text-[11px]"
              >
                취소
              </button>
            </div>
          )}

          <Map
            academies={academies}
            favorites={favorites}
            selectedAcademy={selectedAcademy}
            userCoords={userCoords}
            departureCoords={departureCoords}
            center={mapCenter}
            zoom={mapZoom}
            activeRoute={activeRoute}
            onSelectAcademy={(academy) => setSelectedAcademy(academy)}
            onFindRoute={(academy) => handleFindRoute(academy)}
            onToggleFavorite={handleToggleFavorite}
            onMapClick={handleMapClick}
          />

          {/* Floating Route Navigation Panel */}
          {activeRoute && routeAcademy && (
            <RoutePanel
              route={activeRoute}
              targetAcademy={routeAcademy}
              currentMode={travelMode}
              onChangeMode={handleChangeTravelMode}
              onClose={() => {
                setActiveRoute(null);
                setRouteAcademy(null);
                setIsPickingDeparture(false);
              }}
              isLoading={isLoadingRoute}
              onSetPickDepartureMode={() => setIsPickingDeparture(!isPickingDeparture)}
              isPickingDeparture={isPickingDeparture}
            />
          )}
        </main>
      </div>

      {/* 3. Academy Detail Modal */}
      <AcademyDetailModal
        academy={selectedAcademy}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        isFavorite={isSelectedFav}
        onToggleFavorite={handleToggleFavorite}
        onFindRoute={(academy, mode) => handleFindRoute(academy, mode)}
      />

      {/* 4. Supabase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userEmail={userEmail}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* 5. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onCredentialsUpdated={() => {
          setFavorites(getLocalFavorites());
        }}
      />
    </div>
  );
}
