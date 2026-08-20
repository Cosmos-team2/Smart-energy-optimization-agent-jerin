"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, Navigation, Sparkles, ArrowDown, Building, Zap, ShieldCheck, Compass, Loader2 } from "lucide-react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

import { PRESETS, LocationPreset } from "@/data/facilityPresets";

interface OSMLandingMapProps {
  selectedFacility?: LocationPreset;
  onSelectFacility?: (facility: LocationPreset) => void;
  onLaunchDashboard?: (facility: LocationPreset) => void;
  onScrollToDashboard?: () => void;
}

export function OSMLandingMap({
  selectedFacility: propSelectedFacility,
  onSelectFacility,
  onLaunchDashboard,
  onScrollToDashboard,
}: OSMLandingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef  = useRef<LeafletMap | null>(null);
  const markerRef       = useRef<LeafletMarker | null>(null);

  const [currentLocation,  setCurrentLocation]  = useState({
    lat: propSelectedFacility?.lat || 12.8452,
    lon: propSelectedFacility?.lon || 77.6602,
  });
  const [selectedFacility, setSelectedFacility] = useState<LocationPreset>(
    propSelectedFacility || PRESETS[0]
  );
  const [searchQuery,      setSearchQuery]      = useState(
    propSelectedFacility?.address || PRESETS[0].address
  );
  const [isSearching,      setIsSearching]      = useState(false);
  const [isEvaluating,     setIsEvaluating]     = useState(false);
  const [evalProgress,     setEvalProgress]     = useState(0);
  const [isFlying,         setIsFlying]         = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    import("leaflet").then((leafletModule) => {
      const L = leafletModule.default || leafletModule;
      if (mapInstanceRef.current) mapInstanceRef.current.remove();

      const map = L.map(mapContainerRef.current!, {
        center: [currentLocation.lat, currentLocation.lon],
        zoom: 13,
        zoomControl: false,
        scrollWheelZoom: false,
      });
      // Immediately set dark bg so no white shows while tiles load
      mapContainerRef.current!.style.background = "#0A0A14";
      L.control.zoom({ position: "bottomright" }).addTo(map);
      // Satellite base layer (ESRI World Imagery — free, no API key)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: '&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics',
          maxZoom: 19,
          keepBuffer: 4,
        }
      ).addTo(map);
      // Hybrid label overlay (roads + place names on top of satellite)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, opacity: 0.75 }
      ).addTo(map);

      const customIcon = L.divIcon({
        className: "custom-osm-marker",
        html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
          <span style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(139,92,246,0.4);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
          <div style="position:relative;width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#8B5CF6,#6366F1);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(139,92,246,0.6);">
            <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div></div>`,
        iconSize: [36, 36], iconAnchor: [18, 18],
      });

      const popupHtml = (f: LocationPreset) => `
        <div style="font-family:'Inter',sans-serif;font-size:12px;color:#F0F0FF;background:#16161F;padding:10px 12px;border-radius:10px;border:1px solid rgba(139,92,246,0.25);min-width:200px;">
          <b style="color:#A78BFA;font-size:13px;">${f.name}</b><br/>
          <span style="color:#A0A0B8;font-size:11px;">${f.address}</span><br/>
          <span style="color:#34D399;font-size:10px;font-weight:600;">DISCOM: ${f.discom}</span>
        </div>`;

      const marker = L.marker([currentLocation.lat, currentLocation.lon], { icon: customIcon }).addTo(map);
      marker.bindPopup(popupHtml(selectedFacility));
      mapInstanceRef.current = map;
      markerRef.current      = marker;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setCurrentLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 14, {
            animate: true, duration: 2.5, easeLinearity: 0.15,
          });
          marker.setLatLng([pos.coords.latitude, pos.coords.longitude]);
        }, () => {}, { timeout: 5000 });
      }
      // Wire defocus blur on map movement
      map.on("movestart", () => setIsFlying(true));
      map.on("moveend",   () => setIsFlying(false));
    });
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  const flyToLocation = (lat: number, lon: number, facility: LocationPreset) => {
    setSelectedFacility(facility);
    if (onSelectFacility) onSelectFacility(facility);
    setSearchQuery(facility.address);
    setCurrentLocation({ lat, lon });
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], 14, {
        animate: true, duration: 2.2, easeLinearity: 0.12,
      });
      markerRef.current.setLatLng([lat, lon]);
      const popupContent = `<div style="font-family:'Inter',sans-serif;font-size:12px;color:#F0F0FF;background:#16161F;padding:10px 12px;border-radius:10px;border:1px solid rgba(139,92,246,0.25);min-width:200px;">
        <b style="color:#A78BFA;font-size:13px;">${facility.name}</b><br/>
        <span style="color:#A0A0B8;font-size:11px;">${facility.address}</span><br/>
        <span style="color:#34D399;font-size:10px;font-weight:600;">DISCOM: ${facility.discom}</span>
      </div>`;
      markerRef.current.bindPopup(popupContent).openPopup();
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    try {
      const matched = PRESETS.find(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matched) { flyToLocation(matched.lat, matched.lon, matched); }
      else {
        const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`, { headers: { "User-Agent": "OptiGrid/0.1" } });
        const data = await res.json();
        if (data?.length > 0) {
          const lat = parseFloat(data[0].lat), lon = parseFloat(data[0].lon);
          flyToLocation(lat, lon, { name: data[0].display_name.split(",")[0], address: data[0].display_name, lat, lon, discom: "State DISCOM HT Tariff", facilityId: `f_${Math.floor(100 + Math.random() * 900)}` });
        } else flyToLocation(PRESETS[0].lat, PRESETS[0].lon, PRESETS[0]);
      }
    } catch { flyToLocation(PRESETS[0].lat, PRESETS[0].lon, PRESETS[0]); }
    finally { setIsSearching(false); }
  };

  const handleLaunchDashboard = () => {
    setIsEvaluating(true); setEvalProgress(0);
    const iv = setInterval(() => {
      setEvalProgress(prev => {
        if (prev >= 100) {
          clearInterval(iv);
          setIsEvaluating(false);
          if (onSelectFacility) onSelectFacility(selectedFacility);
          if (onLaunchDashboard) {
            onLaunchDashboard(selectedFacility);
          } else {
            document.getElementById("twin")?.scrollIntoView({ behavior: "smooth" });
          }
          return 100;
        }
        return prev + 25;
      });
    }, 280);
  };

  return (
    <div className="relative w-full h-[92vh] sm:h-[88vh] rounded-2xl overflow-hidden shadow-2xl mb-12"
         style={{ border: "1px solid rgba(139,92,246,0.15)" }}>
      <div
        ref={mapContainerRef}
        className="absolute inset-0 z-0"
        style={{
          transition: "filter 0.35s ease, opacity 0.35s ease",
          filter:  isFlying ? "blur(5px) brightness(0.65) saturate(0.7)" : "blur(0px) brightness(1) saturate(1)",
          opacity: isFlying ? 0.85 : 1,
        }}
      />

      {/* Dark vignette overlay */}
      <div className="absolute inset-0 pointer-events-none z-10"
           style={{ background: "linear-gradient(to right, rgba(10,10,20,0.75) 0%, transparent 50%, rgba(10,10,20,0.30) 100%)" }} />

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 bottom-4 w-full max-w-[380px] z-20 flex flex-col">
        <div className="glass-panel rounded-2xl p-6 flex flex-col h-full overflow-y-auto gap-4">

          {/* Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg"
                   style={{ background: "var(--gradient-accent)", boxShadow: "var(--shadow-glow-sm)" }}>
                <Zap className="h-4 w-4 fill-current text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight" style={{ color: "var(--color-text)" }}>
                    OptiGrid
                  </span>
                  <span className="badge badge-purple">AGENT v0.1</span>
                </div>
                <p className="text-[11px]" style={{ color: "var(--color-muted)" }}>15-Min Demand Spike Optimizer</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono"
                 style={{ background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.20)", color: "#A78BFA" }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#8B5CF6" }} />
              LIVE
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit}>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-subtle)" }}>
              Focus Location
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                {isSearching
                  ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#8B5CF6" }} />
                  : <Search  className="h-4 w-4"              style={{ color: "#8B5CF6" }} />}
              </div>
              <input
                type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Type a facility or campus address…"
                className="w-full rounded-xl pl-9 pr-20 py-2.5 text-xs focus:outline-none transition-all"
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid rgba(139,92,246,0.20)",
                  color: "var(--color-text)",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(139,92,246,0.50)")}
                onBlur={e  => (e.currentTarget.style.borderColor = "rgba(139,92,246,0.20)")}
              />
              <button type="submit"
                className="absolute inset-y-1 right-1 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 text-white"
                style={{ background: "var(--gradient-accent-h)" }}>
                <Navigation className="h-3 w-3" /> Fly
              </button>
            </div>
          </form>

          {/* Quick presets */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-subtle)" }}>
              Quick Focus Hubs
            </p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
              {PRESETS.map(preset => {
                const active = selectedFacility.name === preset.name;
                return (
                  <button key={preset.name} type="button"
                    onClick={() => flyToLocation(preset.lat, preset.lon, preset)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between"
                    style={{
                      background: active ? "rgba(139,92,246,0.12)" : "rgba(30,30,42,0.6)",
                      border: `1px solid ${active ? "rgba(139,92,246,0.35)" : "rgba(139,92,246,0.10)"}`,
                      color: active ? "#A78BFA" : "var(--color-muted)",
                    }}>
                    <div className="truncate pr-2">
                      <div className="font-semibold text-[11px] truncate" style={{ color: active ? "#A78BFA" : "var(--color-text)" }}>
                        {preset.name}
                      </div>
                      <div className="text-[10px] truncate" style={{ color: "var(--color-subtle)" }}>{preset.discom}</div>
                    </div>
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0"
                            style={{ color: active ? "#8B5CF6" : "var(--color-subtle)" }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl p-4 space-y-2.5"
               style={{ background: "var(--color-surface-2)", border: "1px solid rgba(139,92,246,0.12)" }}>
            {[
              { icon: Building,   color: "#A78BFA", label: "Facility",     value: selectedFacility.name },
              { icon: Compass,    color: "#34D399", label: "Coords",       value: `${currentLocation.lat.toFixed(4)}°N, ${currentLocation.lon.toFixed(4)}°E` },
              { icon: ShieldCheck,color: "#818CF8", label: "DISCOM",       value: selectedFacility.discom },
            ].map(({ icon: Icon, color, label, value }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5" style={{ color: "var(--color-subtle)" }}>
                  <Icon className="h-3.5 w-3.5" style={{ color }} /> {label}:
                </span>
                <span className="font-mono font-semibold text-[11px] truncate max-w-[180px]" style={{ color }}>
                  {value}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
              <span className="text-xs" style={{ color: "var(--color-subtle)" }}>Monthly Avoidance:</span>
              <span className="font-extrabold text-sm text-gradient">₹1,30,000</span>
            </div>
          </div>

          {/* Progress */}
          {isEvaluating && (
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1" style={{ color: "#A78BFA" }}>
                <span>Synthesizing site context…</span>
                <span>{evalProgress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--color-surface-3)" }}>
                <div className="h-full rounded-full transition-all duration-300"
                     style={{ width: `${evalProgress}%`, background: "var(--gradient-accent-h)" }} />
              </div>
            </div>
          )}

          {/* CTA */}
          <button type="button" onClick={handleLaunchDashboard} disabled={isEvaluating}
                  className="btn-primary w-full mt-auto group">
            {isEvaluating
              ? <><Loader2 className="h-4 w-4 animate-spin" />Loading Live Grid Twin…</>
              : <><Sparkles className="h-4 w-4" />Launch Live Dashboard<ArrowDown className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform" /></>}
          </button>
        </div>
      </div>

      {/* Scroll pill */}
      <div className="absolute bottom-5 right-1/2 translate-x-1/2 z-20">
        <button
          onClick={() => {
            if (onScrollToDashboard) onScrollToDashboard();
            else document.getElementById("twin")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold shadow-xl transition-all hover:scale-105"
          style={{
            background: "rgba(22,22,31,0.90)",
            border: "1px solid rgba(139,92,246,0.25)",
            color: "var(--color-muted)",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
          Scroll to 3D Digital Twin
          <ArrowDown className="h-3.5 w-3.5" style={{ color: "#8B5CF6" }} />
        </button>
      </div>
    </div>
  );
}
