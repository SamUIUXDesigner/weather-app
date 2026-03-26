// js/compare.js
// Diese Datei ermöglicht den Vergleich von zwei Städten

import { formatTemperature, formatSpeed, getUnitSymbol } from './units.js';

let weatherComparer = null;

export class WeatherComparer {
    constructor() {
        this.cities = [];
        this.isVisible = false;
        this.container = null;
        this.createComparisonUI();
    }
    
    /**
     * UI für Vergleich erstellen
     */
    createComparisonUI() {
        this.container = document.createElement('div');
        this.container.className = 'weather-comparer';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 900px;
            max-height: 85vh;
            overflow-y: auto;
            background: var(--surface);
            border-radius: 28px;
            z-index: 1000;
            display: none;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            animation: fadeIn 0.3s ease;
        `;
        
        this.container.innerHTML = `
            <div style="padding: 20px; border-bottom: 1px solid var(--outline); display: flex; justify-content: space-between; align-items: center;">
                <h2 class="title-2">🌍 Wetter-Vergleich</h2>
                <button class="icon-btn close-comparer" style="width: 36px; height: 36px;" aria-label="Schließen">
                    <span class="m-icon">close</span>
                </button>
            </div>
            <div style="padding: 24px;">
                <div class="comparison-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <div data-city-1></div>
                    <div data-city-2></div>
                </div>
                <div data-differences style="margin-top: 24px;"></div>
                <div style="margin-top: 20px; text-align: center;">
                    <button class="btn-secondary clear-comparer" style="background: var(--white-alpha-8);">
                        <span class="m-icon">delete</span>
                        <span>Vergleich zurücksetzen</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Schließen-Button
        const closeBtn = this.container.querySelector('.close-comparer');
        closeBtn.addEventListener('click', () => this.hide());
        
        // Zurücksetzen-Button
        const clearBtn = this.container.querySelector('.clear-comparer');
        clearBtn.addEventListener('click', () => this.clear());
        
        // Klick außerhalb schließt
        document.addEventListener('click', (e) => {
            if (this.isVisible && !this.container.contains(e.target)) {
                this.hide();
            }
        });
    }
    
    /**
     * Stadt zum Vergleich hinzufügen
     */
    addCity(cityData, cityName) {
        // Prüfen ob Stadt bereits im Vergleich ist
        if (this.cities.some(c => c.name === cityName)) {
            this.showToast(`${cityName} ist bereits im Vergleich!`, 'warning');
            return;
        }
        
        if (this.cities.length >= 2) {
            this.showToast('Maximal 2 Städte können verglichen werden!', 'warning');
            return;
        }
        
        this.cities.push({
            data: cityData,
            name: cityName,
            temp: cityData.main.temp,
            tempCelsius: cityData.main.temp,
            humidity: cityData.main.humidity,
            windSpeed: cityData.wind.speed,
            weather: cityData.weather[0].description,
            icon: cityData.weather[0].icon,
            pressure: cityData.main.pressure,
            feelsLike: cityData.main.feels_like
        });
        
        this.renderComparison();
        
        if (this.cities.length === 2) {
            this.show();
            this.showToast('Vergleich bereit! Zwei Städte werden verglichen.', 'success');
        } else {
            this.showToast(`${cityName} wurde zum Vergleich hinzugefügt. Füge eine zweite Stadt hinzu.`, 'info');
        }
    }
    
    /**
     * Vergleich anzeigen
     */
    show() {
        if (this.cities.length === 2) {
            this.isVisible = true;
            this.container.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Vergleich verstecken
     */
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    /**
     * Vergleich löschen
     */
    clear() {
        this.cities = [];
        this.renderComparison();
        this.hide();
        this.showToast('Vergleich zurückgesetzt', 'info');
    }
    
    /**
     * Vergleich rendern
     */
    renderComparison() {
        const city1Container = this.container.querySelector('[data-city-1]');
        const city2Container = this.container.querySelector('[data-city-2]');
        const diffContainer = this.container.querySelector('[data-differences]');
        
        // Stadt 1
        if (this.cities[0]) {
            city1Container.innerHTML = this.renderCityCard(this.cities[0], 0);
        } else {
            city1Container.innerHTML = `
                <div style="text-align: center; padding: 40px; background: var(--black-alpha-10); border-radius: 20px;">
                    <span class="m-icon" style="font-size: 48px; opacity: 0.5;">add_location</span>
                    <p class="body-3" style="margin-top: 12px;">Keine Stadt ausgewählt</p>
                    <p class="label-2">Klicke auf "Vergleichen" in der Wetter-Karte</p>
                </div>
            `;
        }
        
        // Stadt 2
        if (this.cities[1]) {
            city2Container.innerHTML = this.renderCityCard(this.cities[1], 1);
        } else {
            city2Container.innerHTML = `
                <div style="text-align: center; padding: 40px; background: var(--black-alpha-10); border-radius: 20px;">
                    <span class="m-icon" style="font-size: 48px; opacity: 0.5;">add_location</span>
                    <p class="body-3" style="margin-top: 12px;">Keine Stadt ausgewählt</p>
                    <p class="label-2">Klicke auf "Vergleichen" in der Wetter-Karte</p>
                </div>
            `;
        }
        
        // Unterschiede
        if (this.cities.length === 2) {
            diffContainer.innerHTML = this.renderDifferences();
        } else {
            diffContainer.innerHTML = '';
        }
    }
    
    /**
     * Stadtkarte rendern
     */
    renderCityCard(city, index) {
        const tempFormatted = formatTemperature(city.temp);
        const windFormatted = formatSpeed(city.windSpeed);
        
        return `
            <div style="background: var(--black-alpha-10); border-radius: 20px; padding: 20px; text-align: center; position: relative;">
                <button class="icon-btn remove-city" data-remove-index="${index}" style="position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; background: var(--white-alpha-8);" aria-label="Stadt entfernen">
                    <span class="m-icon" style="font-size: 18px;">close</span>
                </button>
                <h3 class="title-1" style="font-size: 2rem; margin-bottom: 12px;">${city.name}</h3>
                <img src="./assets/images/weather_icons/${city.icon}.png" width="80" height="80" alt="${city.weather}">
                <p class="heading" style="font-size: 3.6rem; margin: 12px 0;">${tempFormatted}</p>
                <p class="body-3" style="text-transform: capitalize; margin-bottom: 16px;">${city.weather}</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px;">
                    <div>
                        <p class="label-1" style="color: var(--on-surface-variant);">💧 Luftfeuchtigkeit</p>
                        <p class="body-2">${city.humidity}%</p>
                    </div>
                    <div>
                        <p class="label-1" style="color: var(--on-surface-variant);">💨 Wind</p>
                        <p class="body-2">${windFormatted}</p>
                    </div>
                    <div>
                        <p class="label-1" style="color: var(--on-surface-variant);">📊 Luftdruck</p>
                        <p class="body-2">${Math.round(city.pressure)} hPa</p>
                    </div>
                    <div>
                        <p class="label-1" style="color: var(--on-surface-variant);">🌡️ Gefühlt</p>
                        <p class="body-2">${formatTemperature(city.feelsLike)}</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Unterschiede berechnen und anzeigen
     */
    renderDifferences() {
        const city1 = this.cities[0];
        const city2 = this.cities[1];
        
        const tempDiff = Math.abs(city1.temp - city2.temp);
        const warmer = city1.temp > city2.temp ? city1.name : city2.name;
        const cooler = city1.temp < city2.temp ? city1.name : city2.name;
        
        const humidityDiff = Math.abs(city1.humidity - city2.humidity);
        const moreHumid = city1.humidity > city2.humidity ? city1.name : city2.name;
        
        const windDiff = Math.abs(city1.windSpeed - city2.windSpeed);
        const windier = city1.windSpeed > city2.windSpeed ? city1.name : city2.name;
        
        return `
            <div style="border-top: 1px solid var(--outline); padding-top: 20px;">
                <h3 class="title-3" style="margin-bottom: 16px;">📊 Unterschiede im Vergleich</h3>
                <div style="display: grid; gap: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--black-alpha-10); border-radius: 16px;">
                        <span class="m-icon">thermostat</span>
                        <span style="flex: 1; margin-left: 12px;">🌡️ Temperatur</span>
                        <span style="font-weight: bold;">${warmer} ist ${tempDiff.toFixed(1)}°C wärmer als ${cooler}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--black-alpha-10); border-radius: 16px;">
                        <span class="m-icon">humidity_percentage</span>
                        <span style="flex: 1; margin-left: 12px;">💧 Luftfeuchtigkeit</span>
                        <span style="font-weight: bold;">${moreHumid} hat ${humidityDiff}% höhere Luftfeuchtigkeit</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--black-alpha-10); border-radius: 16px;">
                        <span class="m-icon">air</span>
                        <span style="flex: 1; margin-left: 12px;">💨 Wind</span>
                        <span style="font-weight: bold;">${windier} hat ${windDiff.toFixed(0)} km/h stärkeren Wind</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Stadt aus Vergleich entfernen
     */
    removeCity(index) {
        if (this.cities[index]) {
            const cityName = this.cities[index].name;
            this.cities.splice(index, 1);
            this.renderComparison();
            if (this.cities.length < 2) {
                this.hide();
            }
            this.showToast(`${cityName} aus Vergleich entfernt`, 'info');
        }
    }
    
    /**
     * Toast-Benachrichtigung
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'warning' ? '#ff4444' : type === 'success' ? '#4caf50' : '#2196f3'};
            color: white;
            padding: 12px 20px;
            border-radius: 40px;
            z-index: 1002;
            animation: slideIn 0.3s ease;
            font-size: 1.4rem;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

/**
 * Comparer initialisieren
 */
export const initComparer = () => {
    if (!weatherComparer) {
        weatherComparer = new WeatherComparer();
        
        // Event-Listener für Remove-Buttons (Event Delegation)
        document.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-remove-index]');
            if (removeBtn && weatherComparer) {
                const index = parseInt(removeBtn.getAttribute('data-remove-index'));
                weatherComparer.removeCity(index);
            }
        });
    }
    return weatherComparer;
};

/**
 * Stadt zum Vergleich hinzufügen
 */
export const addToCompare = (weatherData, cityName) => {
    if (!weatherComparer) initComparer();
    weatherComparer.addCity(weatherData, cityName);
};

/**
 * Vergleich anzeigen
 */
export const showComparer = () => {
    if (weatherComparer) weatherComparer.show();
};

/**
 * Vergleich zurücksetzen
 */
export const clearComparer = () => {
    if (weatherComparer) weatherComparer.clear();
};