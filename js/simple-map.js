// js/simple-map.js (Alternative ohne Leaflet)

export const initSimpleMap = (lat, lon, cityName) => {
    const mapContainer = document.querySelector('[data-weather-map]');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = `
        <iframe 
            width="100%" 
            height="100%" 
            style="border:0; border-radius: var(--radius-16);"
            loading="lazy"
            allowfullscreen
            referrerpolicy="no-referrer-when-downgrade"
            src="https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.1}%2C${lat-0.1}%2C${lon+0.1}%2C${lat+0.1}&layer=mapnik&marker=${lat}%2C${lon}">
        </iframe>
    `;
    
    // Link zur Vollansicht
    const link = document.createElement('a');
    link.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=10/${lat}/${lon}`;
    link.target = '_blank';
    link.className = 'label-1';
    link.style.cssText = 'display: block; text-align: center; margin-top: 8px; color: var(--primary);';
    link.textContent = 'Größere Karte öffnen →';
    mapContainer.parentElement.appendChild(link);
};