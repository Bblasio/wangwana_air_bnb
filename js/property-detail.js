// Property detail page interactive logic for Wangwana Real Estate Agency
import { PROPERTIES, getPropertyById, formatKsh, getProperties } from './properties.js';
import { calculateNights, initDateConstraints } from './utils.js';
import { isFavorite, toggleFavorite } from './favorites.js';
import {
  openFullscreenLightbox,
  openPhotoUploadManagerModal,
  initLimitedAvailabilityTimers,
  createUrgencyTimerHTML
} from './lightbox-360.js';

document.addEventListener('DOMContentLoaded', () => {
  initDateConstraints();
  initLimitedAvailabilityTimers();

  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id') || 'whitehouse';
  const property = getPropertyById(propertyId);

  renderPropertyDetails(property);
  setupPropertySwitcher(property.id);
  setupBookingCalculator(property);
  setupInteractiveCalendar(property);
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

  // Urgency Countdown for High-Demand Properties
  const urgencyContainer = document.getElementById('prop-detail-urgency-timer');
  if (urgencyContainer) {
    urgencyContainer.innerHTML = createUrgencyTimerHTML(property);
  }

  // Gallery
  const images = Array.isArray(property.images) && property.images.length > 0 ? property.images : ['assets/images/whitehouse.jpg'];
  let activePhotoIndex = 0;
  const mainImage = document.getElementById('prop-main-image');
  if (mainImage) {
    mainImage.src = images[0];
    mainImage.alt = `${property.name} Main Photo`;
    mainImage.addEventListener('click', () => {
      openFullscreenLightbox({
        property,
        startIndex: activePhotoIndex,
        initialMode: 'photo'
      });
    });
  }

  // Fullscreen Lightbox Button
  const fullscreenBtn = document.getElementById('btnDetailFullscreen');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      openFullscreenLightbox({
        property,
        startIndex: activePhotoIndex,
        initialMode: 'photo'
      });
    });
  }

  // 360 Virtual Tour Button
  const tour360Btn = document.getElementById('btnDetail360Tour');
  if (tour360Btn) {
    tour360Btn.addEventListener('click', () => {
      openFullscreenLightbox({
        property,
        startIndex: activePhotoIndex,
        initialMode: '360'
      });
    });
  }

  // Upload Photos from Folder Button
  const uploadPhotosBtn = document.getElementById('btnDetailUploadPhotos');
  if (uploadPhotosBtn) {
    uploadPhotosBtn.addEventListener('click', () => {
      openPhotoUploadManagerModal(property.id);
    });
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
        const idx = parseInt(e.target.getAttribute('data-index'), 10) || 0;
        activePhotoIndex = idx;
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

  // Rooms & Sleeping Arrangements
  renderBedrooms(property);

  // Policies & House Rules
  renderPolicies(property);

  // Verified Guest Reviews
  renderReviews(property);

  // Host Details
  renderHost(property);

  // Official Airbnb Link
  setupAirbnbLink(property);

  // Direct Book Button link update
  const directBookBtn = document.getElementById('direct-book-link');
  if (directBookBtn) {
    directBookBtn.href = `book.html?id=${encodeURIComponent(property.id)}`;
  }
}

/**
 * Render detailed bedroom & sleeping arrangements
 */
function renderBedrooms(property) {
  const container = document.getElementById('prop-bedrooms-list');
  if (!container) return;

  const bedrooms = Array.isArray(property.bedroomsDetail) && property.bedroomsDetail.length > 0
    ? property.bedroomsDetail
    : [
        {
          name: 'Primary Bedroom',
          bed: `${property.beds > 1 ? '1 King Bed' : '1 Queen Bed'}`,
          bath: 'En-suite Bathroom',
          features: 'Wardrobe, Clean Linens, Blackout Curtains'
        },
        ...(property.beds > 1 ? [{
          name: 'Second Bedroom',
          bed: '1 Queen Bed',
          bath: 'Adjacent Private Bathroom',
          features: 'Garden View, Dedicated Closet'
        }] : [])
      ];

  container.innerHTML = bedrooms.map((room, idx) => `
    <div class="col-sm-6">
      <div class="p-3 bg-dark-elevated rounded border border-secondary h-100">
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="badge bg-gold text-dark fw-bold px-2 py-1">Room ${idx + 1}</span>
          <h6 class="mb-0 text-light">${room.name}</h6>
        </div>
        <div class="small text-light fw-semibold mb-1">
          <i class="bi bi-door-closed text-gold me-1"></i> ${room.bed}
        </div>
        ${room.bath ? `
          <div class="small text-muted mb-1">
            <i class="bi bi-droplet-half text-gold me-1"></i> ${room.bath}
          </div>
        ` : ''}
        ${room.features ? `
          <div class="small text-muted" style="font-size: 0.8rem;">
            <i class="bi bi-check2 text-gold me-1"></i> ${room.features}
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

/**
 * Render policies and house rules
 */
function renderPolicies(property) {
  const policies = property.policies || {};
  if (policies.checkIn) setText('prop-policy-checkin', `Check-in: ${policies.checkIn}`);
  if (policies.checkOut) setText('prop-policy-checkout', `Check-out: ${policies.checkOut}`);
  if (policies.cancellation) setText('prop-policy-cancellation', policies.cancellation);
  if (policies.payment) setText('prop-policy-payment', policies.payment);

  const rulesList = document.getElementById('prop-policy-rules');
  if (rulesList && Array.isArray(policies.rules)) {
    rulesList.innerHTML = policies.rules.map(rule => `
      <li><i class="bi bi-check2 text-gold me-1"></i> ${rule}</li>
    `).join('');
  }
}

/**
 * Render verified guest reviews
 */
function renderReviews(property) {
  const container = document.getElementById('prop-reviews-list');
  if (!container) return;

  const reviews = Array.isArray(property.reviews) && property.reviews.length > 0
    ? property.reviews
    : [
        {
          guest: 'Faith Muthoni',
          origin: 'Nairobi, Kenya',
          date: 'August 2026',
          rating: 5,
          source: 'Verified Airbnb Stay',
          text: 'One of the best stays in Kisumu. Spotless rooms, super fast internet, and host was readily available on WhatsApp throughout.'
        },
        {
          guest: 'David K. Omondi',
          origin: 'Kisumu, Kenya',
          date: 'July 2026',
          rating: 5,
          source: 'Verified Direct Stay',
          text: 'Great security, calm environment, and the pay on arrival guarantee made it 100% stress-free.'
        }
      ];

  const summary = document.getElementById('prop-reviews-summary');
  if (summary) {
    summary.textContent = `Rated ${Number(property.rating || 4.95).toFixed(2)} out of 5 stars based on ${property.reviewsCount || reviews.length} verified stays`;
  }

  container.innerHTML = reviews.map(rev => `
    <div class="col-md-6">
      <div class="p-3 bg-dark-elevated rounded border border-secondary h-100 d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 class="mb-0 text-light fs-6">${rev.guest}</h6>
            <div class="text-muted" style="font-size: 0.75rem;">${rev.origin || 'Verified Guest'} • ${rev.date}</div>
          </div>
          <span class="badge bg-dark border border-secondary text-warning d-flex align-items-center gap-1">
            <i class="bi bi-star-fill text-warning" style="font-size: 0.7rem;"></i> ${rev.rating}.0
          </span>
        </div>
        <p class="small text-muted mb-2 flex-grow-1" style="line-height: 1.5;">
          "${rev.text}"
        </p>
        <div class="text-end" style="font-size: 0.7rem;">
          <span class="text-success"><i class="bi bi-patch-check-fill me-1"></i>${rev.source || 'Verified Airbnb Stay'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Render host details
 */
function renderHost(property) {
  const host = property.host || {
    name: 'Blasio Odhiambo',
    role: 'Superhost & Wangwana Host Manager',
    phone: '0703165843',
    whatsapp: '+254703165843'
  };

  setText('prop-host-name', `Hosted by ${host.name}`);
}

/**
 * Configure official Airbnb deep links
 */
function setupAirbnbLink(property) {
  const airbnbBtn = document.getElementById('prop-airbnb-link-btn');
  const airbnbCard = document.getElementById('prop-airbnb-card');
  if (!airbnbBtn) return;

  const url = property.airbnbUrl || `https://www.airbnb.com/s/Kisumu--Kenya/homes?query=${encodeURIComponent(property.name)}`;
  airbnbBtn.href = url;
  airbnbBtn.title = `View ${property.name} on Airbnb (Superhost Profile)`;
}

/**
 * Interactive availability calendar where guests can pick check-in & check-out dates
 */
function setupInteractiveCalendar(property) {
  const calendarContainer = document.getElementById('availability-calendar-box');
  if (!calendarContainer) return;

  const checkInInput = document.getElementById('calcCheckIn');
  const checkOutInput = document.getElementById('calcCheckOut');

  const today = new Date();
  let currentDisplayMonth = today.getMonth();
  let currentDisplayYear = today.getFullYear();

  // Blocked days for realistic availability demonstration (e.g. days 10, 11 of the month)
  const blockedDays = [7, 8, 18];

  function renderCalendar() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const firstDay = new Date(currentDisplayYear, currentDisplayMonth, 1).getDay();
    const daysInMonth = new Date(currentDisplayYear, currentDisplayMonth + 1, 0).getDate();

    let checkInDate = checkInInput && checkInInput.value ? new Date(checkInInput.value) : null;
    let checkOutDate = checkOutInput && checkOutInput.value ? new Date(checkOutInput.value) : null;

    let calendarHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <button type="button" class="btn btn-sm btn-outline-secondary" id="calPrevMonthBtn" title="Previous Month">
          <i class="bi bi-chevron-left"></i>
        </button>
        <h6 class="mb-0 text-light fw-bold">${monthNames[currentDisplayMonth]} ${currentDisplayYear}</h6>
        <button type="button" class="btn btn-sm btn-outline-secondary" id="calNextMonthBtn" title="Next Month">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>

      <div class="calendar-grid text-center" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
        <div class="text-muted small fw-semibold py-1">Su</div>
        <div class="text-muted small fw-semibold py-1">Mo</div>
        <div class="text-muted small fw-semibold py-1">Tu</div>
        <div class="text-muted small fw-semibold py-1">We</div>
        <div class="text-muted small fw-semibold py-1">Th</div>
        <div class="text-muted small fw-semibold py-1">Fr</div>
        <div class="text-muted small fw-semibold py-1">Sa</div>
    `;

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      calendarHTML += `<div class="p-2"></div>`;
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const thisDate = new Date(currentDisplayYear, currentDisplayMonth, day);
      const isPast = thisDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isBlocked = blockedDays.includes(day);

      let dateString = `${currentDisplayYear}-${String(currentDisplayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      let isSelected = false;
      let isInRange = false;

      if (checkInInput && checkInInput.value === dateString) {
        isSelected = true;
      } else if (checkOutInput && checkOutInput.value === dateString) {
        isSelected = true;
      } else if (checkInDate && checkOutDate && thisDate > checkInDate && thisDate < checkOutDate) {
        isInRange = true;
      }

      let btnClass = 'btn btn-sm w-100 p-1 rounded ';
      let disabledAttr = '';

      if (isPast || isBlocked) {
        btnClass += 'text-muted text-decoration-line-through bg-dark opacity-50 ';
        disabledAttr = 'disabled';
      } else if (isSelected) {
        btnClass += 'btn-primary text-dark fw-bold shadow ';
      } else if (isInRange) {
        btnClass += 'bg-warning bg-opacity-25 text-gold fw-semibold ';
      } else {
        btnClass += 'btn-outline-secondary text-light ';
      }

      calendarHTML += `
        <div>
          <button type="button" 
                  class="${btnClass} cal-day-btn" 
                  data-date="${dateString}" 
                  ${disabledAttr}
                  style="font-size: 0.85rem; height: 36px;">
            ${day}
          </button>
        </div>
      `;
    }

    calendarHTML += `</div>`;

    // Status feedback
    let statusHTML = '';
    if (checkInInput && checkOutInput && checkInInput.value && checkOutInput.value) {
      const nights = calculateNights(checkInInput.value, checkOutInput.value);
      statusHTML = `
        <div class="alert alert-success py-2 px-3 small mt-3 mb-0 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-check-circle-fill text-success"></i>
            <span><strong>Available:</strong> ${nights} night${nights === 1 ? '' : 's'} selected (${checkInInput.value} to ${checkOutInput.value})</span>
          </div>
          <span class="badge bg-success">Ready to Book</span>
        </div>
      `;
    }

    calendarContainer.innerHTML = calendarHTML + statusHTML;

    // Attach Month Prev/Next listeners
    const prevBtn = document.getElementById('calPrevMonthBtn');
    const nextBtn = document.getElementById('calNextMonthBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentDisplayMonth--;
        if (currentDisplayMonth < 0) {
          currentDisplayMonth = 11;
          currentDisplayYear--;
        }
        renderCalendar();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentDisplayMonth++;
        if (currentDisplayMonth > 11) {
          currentDisplayMonth = 0;
          currentDisplayYear++;
        }
        renderCalendar();
      });
    }

    // Attach click listener on available date buttons
    calendarContainer.querySelectorAll('.cal-day-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clickedDate = e.currentTarget.getAttribute('data-date');
        if (!checkInInput.value || (checkInInput.value && checkOutInput.value)) {
          // New selection starts with checkIn
          checkInInput.value = clickedDate;
          checkOutInput.value = '';
        } else if (checkInInput.value && !checkOutInput.value) {
          if (clickedDate <= checkInInput.value) {
            checkInInput.value = clickedDate;
          } else {
            checkOutInput.value = clickedDate;
          }
        }

        // Trigger change to recalculate
        checkInInput.dispatchEvent(new Event('change'));
        checkOutInput.dispatchEvent(new Event('change'));
        renderCalendar();
      });
    });
  }

  // Listen to input changes in calculator to keep calendar synchronized
  if (checkInInput) checkInInput.addEventListener('change', renderCalendar);
  if (checkOutInput) checkOutInput.addEventListener('change', renderCalendar);

  renderCalendar();
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
  const rangePicker = document.getElementById('propDateRangePicker');
  const openCalBtn = document.getElementById('btnPropOpenCalendar');
  const rangeNightsBadge = document.getElementById('prop-range-nights');

  if (!checkIn || !checkOut) return;

  function recalculate() {
    const nights = calculateNights(checkIn.value, checkOut.value);
    const cleaningFee = 1500;
    const subtotal = property.price * nights;
    const grandTotal = subtotal + cleaningFee;

    if (totalNightsEl) totalNightsEl.textContent = `${nights} night${nights === 1 ? '' : 's'}`;
    if (subtotalEl) subtotalEl.textContent = formatKsh(subtotal);
    if (grandTotalEl) grandTotalEl.textContent = formatKsh(grandTotal);

    if (rangePicker && checkIn.value && checkOut.value) {
      rangePicker.value = `${checkIn.value}  ➔  ${checkOut.value} (${nights} night${nights === 1 ? '' : 's'})`;
    }
    if (rangeNightsBadge) {
      rangeNightsBadge.textContent = `${nights} Night${nights === 1 ? '' : 's'}`;
    }

    if (bookBtn) {
      const selectedGuests = guests ? guests.value : 2;
      bookBtn.href = `book.html?id=${encodeURIComponent(property.id)}&checkIn=${checkIn.value}&checkOut=${checkOut.value}&guests=${selectedGuests}&nights=${nights}`;
    }
  }

  // Initialize Flatpickr range picker on property details page if available
  if (typeof window.flatpickr === 'function' && rangePicker) {
    const propPicker = window.flatpickr(rangePicker, {
      mode: 'range',
      minDate: 'today',
      dateFormat: 'Y-m-d',
      defaultDate: [checkIn.value, checkOut.value],
      onChange: (selectedDates, dateStr, instance) => {
        if (selectedDates.length === 2) {
          checkIn.value = instance.formatDate(selectedDates[0], 'Y-m-d');
          checkOut.value = instance.formatDate(selectedDates[1], 'Y-m-d');
          recalculate();
        }
      }
    });

    if (openCalBtn) {
      openCalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        propPicker.open();
      });
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
