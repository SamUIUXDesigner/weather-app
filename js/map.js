// js/map.js
// Diese Datei erstellt die interaktive Karte mit Leaflet

let map = null;
let marker = null;

/**
 * Leaflet Bibliothek dynamisch laden
 */
const loadLeaflet = () => {
    return new Promise((resolve, reject) => {
        if (window.L) {
            resolve(window.L);
            return;
        }
        
        // Warten bis Leaflet geladen ist
        const checkInterval = setInterval(() => {
            if (window.L) {
                clearInterval(checkInterval);
                resolve(window.L);
            }
        }, 100);
        
        // Timeout nach 5 Sekunden
        setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Leaflet konnte nicht geladen werden'));
        }, 5000);
    });
};

/**
 * Wetterkarte initialisieren
 * @param {number} lat - Breitengrad
 * @param {number} lon - Längengrad
 * @param {string} cityName - Stadtname
 */
export const initWeatherMap = async (lat, lon, cityName) => {
    const mapContainer = document.querySelector('[data-weather-map]');
    if (!mapContainer) {
        console.warn('Karte nicht gefunden');
        return;
    }
    
    try {
        const L = await loadLeaflet();
        
        // Alte Karte löschen
        if (map) {
            map.remove();
        }
        
        // Neue Karte erstellen
        map = L.map(mapContainer).setView([lat, lon], 10);
        
        // Kartenlayer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);
        
        // Marker mit Stadtnamen
        marker = L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`<b>${cityName}</b><br/>Aktuelles Wetter`)
            .openPopup();
        
        // Größe anpassen
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 100);
        
    } catch (error) {
        console.error('Fehler beim Laden der Karte:', error);
        // Fallback: Link zu OpenStreetMap
        mapContainer.innerHTML = `
            <div style="background: var(--surface); border-radius: 16px; padding: 20px; text-align: center;">
                <p>Karte konnte nicht geladen werden.</p>
                <a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}" target="_blank" style="color: var(--primary);">
                    Auf OpenStreetMap öffnen →
                </a>
            </div>
        `;
    }
};

/**
 * Karte zerstören
 */
export const destroyMap = () => {
    if (map) {
        map.remove();
        map = null;
        marker = null;
    }
};