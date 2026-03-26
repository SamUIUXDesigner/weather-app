// js/units.js
// Diese Datei verwaltet die Temperatureinheiten (°C / °F)

import { setApiUnits } from './api.js';

const UNIT_SYSTEMS = {
    METRIC: 'metric',
    IMPERIAL: 'imperial'
};

const UNIT_SYMBOLS = {
    metric: { temperature: '°C', speed: 'km/h', pressure: 'hPa', distance: 'km' },
    imperial: { temperature: '°F', speed: 'mph', pressure: 'inHg', distance: 'mi' }
};

let currentUnitSystem = UNIT_SYSTEMS.METRIC;
let unitChangeCallbacks = [];

/**
 * Einheiten initialisieren
 */
export const initUnits = () => {
    const savedUnit = localStorage.getItem('weatherUnit');
    if (savedUnit && (savedUnit === UNIT_SYSTEMS.METRIC || savedUnit === UNIT_SYSTEMS.IMPERIAL)) {
        currentUnitSystem = savedUnit;
    }
    
    // API-Einheiten setzen
    setApiUnits(currentUnitSystem);
    
    setupUnitToggle();
    return currentUnitSystem;
};

/**
 * Unit-Toggle Button einrichten
 */
const setupUnitToggle = () => {
    const unitToggle = document.querySelector('.unit-toggle');
    if (!unitToggle) return;
    
    // Icon basierend auf aktueller Einheit setzen
    const icon = unitToggle.querySelector('.m-icon');
    if (icon) {
        icon.textContent = currentUnitSystem === UNIT_SYSTEMS.METRIC ? 'thermostat' : 'thermostat_auto';
    }
    
    unitToggle.addEventListener('click', toggleUnit);
};

/**
 * Einheit umschalten
 */
export const toggleUnit = () => {
    currentUnitSystem = currentUnitSystem === UNIT_SYSTEMS.METRIC 
        ? UNIT_SYSTEMS.IMPERIAL 
        : UNIT_SYSTEMS.METRIC;
    
    localStorage.setItem('weatherUnit', currentUnitSystem);
    
    // API-Einheiten aktualisieren
    setApiUnits(currentUnitSystem);
    
    // Toggle-Button Icon aktualisieren
    const unitToggle = document.querySelector('.unit-toggle');
    if (unitToggle) {
        const icon = unitToggle.querySelector('.m-icon');
        if (icon) {
            icon.textContent = currentUnitSystem === UNIT_SYSTEMS.METRIC ? 'thermostat' : 'thermostat_auto';
            // Kleine Animation
            icon.style.transform = 'rotate(360deg)';
            setTimeout(() => { if (icon) icon.style.transform = ''; }, 300);
        }
    }
    
    // Callbacks aufrufen
    unitChangeCallbacks.forEach(cb => {
        try {
            cb(currentUnitSystem);
        } catch (error) {
            console.error('Fehler in Unit-Change-Callback:', error);
        }
    });
    
    // Event auslösen
    window.dispatchEvent(new CustomEvent('unitChanged', { 
        detail: { unitSystem: currentUnitSystem } 
    }));
    
    // Toast anzeigen
    showUnitToast();
    
    return currentUnitSystem;
};

/**
 * Callback für Einheiten-Änderungen registrieren
 */
export const onUnitChange = (callback) => {
    if (typeof callback === 'function') {
        unitChangeCallbacks.push(callback);
    }
};

/**
 * Callback entfernen
 */
export const offUnitChange = (callback) => {
    unitChangeCallbacks = unitChangeCallbacks.filter(cb => cb !== callback);
};

/**
 * Aktuelles Einheiten-System zurückgeben
 */
export const getUnitSystem = () => {
    return currentUnitSystem;
};

/**
 * Einheiten-Symbol zurückgeben
 */
export const getUnitSymbol = (type = 'temperature') => {
    return UNIT_SYMBOLS[currentUnitSystem][type] || UNIT_SYMBOLS.metric[type];
};

/**
 * Temperatur umrechnen
 */
export const convertTemperature = (celsius) => {
    if (currentUnitSystem === UNIT_SYSTEMS.IMPERIAL) {
        return (celsius * 9/5) + 32;
    }
    return celsius;
};

/**
 * Geschwindigkeit umrechnen (km/h zu mph)
 */
export const convertSpeed = (kmh) => {
    if (currentUnitSystem === UNIT_SYSTEMS.IMPERIAL) {
        return kmh * 0.621371;
    }
    return kmh;
};

/**
 * Luftdruck umrechnen (hPa zu inHg)
 */
export const convertPressure = (hpa) => {
    if (currentUnitSystem === UNIT_SYSTEMS.IMPERIAL) {
        return hpa * 0.02953;
    }
    return hpa;
};

/**
 * Distanz umrechnen (km zu mi)
 */
export const convertDistance = (km) => {
    if (currentUnitSystem === UNIT_SYSTEMS.IMPERIAL) {
        return km * 0.621371;
    }
    return km;
};

/**
 * Temperatur formatieren
 */
export const formatTemperature = (celsius, round = true) => {
    const value = convertTemperature(celsius);
    const rounded = round ? Math.round(value) : value.toFixed(1);
    return `${rounded}${getUnitSymbol('temperature')}`;
};

/**
 * Geschwindigkeit formatieren
 */
export const formatSpeed = (kmh, round = true) => {
    const value = convertSpeed(kmh);
    const rounded = round ? Math.round(value) : value.toFixed(1);
    return `${rounded} ${getUnitSymbol('speed')}`;
};

/**
 * Luftdruck formatieren
 */
export const formatPressure = (hpa, round = true) => {
    const value = convertPressure(hpa);
    const rounded = round ? Math.round(value) : value.toFixed(1);
    return `${rounded} ${getUnitSymbol('pressure')}`;
};

/**
 * Distanz formatieren
 */
export const formatDistance = (km, round = true) => {
    const value = convertDistance(km);
    const rounded = round ? value.toFixed(1) : value.toFixed(2);
    return `${rounded} ${getUnitSymbol('distance')}`;
};

/**
 * Toast beim Einheiten-Wechsel
 */
const showUnitToast = () => {
    const message = currentUnitSystem === UNIT_SYSTEMS.METRIC 
        ? '🌡️ °C (Celsius)' 
        : '🌡️ °F (Fahrenheit)';
    
    const toast = document.createElement('div');
    toast.className = 'unit-toast';
    toast.innerHTML = `
        <span class="m-icon">${currentUnitSystem === UNIT_SYSTEMS.METRIC ? 'thermostat' : 'thermostat_auto'}</span>
        <span>${message}</span>
    `;
    
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: var(--primary);
        color: var(--on-primary);
        padding: 10px 18px;
        border-radius: 40px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.4rem;
        font-weight: var(--weight-semiBold);
        box-shadow: var(--shadow-2);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
};

/**
 * Prüft ob metrisches System aktiv ist
 */
export const isMetric = () => {
    return currentUnitSystem === UNIT_SYSTEMS.METRIC;
};

/**
 * Prüft ob imperiales System aktiv ist
 */
export const isImperial = () => {
    return currentUnitSystem === UNIT_SYSTEMS.IMPERIAL;
};