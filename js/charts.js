// js/charts.js
// Diese Datei erstellt das Temperatur-Diagramm mit Chart.js

let currentChart = null;

/**
 * Zerstört das bestehende Chart
 */
export const destroyChart = () => {
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
};

/**
 * Aktualisiert die Chart-Farben basierend auf dem aktuellen Theme
 */
export const updateChartTheme = () => {
    if (!currentChart) return;
    
    const isDarkTheme = document.body.getAttribute('data-theme') !== 'light';
    const textColor = isDarkTheme ? '#EAE6F2' : '#333333';
    const gridColor = isDarkTheme ? '#3E3D40' : '#e0e0e0';
    
    if (currentChart.options?.plugins?.legend?.labels) {
        currentChart.options.plugins.legend.labels.color = textColor;
    }
    if (currentChart.options?.scales?.y) {
        currentChart.options.scales.y.ticks.color = textColor;
        currentChart.options.scales.y.grid.color = gridColor;
    }
    if (currentChart.options?.scales?.x) {
        currentChart.options.scales.x.ticks.color = textColor;
    }
    
    currentChart.update();
};

/**
 * Erstellt ein Temperatur-Diagramm
 * @param {Object} forecastData - Die Forecast-Daten
 * @param {number} timezone - Zeitzone
 * @param {string} unitSystem - Einheitensystem ('metric' oder 'imperial')
 */
export const createTemperatureChart = (forecastData, timezone = 0, unitSystem = 'metric') => {
    // Prüfen ob Chart.js geladen ist
    if (typeof Chart === 'undefined') {
        console.error('Chart.js ist nicht geladen');
        return null;
    }
    
    const canvas = document.querySelector('[data-temp-chart]');
    if (!canvas) {
        console.warn('Chart Canvas nicht gefunden');
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    if (!forecastData || !forecastData.list || forecastData.list.length === 0) {
        console.warn('Keine Forecast-Daten für Diagramm');
        return null;
    }
    
    // Altes Chart löschen
    destroyChart();
    
    // Nur die ersten 8 Stunden nehmen (heute)
    const hourlyData = forecastData.list.slice(0, 8);
    
    // Einheiten-Symbol für die Achsenbeschriftung
    const tempUnit = unitSystem === 'metric' ? '°C' : '°F';
    
    // Labels und Daten vorbereiten
    const labels = hourlyData.map(item => {
        const date = new Date(item.dt * 1000);
        // Mit Zeitzone korrigieren
        if (timezone) {
            const localDate = new Date((item.dt + timezone) * 1000);
            return localDate.getUTCHours() + ':00';
        }
        return date.getHours() + ':00';
    });
    
    // Temperaturen (werden bereits in der richtigen Einheit von der API geliefert)
    const temperatures = hourlyData.map(item => Math.round(item.main.temp));
    const feelsLike = hourlyData.map(item => Math.round(item.main.feels_like));
    
    // Theme-Farben ermitteln
    const isDarkTheme = document.body.getAttribute('data-theme') !== 'light';
    const textColor = isDarkTheme ? '#EAE6F2' : '#333333';
    const gridColor = isDarkTheme ? '#3E3D40' : '#e0e0e0';
    const tooltipBg = isDarkTheme ? 'rgba(29, 28, 31, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const tooltipText = isDarkTheme ? '#EAE6F2' : '#333333';
    
    // Chart erstellen
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Temperatur (${tempUnit})`,
                    data: temperatures,
                    borderColor: '#B5A1E5',
                    backgroundColor: 'rgba(181, 161, 229, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#B5A1E5',
                    pointBorderColor: isDarkTheme ? '#1D1C1F' : '#FFFFFF',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#B5A1E5',
                },
                {
                    label: `Gefühlt (${tempUnit})`,
                    data: feelsLike,
                    borderColor: '#E5C089',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4,
                    borderDash: [5, 5],
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#E5C089',
                    pointBorderColor: isDarkTheme ? '#1D1C1F' : '#FFFFFF',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor,
                        font: {
                            size: 12,
                            family: 'Nunito Sans, sans-serif'
                        },
                        usePointStyle: true,
                        boxWidth: 8,
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: tooltipBg,
                    titleColor: tooltipText,
                    bodyColor: tooltipText === '#EAE6F2' ? '#B9B6BF' : '#666666',
                    borderColor: '#B5A1E5',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}${tempUnit}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: {
                        color: gridColor,
                        drawBorder: false,
                    },
                    ticks: {
                        color: textColor,
                        stepSize: 5,
                        callback: function(value) {
                            return value + tempUnit;
                        }
                    },
                    title: {
                        display: true,
                        text: 'Temperatur',
                        color: textColor === '#EAE6F2' ? '#7B7980' : '#999999',
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false,
                    },
                    ticks: {
                        color: textColor,
                        maxRotation: 45,
                        minRotation: 45
                    },
                    title: {
                        display: true,
                        text: 'Uhrzeit',
                        color: textColor === '#EAE6F2' ? '#7B7980' : '#999999',
                        font: {
                            size: 11
                        }
                    }
                }
            },
            elements: {
                line: {
                    borderJoin: 'round',
                }
            }
        }
    });
    
    // Chart global speichern für Theme-Updates
    window.currentChart = currentChart;
    
    return currentChart;
};

/**
 * Aktualisiert das Chart mit neuen Einheiten
 * @param {string} unitSystem - 'metric' oder 'imperial'
 */
export const updateChartUnits = (unitSystem) => {
    if (!currentChart) return;
    
    const tempUnit = unitSystem === 'metric' ? '°C' : '°F';
    
    // Datensatz-Labels aktualisieren
    if (currentChart.data.datasets[0]) {
        currentChart.data.datasets[0].label = `Temperatur (${tempUnit})`;
    }
    if (currentChart.data.datasets[1]) {
        currentChart.data.datasets[1].label = `Gefühlt (${tempUnit})`;
    }
    
    // Y-Achsen-Beschriftung aktualisieren
    if (currentChart.options?.scales?.y?.ticks) {
        currentChart.options.scales.y.ticks.callback = function(value) {
            return value + tempUnit;
        };
    }
    
    // Tooltip-Callbacks aktualisieren
    if (currentChart.options?.plugins?.tooltip?.callbacks) {
        currentChart.options.plugins.tooltip.callbacks.label = function(context) {
            return `${context.dataset.label}: ${context.raw}${tempUnit}`;
        };
    }
    
    currentChart.update();
};