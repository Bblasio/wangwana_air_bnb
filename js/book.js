// Booking reservation interactive logic for Wangwana Real Estate Agency
import { PROPERTIES, getPropertyById, formatKsh, getProperties } from './properties.js';
import { calculateNights, initDateConstraints } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  initDateConstraints();

  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id') || 'whitehouse';
  let currentProperty = getPropertyById(propertyId);

  // Pre-fill dates if passed from property page
  const checkInParam = urlParams.get('checkIn');
  const checkOutParam = urlParams.get('checkOut');
  const guestsParam = urlParams.get('guests');

  const checkInInput = document.getElementById('bookCheckIn');
  const checkOutInput = document.getElementById('bookCheckOut');
  const guestsInput = document.getElementById('bookGuests');
  const propertySelect = document.getElementById('bookPropertySelect');

  if (checkInInput && checkInParam) checkInInput.value = checkInParam;
  if (checkOutInput && checkOutParam) checkOutInput.value = checkOutParam;
  if (guestsInput && guestsParam) guestsInput.value = guestsParam;

  const allProps = getProperties();

  // Initialize property select
  if (propertySelect) {
    propertySelect.innerHTML = allProps.map(p => `
      <option value="${p.id}" ${p.id.toLowerCase() === currentProperty.id.toLowerCase() ? 'selected' : ''}>
        ${p.name} (${p.neighborhood || 'Kisumu'}) — ${formatKsh(p.price)}/night [${p.agencyRef || 'Agency'}]
      </option>
    `).join('');

    propertySelect.addEventListener('change', (e) => {
      currentProperty = getPropertyById(e.target.value);
      updateSummaryCard(currentProperty);
    });
  }

  // Update summary card initially and on any change
  function refreshSummary() {
    updateSummaryCard(currentProperty);
  }

  if (checkInInput) checkInInput.addEventListener('change', refreshSummary);
  if (checkOutInput) checkOutInput.addEventListener('change', refreshSummary);
  if (checkOutInput) checkOutInput.addEventListener('input', refreshSummary);
  if (guestsInput) guestsInput.addEventListener('change', refreshSummary);

  updateSummaryCard(currentProperty);
  setupReservationForm(currentProperty);
});

/**
 * Updates the summary sidebar card
 * @param {Object} property
 */
function updateSummaryCard(property) {
  const checkInVal = document.getElementById('bookCheckIn')?.value;
  const checkOutVal = document.getElementById('bookCheckOut')?.value;
  const guestsVal = document.getElementById('bookGuests')?.value || 2;

  const nights = calculateNights(checkInVal, checkOutVal);
  const ratePerNight = property.price;
  const subtotal = ratePerNight * nights;
  const cleaningFee = 1500;
  const grandTotal = subtotal + cleaningFee;

  setText('summary-prop-name', property.name);
  setText('summary-prop-location', property.location);
  setText('summary-night-rate', `${formatKsh(ratePerNight)} × ${nights} night${nights === 1 ? '' : 's'}`);
  setText('summary-subtotal', formatKsh(subtotal));
  setText('summary-cleaning', formatKsh(cleaningFee));
  setText('summary-grand-total', formatKsh(grandTotal));
  setText('summary-dates-display', `${checkInVal || 'Selected'} to ${checkOutVal || 'Selected'}`);
  setText('summary-guests-display', `${guestsVal} Guest${guestsVal == 1 ? '' : 's'}`);

  const imgEl = document.getElementById('summary-prop-img');
  if (imgEl && Array.isArray(property.images) && property.images.length > 0) {
    imgEl.src = property.images[0];
    imgEl.alt = property.name;
  }
}

/**
 * Form submission handling with confirmation code
 * @param {Object} property
 */
function setupReservationForm(property) {
  const form = document.getElementById('reservationForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add('was-validated');
      return;
    }

    const guestName = document.getElementById('guestFullName')?.value || 'Guest';
    const guestPhone = document.getElementById('guestPhone')?.value || '';
    const guestEmail = document.getElementById('guestEmail')?.value || '';
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'M-Pesa on Arrival';
    const checkInVal = document.getElementById('bookCheckIn')?.value;
    const checkOutVal = document.getElementById('bookCheckOut')?.value;
    const guestsVal = parseInt(document.getElementById('bookGuests')?.value || '2', 10);
    const nights = calculateNights(checkInVal, checkOutVal);
    const grandTotal = (property.price * nights) + 1500;
    const refCode = 'WNG-' + Math.floor(100000 + Math.random() * 900000);

    // Save to agency backend bookings
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          propertyName: property.name,
          guestName,
          guestPhone,
          guestEmail,
          checkIn: checkInVal,
          checkOut: checkOutVal,
          guests: guestsVal,
          totalAmount: grandTotal,
          paymentMethod
        })
      });
    } catch (err) {
      console.warn('Booking API call failed, continuing with client confirmation:', err);
    }

    const bookingBox = document.getElementById('reservation-flow-container');
    if (bookingBox) {
      bookingBox.innerHTML = `
        <div class="surface-card p-4 p-md-5 border border-success">
          <div class="text-center mb-4">
            <div class="d-inline-flex p-3 rounded-circle bg-success bg-opacity-25 text-success mb-3">
              <i class="bi bi-check-circle-fill fs-1"></i>
            </div>
            <h2 class="h3 text-success">Direct Agency Reservation Confirmed!</h2>
            <p class="text-muted">Agency Confirmation Reference: <strong class="text-light fs-5 font-monospace">${refCode}</strong></p>
          </div>

          <div class="p-3 bg-dark-elevated rounded border border-secondary mb-4">
            <h5 class="h6 text-gold mb-3"><i class="bi bi-shield-check me-1"></i> Managed by Wangwana Real Estate Agency</h5>
            <div class="row g-2 small">
              <div class="col-sm-6 text-muted">Residence: <strong class="text-light">${property.name}</strong></div>
              <div class="col-sm-6 text-muted">Agency Ref: <strong class="text-gold font-monospace">${property.agencyRef || 'WNG-KS'}</strong></div>
              <div class="col-sm-6 text-muted">Guest Name: <strong class="text-light">${guestName}</strong></div>
              <div class="col-sm-6 text-muted">Contact Phone: <strong class="text-light">${guestPhone}</strong></div>
              <div class="col-sm-6 text-muted">Dates: <strong class="text-light">${checkInVal} to ${checkOutVal} (${nights} nights)</strong></div>
              <div class="col-sm-6 text-muted">Total Payable at Arrival: <strong class="text-gold fs-6">${formatKsh(grandTotal)}</strong></div>
              <div class="col-12 text-muted mt-2 pt-2 border-top border-secondary border-opacity-20">
                Payment Guarantee: <strong class="text-success"><i class="bi bi-shield-lock-fill me-1"></i>Pay on Arrival (Inspect first, pay upon key handover)</strong>
              </div>
            </div>
          </div>

          <div class="alert alert-dark border border-secondary small text-muted mb-4">
            <i class="bi bi-building-check text-gold me-1"></i> <strong>Wangwana Agency Service:</strong> A dedicated agency concierge is assigned to welcome you at the residence. Zero advance deduction was made. When you arrive, inspect the home, collect keys, and pay KES ${grandTotal.toLocaleString()} directly via M-Pesa, Cash, or Bank Transfer.
          </div>

          <div class="d-flex flex-column flex-sm-row gap-3">
            <a href="https://wa.me/254703165843?text=Hello%20Wangwana%20Real%20Estate,%20I%20have%20reserved%20${encodeURIComponent(property.name)}%20(Booking%20Ref:%20${refCode})%20for%20${nights}%20nights.%20Kindly%20confirm%20check-in%20arrangements." 
               target="_blank" class="btn btn-success flex-grow-1 py-2">
              <i class="bi bi-whatsapp me-2"></i>Message Agency Concierge on WhatsApp (0703165843)
            </a>
            <a href="tel:0703165843" class="btn btn-outline-gold py-2">
              <i class="bi bi-telephone-fill me-1"></i> Call Concierge (0703165843)
            </a>
            <a href="index.html" class="btn btn-outline-light py-2">Home</a>
          </div>
        </div>
      `;
    }
  });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
