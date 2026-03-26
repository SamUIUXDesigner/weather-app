// js/stats.js
// Diese Datei speichert und verwaltet Wetter-Statistiken

let weatherStats = null;

export class WeatherStats {
    constructor() {
        this.stats = JSON.parse(localStorage.getItem('weatherStats') || '{}');
    }
    
    /**
     * Wetter-Messung aufzeichnen
     */
    recordWeather(temp, city, additionalData = {}) {
        if (!this.stats[city]) {
            this.stats[city] = {
                max: -Infinity,
                min: Infinity,
                sum: 0,
                count: 0,
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                maxTempDate: null,
                minTempDate: null
            };
        }
        
        const stats = this.stats[city];
        
        // Temperatur-Statistiken
        if (temp > stats.max) {
            stats.max = temp;
            stats.maxTempDate = new Date().toISOString();
        }
        if (temp < stats.min) {
            stats.min = temp;
            stats.minTempDate = new Date().toISOString();
        }
        
        stats.sum += temp;
        stats.count++;
        stats.lastSeen = new Date().toISOString();
        
        // Zusätzliche Daten (optional)
        if (additionalData.humidity) {
            if (!stats.humidity) stats.humidity = { sum: 0, count: 0 };
            stats.humidity.sum += additionalData.humidity;
            stats.humidity.count++;
        }
        
        if (additionalData.windSpeed) {
            if (!stats.wind) stats.wind = { sum: 0, count: 0, max: 0 };
            stats.wind.sum += additionalData.windSpeed;
            stats.wind.count++;
            if (additionalData.windSpeed > stats.wind.max) {
                stats.wind.max = additionalData.windSpeed;
            }
        }
        
        localStorage.setItem('weatherStats', JSON.stringify(this.stats));
        return stats;
    }
    
    /**
     * Statistiken für eine Stadt abrufen
     */
    getStats(city) {
        return this.stats[city] || null;
    }
    
    /**
     * Alle Städte mit Statistiken
     */
    getCities() {
        return Object.keys(this.stats);
    }
    
    /**
     * Durchschnitt berechnen
     */
    getAverage(city) {
        const stats = this.stats[city];
        if (!stats) return null;
        return stats.sum / stats.count;
    }
    
    /**
     * Statistiken als HTML anzeigen
     */
    createStatsHTML(city) {
        const stats = this.getStats(city);
        if (!stats) {
            return '<p>Keine Statistiken verfügbar</p>';
        }
        
        const avg = (stats.sum / stats.count).toFixed(1);
        const humidityAvg = stats.humidity ? (stats.humidity.sum / stats.humidity.count).toFixed(0) : null;
        const windAvg = stats.wind ? (stats.wind.sum / stats.wind.count).toFixed(0) : null;
        
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="m-icon">arrow_upward</span>
                    <div>
                        <p class="label-1">Höchste</p>
                        <p class="title-2">${Math.round(stats.max)}°C</p>
                        <p class="label-2">${stats.maxTempDate ? new Date(stats.maxTempDate).toLocaleDateString() : '-'}</p>
                    </div>
                </div>
                <div class="stat-card">
                    <span class="m-icon">arrow_downward</span>
                    <div>
                        <p class="label-1">Tiefste</p>
                        <p class="title-2">${Math.round(stats.min)}°C</p>
                        <p class="label-2">${stats.minTempDate ? new Date(stats.minTempDate).toLocaleDateString() : '-'}</p>
                    </div>
                </div>
                <div class="stat-card">
                    <span class="m-icon">calculate</span>
                    <div>
                        <p class="label-1">Durchschnitt</p>
                        <p class="title-2">${avg}°C</p>
                        <p class="label-2">${stats.count} Messungen</p>
                    </div>
                </div>
                ${humidityAvg ? `
                <div class="stat-card">
                    <span class="m-icon">humidity_percentage</span>
                    <div>
                        <p class="label-1">Luftfeuchtigkeit</p>
                        <p class="title-2">${humidityAvg}%</p>
                    </div>
                </div>
                ` : ''}
                ${windAvg ? `
                <div class="stat-card">
                    <span class="m-icon">air</span>
                    <div>
                        <p class="label-1">Wind</p>
                        <p class="title-2">${windAvg} km/h</p>
                        <p class="label-2">Max: ${Math.round(stats.wind.max)} km/h</p>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }
}

/**
 * Statistiken initialisieren
 */
export const initStats = () => {
    if (!weatherStats) {
        weatherStats = new WeatherStats();
    }
    return weatherStats;
};

/**
 * Wetterdaten aufzeichnen
 */
export const recordWeatherStats = (temp, city, additionalData = {}) => {
    if (!weatherStats) initStats();
    return weatherStats.recordWeather(temp, city, additionalData);
};

/**
 * Statistiken abrufen
 */
export const getWeatherStats = (city) => {
    if (!weatherStats) return null;
    return weatherStats.getStats(city);
};