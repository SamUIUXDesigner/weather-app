// js/favorites.js
// Diese Datei speichert und verwaltet favorisierte Städte

let favoritesManager = null;

export class FavoritesManager {
    constructor() {
        this.favorites = JSON.parse(localStorage.getItem('weatherFavorites') || '[]');
        this.createFavoritesUI();
    }
    
    /**
     * Favoriten-UI in der Sidebar erstellen
     */
    createFavoritesUI() {
        // Prüfen ob Container schon existiert
        if (document.querySelector('.favorites-section')) return;
        
        const favoritesSection = document.createElement('section');
        favoritesSection.className = 'section favorites-section';
        favoritesSection.setAttribute('aria-label', 'Favoriten');
        favoritesSection.innerHTML = `
            <div class="card card-lg">
                <h2 class="title-2">⭐ Favoriten</h2>
                <div data-favorites-list class="favorites-list-container">${this.renderFavoritesList()}</div>
            </div>
        `;
        
        // In linke Spalte einfügen (nach aktuelles Wetter)
        const currentWeather = document.querySelector('[data-current-weather]');
        if (currentWeather && currentWeather.parentNode) {
            currentWeather.parentNode.insertBefore(favoritesSection, currentWeather.nextSibling);
        }
        
        this.favoritesContainer = favoritesSection.querySelector('[data-favorites-list]');
        this.attachEvents();
    }
    
    /**
     * Favoriten-Liste rendern
     */
    renderFavoritesList() {
        if (this.favorites.length === 0) {
            return `
                <div class="empty-favorites" style="text-align: center; padding: 24px;">
                    <span class="m-icon" style="font-size: 48px; color: var(--on-surface-variant);">star_border</span>
                    <p class="label-1" style="margin-top: 12px; color: var(--on-surface-variant);">
                        Keine Favoriten<br>Klicke auf ⭐ zum Speichern
                    </p>
                </div>
            `;
        }
        
        return `
            <ul class="favorites-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto;">
                ${this.favorites.map((fav, index) => `
                    <li class="favorite-item" data-fav-id="${fav.lat}_${fav.lon}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--black-alpha-10); border-radius: 16px; transition: all 0.2s ease;">
                        <a href="#/weather?lat=${fav.lat}&lon=${fav.lon}" class="favorite-link" style="flex: 1; display: flex; align-items: center; gap: 12px;">
                            <span class="m-icon" style="color: var(--primary);">location_on</span>
                            <div>
                                <p class="body-2" style="font-weight: 500;">${fav.city}</p>
                                <p class="label-2" style="color: var(--on-surface-variant);">${new Date(fav.addedAt).toLocaleDateString('de-DE')}</p>
                            </div>
                        </a>
                        <button class="icon-btn remove-fav" data-lat="${fav.lat}" data-lon="${fav.lon}" style="width: 32px; height: 32px;" aria-label="Favorit entfernen">
                            <span class="m-icon" style="font-size: 18px;">close</span>
                        </button>
                    </li>
                `).join('')}
            </ul>
        `;
    }
    
    /**
     * Event-Listener für Favoriten
     */
    attachEvents() {
        // Remove-Buttons
        const removeBtns = document.querySelectorAll('.remove-fav');
        removeBtns.forEach(btn => {
            btn.removeEventListener('click', this.handleRemoveClick);
            btn.addEventListener('click', this.handleRemoveClick.bind(this));
        });
        
        // Favorite-Links - schließen Suche
        const favLinks = document.querySelectorAll('.favorite-link');
        favLinks.forEach(link => {
            link.removeEventListener('click', this.handleFavLinkClick);
            link.addEventListener('click', this.handleFavLinkClick);
        });
    }
    
    /**
     * Handler für Remove-Button
     */
    handleRemoveClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const btn = e.currentTarget;
        const lat = parseFloat(btn.dataset.lat);
        const lon = parseFloat(btn.dataset.lon);
        this.removeFavorite(lat, lon);
        
        // Button-Zustand aktualisieren falls die aktuelle Stadt entfernt wurde
        if (window.currentLat === lat && window.currentLon === lon) {
            this.updateFavoriteButtonState(lat, lon);
        }
    }
    
    /**
     * Handler für Favorite-Link (schließt Suche)
     */
    handleFavLinkClick() {
        const searchView = document.querySelector('[data-search-view]');
        if (searchView && searchView.classList.contains('active')) {
            searchView.classList.remove('active');
        }
    }
    
    /**
     * Favorit hinzufügen
     */
    addFavorite(city, lat, lon) {
        // Prüfen ob bereits vorhanden
        if (this.isFavorite(lat, lon)) {
            this.showToast(`${city} ist bereits in den Favoriten!`, 'info');
            return false;
        }
        
        this.favorites.push({ 
            city, 
            lat, 
            lon, 
            addedAt: new Date().toISOString(),
            id: Date.now()
        });
        this.save();
        this.updateUI();
        this.updateFavoriteButtonState(lat, lon);
        this.showToast(`${city} zu Favoriten hinzugefügt ⭐`, 'success');
        return true;
    }
    
    /**
     * Favorit entfernen
     */
    removeFavorite(lat, lon) {
        const city = this.favorites.find(f => f.lat === lat && f.lon === lon)?.city;
        this.favorites = this.favorites.filter(f => f.lat !== lat || f.lon !== lon);
        this.save();
        this.updateUI();
        this.updateFavoriteButtonState(lat, lon);
        if (city) {
            this.showToast(`${city} aus Favoriten entfernt`, 'info');
        }
    }
    
    /**
     * Prüft ob Stadt favorisiert ist
     */
    isFavorite(lat, lon) {
        return this.favorites.some(f => f.lat === lat && f.lon === lon);
    }
    
    /**
     * Aktualisiert den Zustand des Favorite-Buttons
     * @param {number} lat - Breitengrad
     * @param {number} lon - Längengrad
     */
    updateFavoriteButtonState(lat, lon) {
        const favoriteBtn = document.querySelector('[data-favorite-btn]');
        if (!favoriteBtn) return;
        
        const isFav = this.isFavorite(lat, lon);
        const icon = favoriteBtn.querySelector('.m-icon');
        if (icon) {
            icon.textContent = isFav ? 'favorite' : 'favorite_border';
            
            // Animation für Herz-Button
            if (isFav) {
                icon.style.animation = 'heartBeat 0.3s ease';
                setTimeout(() => {
                    if (icon) icon.style.animation = '';
                }, 300);
            }
        }
        favoriteBtn.setAttribute('data-is-favorite', isFav);
    }
    
    /**
     * Speichern im localStorage
     */
    save() {
        localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
    }
    
    /**
     * UI aktualisieren
     */
    updateUI() {
        if (this.favoritesContainer) {
            this.favoritesContainer.innerHTML = this.renderFavoritesList();
            this.attachEvents();
        }
    }
    
    /**
     * Toast-Benachrichtigung
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `favorite-toast ${type}`;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff4444' : '#2196f3'};
            color: white;
            padding: 12px 20px;
            border-radius: 40px;
            z-index: 1001;
            animation: slideIn 0.3s ease;
            font-size: 1.4rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        toast.innerHTML = `
            <span class="m-icon">${type === 'success' ? 'star' : 'info'}</span>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    /**
     * Gibt alle Favoriten zurück
     */
    getFavorites() {
        return this.favorites;
    }
    
    /**
     * Löscht alle Favoriten
     */
    clearAll() {
        this.favorites = [];
        this.save();
        this.updateUI();
        this.showToast('Alle Favoriten wurden gelöscht', 'info');
    }
}

/**
 * Favoriten initialisieren
 */
export const initFavorites = () => {
    if (!favoritesManager) {
        favoritesManager = new FavoritesManager();
    }
    return favoritesManager;
};

/**
 * Favorit hinzufügen
 */
export const addFavorite = (city, lat, lon) => {
    if (!favoritesManager) initFavorites();
    return favoritesManager.addFavorite(city, lat, lon);
};

/**
 * Favorit entfernen
 */
export const removeFavorite = (lat, lon) => {
    if (favoritesManager) favoritesManager.removeFavorite(lat, lon);
};

/**
 * Prüft ob Stadt favorisiert ist
 */
export const isFavorite = (lat, lon) => {
    if (favoritesManager) return favoritesManager.isFavorite(lat, lon);
    return false;
};

/**
 * Aktualisiert den Favorite-Button
 */
export const updateFavoriteButton = (lat, lon) => {
    if (favoritesManager) favoritesManager.updateFavoriteButtonState(lat, lon);
};

/**
 * Gibt alle Favoriten zurück
 */
export const getFavorites = () => {
    if (favoritesManager) return favoritesManager.getFavorites();
    return [];
};