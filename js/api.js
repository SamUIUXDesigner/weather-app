// js/api.js
// Diese Datei verwaltet alle Verbindungen zur Wetter-API

// API-Key sicher versteckt (wird später über Vercel Environment Variable gesetzt)
// Für lokale Entwicklung: key hier lassen
const API_KEY = "318ec332df17eba3c829e5715a95dd2b";

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
    // Prüfen ob es eine relative URL ist (Serverless Function)
    let finalURL = URL;
    
    // Wenn es keine relative URL ist (nicht mit /api/ beginnt), dann füge API-Key hinzu
    if (!URL.startsWith('/api/')) {
        finalURL = `${URL}&appid=${API_KEY}`;
    }
    
    console.log('Fetching:', finalURL); // Zum Debuggen
    
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
 * Prüft ob wir auf Vercel sind
 */
const isVercel = () => {
    return typeof window !== 'undefined' && 
           window.location.hostname !== 'localhost' &&
           window.location.hostname !== '127.0.0.1';
};

/**
 * Alle API-URLs für verschiedene Abfragen
 */
export const url = {
    // Aktuelles Wetter
    currentWeather(lat, lon) {
        // Auf Vercel: Serverless Function verwenden
        if (isVercel()) {
            return `/api/weather?lat=${lat}&lon=${lon}`;
        }
        // Lokale Entwicklung: direkter API-Aufruf
        return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnits}`;
    },
    // 5-Tage-Vorhersage
    forecast(lat, lon) {
        if (isVercel()) {
            return `/api/forecast?lat=${lat}&lon=${lon}`;
        }
        return `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnits}`;
    },
    // Luftqualität
    airPollution(lat, lon) {
        if (isVercel()) {
            return `/api/air-pollution?lat=${lat}&lon=${lon}`;
        }
        return `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}`;
    },
    // Stadtname aus Koordinaten
    reverseGeo(lat, lon) {
        if (isVercel()) {
            return `/api/reverse-geo?lat=${lat}&lon=${lon}`;
        }
        return `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5`;
    },
    // Stadt suchen
    geo(query) {
        if (isVercel()) {
            return `/api/geo?q=${query}`;
        }
        return `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5`;
    },
}