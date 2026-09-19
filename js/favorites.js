// Favorites persistence utility using localStorage
const FAVORITES_KEY = 'wangwana_favorites';

/**
 * Retrieves list of favorite property IDs from localStorage
 * @returns {string[]}
 */
export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse favorites from localStorage:', err);
    return [];
  }
}

/**
 * Checks if a given property ID is currently in favorites
 * @param {string} propertyId
 * @returns {boolean}
 */
export function isFavorite(propertyId) {
  if (!propertyId) return false;
  const favs = getFavorites();
  return favs.includes(propertyId);
}

/**
 * Toggles a property ID in favorites, updates localStorage, and notifies listeners
 * @param {string} propertyId
 * @returns {boolean} New favorite state (true = saved, false = removed)
 */
export function toggleFavorite(propertyId) {
  if (!propertyId) return false;
  const favs = getFavorites();
  const index = favs.indexOf(propertyId);
  let nowFavorite = false;

  if (index > -1) {
    favs.splice(index, 1);
    nowFavorite = false;
  } else {
    favs.push(propertyId);
    nowFavorite = true;
  }

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch (err) {
    console.warn('Failed to save favorites to localStorage:', err);
  }

  // Dispatch custom event for reactive UI updates across all components
  window.dispatchEvent(new CustomEvent('wangwana:favorites-changed', {
    detail: {
      propertyId,
      isFavorite: nowFavorite,
      allFavorites: favs
    }
  }));

  return nowFavorite;
}

/**
 * Returns total count of saved favorites
 * @returns {number}
 */
export function getFavoriteCount() {
  return getFavorites().length;
}
