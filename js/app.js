// js/app.js
// Hauptdatei mit der gesamten Wetter-Logik

import { fetchData, url } from './api.js';
import * as module from "./module.js";
import { initWeatherMap, destroyMap } from './map.js';
import { createTemperatureChart, destroyChart as destroyWeatherChart, updateChartTheme, updateChartUnits } from './charts.js';
import { initComparer, addToCompare, showComparer } from './compare.js';
import { initFavorites, addFavorite, removeFavorite, isFavorite } from './favorites.js';
import { initNotifications, requestNotificationPermission, showWeatherAlert, scheduleDailyWeatherNotification } from './notifications.js';
import { initStats, recordWeatherStats, getWeatherStats } from './stats.js';
import { initTheme } from './theme.js';
import { initUnits, formatTemperature, formatSpeed, onUnitChange } from './units.js';

/**
 * Event-Listener für mehrere Elemente
 */
const addEventOnElements = function (elements, eventType, callback) {
    for (const element of elements) element.addEventListener(eventType, callback);
};

// ============================================
// SUCHFUNKTION
// ============================================
const searchView = document.querySelector("[data-search-view]");
const searchTogglers = document.querySelectorAll("[data-search-toggler]");

const toggleSearch = () => searchView.classList.toggle("active");
addEventOnElements(searchTogglers, "click", toggleSearch);

const searchField = document.querySelector("[data-search-field]");
const searchResult = document.querySelector("[data-search-result]");

let searchTimeOut = null;
const searchTimeoutDuration = 500;

searchField.addEventListener("input", function () {
    if (searchTimeOut) clearTimeout(searchTimeOut);

    if (!searchField.value.trim()) {
        searchResult.classList.remove("active");
        searchResult.innerHTML = "";
        searchField.classList.remove("searching");
        return;
    }

    searchField.classList.add("searching");

    searchTimeOut = setTimeout(() => {
        fetchData(url.geo(searchField.value), function (locations) {
            searchField.classList.remove("searching");
            
            if (!locations || locations.length === 0) {
                searchResult.classList.remove("active");
                return;
            }
            
            searchResult.classList.add("active");
            searchResult.innerHTML = `<ul class="view-list" data-search-list></ul>`;

            const list = searchResult.querySelector("[data-search-list]");

            for (const { name, lat, lon, country, state } of locations) {
                const searchItem = document.createElement("li");
                searchItem.classList.add("view-item");

                searchItem.innerHTML = `
                    <span class="m-icon">location_on</span>
                    <div>
                        <p class="item-title">${name}</p>
                        <p class="label-2 item-subtitle">${state ? state + ", " : ""}${country}</p>
                    </div>
                    <a href="#/weather?lat=${lat}&lon=${lon}" class="item-link has-state" aria-label="${name} weather" data-search-toggler></a>
                `;

                list.appendChild(searchItem);
            }

            const newTogglers = searchResult.querySelectorAll("[data-search-toggler]");
            addEventOnElements(newTogglers, "click", toggleSearch);
        });
    }, searchTimeoutDuration);
});

// ============================================
// DOM-ELEMENTE
// ============================================
const container = document.querySelector("[data-container]");
const loading = document.querySelector("[data-loading]");
const currentLocationBtn = document.querySelector("[data-current-location-btn]");
const errorContent = document.querySelector("[data-error-content]");

let currentWeatherData = null;

/**
 * Toast-Benachrichtigung
 */
const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'warning' ? '#ff4444' : type === 'success' ? '#4caf50' : '#2196f3'};
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-size: 1.4rem;
        font-family: var(--ff-nunito-sans);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

/**
 * Hintergrund basierend auf Wetter aktualisieren
 */
const updateBackground = (weatherCondition) => {
    const body = document.body;
    const backgrounds = {
        clear: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        clouds: 'linear-gradient(135deg, #3a6186 0%, #89253e 100%)',
        rain: 'linear-gradient(135deg, #0f2027 0%, #203a43 100%)',
        snow: 'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)',
        thunderstorm: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
        default: 'linear-gradient(135deg, #131214 0%, #2a2a2a 100%)'
    };
    
    let bg = backgrounds.default;
    const condition = weatherCondition.toLowerCase();
    
    if (condition.includes('clear')) bg = backgrounds.clear;
    else if (condition.includes('cloud')) bg = backgrounds.clouds;
    else if (condition.includes('rain') || condition.includes('drizzle')) bg = backgrounds.rain;
    else if (condition.includes('snow')) bg = backgrounds.snow;
    else if (condition.includes('thunder')) bg = backgrounds.thunderstorm;
    
    body.style.background = bg;
    body.style.transition = 'background 1s ease';
};

/**
 * Wetter-Warnungen prüfen
 */
const checkWeatherAlerts = (weatherData, cityName) => {
    if (weatherData.main.temp > 35) {
        showWeatherAlert('extreme_heat', cityName, weatherData);
    }
    if (weatherData.main.temp < -10) {
        showWeatherAlert('extreme_cold', cityName, weatherData);
    }
    if (weatherData.wind.speed > 15) {
        showWeatherAlert('strong_wind', cityName, weatherData);
    }
    if (weatherData.main.humidity > 85) {
        showWeatherAlert('high_humidity', cityName, weatherData);
    }
};

/**
 * Statistik-Modal anzeigen
 */
const showStatsModal = (cityName) => {
    const stats = getWeatherStats(cityName);
    
    if (!stats) {
        showToast(`Noch keine Statistiken für ${cityName}`, 'info');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'stats-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--surface);
        border-radius: 28px;
        padding: 24px;
        z-index: 10001;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    const statsManager = initStats();
    const statsHTML = statsManager.createStatsHTML(cityName);
    
    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 class="title-2">📊 Wetter-Statistiken für ${cityName}</h2>
            <button class="icon-btn close-modal" style="width: 32px; height: 32px;">
                <span class="m-icon">close</span>
            </button>
        </div>
        ${statsHTML}
    `;
    
    document.body.appendChild(modal);
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
    `;
    document.body.appendChild(overlay);
    
    const closeModal = () => {
        modal.remove();
        overlay.remove();
    };
    
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
};

// ============================================
// HAUPTFUNKTION: WETTERDATEN AKTUALISIEREN
// ============================================
export const updateWeather = function (lat, lon) {
    // Koordinaten speichern
    window.currentLat = lat;
    window.currentLon = lon;
    
    // Alte Karte und Chart löschen
    destroyMap();
    destroyWeatherChart();
    
    // Loading anzeigen
    loading.style.display = "grid";
    container.style.overflowY = "hidden";
    container.classList.remove("fade-in");
    errorContent.style.display = "none";
    
    const mainContent = document.querySelector("[data-container]");
    if (mainContent) mainContent.style.display = "grid";
    
    currentWeatherData = null;

    const currentWeatherSection = document.querySelector("[data-current-weather]");
    const highlightSection = document.querySelector("[data-highlights]");
    const hourlySection = document.querySelector("[data-hourly-forecast]");
    const forecastSection = document.querySelector("[data-5-day-forecast]");

    currentWeatherSection.innerHTML = "";
    highlightSection.innerHTML = "";
    hourlySection.innerHTML = "";
    forecastSection.innerHTML = "";

    // Button-Status aktualisieren
    if (window.location.hash === "#/current-location") {
        currentLocationBtn.setAttribute("disabled", "");
    } else {
        currentLocationBtn.removeAttribute("disabled");
    }

    // ============================================
    // AKTUELLES WETTER
    // ============================================
    fetchData(url.currentWeather(lat, lon), function (currentWeather) {
        currentWeatherData = currentWeather;
        
        updateBackground(currentWeather.weather[0].description);
        
        const {
            weather,
            dt: dateUnix,
            main: { temp },
            timezone
        } = currentWeather;
        const [{ description, icon }] = weather;

        const card = document.createElement("div");
        card.classList.add("card", "card-lg", "current-weather-card");

        card.innerHTML = `
            <div class="wrapper">
                <p class="heading">${formatTemperature(temp)}</p>
                <img src="./assets/images/weather_icons/${icon}.png" width="64" height="64" alt="${description}" class="weather-icon">
            </div>
            <p class="body-3">${description}</p>
            
            <div class="action-buttons">
                <button class="btn-secondary compare-btn" data-compare-city>
                    <span class="m-icon">compare</span>
                    <span class="span">Vergleichen</span>
                </button>
                <button class="icon-btn favorite-btn" data-favorite-btn>
                    <span class="m-icon">${isFavorite(lat, lon) ? 'favorite' : 'favorite_border'}</span>
                </button>
                <button class="icon-btn stats-btn" data-stats-btn title="Statistiken">
                    <span class="m-icon">show_chart</span>
                </button>
            </div>
            
            <ul class="meta-list">
                <li class="meta-item">
                    <span class="m-icon">calendar_today</span>
                    <p class="title-3 meta-text">${module.getDate(dateUnix, timezone)}</p>
                </li>
                <li class="meta-item">
                    <span class="m-icon">location_on</span>
                    <p class="title-3 meta-text" data-location></p>
                </li>
            </ul>
        `;

        // Stadtnamen abrufen
        fetchData(url.reverseGeo(lat, lon), function (results) {
            let cityName = "Unbekannt";
            if (results && results.length) {
                const { name, country } = results[0];
                cityName = `${name}, ${country}`;
                const locationElement = card.querySelector("[data-location]");
                if (locationElement) locationElement.innerHTML = cityName;
                
                // Statistiken aufzeichnen
                recordWeatherStats(
                    currentWeather.main.temp,
                    name,
                    {
                        humidity: currentWeather.main.humidity,
                        windSpeed: currentWeather.wind.speed,
                        pressure: currentWeather.main.pressure
                    }
                );
                
                // Karte initialisieren
                setTimeout(() => initWeatherMap(lat, lon, name), 100);
                
                // Wetter-Warnungen prüfen
                checkWeatherAlerts(currentWeather, name);
                
                // Tägliche Zusammenfassung planen
                scheduleDailyWeatherNotification(async () => currentWeather);
            } else {
                const locationElement = card.querySelector("[data-location]");
                if (locationElement) locationElement.innerHTML = cityName;
            }
        });

        currentWeatherSection.appendChild(card);
        
        // Favorite-Button
        const favoriteBtn = card.querySelector('[data-favorite-btn]');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => {
                const locationEl = card.querySelector('[data-location]');
                const cityName = locationEl?.textContent?.split(',')[0] || 'Unbekannt';
                
                if (isFavorite(lat, lon)) {
                    removeFavorite(lat, lon);
                    favoriteBtn.querySelector('.m-icon').textContent = 'favorite_border';
                    showToast(`${cityName} aus Favoriten entfernt`, 'info');
                } else {
                    addFavorite(cityName, lat, lon);
                    favoriteBtn.querySelector('.m-icon').textContent = 'favorite';
                    showToast(`${cityName} zu Favoriten hinzugefügt`, 'success');
                }
            });
        }
        
        // Compare-Button
        const compareBtn = card.querySelector('[data-compare-city]');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                const locationEl = card.querySelector('[data-location]');
                const cityName = locationEl?.textContent?.split(',')[0] || 'Unbekannt';
                addToCompare(currentWeather, cityName);
                showToast(`${cityName} wurde zum Vergleich hinzugefügt`, 'success');
            });
        }
        
        // Stats-Button
        const statsBtn = card.querySelector('[data-stats-btn]');
        if (statsBtn) {
            statsBtn.addEventListener('click', () => {
                const locationEl = card.querySelector('[data-location]');
                const cityName = locationEl?.textContent?.split(',')[0] || 'Unbekannt';
                showStatsModal(cityName);
            });
        }
        
        checkAndHideLoading();
    });

    // ============================================
    // LUFTQUALITÄT & HIGHLIGHTS
    // ============================================
    fetchData(url.airPollution(lat, lon), function (airPollution) {
        if (!airPollution || !airPollution.list || airPollution.list.length === 0) return;
        
        const [{
            main: { aqi },
            components: { no2, o3, so2, pm2_5 }
        }] = airPollution.list;

        const renderHighlights = () => {
            const humidity = currentWeatherData?.main?.humidity ?? "--";
            const pressure = currentWeatherData?.main?.pressure ?? "--";
            const visibility = currentWeatherData?.visibility ? (currentWeatherData.visibility / 1000).toFixed(1) : "--";
            const feelsLike = currentWeatherData?.main?.feels_like ? `${Math.round(currentWeatherData.main.feels_like)}&deg;<sub>c</sub>` : "--";
            const sunrise = currentWeatherData?.sys?.sunrise;
            const sunset = currentWeatherData?.sys?.sunset;
            const timezone = currentWeatherData?.timezone;

            const card = document.createElement("div");
            card.classList.add("card", "card-lg");

            card.innerHTML = `
                <h2 class="title-2">Heutige Highlights</h2>
                <div class="highlight-list">
                    <div class="highlight-card one">
                        <h3 class="title-3">Luftqualität</h3>
                        <div class="wrapper">
                            <span class="m-icon">air</span>
                            <ul class="card-list">
                                <li class="card-item"><p>${Number(pm2_5).toPrecision(3)}</p><p>PM2.5</p></li>
                                <li class="card-item"><p>${Number(so2).toPrecision(3)}</p><p>SO₂</p></li>
                                <li class="card-item"><p>${Number(no2).toPrecision(3)}</p><p>NO₂</p></li>
                                <li class="card-item"><p>${Number(o3).toPrecision(3)}</p><p>O₃</p></li>
                            </ul>
                        </div>
                        <span class="badge aqi-${aqi}">${module.aqiText[aqi]?.level || 'Unbekannt'}</span>
                    </div>
                    <div class="highlight-card two">
                        <h3 class="title-3">Sonnenaufgang & -untergang</h3>
                        <div class="card-list">
                            <div><span class="m-icon">clear_day</span><div><p>Sonnenaufgang</p><p>${sunrise && timezone ? module.getTime(sunrise, timezone) : '--'}</p></div></div>
                            <div><span class="m-icon">clear_night</span><div><p>Sonnenuntergang</p><p>${sunset && timezone ? module.getTime(sunset, timezone) : '--'}</p></div></div>
                        </div>
                    </div>
                    <div class="highlight-card"><h3>Luftfeuchtigkeit</h3><div><span class="m-icon">humidity_percentage</span><p>${humidity}%</p></div></div>
                    <div class="highlight-card"><h3>Luftdruck</h3><div><span class="m-icon">airwave</span><p>${pressure} hPa</p></div></div>
                    <div class="highlight-card"><h3>Sichtweite</h3><div><span class="m-icon">visibility</span><p>${visibility} km</p></div></div>
                    <div class="highlight-card"><h3>Gefühlt</h3><div><span class="m-icon">thermostat</span><p>${feelsLike}</p></div></div>
                </div>
            `;

            const highlightContainer = document.querySelector("[data-highlights]");
            if (highlightContainer) {
                highlightContainer.innerHTML = "";
                highlightContainer.appendChild(card);
            }
            checkAndHideLoading();
        };

        if (currentWeatherData) {
            renderHighlights();
        } else {
            const interval = setInterval(() => {
                if (currentWeatherData) {
                    clearInterval(interval);
                    renderHighlights();
                }
            }, 100);
            setTimeout(() => clearInterval(interval), 5000);
        }
    });

    // ============================================
    // VORHERSAGE & DIAGRAMM
    // ============================================
    fetchData(url.forecast(lat, lon), function (forecast) {
        if (!forecast || !forecast.list) return;
        
        const {
            list: forecastList,
            city: { timezone }
        } = forecast;

        try {
            createTemperatureChart(forecast, timezone);
        } catch (error) {
            console.error('Chart Fehler:', error);
        }

        const hourlySectionEl = document.querySelector("[data-hourly-forecast]");
        if (hourlySectionEl) {
            hourlySectionEl.innerHTML = `
                <h2 class="title-2">Heute im Stundenverlauf</h2>
                <div class="slider-container">
                    <ul class="slider-list" data-temp></ul>
                    <ul class="slider-list" data-wind></ul>
                </div>
            `;
        }

        // Stündliche Vorhersage (erste 8 Stunden)
        for (const [index, data] of forecastList.entries()) {
            if (index > 7) break;

            const {
                dt: dateTimeUnix,
                main: { temp },
                weather,
                wind: { deg: windDirection, speed: windSpeed }
            } = data;
            const [{ icon, description }] = weather;

            // Temperatur (mit formatTemperature)
            const tempLi = document.createElement("li");
            tempLi.classList.add("slider-item");
            tempLi.innerHTML = `
                <div class="card card-sm slider-card">
                    <p class="body-3">${module.getHours(dateTimeUnix, timezone)}</p>
                    <img src="./assets/images/weather_icons/${icon}.png" width="48" height="48" alt="${description}" class="weather-icon">
                    <p class="body-3">${formatTemperature(temp)}</p>
                </div>
            `;
            const tempContainer = document.querySelector("[data-hourly-forecast] [data-temp]");
            if (tempContainer) tempContainer.appendChild(tempLi);

            // Wind (mit formatSpeed)
            const windLi = document.createElement("li");
            windLi.classList.add("slider-item");
            windLi.innerHTML = `
                <div class="card card-sm slider-card">
                    <p class="body-3">${module.getHours(dateTimeUnix, timezone)}</p>
                    <img src="./assets/images/weather_icons/direction.png" width="48" height="48" alt="Windrichtung" class="weather-icon" style="transform: rotate(${windDirection}deg)">
                    <p class="body-3">${formatSpeed(module.mps_to_kmh(windSpeed))}</p>
                </div>
            `;
            const windContainer = document.querySelector("[data-hourly-forecast] [data-wind]");
            if (windContainer) windContainer.appendChild(windLi);
        }

        // 5-Tage-Vorhersage
        const forecastSectionEl = document.querySelector("[data-5-day-forecast]");
        if (forecastSectionEl) {
            forecastSectionEl.innerHTML = `
                <h2 class="title-2">5-Tage-Vorhersage</h2>
                <div class="card card-lg forecast-card">
                    <ul data-forecast-list></ul>
                </div>
            `;
        }

        for (let i = 7, len = forecastList.length; i < len; i += 8) {
            const { main: { temp_max }, weather, dt_txt } = forecastList[i];
            const [{ icon, description }] = weather;
            const date = new Date(dt_txt);

            const li = document.createElement("li");
            li.classList.add("card-item");
            li.innerHTML = `
                <div class="icon-wrapper">
                    <img src="./assets/images/weather_icons/${icon}.png" width="36" height="36" alt="${description}" class="weather-icon">
                    <span class="span"><p class="title-2">${formatTemperature(temp_max)}</p></span>
                </div>
                <p class="label-1">${module.monthNames[date.getUTCMonth()]} ${date.getUTCDate()}</p>
                <p class="label-1">${module.weekDayNames[date.getUTCDay()]}</p>
            `;
            const forecastListEl = document.querySelector("[data-5-day-forecast] [data-forecast-list]");
            if (forecastListEl) forecastListEl.appendChild(li);
        }
        
        checkAndHideLoading();
    });
    
    setTimeout(() => checkAndHideLoading(), 10000);
};

/**
 * Lädt alle Abschnitte und versteckt Loading
 */
function checkAndHideLoading() {
    const currentWeatherSection = document.querySelector("[data-current-weather]");
    const highlightSection = document.querySelector("[data-highlights]");
    const hourlySection = document.querySelector("[data-hourly-forecast]");
    const forecastSection = document.querySelector("[data-5-day-forecast]");
    
    if (currentWeatherSection?.innerHTML && 
        highlightSection?.innerHTML && 
        hourlySection?.innerHTML && 
        forecastSection?.innerHTML) {
        loading.style.display = "none";
        container.style.overflowY = "auto";
        container.classList.add("fade-in");
    }
}

/**
 * 404 Fehler
 */
export const error404 = function () {
    loading.style.display = "none";
    container.style.overflowY = "hidden";
    
    const mainContent = document.querySelector("[data-container]");
    if (mainContent) mainContent.style.display = "none";
    
    if (errorContent) errorContent.style.display = "flex";
};

/**
 * Wetter vorlesen
 */
export const speakWeather = (weatherData, cityName) => {
    if (!('speechSynthesis' in window)) {
        console.warn('Sprachausgabe nicht unterstützt');
        return;
    }
    
    const text = `Aktuelles Wetter in ${cityName}: 
        ${Math.round(weatherData.main.temp)} Grad, 
        ${weatherData.weather[0].description}. 
        Luftfeuchtigkeit: ${weatherData.main.humidity} Prozent.`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
};

// ============================================
// INITIALISIERUNG
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Theme initialisieren
    initTheme();
    
    // Einheiten initialisieren
    initUnits();
    
    // Favoriten initialisieren
    initFavorites();
    
    // Statistiken initialisieren
    initStats();
    
    // Comparer initialisieren
    initComparer();

    // Benachrichtigungen initialisieren
    await initNotifications();

    // Auf Theme-Änderungen reagieren
    window.addEventListener('themeChange', (e) => {
        updateChartTheme();
    });
    
    // Auf Einheiten-Änderungen reagieren
    onUnitChange(() => {
        if (window.currentLat && window.currentLon) {
            updateWeather(window.currentLat, window.currentLon);
        }
    });
    
    // Sprach-Button
    const speakBtn = document.querySelector('[data-speak-btn]');
    if (speakBtn) {
        speakBtn.addEventListener('click', () => {
            if (currentWeatherData) {
                const locationEl = document.querySelector('[data-location]');
                const cityName = locationEl?.textContent?.split(',')[0] || 'Aktueller Ort';
                speakWeather(currentWeatherData, cityName);
            }
        });
    }
    
    // Vergleichen-Button
    const openComparerBtn = document.querySelector('[data-open-comparer]');
    if (openComparerBtn) {
        openComparerBtn.addEventListener('click', () => showComparer());
    }
    
    // Benachrichtigungen-Button
    const notificationBtn = document.querySelector('[data-notification-btn]');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', async () => {
            const granted = await requestNotificationPermission();
            if (granted) {
                const icon = notificationBtn.querySelector('.m-icon');
                if (icon) icon.textContent = 'notifications_active';
                showToast('Benachrichtigungen aktiviert!', 'success');
            }
        });
    }
});