// js/route.js
// Diese Datei verwaltet die Navigation (URL-Hashes)

import { updateWeather, error404 } from "./app.js";

// Standard-Stadt (Bad Hersfeld)
const defaultLocation = "#/weather?lat=50.8142&lon=9.8463";

/**
 * Aktuellen Standort verwenden
 */
const currentLocation = function () {
    if (!window.navigator.geolocation) {
        console.error("Geolocation wird nicht unterstützt");
        window.location.hash = defaultLocation;
        return;
    }
    
    window.navigator.geolocation.getCurrentPosition(
        res => {
            const { latitude, longitude } = res.coords;
            updateWeather(latitude, longitude);
        }, 
        err => {
            console.error("Geolocation Fehler:", err.message);
            window.location.hash = defaultLocation;
        }
    );
}

/**
 * Gesuchten Ort anzeigen
 */
const searchedLocation = (query) => {
    if (!query) return;
    const params = new URLSearchParams(query);
    const lat = params.get('lat');
    const lon = params.get('lon');
    
    if (lat && lon) {
        updateWeather(parseFloat(lat), parseFloat(lon));
    }
}

// Routen: welcher Hash welche Funktion aufruft
const routes = new Map([
    ["/current-location", currentLocation],
    ["/weather", searchedLocation],
]);

/**
 * Prüft den aktuellen Hash und ruft die passende Funktion auf
 */
const checkHash = () => {
    const requestURL = window.location.hash.slice(1);
    const [route, query = ""] = requestURL.split(/\?(.*)/).filter(Boolean);
    
    const routeHandler = routes.get(route);
    if (routeHandler) {
        routeHandler(query);
    } else {
        error404();
    }
};

// Bei Hash-Änderung prüfen
window.addEventListener("hashchange", checkHash);

// Beim Laden der Seite
window.addEventListener("load", () => {
    if (!window.location.hash || window.location.hash === "#") {
        window.location.hash = "/current-location";
    } else {
        checkHash();
    }
});