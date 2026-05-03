import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import * as api from './api.js';

// Fix default marker icons (leaflet issue with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helper: recenter map when location changes
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], 14);
  }, [lat, lng, map]);
  return null;
}

// Direct Overpass API call (fallback when not authenticated)
async function fetchHospitalsOverpass(lat, lng, radius = 5000) {
  const timeout = radius > 50000 ? 30 : 15;
  const query = `[out:json][timeout:${timeout}];(node["amenity"~"^(hospital|clinic|doctors)$"](around:${radius},${lat},${lng});way["amenity"~"^(hospital|clinic|doctors)$"](around:${radius},${lat},${lng}););out center 30;`;
  const body = new URLSearchParams({ data: query });
  
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: body.toString(),
  });
  
  if (!res.ok) throw new Error('Overpass API failed');
  const data = await res.json();
  
  return (data.elements || [])
    .map(el => {
      const tags = el.tags || {};
      const name = tags.name || tags['name:en'] || tags.operator;
      if (!name) return null;
      const elLat = el.type === 'node' ? el.lat : el.center?.lat;
      const elLng = el.type === 'node' ? el.lon : el.center?.lon;
      if (!elLat || !elLng) return null;
      const dist = haversine(lat, lng, elLat, elLng);
      return {
        id: `osm-${el.type}-${el.id}`,
        name,
        lat: elLat,
        lng: elLng,
        distance: dist,
        type: tags.amenity || 'hospital',
        phone: tags.phone || tags['contact:phone'],
        isOpen: tags.opening_hours === '24/7' || tags.emergency === 'yes',
        address: [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', '),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 20);
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HospitalMap({ showToast, lang = 'en' }) {
  const [userPos, setUserPos] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  const labels = {
    en: { yourLocation: 'Your Location', nearbyHospitals: 'Nearby Hospitals', searching: 'Searching hospitals via OpenStreetMap...', noResults: 'No hospitals found nearby. Try expanding search radius.', getDirections: 'Get Directions', refresh: 'Refresh Results', gettingLocation: 'Getting your location...', locationDenied: 'Location access denied. Please allow location access for accurate results.', geoNotSupported: 'Geolocation is not supported by your browser' },
    hi: { yourLocation: 'आपकी स्थिति', nearbyHospitals: 'नजदीकी अस्पताल', searching: 'OpenStreetMap से अस्पताल खोज रहे हैं...', noResults: 'पास में कोई अस्पताल नहीं मिला। खोज सीमा बढ़ाने का प्रयास करें।', getDirections: 'दिशा-निर्देश', refresh: 'परिणाम ताज़ा करें', gettingLocation: 'आपकी स्थिति प्राप्त कर रहे हैं...', locationDenied: 'स्थान एक्सेस अस्वीकृत। सटीक परिणामों के लिए स्थान अनुमति दें।', geoNotSupported: 'आपका ब्राउज़र जियोलोकेशन का समर्थन नहीं करता' },
    bn: { yourLocation: 'আপনার অবস্থান', nearbyHospitals: 'কাছের হাসপাতাল', searching: 'OpenStreetMap থেকে হাসপাতাল খুঁজছি...', noResults: 'কাছে কোনো হাসপাতাল পাওয়া যায়নি।', getDirections: 'দিকনির্দেশ', refresh: 'ফলাফল রিফ্রেশ করুন', gettingLocation: 'আপনার অবস্থান পাচ্ছি...', locationDenied: 'অবস্থান অ্যাক্সেস অস্বীকৃত। সঠিক ফলাফলের জন্য অনুমতি দিন।', geoNotSupported: 'আপনার ব্রাউজার জিওলোকেশন সমর্থন করে না' },
    ta: { yourLocation: 'உங்கள் இருப்பிடம்', nearbyHospitals: 'அருகிலுள்ள மருத்துவமனைகள்', searching: 'OpenStreetMap மூலம் மருத்துவமனைகளைத் தேடுகிறது...', noResults: 'அருகில் மருத்துவமனைகள் இல்லை.', getDirections: 'வழிகாட்டுதல்', refresh: 'புதுப்பிக்கவும்', gettingLocation: 'உங்கள் இருப்பிடத்தைப் பெறுகிறது...', locationDenied: 'இருப்பிட அணுகல் மறுக்கப்பட்டது.', geoNotSupported: 'உங்கள் உலாவி புவி இருப்பிடத்தை ஆதரிக்கவில்லை' },
    te: { yourLocation: 'మీ స్థానం', nearbyHospitals: 'సమీపంలోని ఆసుపత్రులు', searching: 'OpenStreetMap నుండి ఆసుపత్రులను శోధిస్తోంది...', noResults: 'సమీపంలో ఆసుపత్రులు కనుగొనబడలేదు.', getDirections: 'దిశలు', refresh: 'ఫలితాలను రిఫ్రెష్ చేయండి', gettingLocation: 'మీ స్థానాన్ని పొందుతోంది...', locationDenied: 'స్థాన ప్రాప్యత నిరాకరించబడింది.', geoNotSupported: 'మీ బ్రౌజర్ జియోలొకేషన్‌కు మద్దతు ఇవ్వదు' },
    mr: { yourLocation: 'तुमचे स्थान', nearbyHospitals: 'जवळची रुग्णालये', searching: 'OpenStreetMap वरून रुग्णालये शोधत आहे...', noResults: 'जवळपास कोणतेही रुग्णालय सापडले नाही.', getDirections: 'दिशा मिळवा', refresh: 'परिणाम रिफ्रेश करा', gettingLocation: 'तुमचे स्थान मिळवत आहे...', locationDenied: 'स्थान प्रवेश नाकारला. कृपया अनुमती द्या.', geoNotSupported: 'तुमचा ब्राउझर जिओलोकेशन समर्थन करत नाही' }
  };
  const t = labels[lang] || labels.en;

  useEffect(() => {
    if (!navigator.geolocation) {
      setError(t.geoNotSupported);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        fetchHospitals(latitude, longitude);
      },
      (err) => {
        // Try IP-based geolocation as fallback
        fetch('https://ipapi.co/json/')
          .then(r => r.json())
          .then(data => {
            if (data.latitude && data.longitude) {
              setUserPos({ lat: data.latitude, lng: data.longitude });
              fetchHospitals(data.latitude, data.longitude);
              setError(t.locationDenied);
            } else {
              setError(t.locationDenied);
              setLoading(false);
            }
          })
          .catch(() => {
            setError(t.locationDenied);
            setLoading(false);
          });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const fetchHospitals = async (lat, lng) => {
    setLoading(true);
    setError(null);
    const radiusList = [5000, 10000, 20000, 50000, 100000]; // Try expanding radius: 5km, 10km, 20km, 50km, 100km
    const MIN_RESULTS = 5;
    try {
      // Try backend API first (authenticated)
      if (api.getToken()) {
        for (const radius of radiusList) {
          const res = await api.getNearbyFacilities(lat, lng, radius);
          const items = (res.data?.items || []).map(h => ({
            ...h,
            lat: h.location?.lat,
            lng: h.location?.lng,
            distance: h.distanceMeters,
          }));
          if (items.length >= MIN_RESULTS) {
            setHospitals(items);
            setLoading(false);
            return;
          }
        }
      }
      // Fallback: direct Overpass API with expanding radius
      for (const radius of radiusList) {
        const results = await fetchHospitalsOverpass(lat, lng, radius);
        if (results.length >= MIN_RESULTS) {
          setHospitals(results);
          setLoading(false);
          return;
        }
      }
      // If we still have some results (less than 5), show them
      const lastResults = await fetchHospitalsOverpass(lat, lng, 100000);
      setHospitals(lastResults);
    } catch (err) {
      // Last resort: direct Overpass with max radius
      try {
        const results = await fetchHospitalsOverpass(lat, lng, 100000);
        setHospitals(results);
      } catch (e) {
        setError('Failed to fetch nearby hospitals. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters) => {
    if (!meters) return '';
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
  };

  const openDirections = (lat, lng, name) => {
    const url = `https://www.openstreetmap.org/directions?from=${userPos?.lat},${userPos?.lng}&to=${lat},${lng}`;
    window.open(url, '_blank');
    showToast?.(`Opening directions to ${name}...`);
  };

  if (!userPos && loading) {
    return (
      <div className="map-loading">
        <div className="typing-indicator">
          <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{t.gettingLocation}</p>
      </div>
    );
  }

  return (
    <div className="hospital-map-container">
      {error && (
        <div style={{ fontSize: '12px', color: 'var(--warning)', padding: '6px 10px', background: 'var(--warning-light)', borderRadius: '6px', marginBottom: '8px' }}>
          ⚠️ {error}
        </div>
      )}
      
      {userPos && (
        <div className="leaflet-map-wrapper" style={{ height: '200px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '12px' }}>
          <MapContainer
            center={[userPos.lat, userPos.lng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap lat={userPos.lat} lng={userPos.lng} />
            <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
              <Popup>📍 {t.yourLocation}</Popup>
            </Marker>
            {hospitals.map((h) => (
              h.lat && h.lng && (
                <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
                  <Popup>
                    <strong>{h.name}</strong><br />
                    {h.address && <><span>{h.address}</span><br /></>}
                    {h.phone && <><span>📞 {h.phone}</span><br /></>}
                    <span>📍 {formatDistance(h.distance)}</span>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      )}

      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
        {t.nearbyHospitals} {hospitals.length > 0 && `(${hospitals.length})`}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div className="typing-indicator">
            <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{t.searching}</p>
        </div>
      ) : hospitals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
          {t.noResults}
        </div>
      ) : (
        hospitals.slice(0, 8).map((h) => (
          <div key={h.id} className="hospital-card">
            <div className="hospital-name">{h.name}</div>
            <div className="hospital-meta">
              <span>🏥 {h.type || 'Hospital'}</span>
              <span>📍 {formatDistance(h.distance)}</span>
            </div>
            {(h.phone || h.isOpen !== undefined) && (
              <div className="hospital-meta" style={{ marginBottom: '6px' }}>
                {h.phone && <span>📞 {h.phone}</span>}
                {h.isOpen && <span style={{ color: 'var(--secondary)' }}>● Open 24/7</span>}
              </div>
            )}
            {h.address && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>{h.address}</div>
            )}
            <button className="hospital-btn" onClick={() => openDirections(h.lat, h.lng, h.name)}>
              {t.getDirections}
            </button>
          </div>
        ))
      )}

      {userPos && (
        <button
          className="hospital-btn"
          style={{ width: '100%', marginTop: '8px', background: 'var(--surface2)' }}
          onClick={() => fetchHospitals(userPos.lat, userPos.lng)}
        >
          🔄 {t.refresh}
        </button>
      )}
    </div>
  );
}
