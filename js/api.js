// js/api.js
// Diese Datei verwaltet alle Verbindungen zur Wetter-API

// API-Key für OpenWeatherMap
const API_KEY = "318ec332df17eba3c829e5715a95dd2b";

// Aktuelle Einheit (wird von units.js gesetzt)
let currentUnits = 'metric';

export const setApiUnits = (units) => {
    currentUnits = units;
    console.log(`API-Einheiten auf ${units} gesetzt`);
};

export const fetchData = function (URL, callback, errorCallback) {
    let finalURL = URL;
    
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

const isVercel = () => {
    return typeof window !== 'undefined' && 
           window.location.hostname !== 'localhost' &&
           window.location.hostname !== '127.0.0.1';
};

export const url = {
    currentWeather(lat, lon) {
        if (isVercel()) {
            return `/api/weather?lat=${lat}&lon=${lon}`;
        }
        return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnits}`;
    },
    forecast(lat, lon) {
        if (isVercel()) {
            return `/api/forecast?lat=${lat}&lon=${lon}`;
        }
        return `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnits}`;
    },
    airPollution(lat, lon) {
        if (isVercel()) {
            return `/api/air-pollution?lat=${lat}&lon=${lon}`;
        }
        return `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}`;
    },
    reverseGeo(lat, lon) {
        if (isVercel()) {
            return `/api/reverse-geo?lat=${lat}&lon=${lon}`;
        }
        return `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5`;
    },
    geo(query) {
        if (isVercel()) {
            return `/api/geo?q=${query}`;
        }
        return `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5`;
    },
}