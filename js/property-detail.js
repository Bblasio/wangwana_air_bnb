// Property detail page interactive logic for Wangwana Real Estate Agency
import { PROPERTIES, getPropertyById, formatKsh, getProperties } from './properties.js';
import { calculateNights, initDateConstraints } from './utils.js';
import { isFavorite, toggleFavorite } from './favorites.js';

document.addEventListener('DOMContentLoaded', () => {
  initDateConstraints();

  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id') || 'whitehouse';
  const property = getPropertyById(propertyId);

  renderPropertyDetails(property);
  setupPropertySwitcher(property.id);
  setupBookingCalculator(property);
  setupDetailFavoriteButton(property.id);
});

/**
 * Sets up favorite toggle button on property detail view
 * @param {string} propertyId
 */
function setupDetailFavoriteButton(propertyId) {
  const btn = document.getElementById('detail-favorite-btn');
  const icon = document.getElementById('detail-favorite-icon');
  const text = document.getElementById('detail-favorite-text');
  if (!btn) return;

  function updateVisual(fav) {
    if (fav) {
      btn.classList.add('btn-danger');
      btn.classList.remove('btn-outline-light');
      if (icon) icon.className = 'bi bi-heart-fill me-1 text-light';
      if (text) text.textContent = 'Saved in Favorites';
      btn.setAttribute('title', 'Remove from favorites');
    } else {
      btn.classList.remove('btn-danger');
      btn.classList.add('btn-outline-light');
      if (icon) icon.className = 'bi bi-heart me-1 text-danger';
      if (text) text.textContent = 'Save to Favorites';
      btn.setAttribute('title', 'Save to favorites');
    }
  }

  updateVisual(isFavorite(propertyId));

  btn.addEventListener('click', () => {
    const isNowFav = toggleFavorite(propertyId);
    updateVisual(isNowFav);
  });
}

/**
 * Populate all property fields on property.html
 * @param {Object} property
 */
function renderPropertyDetails(property) {
  // Title & Location
  document.title = `Wangwana Real Estate Agency - ${property.name}`;
  setText('prop-title', property.name);
  setText('prop-location', property.location);
  setText('prop-type-badge', property.type || 'Serviced Residence');
  setText('prop-badge', property.badge || 'Agency Managed');
  setText('prop-agency-ref', property.agencyRef || 'WNG-KS');
  setText('prop-rating', Number(property.rating || 5.0).toFixed(2));
  setText('prop-reviews', `(${property.reviewsCount || 1} verified client reviews)`);
  setText('prop-description', property.description);
  setText('calc-base-price', formatKsh(property.price));

  // Monthly Lease display if available
  const monthlyBox = document.getElementById('prop-monthly-lease');
  if (monthlyBox) {
    if (property.monthlyLease) {
      monthlyBox.innerHTML = `<i class="bi bi-calendar3 text-gold me-1"></i> Long-Term Mandate: <strong class="text-light">${formatKsh(property.monthlyLease)}/month</strong>`;
      monthlyBox.classList.remove('d-none');
    } else {
      monthlyBox.classList.add('d-none');
    }
  }

  // Key stats
  setText('prop-guests-count', `${property.guests} Guests max`);
  setText('prop-beds-count', `${property.beds} Bedrooms`);
  setText('prop-baths-count', `${property.baths} Bathrooms`);

  // Gallery
  const images = Array.isArray(property.images) && property.images.length > 0 ? property.images : ['assets/images/whitehouse.jpg'];
  const mainImage = document.getElementById('prop-main-image');
  if (mainImage) {
    mainImage.src = images[0];
    mainImage.alt = `${property.name} Main Photo`;
  }

  const thumbContainer = document.getElementById('prop-thumbnail-strip');
  if (thumbContainer) {
    thumbContainer.innerHTML = images.map((src, idx) => `
      <div class="col-3 col-sm-2 col-md-2 p-1">
        <img src="${src}" 
             class="gallery-thumbnail ${idx === 0 ? 'active' : ''}" 
             data-index="${idx}" 
             alt="${property.name} Thumbnail ${idx + 1}"
             onerror="this.src='assets/images/whitehouse.jpg'">
      </div>
    `).join('');

    thumbContainer.querySelectorAll('.gallery-thumbnail').forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        thumbContainer.querySelectorAll('.gallery-thumbnail').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        if (mainImage) {
          mainImage.src = e.target.src;
        }
      });
    });
  }

  // Amenities Grid
  const amenitiesList = document.getElementById('prop-amenities-list');
  if (amenitiesList) {
    const iconMap = {
      'wifi': 'bi-wifi',
      'kitchen': 'bi-cup-hot-fill',
      'parking': 'bi-p-circle-fill',
      'security': 'bi-shield-fill-check',
      'tv': 'bi-tv-fill',
      'washing': 'bi-arrow-repeat',
      'view': 'bi-water',
      'generator': 'bi-lightning-charge-fill',
      'terrace': 'bi-tree-fill',
      'bbq': 'bi-fire',
      'workstation': 'bi-laptop'
    };

    const amenities = Array.isArray(property.amenities) ? property.amenities : ['High-Speed WiFi', 'Backup Power', 'Dedicated Parking', '24/7 Security'];

    amenitiesList.innerHTML = amenities.map(amenity => {
      let iconClass = 'bi-check-circle-fill';
      const lower = amenity.toLowerCase();
      for (const [key, icon] of Object.entries(iconMap)) {
        if (lower.includes(key)) {
          iconClass = icon;
          break;
        }
      }

      return `
        <div class="col-md-6 mb-3">
          <div class="amenity-item">
            <i class="bi ${iconClass}"></i>
            <span>${amenity}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Direct Book Button link update
  const directBookBtn = document.getElementById('direct-book-link');
  if (directBookBtn) {
    directBookBtn.href = `book.html?id=${encodeURIComponent(property.id)}`;
  }
}

/**
 * Setup property switcher dropdown
 * @param {string} currentId
 */
function setupPropertySwitcher(currentId) {
  const switcher = document.getElementById('propertySwitcher');
  if (!switcher) return;

  const allProps = getProperties();
  switcher.innerHTML = allProps.map(p => `
    <option value="${p.id}" ${p.id.toLowerCase() === currentId.toLowerCase() ? 'selected' : ''}>
      ${p.name} — ${formatKsh(p.price)}/night (${p.neighborhood || 'Kisumu'})
    </option>
  `).join('');

  switcher.addEventListener('change', (e) => {
    window.location.href = `property.html?id=${encodeURIComponent(e.target.value)}`;
  });
}

/**
 * Real-time booking price calculator on Property Details
 * @param {Object} property
 */
function setupBookingCalculator(property) {
  const checkIn = document.getElementById('calcCheckIn');
  const checkOut = document.getElementById('calcCheckOut');
  const guests = document.getElementById('calcGuests');
  const totalNightsEl = document.getElementById('calc-total-nights');
  const subtotalEl = document.getElementById('calc-subtotal');
  const grandTotalEl = document.getElementById('calc-grand-total');
  const bookBtn = document.getElementById('calc-submit-book-btn');

  if (!checkIn || !checkOut) return;

  function recalculate() {
    const nights = calculateNights(checkIn.value, checkOut.value);
    const cleaningFee = 1500;
    const subtotal = property.price * nights;
    const grandTotal = subtotal + cleaningFee;

    if (totalNightsEl) totalNightsEl.textContent = `${nights} night${nights === 1 ? '' : 's'}`;
    if (subtotalEl) subtotalEl.textContent = formatKsh(subtotal);
    if (grandTotalEl) grandTotalEl.textContent = formatKsh(grandTotal);

    if (bookBtn) {
      const selectedGuests = guests ? guests.value : 2;
      bookBtn.href = `book.html?id=${encodeURIComponent(property.id)}&checkIn=${checkIn.value}&checkOut=${checkOut.value}&guests=${selectedGuests}&nights=${nights}`;
    }
  }

  checkIn.addEventListener('change', recalculate);
  checkOut.addEventListener('change', recalculate);
  checkOut.addEventListener('input', recalculate);
  if (guests) guests.addEventListener('change', recalculate);

  // Initial calculation
  recalculate();
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
