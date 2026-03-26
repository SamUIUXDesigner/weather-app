// js/theme.js
// Diese Datei verwaltet den Dark/Light Mode

const THEMES = {
    DARK: 'dark',
    LIGHT: 'light'
};

const THEME_ICONS = {
    dark: 'dark_mode',
    light: 'light_mode'
};

/**
 * Theme initialisieren
 */
export const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || THEMES.DARK;
    applyTheme(savedTheme);
    setupThemeToggle();
    detectSystemTheme();
};

/**
 * Theme anwenden
 */
const applyTheme = (theme) => {
    document.body.setAttribute('data-theme', theme);
    
    // Theme-Farbe für mobile Browser
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        const bgColor = theme === THEMES.DARK ? '#131214' : '#f5f5f5';
        metaThemeColor.setAttribute('content', bgColor);
    }
    
    // Chart-Theme aktualisieren (falls vorhanden)
    updateChartTheme(theme);
};

/**
 * Theme-Toggle Button einrichten
 */
const setupThemeToggle = () => {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;
    
    const currentTheme = document.body.getAttribute('data-theme') || THEMES.DARK;
    const icon = themeToggle.querySelector('.m-icon');
    if (icon) icon.textContent = THEME_ICONS[currentTheme];
    
    themeToggle.addEventListener('click', toggleTheme);
};

/**
 * Theme umschalten
 */
const toggleTheme = () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Icon aktualisieren
    const icon = document.querySelector('.theme-toggle .m-icon');
    if (icon) icon.textContent = THEME_ICONS[newTheme];
    
    // Animation
    icon.style.transform = 'rotate(360deg)';
    setTimeout(() => { if (icon) icon.style.transform = ''; }, 300);
    
    // Event auslösen
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
};

/**
 * System-Theme erkennen
 */
const detectSystemTheme = () => {
    if (window.matchMedia && !localStorage.getItem('theme')) {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
            ? THEMES.DARK : THEMES.LIGHT;
        applyTheme(systemTheme);
    }
};

/**
 * Chart-Theme aktualisieren
 */
const updateChartTheme = (theme) => {
    if (window.currentChart) {
        const textColor = theme === THEMES.DARK ? '#EAE6F2' : '#333333';
        const gridColor = theme === THEMES.DARK ? '#3E3D40' : '#e0e0e0';
        
        const chart = window.currentChart;
        if (chart.options?.plugins?.legend?.labels) {
            chart.options.plugins.legend.labels.color = textColor;
        }
        if (chart.options?.scales?.y) {
            chart.options.scales.y.ticks.color = textColor;
            chart.options.scales.y.grid.color = gridColor;
        }
        if (chart.options?.scales?.x) {
            chart.options.scales.x.ticks.color = textColor;
        }
        chart.update();
    }
};

/**
 * Aktuelles Theme zurückgeben
 */
export const getCurrentTheme = () => {
    return document.body.getAttribute('data-theme') || THEMES.DARK;
};