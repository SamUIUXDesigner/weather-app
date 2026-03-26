// js/api.js
// Diese Datei verwaltet alle Verbindungen zur Wetter-API

// Dein API-Schlüssel (wird später über Vercel Environment Variable gesetzt)
// Für lokale Entwicklung kannst du den Key hier lassen
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || "318ec332df17eba3c829e5715a95dd2b";

// Aktuelle Einheit (wird von units.js gesetzt)
let currentUnits = 'metric';

/**
 * Setzt die Einheiten für API-Aufrufe
 * @param {string} units - 'metric' oder 'imperial'
 */
export const setApiUnits = (units) => {
    currentUnits = units;
    console.log(`API-Einheiten auf ${units} gesetzt`);
};

/**
 * Holt Daten von der API
 * @param {string} URL - Die API-URL
 * @param {function} callback - Funktion die mit den Daten aufgerufen wird
 * @param {function} errorCallback - Funktion bei Fehler (optional)
 */
export const fetchData = function (URL, callback, errorCallback) {
    // Für Vercel Serverless Functions brauchen wir keinen API-Key mehr
    // weil der im Backend ist. Aber für lokale Entwicklung lassen wir ihn drin.
    let finalURL = URL;
    
    // Wenn es keine relative URL ist (also nicht /api/...), dann füge API-Key hinzu
    if (!URL.startsWith('/api/')) {
        finalURL = `${URL}&appid=${API_KEY}`;
    }
    
    fetch(finalURL)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP Fehler! Status: ${res.status}`);
            return res.json();
        })
        .then(data => callback(data))
        .catch(error => {
            console.error("Fehler beim Abrufen:", error);
            if (errorCallback) errorCallback(error);
        });
}

/**
 * Alle API-URLs für verschiedene Abfragen
 */
export const url = {
    // Aktuelles Wetter
    currentWeather(lat, lon) {
        // Für Vercel: relative URL zu Serverless Function
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            return `/api/weather?lat=${lat}&lon=${lon}`;
        }
        // Für lokale Entwicklung
        return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnits}`;
    },
    // 5-Tage-Vorhersage
    forecast(lat, lon) {
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            return `/api/forecast?lat=${lat}&lon=${lon}`;
        }
        return `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnits}`;
    },
    // Luftqualität
    airPollution(lat, lon) {
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            return `/api/air-pollution?lat=${lat}&lon=${lon}`;
        }
        return `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}`;
    },
    // Stadtname aus Koordinaten
    reverseGeo(lat, lon) {
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            return `/api/reverse-geo?lat=${lat}&lon=${lon}`;
        }
        return `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5`;
    },
    // Stadt suchen
    geo(query) {
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            return `/api/geo?q=${query}`;
        }
        return `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5`;
    },
}