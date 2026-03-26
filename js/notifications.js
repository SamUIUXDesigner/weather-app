// js/notifications.js
// Diese Datei verwaltet Browser-Benachrichtigungen

let notificationPermissionGranted = false;

/**
 * Benachrichtigungen initialisieren
 */
export const initNotifications = async () => {
    if (!('Notification' in window)) {
        console.warn('Browser unterstützt keine Benachrichtigungen');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        notificationPermissionGranted = true;
        return true;
    }
    
    return false;
};

/**
 * Benachrichtigungs-Berechtigung anfordern
 */
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        showToast('Ihr Browser unterstützt keine Benachrichtigungen', 'error');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        notificationPermissionGranted = true;
        showToast('Benachrichtigungen sind bereits aktiviert', 'success');
        return true;
    }
    
    if (Notification.permission === 'denied') {
        showToast('Benachrichtigungen wurden blockiert. Bitte in den Browser-Einstellungen aktivieren.', 'warning');
        return false;
    }
    
    try {
        const permission = await Notification.requestPermission();
        notificationPermissionGranted = permission === 'granted';
        
        if (notificationPermissionGranted) {
            showToast('✅ Benachrichtigungen aktiviert!', 'success');
            showTestNotification();
        } else {
            showToast('❌ Benachrichtigungen wurden abgelehnt', 'error');
        }
        
        return notificationPermissionGranted;
    } catch (error) {
        console.error('Fehler:', error);
        return false;
    }
};

/**
 * Benachrichtigung anzeigen
 */
export const showNotification = (title, body, icon = './assets/images/logo.png') => {
    if (!notificationPermissionGranted && Notification.permission !== 'granted') {
        return false;
    }
    
    try {
        const notification = new Notification(title, {
            body: body,
            icon: icon,
            silent: false
        });
        
        setTimeout(() => notification.close(), 5000);
        return notification;
    } catch (error) {
        console.error('Fehler beim Senden:', error);
        return false;
    }
};

/**
 * Test-Benachrichtigung
 */
const showTestNotification = () => {
    showNotification(
        '🌤️ Wetter App',
        'Benachrichtigungen funktionieren! Sie erhalten jetzt Wetter-Warnungen.',
        './assets/images/logo.png'
    );
};

/**
 * Wetter-Warnung anzeigen
 */
export const showWeatherAlert = (alertType, cityName, weatherData) => {
    let title = '';
    let body = '';
    
    switch (alertType) {
        case 'extreme_heat':
            title = '🔥 Extreme Hitze-Warnung!';
            body = `${cityName}: ${Math.round(weatherData.main.temp)}°C. Trinken Sie ausreichend Wasser!`;
            break;
        case 'extreme_cold':
            title = '❄️ Extreme Kälte-Warnung!';
            body = `${cityName}: ${Math.round(weatherData.main.temp)}°C. Ziehen Sie sich warm an!`;
            break;
        case 'strong_wind':
            title = '💨 Sturm-Warnung!';
            body = `${cityName}: Wind ${Math.round(weatherData.wind.speed)} km/h. Vorsicht!`;
            break;
        case 'high_humidity':
            title = '💧 Hohe Luftfeuchtigkeit!';
            body = `${cityName}: ${weatherData.main.humidity}% Luftfeuchtigkeit.`;
            break;
        default:
            return;
    }
    
    showNotification(title, body);
};

/**
 * Tägliche Wetter-Zusammenfassung
 */
export const scheduleDailyWeatherNotification = async (getWeatherCallback) => {
    if (!notificationPermissionGranted && Notification.permission !== 'granted') {
        return false;
    }
    
    const lastNotified = localStorage.getItem('lastWeatherNotification');
    const today = new Date().toDateString();
    
    if (lastNotified !== today) {
        if (getWeatherCallback && typeof getWeatherCallback === 'function') {
            try {
                const weatherData = await getWeatherCallback();
                if (weatherData) {
                    showDailySummary(weatherData);
                    localStorage.setItem('lastWeatherNotification', today);
                    return true;
                }
            } catch (error) {
                console.error('Fehler:', error);
            }
        }
    }
    return false;
};

/**
 * Tägliche Zusammenfassung anzeigen
 */
const showDailySummary = (weatherData) => {
    const temp = Math.round(weatherData.main.temp);
    const description = weatherData.weather[0].description;
    
    let tip = '';
    if (temp > 30) tip = 'Tipp: Viel Wasser trinken! ☀️';
    else if (temp < 0) tip = 'Tipp: Warm anziehen! 🧣';
    else tip = 'Tipp: Genießen Sie das Wetter! 🌤️';
    
    showNotification(
        '🌤️ Tägliche Wetter-Zusammenfassung',
        `${temp}°C, ${description}\n${tip}`,
        './assets/images/logo.png'
    );
};

/**
 * Toast-Benachrichtigung (für Feedback)
 */
const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff4444' : '#2196f3'};
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        z-index: 10001;
        animation: slideIn 0.3s ease;
        font-size: 1.4rem;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};