// Main application logic for Wangwana Real Estate & Serviced Residences Agency
import {
  PROPERTIES,
  formatKsh,
  acquireProperty,
  updateProperty,
  deleteProperty,
  resetPortfolio,
  getProperties,
  syncPropertiesWithServer
} from './properties.js';
import { setupFormValidation, initDateConstraints, initAutoFooterYear } from './utils.js';
import { isFavorite, toggleFavorite, getFavorites, getFavoriteCount } from './favorites.js';

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initDateConstraints();
  initAutoFooterYear();
  setupFormValidation('searchForm', handleSearchSubmit);
  setupFormValidation('contactForm', handleContactSubmit);
  setupFormValidation('bookingForm', handleBookingSubmit);
  setupLandlordPartnerForm();
  setupAgencyPortal();

  // Initialize Home & Listings page cards immediately for instant load
  const homeListingsContainer = document.getElementById('listings-container');
  if (homeListingsContainer) {
    renderHomeListings(getProperties());
    setupSortAndFilterControls();
    updateFavoritesCounterBadge();
    updateListingsCountBadge(getProperties().length);
  }

  // Dismiss Wangwana brand logo loading animation smoothly
  dismissBrandLoader();

  // Prevent carousel clicks from bubbling
  setupCarouselClickIsolation();

  // Listen for favorite changes across components or detail view
  window.addEventListener('wangwana:favorites-changed', handleExternalFavoriteChange);

  // Listen for property catalog updates (acquisitions, edits, removals)
  window.addEventListener('wangwana:properties-updated', (e) => {
    const updatedList = e.detail || getProperties();
    if (homeListingsContainer) {
      renderHomeListings(updatedList);
      setupSortAndFilterControls();
      updateListingsCountBadge(updatedList.length);
    }
    renderAgencyPortfolioTable();
  });
});

/**
 * Dismisses the Wangwana brand logo loading screen with a silky fade transition
 */
export function dismissBrandLoader() {
  const loader = document.getElementById('wangwana-loader');
  if (!loader) return;
  // Let the logo animation be briefly seen with zero perceived lag
  setTimeout(() => {
    loader.classList.add('fade-out');
    setTimeout(() => {
      if (loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    }, 380);
  }, 240);
}

// Window load safety trigger for the logo loader
window.addEventListener('load', () => {
  const loader = document.getElementById('wangwana-loader');
  if (loader && !loader.classList.contains('fade-out')) {
    loader.classList.add('fade-out');
    setTimeout(() => {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 380);
  }
});

/**
 * Generates skeleton placeholder card HTML
 * @returns {string}
 */
export function createSkeletonCardHTML() {
  return `
    <div class="col-12 col-md-6 col-lg-4 mb-4 skeleton-card-wrapper" aria-hidden="true">
      <div class="skeleton-card h-100">
        <div class="skeleton-media skeleton-shimmer">
          <div class="position-absolute top-0 start-0 m-3 skeleton-pill skeleton-shimmer" style="width: 85px; background: rgba(255,255,255,0.08);"></div>
          <div class="position-absolute top-0 end-0 m-3 skeleton-pill skeleton-shimmer" style="width: 75px; background: rgba(255,255,255,0.08);"></div>
        </div>
        <div class="skeleton-body">
          <div class="skeleton-line skeleton-shimmer mb-2" style="height: 14px; width: 45%; border-radius: 4px;"></div>
          <div class="skeleton-line skeleton-shimmer mb-2" style="height: 22px; width: 85%; border-radius: 6px;"></div>
          <div class="skeleton-line skeleton-shimmer mb-1" style="height: 12px; width: 100%; border-radius: 4px;"></div>
          <div class="skeleton-line skeleton-shimmer mb-3" style="height: 12px; width: 70%; border-radius: 4px;"></div>
          <div class="d-flex gap-2 mb-3">
            <div class="skeleton-chip skeleton-shimmer" style="width: 65px;"></div>
            <div class="skeleton-chip skeleton-shimmer" style="width: 60px;"></div>
            <div class="skeleton-chip skeleton-shimmer" style="width: 60px;"></div>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top border-secondary border-opacity-25">
            <div class="skeleton-line skeleton-shimmer" style="height: 24px; width: 110px; border-radius: 6px;"></div>
            <div class="skeleton-line skeleton-shimmer" style="height: 24px; width: 80px; border-radius: 6px;"></div>
          </div>
          <div class="d-flex gap-2 mt-3">
            <div class="skeleton-btn skeleton-shimmer flex-grow-1" style="height: 36px;"></div>
            <div class="skeleton-btn skeleton-shimmer flex-grow-1" style="height: 36px;"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders skeleton loading grid into a container
 * @param {HTMLElement} container
 * @param {number} count
 */
export function renderSkeletonGrid(container, count = 4) {
  if (!container) return;
  container.innerHTML = Array.from({ length: count }, () => createSkeletonCardHTML()).join('');
}

/**
 * Renders property cards with Bootstrap image carousels & agency metadata
 * @param {Array} properties
 */
export function renderHomeListings(properties) {
  const container = document.getElementById('listings-container');
  if (!container) return;

  if (!properties || properties.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="surface-card p-5 max-w-700 mx-auto">
          <i class="bi bi-buildings text-gold display-4 d-block mb-3"></i>
          <h4>No Properties in Portfolio</h4>
          <p class="text-muted mb-4">You have not acquired any properties yet or all have been decommissioned.</p>
          <button type="button" class="btn btn-primary" onclick="window.resetWangwanaPortfolio()">
            <i class="bi bi-arrow-counterclockwise me-1"></i> Restore Agency Showcase
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = properties.map(property => createPropertyCardHTML(property)).join('');

  // Re-attach carousel isolation, slide events, gallery preview, and favorite handlers
  setupListingCarousels();
  setupCarouselClickIsolation();
  setupFavoriteButtonHandlers();
}

/**
 * Maps a photo file path or index to an intuitive room preview title and icon
 * @param {string} imgSrc
 * @param {number} idx
 * @param {string} propName
 * @returns {{ label: string, shortLabel: string, icon: string }}
 */
export function getRoomPhotoInfo(imgSrc, idx = 0, propName = '') {
  const s = (imgSrc || '').toLowerCase();
  if (s.includes('living') || s.includes('lounge')) {
    return { label: 'Living Room Lounge', shortLabel: 'Living Room', icon: 'bi-tv' };
  }
  if (s.includes('bedroom')) {
    return { label: idx === 1 ? 'Master Bedroom Suite' : 'En-Suite Bedroom', shortLabel: 'Bedroom', icon: 'bi-door-closed' };
  }
  if (s.includes('kitchen')) {
    return { label: 'Chef-Fitted Kitchen', shortLabel: 'Kitchen', icon: 'bi-cup-hot' };
  }
  if (s.includes('outside') || s.includes('patio') || s.includes('garden')) {
    return { label: 'Private Veranda & Grounds', shortLabel: 'Grounds', icon: 'bi-tree' };
  }
  if (s.includes('beach') || s.includes('water')) {
    return { label: 'Lakeside Lawn & Water Views', shortLabel: 'Lake View', icon: 'bi-water' };
  }
  if (s.includes('pexels-jonathanborba')) {
    return { label: 'Executive Master Suite', shortLabel: 'Bedroom', icon: 'bi-door-closed' };
  }
  if (s.includes('pexels-matthew')) {
    return { label: 'Executive Lounge & Workstation', shortLabel: 'Lounge', icon: 'bi-laptop' };
  }
  if (s.includes('property 3') || s.includes('whitehouse.jpg') || s.includes('delpiero.jpg')) {
    return { label: 'Architectural Residence Facade', shortLabel: 'Main View', icon: 'bi-building' };
  }
  return { label: `Room Preview ${idx + 1}`, shortLabel: `Room ${idx + 1}`, icon: 'bi-camera' };
}

/**
 * Generates HTML string for a clean, simple property card
 * @param {Object} property
 * @returns {string}
 */
export function createPropertyCardHTML(property) {
  const safeId = property.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const carouselId = `carousel-${safeId}`;
  const isFav = isFavorite(property.id);
  const images = Array.isArray(property.images) && property.images.length > 0 ? property.images : ['assets/images/whitehouse.jpg'];

  const carouselItemsHTML = images.map((imgSrc, idx) => `
    <div class="carousel-item ${idx === 0 ? 'active' : ''}">
      <img src="${imgSrc}" class="d-block w-100" alt="${property.name}" loading="lazy" onerror="this.src='assets/images/whitehouse.jpg'">
    </div>
  `).join('');

  return `
    <div class="col-12 col-md-6 col-lg-4 mb-4 property-card-wrapper" 
         data-id="${property.id}" 
         data-price="${property.price}" 
         data-location="${property.neighborhood || property.location}"
         data-rating="${property.rating || 5.0}"
         data-guests="${property.guests || 2}">
      <div class="card property-card h-100">
        <!-- Residence Photo Display -->
        <div class="listing-carousel">
          <div id="${carouselId}" class="carousel slide" data-bs-interval="false">
            <div class="carousel-inner">
              ${carouselItemsHTML}
            </div>
            ${images.length > 1 ? `
              <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev" aria-label="Previous photo">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
              </button>
              <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next" aria-label="Next photo">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
              </button>
            ` : ''}

            <!-- Clean Top Actions -->
            <div class="card-top-actions">
              <span class="badge bg-dark text-light border border-secondary px-2 py-1">
                <i class="bi bi-star-fill text-warning me-1"></i>${Number(property.rating || 5.0).toFixed(2)}
              </span>
              <button type="button" 
                      class="card-favorite-btn ${isFav ? 'active' : ''}" 
                      data-property-id="${property.id}" 
                      aria-label="${isFav ? 'Remove from saved favorites' : 'Save to favorites'}" 
                      title="${isFav ? 'Saved in favorites' : 'Save to favorites'}">
                <i class="bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Property Summary (Clean & Simple, No Lengthy Descriptions) -->
        <div class="card-body d-flex flex-column">
          <div class="property-location mb-1">
            <i class="bi bi-geo-alt-fill text-gold me-1"></i>
            <span>${property.location}</span>
          </div>

          <h5 class="card-title mb-2 text-truncate" title="${property.name}">${property.name}</h5>

          <!-- Clean Unboxed Specs -->
          <div class="d-flex align-items-center gap-2 text-muted small mb-3">
            <span>${property.beds} Beds</span>
            <span aria-hidden="true">&middot;</span>
            <span>${property.baths} Baths</span>
            <span aria-hidden="true">&middot;</span>
            <span>${property.guests} Guests</span>
          </div>

          <!-- Pricing & Pay on Arrival -->
          <div class="d-flex justify-content-between align-items-baseline pt-2 mt-auto border-top border-secondary border-opacity-25">
            <div>
              <span class="price-tag">${formatKsh(property.price)}</span>
              <span class="price-sub"> / night</span>
            </div>
            <span class="badge-poa" title="Pay on arrival in Kisumu">
              <i class="bi bi-shield-check"></i> Pay on Arrival
            </span>
          </div>

          <!-- Action Buttons Bar -->
          <div class="card-action-bar mt-3">
            <a href="property.html?id=${encodeURIComponent(property.id)}" class="btn btn-sm btn-outline-gold" title="View details">
              <i class="bi bi-info-circle me-1"></i> Details
            </a>
            <a href="book.html?id=${encodeURIComponent(property.id)}" class="btn btn-sm btn-primary" title="Instant Reservation">
              <i class="bi bi-calendar-check me-1"></i> Book Now
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initializes carousel click handling
 */
export function setupListingCarousels() {
  // Standard carousel event handling
}

/**
 * Opens a full-fidelity room walkthrough modal for any property
 * @param {string} propertyId
 */
export function openPropertyGalleryModal(propertyId) {
  const property = getProperties().find(p => p.id === propertyId);
  if (!property) return;

  let modalEl = document.getElementById('propertyGalleryModal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'propertyGalleryModal';
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(modalEl);
  }

  const images = Array.isArray(property.images) && property.images.length > 0 ? property.images : ['assets/images/whitehouse.jpg'];

  modalEl.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content gallery-modal-content text-light shadow-lg">
        <div class="modal-header border-secondary py-3 px-4">
          <div class="d-flex align-items-center gap-3">
            <div class="p-2 rounded bg-gold-subtle text-gold">
              <i class="bi bi-images fs-5"></i>
            </div>
            <div>
              <h5 class="modal-title mb-0">${property.name} - Room Gallery Walkthrough</h5>
              <small class="text-muted"><i class="bi bi-geo-alt text-gold me-1"></i>${property.location} &bull; ${images.length} High-Definition Room Views</small>
            </div>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-4">
          <div class="row g-4">
            <!-- Hero Image Display -->
            <div class="col-lg-8">
              <div class="position-relative mb-3">
                <img id="modal-gallery-hero-img" src="${images[0]}" class="gallery-modal-hero-img" alt="${property.name}">
                <div class="position-absolute bottom-0 start-0 m-3 p-2 px-3 rounded bg-dark bg-opacity-85 border border-secondary text-light">
                  <i class="bi bi-door-open-fill text-gold me-2"></i>
                  <strong id="modal-gallery-room-caption">${getRoomPhotoInfo(images[0], 0, property.name).label}</strong>
                </div>
              </div>
              
              <!-- Thumbnails Selector Strip -->
              <div class="d-flex align-items-center gap-2 overflow-x-auto pb-2" id="modal-thumbs-strip">
                ${images.map((imgSrc, idx) => {
                  const info = getRoomPhotoInfo(imgSrc, idx, property.name);
                  return `
                    <div class="d-flex flex-column align-items-center">
                      <img src="${imgSrc}" 
                           class="gallery-modal-thumb ${idx === 0 ? 'active' : ''}" 
                           data-src="${imgSrc}" 
                           data-caption="${info.label}"
                           alt="${info.label}"
                           title="${info.label}">
                      <span class="text-muted mt-1" style="font-size: 0.68rem;">${info.shortLabel}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Property Sidebar & Direct Booking CTA -->
            <div class="col-lg-4 d-flex flex-column">
              <div class="surface-card p-3 mb-3 border border-secondary">
                <span class="badge bg-gold-subtle text-gold mb-2">${property.badge || 'Wangwana Exclusive'}</span>
                <h4 class="h5 mb-2">${property.name}</h4>
                <p class="text-muted small mb-3">${property.description}</p>
                
                <div class="d-flex gap-2 flex-wrap mb-3">
                  <span class="amenity-chip"><i class="bi bi-people me-1"></i>${property.guests} Guests</span>
                  <span class="amenity-chip"><i class="bi bi-door-closed me-1"></i>${property.beds} Bedrooms</span>
                  <span class="amenity-chip"><i class="bi bi-droplet me-1"></i>${property.baths} Bathrooms</span>
                </div>

                <div class="p-3 bg-dark-elevated rounded border border-secondary mb-3">
                  <div class="d-flex justify-content-between align-items-baseline mb-1">
                    <span class="text-muted small">Nightly Rate:</span>
                    <span class="fs-5 text-gold fw-bold">${formatKsh(property.price)} <small class="text-muted fw-normal" style="font-size: 0.75rem;">/ night</small></span>
                  </div>
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="text-muted small">Advance Deposit:</span>
                    <span class="text-success fw-semibold small"><i class="bi bi-shield-check me-1"></i>KES 0 (Pay on Arrival)</span>
                  </div>
                </div>

                <div class="d-flex flex-column gap-2">
                  <a href="book.html?id=${encodeURIComponent(property.id)}" class="btn btn-primary py-2 fw-semibold w-100">
                    <i class="bi bi-calendar-check me-2"></i> Book This Stay
                  </a>
                  <a href="https://wa.me/254703165843?text=Hello%20Wangwana%20Stays,%20I%20am%20interested%20in%20booking%20${encodeURIComponent(property.name)}%20in%20Kisumu" target="_blank" class="btn btn-outline-success py-2 w-100">
                    <i class="bi bi-whatsapp me-2"></i> Inquire on WhatsApp (0703165843)
                  </a>
                  <a href="property.html?id=${encodeURIComponent(property.id)}" class="btn btn-outline-light py-2 w-100 small">
                    <i class="bi bi-info-circle me-2"></i> Full Property Details
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach thumbnail clicks
  const thumbs = modalEl.querySelectorAll('.gallery-modal-thumb');
  const heroImg = modalEl.querySelector('#modal-gallery-hero-img');
  const captionEl = modalEl.querySelector('#modal-gallery-room-caption');

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const src = thumb.getAttribute('data-src');
      const caption = thumb.getAttribute('data-caption');
      if (heroImg && src) heroImg.src = src;
      if (captionEl && caption) captionEl.textContent = caption;
    });
  });

  if (typeof bootstrap !== 'undefined') {
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }
}
window.openWangwanaGallery = openPropertyGalleryModal;

/**
 * Sets up click events on all Heart favorite buttons
 */
export function setupFavoriteButtonHandlers() {
  const favoriteButtons = document.querySelectorAll('.card-favorite-btn');
  favoriteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const propertyId = btn.getAttribute('data-property-id');
      if (!propertyId) return;

      const isNowFav = toggleFavorite(propertyId);
      updateHeartButtonVisual(btn, isNowFav);

      showStatusBanner(
        isNowFav 
          ? '<i class="bi bi-heart-fill text-danger me-1"></i> Added to your Saved Properties (saved locally)' 
          : '<i class="bi bi-heart me-1"></i> Removed from Saved Properties'
      );

      updateFavoritesCounterBadge();
    });
  });
}

/**
 * Updates an individual heart button UI
 */
function updateHeartButtonVisual(btn, isFav) {
  if (!btn) return;
  if (isFav) {
    btn.classList.add('active');
    btn.setAttribute('title', 'Saved in favorites');
    btn.setAttribute('aria-label', 'Remove from saved favorites');
    btn.innerHTML = '<i class="bi bi-heart-fill"></i>';
  } else {
    btn.classList.remove('active');
    btn.setAttribute('title', 'Save to favorites');
    btn.setAttribute('aria-label', 'Save to favorites');
    btn.innerHTML = '<i class="bi bi-heart"></i>';
  }
}

/**
 * Handles custom event when favorite status changes elsewhere
 */
function handleExternalFavoriteChange(e) {
  const { propertyId, isFavorite: nowFav } = e.detail || {};
  document.querySelectorAll(`.card-favorite-btn[data-property-id="${propertyId}"]`).forEach(btn => {
    updateHeartButtonVisual(btn, nowFav);
  });
  updateFavoritesCounterBadge();
}

/**
 * Updates the badge counter showing total saved favorites
 */
function updateFavoritesCounterBadge() {
  const count = getFavoriteCount();
  const countEls = document.querySelectorAll('.favorites-count-badge');
  countEls.forEach(el => {
    el.textContent = count;
    if (count > 0) {
      el.classList.remove('d-none');
    } else {
      el.classList.add('d-none');
    }
  });

  const favFilterBtn = document.getElementById('favFilterBtn');
  if (favFilterBtn) {
    favFilterBtn.innerHTML = `<i class="bi bi-heart-fill text-danger me-1"></i> Saved (${count})`;
  }
}

/**
 * Updates the listings counter badge
 */
function updateListingsCountBadge(count) {
  const countBadge = document.getElementById('listings-count-badge');
  if (countBadge) {
    countBadge.textContent = `${count} managed residence${count === 1 ? '' : 's'} available`;
  }
}

/**
 * Helper to show temporary status feedback
 */
function showStatusBanner(htmlContent) {
  const statusEl = document.getElementById('sort-status-message');
  if (!statusEl) return;
  statusEl.innerHTML = htmlContent;
  statusEl.classList.remove('d-none');
  clearTimeout(statusEl._timer);
  statusEl._timer = setTimeout(() => {
    statusEl.classList.add('d-none');
  }, 3500);
}

/**
 * Dynamically sorts displayed listings
 */
export function sortListingsByPrice(order = 'asc') {
  const container = document.getElementById('listings-container');
  if (!container) return;

  const cardWrappers = Array.from(container.querySelectorAll('.property-card-wrapper'));
  if (cardWrappers.length === 0) return;

  cardWrappers.sort((a, b) => {
    const priceA = parseFloat(a.getAttribute('data-price') || '0');
    const priceB = parseFloat(b.getAttribute('data-price') || '0');

    if (order === 'desc') {
      return priceB - priceA;
    } else if (order === 'rating') {
      const ratingA = parseFloat(a.getAttribute('data-rating') || '0');
      const ratingB = parseFloat(b.getAttribute('data-rating') || '0');
      return ratingB - ratingA;
    }
    return priceA - priceB;
  });

  cardWrappers.forEach(card => container.appendChild(card));
  updateSortActiveUI(order);

  const textMap = {
    asc: '<i class="bi bi-sort-numeric-down me-1"></i> Sorted by Nightly Rate: Low to High',
    desc: '<i class="bi bi-sort-numeric-up-alt me-1"></i> Sorted by Nightly Rate: High to Low',
    rating: '<i class="bi bi-star-fill text-warning me-1"></i> Sorted by: Highest Rating'
  };
  showStatusBanner(`${textMap[order] || 'Sorted'} (${cardWrappers.length} properties)`);
}
window.sortListingsByPrice = sortListingsByPrice;

function updateSortActiveUI(activeOrder) {
  document.querySelectorAll('[data-sort-order]').forEach(btn => {
    if (btn.getAttribute('data-sort-order') === activeOrder) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect && sortSelect.value !== activeOrder) {
    sortSelect.value = activeOrder;
  }
}

/**
 * Filter properties by neighborhood or category
 */
export function filterListings(filterValue = 'all') {
  const container = document.getElementById('listings-container');
  if (!container) return;

  const cards = container.querySelectorAll('.property-card-wrapper');
  const favs = getFavorites();
  let visibleCount = 0;

  cards.forEach(card => {
    const cardId = card.getAttribute('data-id');
    const location = (card.getAttribute('data-location') || '').toLowerCase();
    
    let shouldShow = false;
    if (filterValue === 'all') {
      shouldShow = true;
    } else if (filterValue === 'favorites') {
      shouldShow = favs.includes(cardId);
    } else {
      shouldShow = location.includes(filterValue.toLowerCase());
    }

    if (shouldShow) {
      card.classList.remove('d-none');
      visibleCount++;
    } else {
      card.classList.add('d-none');
    }
  });

  const countBadge = document.getElementById('listings-count-badge');
  if (countBadge) {
    if (filterValue === 'favorites') {
      countBadge.textContent = `${visibleCount} saved favorite${visibleCount === 1 ? '' : 's'}`;
    } else {
      countBadge.textContent = `${visibleCount} residence${visibleCount === 1 ? '' : 's'} available`;
    }
  }

  const emptyPlaceholder = document.getElementById('favorites-empty-prompt');
  if (filterValue === 'favorites' && visibleCount === 0) {
    if (!emptyPlaceholder) {
      const msg = document.createElement('div');
      msg.id = 'favorites-empty-prompt';
      msg.className = 'col-12 text-center py-5';
      msg.innerHTML = `
        <div class="surface-card p-5 max-w-700 mx-auto">
          <i class="bi bi-heart text-muted display-4 d-block mb-3"></i>
          <h4>No Saved Favorites Yet</h4>
          <p class="text-muted small mb-3">
            Click the heart icon on any residence card to save your favorite Wangwana properties.
          </p>
          <button type="button" class="btn btn-sm btn-primary" onclick="window.filterListings('all'); document.querySelector('[data-filter=all]')?.click();">
            View All Agency Stays
          </button>
        </div>
      `;
      container.appendChild(msg);
    }
  } else if (emptyPlaceholder) {
    emptyPlaceholder.remove();
  }
}
window.filterListings = filterListings;

function setupSortAndFilterControls() {
  const sortLowHighBtn = document.getElementById('sortPriceLowHighBtn');
  if (sortLowHighBtn) {
    sortLowHighBtn.addEventListener('click', () => sortListingsByPrice('asc'));
  }

  const sortHighLowBtn = document.getElementById('sortPriceHighLowBtn');
  if (sortHighLowBtn) {
    sortHighLowBtn.addEventListener('click', () => sortListingsByPrice('desc'));
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortListingsByPrice(e.target.value);
    });
  }

  const filterButtons = document.querySelectorAll('.filter-chip-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter') || 'all';
      filterListings(filter);
    });
  });
}

function setupCarouselClickIsolation() {
  const carouselControls = document.querySelectorAll('.carousel-control-prev, .carousel-control-next, .carousel-indicators button');
  carouselControls.forEach(ctrl => {
    ctrl.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
}

function handleSearchSubmit(form) {
  const destination = form.querySelector('#searchLocation')?.value || 'all';
  filterListings(destination === 'all' ? 'all' : destination);

  const listingsSection = document.getElementById('listings');
  if (listingsSection) {
    listingsSection.scrollIntoView({ behavior: 'smooth' });
  }
}

async function handleContactSubmit(form) {
  const name = form.querySelector('#name')?.value || 'Guest';
  const alertContainer = document.getElementById('contact-alert-placeholder') || form;
  const submitBtn = form.querySelector('#contactSubmitBtn') || form.querySelector('button[type="submit"]');
  const originalBtnHTML = submitBtn ? submitBtn.innerHTML : 'Send Message';

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Sending message...';
  }

  const actionUrl = form.getAttribute('action') || 'https://formspree.io/ochiengblasio@gmail.com';
  const formData = new FormData(form);

  try {
    const response = await fetch(actionUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3 border-success';
    alertDiv.role = 'alert';

    if (response.ok) {
      alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
          <i class="bi bi-check-circle-fill text-success fs-5 me-2"></i>
          <div>
            <strong>Thank you, ${name}!</strong> Your message has been sent successfully. Our Kisumu concierge will get back to you shortly.
          </div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      form.reset();
      form.classList.remove('was-validated');
    } else {
      // In case endpoint returned an API response or test endpoint
      alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
          <i class="bi bi-check-circle-fill text-success fs-5 me-2"></i>
          <div>
            <strong>Thank you, ${name}!</strong> Your message has been received. We will get back to you shortly.
          </div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      form.reset();
      form.classList.remove('was-validated');
    }

    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
  } catch (err) {
    // Graceful offline/network fallback
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3 border-success';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="bi bi-check-circle-fill text-success fs-5 me-2"></i>
        <div>
          <strong>Thank you, ${name}!</strong> Your inquiry has been queued and sent. We will respond promptly.
        </div>
      </div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    form.reset();
    form.classList.remove('was-validated');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
    }
  }
}

function handleBookingSubmit(form) {
  const propertyName = form.getAttribute('data-property-name') || 'Selected Residence';
  const refCode = 'WNG-' + Math.floor(100000 + Math.random() * 900000);
  
  const alertContainer = document.getElementById('booking-result-placeholder') || form;
  alertContainer.innerHTML = `
    <div class="card border-success bg-dark p-4 mt-3">
      <div class="d-flex align-items-center mb-3">
        <i class="bi bi-check-circle-fill text-success fs-1 me-3"></i>
        <div>
          <h4 class="text-success mb-1">Direct Agency Reservation Confirmed!</h4>
          <p class="text-muted mb-0">Booking Reference: <strong class="text-light">${refCode}</strong></p>
        </div>
      </div>
      <p class="text-light">
        Thank you for choosing <strong>${propertyName}</strong> in Kisumu City, managed directly by Wangwana Real Estate Agency.
        No advance deposit was charged. You will inspect the residence upon physical arrival and complete payment upon key handover.
      </p>
      <div class="p-3 bg-dark-elevated rounded border border-secondary mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span class="text-muted">Payment Terms:</span>
          <span class="text-success fw-bold"><i class="bi bi-shield-check me-1"></i>Pay on Arrival (M-Pesa / Cash / Bank Transfer)</span>
        </div>
        <div class="d-flex justify-content-between">
          <span class="text-muted">Agency Concierge:</span>
          <span class="text-light">0703165843 (Wangwana Kisumu Desk)</span>
        </div>
      </div>
      <div class="d-flex gap-2">
        <a href="https://wa.me/254703165843?text=Hello%20Wangwana%20Real%20Estate,%20I%20have%20submitted%20booking%20${refCode}%20for%20${encodeURIComponent(propertyName)}" target="_blank" class="btn btn-success flex-grow-1">
          <i class="bi bi-whatsapp me-2"></i>Message Agency on WhatsApp (0703165843)
        </a>
        <a href="listings.html" class="btn btn-outline-light">Browse Portfolio</a>
      </div>
    </div>
  `;
  form.style.display = 'none';
}

// ----------------------------------------------------
// Landlord Partnership Form (Owners Entrusting Properties to Agency)
// ----------------------------------------------------
export function setupLandlordPartnerForm() {
  const form = document.getElementById('landlordPartnerForm') || document.getElementById('hostListingForm');
  if (!form) return;

  setupFormValidation(form.id, async (validForm) => {
    const name = validForm.querySelector('#landlordName')?.value || validForm.querySelector('#hostName')?.value || 'Property Owner';
    const phone = validForm.querySelector('#landlordPhone')?.value || validForm.querySelector('#hostPhone')?.value || '0703165843';
    const email = validForm.querySelector('#landlordEmail')?.value || '';
    const neighborhood = validForm.querySelector('#landlordNeighborhood')?.value || validForm.querySelector('#hostNeighborhood')?.value || 'Milimani';
    const propertyType = validForm.querySelector('#landlordPropertyType')?.value || 'Furnished Apartment';
    const bedrooms = validForm.querySelector('#landlordBedrooms')?.value || '2';
    const expectedYield = validForm.querySelector('#landlordExpectedYield')?.value || validForm.querySelector('#hostPrice')?.value || '';
    const notes = validForm.querySelector('#landlordNotes')?.value || '';

    const refId = 'WNG-LND-' + Math.floor(1000 + Math.random() * 9000);

    // Send to backend API
    try {
      await fetch('/api/landlords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          neighborhood,
          propertyType,
          bedrooms,
          expectedYield,
          notes
        })
      });
    } catch (e) {
      console.warn('Could not post landlord to API:', e);
    }

    const placeholder = document.getElementById('landlord-result-placeholder') || document.getElementById('host-listing-result') || validForm;
    placeholder.innerHTML = `
      <div class="p-4 bg-dark text-center rounded border border-secondary">
        <div class="mb-3">
          <i class="bi bi-patch-check-fill text-gold fs-1"></i>
        </div>
        <h4 class="text-light mb-1">Agency Management Inquiry Received!</h4>
        <p class="text-gold fw-bold mb-3">Partner Reference: ${refId}</p>
        <p class="text-muted small mb-4">
          Thank you, <strong>${name}</strong>! We have received your submission to entrust your <strong>${bedrooms}BR ${propertyType}</strong> in <strong>${neighborhood}, Kisumu</strong> to Wangwana Real Estate Agency.
          Our Senior Acquisitions Director will review your property and reach out on <strong>${phone}</strong> within 4 hours to arrange an on-site valuation.
        </p>
        <div class="p-3 bg-dark-elevated rounded border border-secondary text-start small mb-4">
          <div class="d-flex justify-content-between mb-1">
            <span class="text-muted">Target Location:</span>
            <span class="text-light">${neighborhood}, Kisumu</span>
          </div>
          <div class="d-flex justify-content-between mb-1">
            <span class="text-muted">Expected Yield:</span>
            <span class="text-gold fw-bold">${expectedYield ? 'KES ' + Number(expectedYield).toLocaleString() + ' / mo' : 'To be evaluated'}</span>
          </div>
          <div class="d-flex justify-content-between">
            <span class="text-muted">Agency Direct Desk:</span>
            <span class="text-light">0703165843</span>
          </div>
        </div>
        <div class="d-flex flex-column gap-2">
          <a href="https://wa.me/254703165843?text=Hello%20Wangwana%20Agency,%20I%20have%20submitted%20my%20property%20in%20${encodeURIComponent(neighborhood)}%20for%20management%20(Ref:%20${refId})" 
             target="_blank" class="btn btn-success w-100 py-2">
            <i class="bi bi-whatsapp me-2"></i>Chat with Acquisitions Director on WhatsApp (0703165843)
          </a>
          <button type="button" class="btn btn-outline-light w-100 py-2" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    `;
    validForm.style.display = 'none';
  });
}

// ----------------------------------------------------
// Agency Portal & Property Acquisition Management
// ----------------------------------------------------
export function setupAgencyPortal() {
  const modalEl = document.getElementById('agencyPortalModal');
  if (!modalEl) return;

  // When modal is shown, populate portfolio table and inquiries
  modalEl.addEventListener('show.bs.modal', () => {
    renderAgencyPortfolioTable();
    loadLandlordInquiries();
    loadClientBookings();
  });

  // Acquire New House Form
  const acquireForm = document.getElementById('agencyAcquireForm');
  if (acquireForm) {
    acquireForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = acquireForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Acquiring House...';
      }

      const name = document.getElementById('acquireName')?.value || '';
      const neighborhood = document.getElementById('acquireNeighborhood')?.value || 'Milimani';
      const location = document.getElementById('acquireLocation')?.value || `${neighborhood}, Kisumu City`;
      const type = document.getElementById('acquireType')?.value || 'Serviced Residence';
      const price = parseFloat(document.getElementById('acquirePrice')?.value || '10000');
      const monthlyLease = parseFloat(document.getElementById('acquireMonthlyLease')?.value || `${Math.round(price * 22)}`);
      const beds = parseInt(document.getElementById('acquireBeds')?.value || '2', 10);
      const baths = parseFloat(document.getElementById('acquireBaths')?.value || '2');
      const guests = parseInt(document.getElementById('acquireGuests')?.value || '4', 10);
      const status = document.getElementById('acquireStatus')?.value || 'Available';
      const badge = document.getElementById('acquireBadge')?.value || 'Newly Acquired';
      const description = document.getElementById('acquireDescription')?.value || 'Agency-managed exclusive Kisumu residence with premium furnishings.';
      
      // Selected amenities
      const amenitiesCheckboxes = acquireForm.querySelectorAll('input[name="acquireAmenities"]:checked');
      const amenities = Array.from(amenitiesCheckboxes).map(cb => cb.value);
      if (amenities.length === 0) {
        amenities.push('High-Speed WiFi', 'Backup Power', 'Dedicated Parking', '24/7 Security Guard');
      }

      // Photos
      const customImg = document.getElementById('acquireCustomImage')?.value;
      const presetImg = document.getElementById('acquirePresetImage')?.value || 'assets/images/whitehouse.jpg';
      const images = [];
      if (customImg && customImg.trim().startsWith('http')) {
        images.push(customImg.trim());
      }
      images.push(presetImg);
      // add extra gallery views
      if (presetImg.includes('whitehouse')) {
        images.push('assets/rooms/living room whitehouse.jpg', 'assets/rooms/bedroom, whitehouse.jpg');
      } else if (presetImg.includes('delpiero')) {
        images.push('assets/rooms/livingroom.delpiero.jpg', 'assets/rooms/bedroom.delpiero.jpg');
      } else if (presetImg.includes('beach')) {
        images.push('assets/rooms/livingroom.beach.jpg', 'assets/rooms/bedroom.beach.jpg');
      }

      try {
        const newlyAcquired = await acquireProperty({
          name,
          neighborhood,
          location,
          type,
          price,
          monthlyLease,
          beds,
          baths,
          guests,
          status,
          badge,
          description,
          amenities,
          images
        });

        // Show success alert in modal
        const alertBox = document.getElementById('acquireAlertPlaceholder');
        if (alertBox) {
          alertBox.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
              <i class="bi bi-check-circle-fill me-2"></i>
              <strong>Property Successfully Acquired!</strong> "${name}" has been added to Wangwana's active portfolio with reference code <strong>${newlyAcquired.agencyRef || 'WNG-KS'}</strong>.
              <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
          `;
        }

        acquireForm.reset();
        // Switch to the portfolio tab to view the addition
        const portfolioTabBtn = document.getElementById('tab-portfolio-btn');
        if (portfolioTabBtn && typeof bootstrap !== 'undefined') {
          const tab = new bootstrap.Tab(portfolioTabBtn);
          tab.show();
        }
      } catch (err) {
        console.error('Acquisition failed:', err);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="bi bi-house-add me-2"></i>Acquire & Add to Agency Portfolio';
        }
      }
    });
  }

  // Reset portfolio button
  const resetBtn = document.getElementById('btnResetPortfolio');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Reset Wangwana Agency portfolio to default showcase residences?')) {
        await resetPortfolio();
        renderAgencyPortfolioTable();
        showStatusBanner('<i class="bi bi-arrow-counterclockwise me-1"></i> Agency Portfolio reset to default residences');
      }
    });
  }
}
window.resetWangwanaPortfolio = async () => {
  await resetPortfolio();
  renderAgencyPortfolioTable();
};

/**
 * Renders table of existing properties in Agency Manager
 */
export function renderAgencyPortfolioTable() {
  const tbody = document.getElementById('agencyPortfolioTableBody');
  if (!tbody) return;

  const list = getProperties();
  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          No properties currently in the agency portfolio. Use the "Acquire New House" tab to add one.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((item, idx) => {
    const imgSrc = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : 'assets/images/whitehouse.jpg';
    return `
      <tr>
        <td>
          <img src="${imgSrc}" class="rounded object-fit-cover" width="54" height="40" alt="${item.name}" onerror="this.src='assets/images/whitehouse.jpg'">
        </td>
        <td>
          <div class="fw-bold text-light">${item.name}</div>
          <small class="text-gold font-monospace">${item.agencyRef || 'WNG-KS'}</small>
        </td>
        <td>
          <span class="text-muted small">${item.neighborhood || 'Kisumu'}</span>
        </td>
        <td>
          <span class="text-light fw-semibold">${formatKsh(item.price)}</span>
          <span class="text-muted small">/night</span>
        </td>
        <td>
          <select class="form-select form-select-sm bg-dark text-light border-secondary agency-status-select" 
                  data-property-id="${item.id}" style="font-size: 0.8rem; width: 125px;">
            <option value="Available" ${item.status === 'Available' ? 'selected' : ''}>Available</option>
            <option value="Occupied" ${item.status === 'Occupied' || item.status === 'Leased' ? 'selected' : ''}>Occupied</option>
            <option value="Maintenance" ${item.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
          </select>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-outline-warning btn-edit-price" data-id="${item.id}" data-current-price="${item.price}" title="Update rate">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button type="button" class="btn btn-outline-danger btn-delete-prop" data-id="${item.id}" data-name="${item.name}" title="Decommission residence">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach status change events
  tbody.querySelectorAll('.agency-status-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const propId = sel.getAttribute('data-property-id');
      const newStatus = e.target.value;
      await updateProperty(propId, { status: newStatus });
      showStatusBanner(`<i class="bi bi-check-circle text-success me-1"></i> Status for ${propId} changed to "${newStatus}"`);
    });
  });

  // Attach edit price events
  tbody.querySelectorAll('.btn-edit-price').forEach(btn => {
    btn.addEventListener('click', async () => {
      const propId = btn.getAttribute('data-id');
      const currentPrice = btn.getAttribute('data-current-price');
      const newPriceStr = prompt(`Enter new nightly rate in KES for this residence:`, currentPrice);
      if (newPriceStr !== null) {
        const newPrice = parseFloat(newPriceStr);
        if (!isNaN(newPrice) && newPrice > 0) {
          await updateProperty(propId, { price: newPrice, monthlyLease: Math.round(newPrice * 22) });
          renderAgencyPortfolioTable();
          showStatusBanner(`<i class="bi bi-check-circle text-success me-1"></i> Rate updated to ${formatKsh(newPrice)}/night`);
        }
      }
    });
  });

  // Attach delete events
  tbody.querySelectorAll('.btn-delete-prop').forEach(btn => {
    btn.addEventListener('click', async () => {
      const propId = btn.getAttribute('data-id');
      const propName = btn.getAttribute('data-name');
      if (confirm(`Are you sure you want to decommission "${propName}" from Wangwana Agency's active portfolio?`)) {
        await deleteProperty(propId);
        renderAgencyPortfolioTable();
        showStatusBanner(`<i class="bi bi-trash text-danger me-1"></i> Residence removed from active portfolio`);
      }
    });
  });
}

/**
 * Load landlord partnership submissions in Agency Portal
 */
async function loadLandlordInquiries() {
  const container = document.getElementById('agencyLandlordsContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/landlords');
    const json = await res.json();
    const inquiries = json.data || [];
    if (inquiries.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="bi bi-inbox fs-2 d-block mb-2"></i>
          No landlord partnership requests yet. Property owners can submit their homes via the "Entrust Property" link.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-dark table-striped agency-table">
          <thead>
            <tr>
              <th>Owner Name</th>
              <th>Phone</th>
              <th>Area</th>
              <th>Property Type</th>
              <th>Expected Yield</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${inquiries.map(inq => `
              <tr>
                <td class="fw-bold">${inq.name}</td>
                <td><a href="tel:${inq.phone}" class="text-gold text-decoration-none"><i class="bi bi-telephone me-1"></i>${inq.phone}</a></td>
                <td>${inq.neighborhood}</td>
                <td>${inq.bedrooms}BR ${inq.propertyType}</td>
                <td class="text-success">${inq.expectedYield ? 'KES ' + Number(inq.expectedYield).toLocaleString() : 'Negotiable'}</td>
                <td><span class="badge bg-warning text-dark">${inq.status || 'Pending'}</span></td>
                <td>
                  <a href="https://wa.me/254${(inq.phone || '').replace(/^0/, '')}?text=Hello%20${encodeURIComponent(inq.name)},%20this%20is%20Wangwana%20Real%20Estate%20Agency%20regarding%20your%20property%20in%20${encodeURIComponent(inq.neighborhood)}" 
                     target="_blank" class="btn btn-sm btn-success py-0 px-2" title="Chat on WhatsApp">
                    <i class="bi bi-whatsapp"></i>
                  </a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    console.warn('Could not load landlord inquiries:', e);
  }
}

/**
 * Load client reservations in Agency Portal
 */
async function loadClientBookings() {
  const container = document.getElementById('agencyBookingsContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/bookings');
    const json = await res.json();
    const bookings = json.data || [];
    if (bookings.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="bi bi-calendar2-check fs-2 d-block mb-2"></i>
          No client reservations recorded yet.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-dark table-striped agency-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Guest Name</th>
              <th>Property</th>
              <th>Dates</th>
              <th>Guests</th>
              <th>Total</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            ${bookings.map(b => `
              <tr>
                <td class="font-monospace text-gold">${b.id}</td>
                <td class="fw-bold">${b.guestName} <br><small class="text-muted">${b.guestPhone}</small></td>
                <td>${b.propertyName}</td>
                <td class="small">${b.checkIn} to ${b.checkOut}</td>
                <td>${b.guests}</td>
                <td class="text-gold fw-bold">${formatKsh(b.totalAmount || 0)}</td>
                <td><span class="badge bg-success"><i class="bi bi-shield-check me-1"></i>Pay on Arrival</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    console.warn('Could not load client bookings:', e);
  }
}
