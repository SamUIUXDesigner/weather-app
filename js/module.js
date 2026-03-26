// js/module.js
// Diese Datei enthält Hilfsfunktionen für Datum, Uhrzeit und AQI

// Wochentage (deutsch)
export const weekDayNames = [
    "Sonntag", "Montag", "Dienstag", "Mittwoch", 
    "Donnerstag", "Freitag", "Samstag"
];

// Monatsnamen (kurz)
export const monthNames = [
    "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
    "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"
];

/**
 * Erstellt ein Datum mit korrekter Zeitzone
 */
const getUTCDateWithTimezone = (unix, timezone) =>
    new Date((unix + timezone) * 1000);

/**
 * Gibt das Datum im Format "Sonntag 10, Jan" zurück
 */
export const getDate = (dateUnix, timezone) => {
    const date = getUTCDateWithTimezone(dateUnix, timezone);
    const weekDayName = weekDayNames[date.getUTCDay()];
    const monthName = monthNames[date.getUTCMonth()];
    return `${weekDayName} ${date.getUTCDate()}, ${monthName}`;
};

/**
 * Gibt die Uhrzeit im Format "HH:MM AM/PM" zurück
 */
export const getTime = (timeUnix, timezone) => {
    const date = getUTCDateWithTimezone(timeUnix, timezone);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const paddedMinutes = minutes.toString().padStart(2, "0");
    return `${hours % 12 || 12}:${paddedMinutes} ${period}`;
};

/**
 * Gibt die Stunde im Format "HH AM/PM" zurück
 */
export const getHours = (timeUnix, timezone) => {
    const date = getUTCDateWithTimezone(timeUnix, timezone);
    const hours = date.getUTCHours();
    const period = hours >= 12 ? "PM" : "AM";
    return `${hours % 12 || 12} ${period}`;
};

/**
 * Rechnet m/s in km/h um
 */
export const mps_to_kmh = mps => (mps * 3600) / 1000;

/**
 * AQI-Texte für Luftqualität (1 = sehr gut, 5 = sehr schlecht)
 */
export const aqiText = {
    1: {
        level: "Sehr gut",
        message: "Die Luftqualität ist zufriedenstellend."
    },
    2: {
        level: "Gut",
        message: "Die Luftqualität ist akzeptabel."
    },
    3: {
        level: "Mäßig",
        message: "Für empfindliche Personen leichte Gesundheitsbeeinträchtigung möglich."
    },
    4: {
        level: "Schlecht",
        message: "Gesundheitliche Beeinträchtigungen möglich."
    },
    5: {
        level: "Sehr schlecht",
        message: "Gesundheitswarnung! Ernsthafte Beeinträchtigungen möglich."
    }
};