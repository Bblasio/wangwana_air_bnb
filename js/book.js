// Booking reservation interactive logic for Wangwana Real Estate Agency
import { PROPERTIES, getPropertyById, formatKsh, getProperties } from './properties.js';
import { calculateNights, initDateConstraints } from './utils.js';

let activeProperty = null;
let stkPollingTimer = null;
let dateRangePickerInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  initDateConstraints();

  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id') || 'whitehouse';
  activeProperty = getPropertyById(propertyId);

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
      <option value="${p.id}" ${p.id.toLowerCase() === activeProperty.id.toLowerCase() ? 'selected' : ''}>
        ${p.name} (${p.neighborhood || 'Kisumu'}) — ${formatKsh(p.price)}/night [${p.agencyRef || 'Agency'}]
      </option>
    `).join('');

    propertySelect.addEventListener('change', (e) => {
      activeProperty = getPropertyById(e.target.value);
      updateSummaryCard(activeProperty);
    });
  }

  // Initialize Calendar Date Range Picker
  setupCalendarDateRangePicker(checkInParam, checkOutParam);

  // Update summary card initially and on any change
  function refreshSummary() {
    updateSummaryCard(activeProperty);
  }

  if (checkInInput) checkInInput.addEventListener('change', refreshSummary);
  if (checkOutInput) checkOutInput.addEventListener('change', refreshSummary);
  if (checkOutInput) checkOutInput.addEventListener('input', refreshSummary);
  if (guestsInput) guestsInput.addEventListener('change', refreshSummary);

  updateSummaryCard(activeProperty);
  setupMpesaPaymentControls();
  setupReservationForm();
});

/**
 * Initializes the interactive calendar date range picker (powered by Flatpickr)
 * @param {string|null} initialCheckIn
 * @param {string|null} initialCheckOut
 */
function setupCalendarDateRangePicker(initialCheckIn, initialCheckOut) {
  const rangeInput = document.getElementById('bookDateRangePicker');
  const checkInInput = document.getElementById('bookCheckIn');
  const checkOutInput = document.getElementById('bookCheckOut');
  const displayCheckIn = document.getElementById('displayCheckInDate');
  const displayCheckOut = document.getElementById('displayCheckOutDate');
  const displayNights = document.getElementById('displayNightsCount');
  const durationBadge = document.getElementById('bookingDurationBadge');
  const openCalendarBtn = document.getElementById('btnOpenCalendar');
  const cardCheckIn = document.getElementById('cardCheckIn');
  const cardCheckOut = document.getElementById('cardCheckOut');
  const errorAlert = document.getElementById('dateRangeError');

  // Formats YYYY-MM-DD to "Fri, Oct 2, 2026"
  function formatHumanDate(dateStr) {
    if (!dateStr) return 'Not selected';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  }

  // Update visual cards, badges, and synchronized inputs
  function updateVisualDateState(startStr, endStr) {
    if (checkInInput) checkInInput.value = startStr || '';
    if (checkOutInput) checkOutInput.value = endStr || '';

    if (startStr && endStr) {
      const nights = calculateNights(startStr, endStr);
      if (displayCheckIn) displayCheckIn.textContent = formatHumanDate(startStr);
      if (displayCheckOut) displayCheckOut.textContent = formatHumanDate(endStr);
      if (displayNights) displayNights.textContent = `${nights} Night${nights === 1 ? '' : 's'}`;
      if (durationBadge) durationBadge.innerHTML = `<i class="bi bi-moon-stars-fill me-1"></i> ${nights} Night${nights === 1 ? '' : 's'}`;
      if (rangeInput) rangeInput.value = `${startStr}  ➔  ${endStr}  (${nights} night${nights === 1 ? '' : 's'})`;
      if (errorAlert) errorAlert.classList.add('d-none');
    } else if (startStr && !endStr) {
      if (displayCheckIn) displayCheckIn.textContent = formatHumanDate(startStr);
      if (displayCheckOut) displayCheckOut.textContent = 'Choose Check-out...';
      if (displayNights) displayNights.textContent = 'Select check-out';
      if (rangeInput) rangeInput.value = `${startStr}  ➔  (select checkout date)`;
    } else {
      if (displayCheckIn) displayCheckIn.textContent = 'Selecting...';
      if (displayCheckOut) displayCheckOut.textContent = 'Selecting...';
      if (displayNights) displayNights.textContent = 'Dates required';
      if (rangeInput) rangeInput.value = '';
    }

    updateSummaryCard(activeProperty);
  }

  // Determine starting default dates
  let defaultStart = initialCheckIn || checkInInput?.value;
  let defaultEnd = initialCheckOut || checkOutInput?.value;

  if (!defaultStart) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    defaultStart = tomorrow.toISOString().split('T')[0];
  }
  if (!defaultEnd) {
    const startObj = new Date(defaultStart);
    const endObj = new Date(startObj);
    endObj.setDate(endObj.getDate() + 2);
    defaultEnd = endObj.toISOString().split('T')[0];
  }

  // Initialize Flatpickr if available in window
  if (typeof window.flatpickr === 'function' && rangeInput) {
    const isMobile = window.innerWidth < 768;
    dateRangePickerInstance = window.flatpickr(rangeInput, {
      mode: 'range',
      minDate: 'today',
      dateFormat: 'Y-m-d',
      showMonths: isMobile ? 1 : 2,
      defaultDate: [defaultStart, defaultEnd],
      monthSelectorType: 'static',
      onChange: (selectedDates, dateStr, instance) => {
        if (selectedDates.length === 2) {
          const s = instance.formatDate(selectedDates[0], 'Y-m-d');
          const e = instance.formatDate(selectedDates[1], 'Y-m-d');
          updateVisualDateState(s, e);
        } else if (selectedDates.length === 1) {
          const s = instance.formatDate(selectedDates[0], 'Y-m-d');
          updateVisualDateState(s, null);
        }
      },
      onClose: (selectedDates, dateStr, instance) => {
        if (selectedDates.length === 1) {
          // If only 1 date selected when closed, set check-out to the next day
          const nextDay = new Date(selectedDates[0]);
          nextDay.setDate(nextDay.getDate() + 1);
          instance.setDate([selectedDates[0], nextDay], true);
        }
      }
    });

    if (openCalendarBtn) {
      openCalendarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        dateRangePickerInstance.open();
      });
    }

    if (cardCheckIn) {
      cardCheckIn.addEventListener('click', () => {
        dateRangePickerInstance.open();
      });
    }

    if (cardCheckOut) {
      cardCheckOut.addEventListener('click', () => {
        dateRangePickerInstance.open();
      });
    }

    // Dynamic month count on mobile/desktop resize
    window.addEventListener('resize', () => {
      if (dateRangePickerInstance) {
        const nowMobile = window.innerWidth < 768;
        if ((nowMobile && dateRangePickerInstance.config.showMonths === 2) ||
            (!nowMobile && dateRangePickerInstance.config.showMonths === 1)) {
          dateRangePickerInstance.set('showMonths', nowMobile ? 1 : 2);
        }
      }
    });
  }

  // Initial update of cards & inputs
  updateVisualDateState(defaultStart, defaultEnd);

  // Quick Preset buttons
  document.querySelectorAll('.date-preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.date-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const preset = btn.dataset.preset;
      const today = new Date();
      let start = new Date(today);
      let end = new Date(today);

      if (preset === 'tonight') {
        end.setDate(start.getDate() + 1);
      } else if (preset === '2nights') {
        start.setDate(today.getDate() + 1);
        end.setDate(start.getDate() + 2);
      } else if (preset === 'weekend') {
        const dayOfWeek = today.getDay(); // 0 is Sun, 5 is Fri
        let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
        if (daysUntilFriday === 0 && today.getHours() >= 18) {
          daysUntilFriday = 7;
        }
        start.setDate(today.getDate() + daysUntilFriday);
        end = new Date(start);
        end.setDate(start.getDate() + 2);
      } else if (preset === 'week') {
        start.setDate(today.getDate() + 1);
        end.setDate(start.getDate() + 7);
      }

      const sStr = start.toISOString().split('T')[0];
      const eStr = end.toISOString().split('T')[0];

      if (dateRangePickerInstance) {
        dateRangePickerInstance.setDate([sStr, eStr], true);
      } else {
        updateVisualDateState(sStr, eStr);
      }
    });
  });
}

/**
 * Updates the summary sidebar card
 * @param {Object} property
 */
function updateSummaryCard(property) {
  if (!property) return;
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
 * Configures M-Pesa STK Push controls and toggles
 */
function setupMpesaPaymentControls() {
  const mpesaRadio = document.getElementById('payMpesaStk');
  const arrivalRadio = document.getElementById('payArrival');
  const mpesaPhoneBox = document.getElementById('mpesaStkPhoneBox');
  const guestPhoneInput = document.getElementById('guestPhone');
  const mpesaPhoneInput = document.getElementById('mpesaPhone');
  const submitBtn = document.getElementById('submitBookingBtn');
  const testStkBtn = document.getElementById('btnTestStk');

  // Synchronize guest phone with M-Pesa phone field
  if (guestPhoneInput && mpesaPhoneInput) {
    guestPhoneInput.addEventListener('input', (e) => {
      if (!mpesaPhoneInput.dataset.manualEdit) {
        mpesaPhoneInput.value = e.target.value;
      }
    });

    mpesaPhoneInput.addEventListener('input', () => {
      mpesaPhoneInput.dataset.manualEdit = 'true';
    });
  }

  function updatePaymentMethodUI() {
    const isStk = mpesaRadio && mpesaRadio.checked;
    if (mpesaPhoneBox) {
      mpesaPhoneBox.style.display = isStk ? 'block' : 'none';
    }
    if (submitBtn) {
      if (isStk) {
        submitBtn.className = 'btn btn-success w-100 py-3 fs-6 d-flex align-items-center justify-content-center gap-2';
        submitBtn.innerHTML = '<i class="bi bi-phone-vibrate fs-5"></i> Send M-Pesa STK Push & Book';
      } else {
        submitBtn.className = 'btn btn-primary w-100 py-3 fs-6 d-flex align-items-center justify-content-center gap-2';
        submitBtn.innerHTML = '<i class="bi bi-shield-check fs-5"></i> Confirm Reservation (Pay on Arrival)';
      }
    }
  }

  if (mpesaRadio) mpesaRadio.addEventListener('change', updatePaymentMethodUI);
  if (arrivalRadio) arrivalRadio.addEventListener('change', updatePaymentMethodUI);
  updatePaymentMethodUI();

  // "Trigger STK" button inside phone box for immediate test
  if (testStkBtn) {
    testStkBtn.addEventListener('click', async () => {
      const phone = mpesaPhoneInput?.value || guestPhoneInput?.value;
      if (!phone) {
        alert('Please enter your phone number first.');
        mpesaPhoneInput?.focus();
        return;
      }
      const nights = calculateNights(
        document.getElementById('bookCheckIn')?.value,
        document.getElementById('bookCheckOut')?.value
      );
      const total = ((activeProperty?.price || 10000) * nights) + 1500;
      await startMpesaStkPushFlow({
        phone,
        amount: total,
        bookingRef: 'TEST-' + Math.floor(100000 + Math.random() * 900000),
        propertyName: activeProperty?.name || 'Wangwana Residence',
        guestName: document.getElementById('guestFullName')?.value || 'Guest',
        isStandaloneTest: true
      });
    });
  }
}

/**
 * Handles reservation form submission
 */
function setupReservationForm() {
  const form = document.getElementById('reservationForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add('was-validated');
      return;
    }

    const currentProp = activeProperty || getPropertyById(document.getElementById('bookPropertySelect')?.value || 'whitehouse');
    const guestName = document.getElementById('guestFullName')?.value || 'Guest';
    const guestPhone = document.getElementById('guestPhone')?.value || '';
    const mpesaPhone = document.getElementById('mpesaPhone')?.value || guestPhone;
    const guestEmail = document.getElementById('guestEmail')?.value || '';
    const isMpesaStk = document.getElementById('payMpesaStk')?.checked;
    const checkInVal = document.getElementById('bookCheckIn')?.value;
    const checkOutVal = document.getElementById('bookCheckOut')?.value;

    if (!checkInVal || !checkOutVal) {
      const errorAlert = document.getElementById('dateRangeError');
      if (errorAlert) errorAlert.classList.remove('d-none');
      if (dateRangePickerInstance) dateRangePickerInstance.open();
      return;
    }
    const guestsVal = parseInt(document.getElementById('bookGuests')?.value || '2', 10);
    const notes = document.getElementById('guestNotes')?.value || '';
    const nights = calculateNights(checkInVal, checkOutVal);
    const grandTotal = (currentProp.price * nights) + 1500;
    const bookingRef = 'WNG-' + Math.floor(100000 + Math.random() * 900000);

    if (isMpesaStk) {
      // Trigger M-Pesa STK Push
      await startMpesaStkPushFlow({
        phone: mpesaPhone,
        amount: grandTotal,
        bookingRef,
        propertyName: currentProp.name,
        guestName,
        guestEmail,
        checkIn: checkInVal,
        checkOut: checkOutVal,
        guests: guestsVal,
        property: currentProp,
        nights,
        notes,
        isStandaloneTest: false
      });
    } else {
      // Direct Pay on Arrival Reservation
      await completeBookingSubmission({
        bookingRef,
        property: currentProp,
        guestName,
        guestPhone,
        guestEmail,
        checkInVal,
        checkOutVal,
        guestsVal,
        nights,
        grandTotal,
        paymentMethod: 'Pay on Arrival (M-Pesa / Cash)',
        paymentStatus: 'Pending Arrival',
        mpesaReceipt: null,
        notes
      });
    }
  });
}

/**
 * Executes M-Pesa STK Push request and controls interactive UI/polling
 */
async function startMpesaStkPushFlow(params) {
  const modalEl = document.getElementById('mpesaStkModal');
  const modalBody = document.getElementById('mpesaStkModalBody');
  if (!modalEl || !modalBody) return;

  const modalInstance = window.bootstrap?.Modal?.getOrCreateInstance(modalEl) || new window.bootstrap.Modal(modalEl);
  modalInstance.show();

  // Phase 1: Sending STK Push
  modalBody.innerHTML = `
    <div class="py-4">
      <div class="spinner-border text-success mb-3" style="width: 3rem; height: 3rem;" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <h5 class="text-light mb-1">Sending Lipa Na M-Pesa STK Push...</h5>
      <p class="text-muted small mb-0">Connecting to Safaricom Daraja Gateway for <strong>${params.phone}</strong></p>
    </div>
  `;

  if (stkPollingTimer) {
    clearInterval(stkPollingTimer);
    stkPollingTimer = null;
  }

  try {
    const res = await fetch('/api/mpesa/stkpush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: params.phone,
        amount: params.amount,
        bookingRef: params.bookingRef,
        propertyName: params.propertyName,
        guestName: params.guestName
      })
    });

    const data = await res.json();

    if (!data.success) {
      modalBody.innerHTML = `
        <div class="py-3">
          <div class="text-danger mb-3"><i class="bi bi-x-circle fs-1"></i></div>
          <h5 class="text-light mb-2">STK Push Request Failed</h5>
          <p class="text-muted small mb-4">${data.message || 'Could not send M-Pesa prompt.'}</p>
          <div class="d-flex gap-2 justify-content-center">
            <button type="button" class="btn btn-outline-light px-3" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-success px-3" onclick="document.getElementById('btnTestStk')?.click();">Retry</button>
          </div>
        </div>
      `;
      return;
    }

    const checkoutId = data.CheckoutRequestID;
    const formattedPhone = data.phoneNumber || params.phone;

    // Phase 2: Awaiting User PIN Entry
    modalBody.innerHTML = `
      <div class="py-2">
        <div class="mb-3">
          <span class="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 p-2 rounded-circle">
            <i class="bi bi-phone-vibrate fs-2"></i>
          </span>
        </div>
        <h5 class="text-light mb-1">Prompt Sent to Your Handset!</h5>
        <p class="text-muted small mb-3">
          Please check your phone <strong>+${formattedPhone}</strong> now and enter your M-Pesa PIN.
        </p>

        <!-- Simulated Authentic Handset Prompt Card -->
        <div class="p-3 bg-black rounded border border-success border-opacity-50 text-start font-monospace small mb-3 shadow">
          <div class="text-success fw-bold border-bottom border-secondary pb-1 mb-2 d-flex justify-content-between">
            <span><i class="bi bi-sim me-1"></i> SIM ToolKit</span>
            <span class="badge bg-success text-black">M-Pesa</span>
          </div>
          <div class="text-light mb-1">Do you want to pay:</div>
          <div class="text-warning fw-bold fs-6 mb-1">KES ${Number(params.amount).toLocaleString()}</div>
          <div class="text-light small mb-1">To: <span class="text-white">Wangwana Airbnb</span></div>
          <div class="text-muted small mb-2">Ref: <span class="text-light">${params.bookingRef}</span></div>
          <div class="d-flex align-items-center gap-2 pt-2 border-top border-secondary">
            <span class="text-muted small">Enter PIN:</span>
            <span class="text-success fw-bold fs-5">••••</span>
            <span class="spinner-grow spinner-grow-sm text-success ms-auto" role="status"></span>
          </div>
        </div>

        <div class="d-flex align-items-center justify-content-center gap-2 text-muted small mb-3">
          <span class="spinner-border spinner-border-sm text-success" role="status"></span>
          <span>Awaiting PIN confirmation from Safaricom...</span>
        </div>

        <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">
          Cancel / Pay on Arrival Instead
        </button>
      </div>
    `;

    // Start Polling Query Status
    let attempts = 0;
    stkPollingTimer = setInterval(async () => {
      attempts++;
      if (attempts > 30) {
        clearInterval(stkPollingTimer);
        stkPollingTimer = null;
        modalBody.innerHTML = `
          <div class="py-3">
            <div class="text-warning mb-3"><i class="bi bi-clock-history fs-1"></i></div>
            <h5 class="text-light mb-2">Payment Verification Timeout</h5>
            <p class="text-muted small mb-4">Did not receive confirmation in time. If you entered your PIN, your receipt is safe. You can also complete payment on arrival.</p>
            <button type="button" class="btn btn-outline-light px-3" data-bs-dismiss="modal">Close</button>
          </div>
        `;
        return;
      }

      try {
        const queryRes = await fetch(`/api/mpesa/query/${checkoutId}`);
        const queryData = await queryRes.json();

        if (queryData.success && queryData.status === 'COMPLETED') {
          clearInterval(stkPollingTimer);
          stkPollingTimer = null;

          const receipt = queryData.mpesaReceipt || ('SJA' + Math.floor(1000000 + Math.random() * 9000000));

          // Phase 3: Confirmed
          modalBody.innerHTML = `
            <div class="py-3">
              <div class="text-success mb-3">
                <i class="bi bi-check-circle-fill display-4 text-success"></i>
              </div>
              <h4 class="text-success mb-1">M-Pesa Payment Successful!</h4>
              <p class="text-light mb-3">Receipt Number: <strong class="text-gold font-monospace fs-5">${receipt}</strong></p>
              <div class="p-3 bg-dark-elevated rounded border border-secondary text-start small mb-3">
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">Amount Paid:</span>
                  <span class="text-success fw-bold">KES ${Number(params.amount).toLocaleString()}</span>
                </div>
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">Paid From:</span>
                  <span class="text-light">+${formattedPhone}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Payment Mode:</span>
                  <span class="text-light">Lipa Na M-Pesa Online (STK Push)</span>
                </div>
              </div>

              ${params.isStandaloneTest ? `
                <button type="button" class="btn btn-success w-100 py-2" data-bs-dismiss="modal">
                  <i class="bi bi-check-lg me-1"></i> Done Testing
                </button>
              ` : `
                <button type="button" class="btn btn-success w-100 py-2" id="btnFinishBookingFlow">
                  <i class="bi bi-arrow-right-circle me-1"></i> View Booking Confirmation
                </button>
              `}
            </div>
          `;

          if (!params.isStandaloneTest) {
            // Save completed booking
            await completeBookingSubmission({
              bookingRef: params.bookingRef,
              property: params.property,
              guestName: params.guestName,
              guestPhone: params.phone,
              guestEmail: params.guestEmail,
              checkInVal: params.checkIn,
              checkOutVal: params.checkOut,
              guestsVal: params.guests,
              nights: params.nights,
              grandTotal: params.amount,
              paymentMethod: 'Lipa Na M-Pesa (STK Push)',
              paymentStatus: 'PAID',
              mpesaReceipt: receipt,
              notes: params.notes
            });

            const finishBtn = document.getElementById('btnFinishBookingFlow');
            if (finishBtn) {
              finishBtn.addEventListener('click', () => {
                modalInstance.hide();
              });
            }
          }
        }
      } catch (pollErr) {
        console.warn('STK Polling query attempt failed:', pollErr);
      }
    }, 1500);

  } catch (err) {
    console.error('STK Push request network error:', err);
    modalBody.innerHTML = `
      <div class="py-3">
        <div class="text-danger mb-3"><i class="bi bi-exclamation-triangle fs-1"></i></div>
        <h5 class="text-light mb-2">Network Error</h5>
        <p class="text-muted small mb-4">Could not communicate with the server. Please check your connection and retry.</p>
        <button type="button" class="btn btn-outline-light px-3" data-bs-dismiss="modal">Close</button>
      </div>
    `;
  }
}

/**
 * Finalizes booking and renders the confirmation card
 */
async function completeBookingSubmission(data) {
  try {
    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: data.property.id,
        propertyName: data.property.name,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail,
        checkIn: data.checkInVal,
        checkOut: data.checkOutVal,
        guests: data.guestsVal,
        totalAmount: data.grandTotal,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        mpesaReceipt: data.mpesaReceipt,
        notes: data.notes
      })
    });
  } catch (err) {
    console.warn('Booking API call error, continuing locally:', err);
  }

  const bookingBox = document.getElementById('reservation-flow-container');
  if (bookingBox) {
    const isPaid = data.paymentStatus === 'PAID';
    bookingBox.innerHTML = `
      <div class="surface-card p-4 p-md-5 border border-success">
        <div class="text-center mb-4">
          <div class="d-inline-flex p-3 rounded-circle bg-success bg-opacity-25 text-success mb-3">
            <i class="bi bi-check-circle-fill fs-1"></i>
          </div>
          <h2 class="h3 text-success">${isPaid ? 'Reservation & Payment Confirmed!' : 'Direct Agency Reservation Confirmed!'}</h2>
          <p class="text-muted">Agency Confirmation Reference: <strong class="text-light fs-5 font-monospace">${data.bookingRef}</strong></p>
          ${isPaid ? `
            <div class="d-inline-block bg-success bg-opacity-20 text-success border border-success border-opacity-50 px-3 py-1 rounded-pill small fw-bold">
              <i class="bi bi-patch-check-fill me-1"></i> M-Pesa Receipt: ${data.mpesaReceipt}
            </div>
          ` : ''}
        </div>

        <div class="p-3 bg-dark-elevated rounded border border-secondary mb-4">
          <h5 class="h6 text-gold mb-3"><i class="bi bi-shield-check me-1"></i> Managed by Wangwana Real Estate Agency</h5>
          <div class="row g-2 small">
            <div class="col-sm-6 text-muted">Residence: <strong class="text-light">${data.property.name}</strong></div>
            <div class="col-sm-6 text-muted">Agency Ref: <strong class="text-gold font-monospace">${data.property.agencyRef || 'WNG-KS'}</strong></div>
            <div class="col-sm-6 text-muted">Guest Name: <strong class="text-light">${data.guestName}</strong></div>
            <div class="col-sm-6 text-muted">Contact Phone: <strong class="text-light">${data.guestPhone}</strong></div>
            <div class="col-sm-6 text-muted">Dates: <strong class="text-light">${data.checkInVal} to ${data.checkOutVal} (${data.nights} nights)</strong></div>
            <div class="col-sm-6 text-muted">
              ${isPaid ? 'Total Paid via M-Pesa:' : 'Total Payable at Arrival:'} 
              <strong class="text-success fs-6">${formatKsh(data.grandTotal)}</strong>
            </div>
            <div class="col-12 text-muted mt-2 pt-2 border-top border-secondary border-opacity-20">
              Payment Status: 
              ${isPaid ? `
                <strong class="text-success"><i class="bi bi-check-circle-fill me-1"></i>Fully Paid via Lipa Na M-Pesa STK Push</strong>
              ` : `
                <strong class="text-success"><i class="bi bi-shield-lock-fill me-1"></i>Pay on Arrival (Inspect first, pay upon key handover)</strong>
              `}
            </div>
          </div>
        </div>

        <div class="alert alert-dark border border-secondary small text-muted mb-4">
          <i class="bi bi-building-check text-gold me-1"></i> 
          <strong>Wangwana Concierge Service:</strong> 
          ${isPaid ? 
            `Your payment of KES ${Number(data.grandTotal).toLocaleString()} has been securely settled via M-Pesa (Receipt: ${data.mpesaReceipt}). Your host concierge has been notified and will welcome you at the residence with keys upon arrival.` :
            `A dedicated agency concierge is assigned to welcome you at the residence. Zero advance deduction was made. When you arrive, inspect the home, collect keys, and pay KES ${Number(data.grandTotal).toLocaleString()} directly via M-Pesa or Cash.`}
        </div>

        <div class="d-flex flex-column flex-sm-row gap-3">
          <a href="https://wa.me/254703165843?text=Hello%20Wangwana%20Real%20Estate,%20I%20have%20reserved%20${encodeURIComponent(data.property.name)}%20(Booking%20Ref:%20${data.bookingRef},%20${isPaid ? 'M-Pesa%20Receipt:%20' + data.mpesaReceipt : 'Pay%20on%20Arrival'})%20for%20${data.nights}%20nights.%20Kindly%20confirm%20check-in." 
             target="_blank" class="btn btn-success flex-grow-1 py-2">
            <i class="bi bi-whatsapp me-2"></i>WhatsApp Agency Concierge
          </a>
          <a href="listings.html" class="btn btn-outline-light py-2">Browse More Stays</a>
          <a href="index.html" class="btn btn-outline-light py-2">Home</a>
        </div>
      </div>
    `;
    bookingBox.scrollIntoView({ behavior: 'smooth' });
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
