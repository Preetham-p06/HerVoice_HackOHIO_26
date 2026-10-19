"use client";
import { useState } from "react";
import { MapPin, ArrowUpRight, Map } from "lucide-react";

export default function CaseMap({ location }: { location: string }) {
  const [loaded, load] = useState(false);
  const [ready, Ready] = useState(false);
  const query = location?.trim();
  const encoded = encodeURIComponent(query || "");
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const source = key
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encoded}`
    : `https://www.google.com/maps?q=${encoded}&z=14&output=embed`;
  return (
    <section className="panel case-map" aria-labelledby="case-map-title">
      <div className="case-map-heading">
        <h2 id="case-map-title"><MapPin size={20} /> Reported location</h2>
        {query && <a href={`https://www.google.com/maps/search/?api=1&query=${encoded}`} target="_blank" rel="noreferrer">Open Google Maps <ArrowUpRight size={16} /></a>}
      </div>
      {query ? <>
        <p className="map-location-label">{query}</p>
        {loaded ? <div className="case-map-frame">
          {!ready && <p className="map-loading" role="status">Loading Google Maps…</p>}
          <iframe
            title="Google map of reported location"
            src={source}
            referrerPolicy={key ? "strict-origin-when-cross-origin" : "no-referrer"}
            allowFullScreen
            onLoad={() => Ready(true)}
          />
        </div> : <div className="map-placeholder">
          <Map size={38} strokeWidth={1.4} aria-hidden="true" />
          <p>See this location on an interactive map.</p>
          <button className="btn" onClick={() => load(true)}>Load Google map <ArrowUpRight size={17} /></button>
          <small>Loads Google Maps and shares this reported location with Google.</small>
        </div>}
        {loaded && <small className="map-fallback">Map not visible? Use Open Google Maps above. A city or region shows an approximate area.</small>}
      </> : <div className="map-placeholder"><MapPin size={35} aria-hidden="true" /><h3>No location shared</h3><p>This person chose not to provide a location.</p></div>}
    </section>
  );
}
