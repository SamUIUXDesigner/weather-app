// js/api.js
// API-Key ist jetzt im Backend versteckt!

// In Entwicklung: localhost, in Produktion: die Vercel-URL
const API_BASE_URL = import.meta.env.PROD 
    ? '' // Relativer Pfad für Vercel
    : 'http://localhost:3000';

export const fetchData = async function (URL, callback, errorCallback) {
    try {
        const response = await fetch(URL);
        
        if (!response.ok) {
            throw new Error(`HTTP Fehler! Status: ${response.status}`);
        }
        
        const data = await response.json();
        callback(data);
    } catch (error) {
        console.error("Fehler beim Abrufen:", error);
        if (errorCallback) errorCallback(error);
    }
};

export const url = {
    // Aktuelles Wetter
    currentWeather(lat, lon) {
        return `/api/weather?lat=${lat}&lon=${lon}`;
    },
    // 5-Tage-Vorhersage
    forecast(lat, lon) {
        return `/api/forecast?lat=${lat}&lon=${lon}`;
    },
    // Luftqualität
    airPollution(lat, lon) {
        return `/api/air-pollution?lat=${lat}&lon=${lon}`;
    },
    // Stadtname aus Koordinaten
    reverseGeo(lat, lon) {
        return `/api/reverse-geo?lat=${lat}&lon=${lon}`;
    },
    // Stadt suchen
    geo(query) {
        return `/api/geo?q=${query}`;
    },
};