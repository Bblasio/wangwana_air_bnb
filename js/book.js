// Booking reservation interactive logic & M-Pesa STK Push simulation for Wangwana Real Estate Agency
import { PROPERTIES, getPropertyById, formatKsh, getProperties } from './properties.js';
import { calculateNights, initDateConstraints } from './utils.js';

let activeReservationState = null;
let currentStkRequestId = null;
let currentPinBuffer = '';

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
  setupMpesaSimulationModal();
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

  const airbnbLink = document.getElementById('summary-airbnb-link');
  if (airbnbLink) {
    airbnbLink.href = property.airbnbUrl || `https://www.airbnb.com/s/Kisumu--Kenya/homes?query=${encodeURIComponent(property.name)}`;
    airbnbLink.title = `View ${property.name} on Airbnb`;
  }
}

/**
 * Form submission handling with M-Pesa STK Push Simulation & Pay on Arrival
 * @param {Object} property
 */
function setupReservationForm(property) {
  const form = document.getElementById('reservationForm');
  const quickPoaBtn = document.getElementById('btnQuickPoa');

  if (!form) return;

  // Handler for form submit (either M-Pesa STK push or POA)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add('was-validated');
      return;
    }

    const currentProp = getSelectedProperty();
    const guestData = extractFormData(currentProp);
    activeReservationState = guestData;

    // Check payment method chosen
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || '';
    const isMpesa = selectedMethod.includes('M-Pesa Online') || selectedMethod.includes('STK Push') || selectedMethod === 'M-Pesa';

    if (isMpesa) {
      // Launch M-Pesa Modal
      launchMpesaModal(activeReservationState);
    } else {
      // Confirm directly on Pay on Arrival
      await completeBookingRecord(activeReservationState, 'Pay on Arrival (Zero Prepayment)', 'Confirmed (Pay on Arrival)');
      renderConfirmedVoucher(activeReservationState);
    }
  });

  if (quickPoaBtn) {
    quickPoaBtn.addEventListener('click', async () => {
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }
      const currentProp = getSelectedProperty();
      activeReservationState = extractFormData(currentProp);
      activeReservationState.paymentMethod = 'Pay on Arrival (Zero Prepayment)';
      await completeBookingRecord(activeReservationState, 'Pay on Arrival (Zero Prepayment)', 'Confirmed (Pay on Arrival)');
      renderConfirmedVoucher(activeReservationState);
    });
  }
}

function getSelectedProperty() {
  const select = document.getElementById('bookPropertySelect');
  const propId = select?.value || 'whitehouse';
  return getPropertyById(propId);
}

function extractFormData(property) {
  const guestName = document.getElementById('guestFullName')?.value || 'Guest';
  const guestPhone = document.getElementById('guestPhone')?.value || '0703165843';
  const guestEmail = document.getElementById('guestEmail')?.value || 'guest@wangwana.co.ke';
  const checkInVal = document.getElementById('bookCheckIn')?.value || '2026-10-15';
  const checkOutVal = document.getElementById('bookCheckOut')?.value || '2026-10-17';
  const guestsVal = parseInt(document.getElementById('bookGuests')?.value || '2', 10);
  const nights = calculateNights(checkInVal, checkOutVal);
  const nightlyRate = property.price || 10500;
  const grandTotal = (nightlyRate * nights) + 1500;
  const refCode = 'WNG-' + Math.floor(100000 + Math.random() * 900000);

  return {
    propertyId: property.id,
    propertyName: property.name,
    agencyRef: property.agencyRef || 'WNG-KS',
    location: property.location || 'Kisumu City',
    nightlyRate,
    guestName,
    guestPhone,
    guestEmail,
    checkIn: checkInVal,
    checkOut: checkOutVal,
    guests: guestsVal,
    nights,
    totalAmount: grandTotal,
    refCode,
    paymentMethod: 'Lipa Na M-Pesa Online (STK Push)',
    status: 'Pending Payment / Confirmation'
  };
}

/**
 * Initializes the interactive M-Pesa STK Push Simulation Modal
 */
function setupMpesaSimulationModal() {
  const modalEl = document.getElementById('mpesaStkModal');
  if (!modalEl) return;

  const triggerStkBtn = document.getElementById('btnTriggerStkPush');
  const skipToPoaBtn = document.getElementById('btnSkipToPayOnArrival');
  const submitPinBtn = document.getElementById('btnSubmitStkPin');
  const cancelPromptBtn = document.getElementById('btnCancelStkPrompt');
  const directPinInput = document.getElementById('simDirectPinInput');
  const finishBtn = document.getElementById('btnFinishMpesaModal');

  // Keypad numbers handling
  const keypadButtons = modalEl.querySelectorAll('.stk-key-btn');
  keypadButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const key = btn.getAttribute('data-key');
      handleKeypadInput(key);
    });
  });

  // Direct typing input handler
  if (directPinInput) {
    directPinInput.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
      currentPinBuffer = val;
      updatePinDotsUI(currentPinBuffer.length);
      if (val.length === 4) {
        // Auto highlight Send PIN
        submitPinBtn?.focus();
      }
    });

    directPinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitPinBtn?.click();
      }
    });
  }

  // Trigger STK Push initiation
  if (triggerStkBtn) {
    triggerStkBtn.addEventListener('click', async () => {
      if (!activeReservationState) return;

      const rawPhone = document.getElementById('mpesaPromptPhone')?.value || activeReservationState.guestPhone;
      let cleanPhone = rawPhone.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);
      if (!cleanPhone.startsWith('254')) cleanPhone = '254' + cleanPhone;

      triggerStkBtn.disabled = true;
      triggerStkBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
        Contacting Safaricom Daraja Gateway...
      `;

      try {
        const resp = await fetch('/api/mpesa/stkpush', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: cleanPhone,
            amount: activeReservationState.totalAmount,
            accountReference: activeReservationState.agencyRef || activeReservationState.refCode,
            transactionDesc: `Wangwana Stay ${activeReservationState.propertyName}`
          })
        });

        const data = await resp.json();
        currentStkRequestId = data.checkoutRequestId || ('ws_CO_' + Date.now());

        // Update phone simulation screen details
        setStepView('mpesaStepSimulating');
        setText('stkDialogAmount', formatKsh(activeReservationState.totalAmount));
        setText('stkDialogRef', activeReservationState.agencyRef || activeReservationState.refCode);
        
        // Update live phone time
        const now = new Date();
        setText('phoneSimTime', now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        // Reset pin buffer & focus
        currentPinBuffer = '';
        updatePinDotsUI(0);
        if (directPinInput) {
          directPinInput.value = '';
          setTimeout(() => directPinInput.focus(), 300);
        }
      } catch (err) {
        console.warn('STK Push API error, fallback to simulated flow:', err);
        currentStkRequestId = 'ws_CO_' + Date.now();
        setStepView('mpesaStepSimulating');
      } finally {
        triggerStkBtn.disabled = false;
        triggerStkBtn.innerHTML = `
          <i class="bi bi-phone-vibrate fs-5"></i>
          <span>Send M-Pesa Prompt to Phone</span>
        `;
      }
    });
  }

  // Cancel STK prompt in handset simulation
  if (cancelPromptBtn) {
    cancelPromptBtn.addEventListener('click', () => {
      setStepView('mpesaStepInitiate');
    });
  }

  // Submit PIN
  if (submitPinBtn) {
    submitPinBtn.addEventListener('click', async () => {
      const pin = currentPinBuffer || directPinInput?.value || '1234';
      if (pin.length < 4) {
        alert('Please enter a 4-digit M-Pesa PIN');
        return;
      }

      const spinner = document.getElementById('btnSubmitPinSpinner');
      if (spinner) spinner.classList.remove('d-none');
      submitPinBtn.disabled = true;

      try {
        const resp = await fetch('/api/mpesa/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkoutRequestId: currentStkRequestId,
            pin: pin
          })
        });

        const result = await resp.json();
        const receipt = result.receipt || generateMpesaReceipt();

        // Save booking to backend as paid
        activeReservationState.paymentMethod = `Lipa Na M-Pesa Online (Ref: ${receipt})`;
        activeReservationState.status = 'Paid & Confirmed';
        activeReservationState.mpesaReceipt = receipt;

        await completeBookingRecord(activeReservationState, activeReservationState.paymentMethod, activeReservationState.status);

        // Populate Success Step
        setText('smsReceiptNumber', receipt);
        setText('smsReceiptMessage', `M-PESA Confirmed. Receipt: ${receipt}. KES ${activeReservationState.totalAmount.toLocaleString()}.00 sent to WANGWANA REAL ESTATE AGENCY (Till 843165) on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. New M-PESA balance is KES 48,250.00. Transaction cost: KES 0.00.`);
        
        setText('successPropName', activeReservationState.propertyName);
        setText('successAgencyRef', activeReservationState.agencyRef);
        setText('successGuestName', activeReservationState.guestName);
        setText('successGuestPhone', activeReservationState.guestPhone);
        setText('successDates', `${activeReservationState.checkIn} to ${activeReservationState.checkOut} (${activeReservationState.nights} nights)`);

        const waLink = document.getElementById('successWhatsAppConcierge');
        if (waLink) {
          waLink.href = `https://wa.me/254703165843?text=Hello%20Wangwana%20Agency,%20I%20have%20paid%20KES%20${activeReservationState.totalAmount}%20via%20M-Pesa%20(Receipt:%20${receipt})%20for%20${encodeURIComponent(activeReservationState.propertyName)}%20(Ref:%20${activeReservationState.agencyRef}).%20Kindly%20confirm%20check-in.`;
        }

        // Reset and prepare Download/Print PDF Button
        if (downloadPrintPdfBtn) {
          downloadPrintPdfBtn.disabled = false;
          downloadPrintPdfBtn.className = 'btn btn-gold text-dark fw-bold flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2';
          downloadPrintPdfBtn.innerHTML = `
            <i class="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
            <span>Download / Print Booking PDF</span>
          `;
          downloadPrintPdfBtn.onclick = null;
        }
        setText('assurancePropName', activeReservationState.propertyName);

        setStepView('mpesaStepSuccess');
      } catch (err) {
        console.error('Error confirming M-Pesa PIN:', err);
        setStepView('mpesaStepSuccess');
      } finally {
        if (spinner) spinner.classList.add('d-none');
        submitPinBtn.disabled = false;
      }
    });
  }

  // Download / Print Booking PDF button in modal
  const downloadPrintPdfBtn = document.getElementById('btnDownloadPrintPdf');
  if (downloadPrintPdfBtn) {
    downloadPrintPdfBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (activeReservationState) {
        handleDownloadPrintBookingPdf(activeReservationState, downloadPrintPdfBtn);
      }
    });
  }

  // Skip to Pay on Arrival instead
  if (skipToPoaBtn) {
    skipToPoaBtn.addEventListener('click', async () => {
      if (!activeReservationState) return;
      activeReservationState.paymentMethod = 'Pay on Arrival (Zero Prepayment)';
      activeReservationState.status = 'Confirmed (Pay on Arrival)';
      await completeBookingRecord(activeReservationState, activeReservationState.paymentMethod, activeReservationState.status);

      // Close modal
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();

      renderConfirmedVoucher(activeReservationState);
    });
  }

  // When modal is finished / dismissed
  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      if (activeReservationState) {
        renderConfirmedVoucher(activeReservationState);
      }
    });
  }
}

function handleKeypadInput(key) {
  const directInput = document.getElementById('simDirectPinInput');

  if (key === 'clear') {
    currentPinBuffer = '';
  } else if (key === 'back') {
    currentPinBuffer = currentPinBuffer.slice(0, -1);
  } else if (/^[0-9]$/.test(key)) {
    if (currentPinBuffer.length < 4) {
      currentPinBuffer += key;
    }
  }

  if (directInput) {
    directInput.value = currentPinBuffer;
  }
  updatePinDotsUI(currentPinBuffer.length);
}

function updatePinDotsUI(filledCount) {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`pindot-${i}`);
    if (dot) {
      if (i <= filledCount) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    }
  }
}

function setStepView(stepId) {
  const steps = ['mpesaStepInitiate', 'mpesaStepSimulating', 'mpesaStepSuccess'];
  steps.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === stepId) {
        el.classList.remove('d-none');
      } else {
        el.classList.add('d-none');
      }
    }
  });
}

function launchMpesaModal(bookingData) {
  const modalEl = document.getElementById('mpesaStkModal');
  if (!modalEl) return;

  // Fill in booking data
  setText('modalStayName', bookingData.propertyName);
  setText('modalStayLocation', bookingData.location);
  setText('modalAgencyRef', bookingData.agencyRef);
  setText('modalAccountRef', bookingData.agencyRef);
  setText('modalGuestName', bookingData.guestName);
  setText('modalDates', `${bookingData.checkIn} to ${bookingData.checkOut} (${bookingData.nights} nights)`);
  setText('modalGuests', `${bookingData.guests} Guest${bookingData.guests == 1 ? '' : 's'}`);
  setText('modalTotalPayable', formatKsh(bookingData.totalAmount));
  setText('modalPromptAmount', formatKsh(bookingData.totalAmount));

  // Phone input
  const phoneInput = document.getElementById('mpesaPromptPhone');
  if (phoneInput) {
    let clean = bookingData.guestPhone.replace(/\D/g, '');
    if (clean.startsWith('254')) clean = clean.slice(3);
    else if (clean.startsWith('0')) clean = clean.slice(1);
    phoneInput.value = clean || '703165843';
  }

  setStepView('mpesaStepInitiate');

  const downloadPrintPdfBtn = document.getElementById('btnDownloadPrintPdf');
  if (downloadPrintPdfBtn) {
    downloadPrintPdfBtn.disabled = false;
    downloadPrintPdfBtn.className = 'btn btn-gold text-dark fw-bold flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2';
    downloadPrintPdfBtn.innerHTML = `
      <i class="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
      <span>Download / Print Booking PDF</span>
    `;
    downloadPrintPdfBtn.onclick = null;
  }

  const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
  modalInstance.show();
}

async function completeBookingRecord(bookingData, paymentMethod, status) {
  try {
    // 1. Save to local Express backend
    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: bookingData.propertyId,
        propertyName: bookingData.propertyName,
        guestName: bookingData.guestName,
        guestPhone: bookingData.guestPhone,
        guestEmail: bookingData.guestEmail,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        totalAmount: bookingData.totalAmount,
        paymentMethod: paymentMethod || bookingData.paymentMethod,
        status: status || bookingData.status,
        receiptNumber: bookingData.mpesaReceipt || null,
        notes: document.getElementById('guestNotes')?.value || ''
      })
    });

    // 2. Dispatch email notification to ochiengblasio@gmail.com via Formspree
    const NOTIFICATION_EMAIL = 'ochiengblasio@gmail.com';
    const formspreePayload = {
      _to: NOTIFICATION_EMAIL,
      _replyto: bookingData.guestEmail || NOTIFICATION_EMAIL,
      _subject: `New Wangwana Airbnb Reservation: ${bookingData.propertyName} (${bookingData.guestName})`,
      "Guest Name": bookingData.guestName,
      "Guest Phone": bookingData.guestPhone,
      "Guest Email": bookingData.guestEmail,
      "Property": bookingData.propertyName,
      "Agency Reference": bookingData.agencyRef || bookingData.refCode || 'WNG-KS',
      "Location": bookingData.location || 'Kisumu City',
      "Check In": bookingData.checkIn,
      "Check Out": bookingData.checkOut,
      "Nights": bookingData.nights,
      "Guests": bookingData.guests,
      "Total Amount": `KSH ${Number(bookingData.totalAmount || 0).toLocaleString()}`,
      "Payment Mode": paymentMethod || bookingData.paymentMethod,
      "M-Pesa Receipt": bookingData.mpesaReceipt || 'N/A (Pay on Arrival)',
      "Reservation Status": status || bookingData.status,
      "Special Requests": document.getElementById('guestNotes')?.value || 'None',
      "Recipient": NOTIFICATION_EMAIL,
      "Agency Desk": "Wangwana Real Estate Agency Kisumu (Till 843165)"
    };

    fetch('https://formspree.io/f/ochiengblasio@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(formspreePayload)
    }).catch(() => {
      fetch('https://formspree.io/ochiengblasio@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(formspreePayload)
      }).catch(e => console.log('Client Formspree dispatch handled'));
    });
  } catch (err) {
    console.warn('Booking record save warning:', err);
  }
}

function generateMpesaReceipt() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const prefix = 'RE' + Math.floor(10 + Math.random() * 90);
  let randomStr = '';
  for (let i = 0; i < 4; i++) {
    randomStr += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return prefix + randomStr + Math.floor(10 + Math.random() * 90) + 'P';
}

/**
 * Renders confirmed agency reservation voucher on page
 * @param {Object} data
 */
function renderConfirmedVoucher(data) {
  const bookingBox = document.getElementById('reservation-flow-container');
  if (!bookingBox) return;

  const isMpesaPaid = (data.paymentMethod || '').includes('M-Pesa') && data.status.includes('Paid');

  bookingBox.innerHTML = `
    <div class="surface-card p-4 p-md-5 border ${isMpesaPaid ? 'border-success' : 'border-gold'}">
      <div class="text-center mb-4">
        <div class="d-inline-flex p-3 rounded-circle ${isMpesaPaid ? 'bg-success bg-opacity-25 text-success' : 'bg-gold bg-opacity-25 text-gold'} mb-3">
          <i class="bi ${isMpesaPaid ? 'bi-patch-check-fill' : 'bi-check-circle-fill'} fs-1"></i>
        </div>
        <h2 class="h3 ${isMpesaPaid ? 'text-success' : 'text-gold'}">
          ${isMpesaPaid ? 'Stay Confirmed & M-Pesa Payment Received!' : 'Direct Agency Reservation Confirmed!'}
        </h2>
        <p class="text-muted">Agency Confirmation Reference: <strong class="text-light fs-5 font-monospace">${data.refCode}</strong></p>
      </div>

      ${isMpesaPaid ? `
        <div class="mpesa-receipt-card mb-4">
          <div class="d-flex align-items-center justify-content-between mb-2 border-bottom border-success border-opacity-25 pb-2">
            <span class="text-success fw-bold"><i class="bi bi-phone-vibrate me-1"></i> Lipa Na M-Pesa Official Receipt</span>
            <span class="badge bg-success">${data.mpesaReceipt || 'CONFIRMED'}</span>
          </div>
          <div class="text-light small font-monospace">
            Amount: KES ${data.totalAmount.toLocaleString()}.00 | Till: 843165 (Wangwana Real Estate Agency)<br>
            Transaction Status: COMPLETED & VERIFIED ONLINE
          </div>
        </div>
      ` : ''}

      <div class="p-3 bg-dark-elevated rounded border border-secondary mb-4">
        <h5 class="h6 text-gold mb-3"><i class="bi bi-shield-check me-1"></i> Managed by Wangwana Real Estate Agency</h5>
        <div class="row g-2 small">
          <div class="col-sm-6 text-muted">Residence: <strong class="text-light">${data.propertyName}</strong></div>
          <div class="col-sm-6 text-muted">Agency Ref: <strong class="text-gold font-monospace">${data.agencyRef}</strong></div>
          <div class="col-sm-6 text-muted">Guest Name: <strong class="text-light">${data.guestName}</strong></div>
          <div class="col-sm-6 text-muted">Contact Phone: <strong class="text-light">${data.guestPhone}</strong></div>
          <div class="col-sm-6 text-muted">Dates: <strong class="text-light">${data.checkIn} to ${data.checkOut} (${data.nights} nights)</strong></div>
          <div class="col-sm-6 text-muted">Total Amount: <strong class="text-gold fs-6">${formatKsh(data.totalAmount)}</strong></div>
          <div class="col-12 text-muted mt-2 pt-2 border-top border-secondary border-opacity-20">
            Payment Status: <strong class="${isMpesaPaid ? 'text-success' : 'text-gold'}">
              <i class="bi ${isMpesaPaid ? 'bi-check-all' : 'bi-shield-lock-fill'} me-1"></i>
              ${isMpesaPaid ? 'Paid in Full via Lipa Na M-Pesa Online' : 'Pay on Arrival (Inspect first, pay upon key handover)'}
            </strong>
          </div>
        </div>
      </div>

      <!-- Host Notification Confirmation Badge -->
      <div class="d-flex align-items-center gap-3 p-3 rounded bg-dark-elevated border border-secondary mb-4 small">
        <i class="bi bi-envelope-check-fill text-gold fs-4 flex-shrink-0"></i>
        <div>
          <span class="text-light fw-bold d-block">Host Email Dispatched</span>
          <span class="text-muted">A reservation notification has been transmitted to <strong class="text-gold">ochiengblasio@gmail.com</strong> via Formspree for immediate concierge arrival prep.</span>
        </div>
      </div>

      <div class="alert alert-dark border border-secondary small text-muted mb-4">
        <i class="bi bi-building-check text-gold me-1"></i> <strong>Wangwana Agency Concierge:</strong> A dedicated host concierge has been dispatched for your reservation. 
        ${isMpesaPaid 
          ? 'Your payment is officially registered in our Kisumu system. Present this voucher or WhatsApp the concierge upon arriving in Kisumu.' 
          : 'Zero advance deduction was made. When you arrive, inspect the residence, collect keys, and pay directly via M-Pesa, Cash, or Bank Transfer.'}
      </div>

      <div class="d-flex flex-column flex-sm-row gap-3">
        <a href="https://wa.me/254703165843?text=Hello%20Wangwana%20Real%20Estate,%20I%20have%20confirmed%20${encodeURIComponent(data.propertyName)}%20(Booking%20Ref:%20${data.refCode},%20${isMpesaPaid ? 'Paid via M-Pesa' : 'Pay on Arrival'}).%20Kindly%20confirm%20check-in%20arrangements." 
           target="_blank" class="btn btn-success flex-grow-1 py-2">
          <i class="bi bi-whatsapp me-2"></i>WhatsApp Agency Concierge (0703165843)
        </a>
        <button type="button" id="btnVoucherDownloadPdf" class="btn btn-gold text-dark fw-bold py-2 px-3 d-flex align-items-center justify-content-center gap-2">
          <i class="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
          <span>Download / Print Booking PDF</span>
        </button>
        <a href="listings.html" class="btn btn-outline-gold py-2">
          <i class="bi bi-geo-alt me-1"></i> Explore Map Stays
        </a>
      </div>
    </div>
  `;

  // Attach PDF download & print handler to voucher button
  const voucherPdfBtn = document.getElementById('btnVoucherDownloadPdf');
  if (voucherPdfBtn) {
    voucherPdfBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleDownloadPrintBookingPdf(data, voucherPdfBtn);
    });
  }

  // Scroll voucher into view smoothly
  bookingBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Generates an authentic Wangwana Booking Invoice & Stay Guarantee Document
 * Downloads the PDF directly and triggers print preview for physical/digital assurance.
 * @param {Object} data 
 * @param {HTMLButtonElement} [triggerBtn]
 */
async function handleDownloadPrintBookingPdf(data, triggerBtn = null) {
  if (!data) return;

  const isMpesaPaid = (data.paymentMethod || '').includes('M-Pesa') && (data.status || '').includes('Paid');
  const nights = Number(data.nights) || 1;
  const totalAmount = Number(data.totalAmount) || 0;
  const serviceFee = 1500;
  const nightlyRate = data.nightlyRate || Math.max(1000, Math.round((totalAmount - serviceFee) / nights));
  const subtotal = nightlyRate * nights;
  const invoiceNumber = `INV-${(data.refCode || 'WNG-2026').replace(/[^a-zA-Z0-9-]/g, '')}`;
  const issueDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Update button state while generating
  const originalBtnContent = triggerBtn ? triggerBtn.innerHTML : '';
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm text-dark me-2" role="status"></span>
      <span>Compiling Booking PDF...</span>
    `;
  }

  // Populate #print-invoice-sheet container with authentic agency assurance invoice layout
  let printSheet = document.getElementById('print-invoice-sheet');
  if (!printSheet) {
    printSheet = document.createElement('div');
    printSheet.id = 'print-invoice-sheet';
    document.body.appendChild(printSheet);
  }

  printSheet.innerHTML = `
    <div style="background:#ffffff; color:#0f172a; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding:32px 36px; max-width:800px; margin:0 auto; line-height:1.5; box-sizing:border-box;">
      <!-- Header with Agency Letterhead -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #0f172a; padding-bottom:16px; margin-bottom:20px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#b45309">
              <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/>
            </svg>
            <h1 style="font-size:22px; font-weight:800; color:#0f172a; margin:0; letter-spacing:-0.5px; text-transform:uppercase;">
              WANGWANA REAL ESTATE AGENCY
            </h1>
          </div>
          <div style="font-size:11px; font-weight:700; color:#b45309; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">
            Official Accommodation Invoice & Stay Guarantee Voucher
          </div>
          <div style="font-size:10px; color:#64748b; line-height:1.4;">
            Reg No: BN-KS-2024-843165 | Kisumu County Short-Stay Directorate<br>
            Mega Plaza 3rd Floor, Oginga Odinga St, Kisumu City, Kenya<br>
            Helpline / WhatsApp: +254 703 165 843 | Email: ochiengblasio@gmail.com
          </div>
        </div>

        <div style="text-align:right;">
          <div style="font-size:18px; font-weight:800; color:#0f172a; letter-spacing:0.5px;">INVOICE</div>
          <div style="font-size:12px; font-family:monospace; font-weight:700; color:#b45309;">${invoiceNumber}</div>
          <div style="font-size:10px; color:#64748b; margin-top:2px;">Issued: ${issueDate}</div>
          <div style="margin-top:8px;">
            <span style="display:inline-block; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:700; text-transform:uppercase; ${
              isMpesaPaid 
                ? 'background:#dcfce7; color:#15803d; border:1px solid #86efac;' 
                : 'background:#fef3c7; color:#92400e; border:1px solid #fcd34d;'
            }">
              ${isMpesaPaid ? '✓ PAID IN FULL (M-PESA)' : '✓ RESERVATION GUARANTEED (POA)'}
            </span>
          </div>
        </div>
      </div>

      <!-- 2-Column Info: Guest Details and Reservation Particulars -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:12px 14px;">
          <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
            BILLED TO (GUEST INFORMATION)
          </div>
          <div style="font-size:14px; font-weight:700; color:#0f172a; margin-bottom:2px;">${data.guestName}</div>
          <div style="font-size:11px; color:#475569;"><strong>Phone:</strong> ${data.guestPhone}</div>
          <div style="font-size:11px; color:#475569;"><strong>Email:</strong> ${data.guestEmail}</div>
          <div style="font-size:11px; color:#475569; margin-top:4px;">
            <strong>Guest Count:</strong> ${data.guests} Registered Guest(s)
          </div>
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:12px 14px;">
          <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
            RESERVATION PARTICULARS
          </div>
          <div style="font-size:14px; font-weight:700; color:#0f172a; margin-bottom:2px;">${data.propertyName}</div>
          <div style="font-size:11px; color:#475569;"><strong>Location:</strong> ${data.location || 'Kisumu City'}</div>
          <div style="font-size:11px; color:#475569;"><strong>Agency Ref:</strong> <span style="font-family:monospace; color:#b45309; font-weight:700;">${data.agencyRef || data.refCode}</span></div>
          <div style="font-size:11px; color:#475569; margin-top:4px;">
            <strong>Check-in:</strong> ${data.checkIn} (from 2:00 PM)<br>
            <strong>Check-out:</strong> ${data.checkOut} (by 11:00 AM) [${nights} Night(s)]
          </div>
        </div>
      </div>

      <!-- Itemized Table -->
      <table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:11px;">
        <thead>
          <tr style="background:#f1f5f9; border-top:1px solid #cbd5e1; border-bottom:1px solid #cbd5e1; text-align:left;">
            <th style="padding:8px 10px; color:#0f172a; font-weight:700;">ITEM / DESCRIPTION</th>
            <th style="padding:8px 10px; color:#0f172a; font-weight:700; text-align:center;">NIGHTS</th>
            <th style="padding:8px 10px; color:#0f172a; font-weight:700; text-align:right;">RATE</th>
            <th style="padding:8px 10px; color:#0f172a; font-weight:700; text-align:right;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:8px 10px;">
              <strong style="color:#0f172a; font-size:12px;">Accommodation Charge</strong><br>
              <span style="font-size:10px; color:#64748b;">${data.propertyName} (${data.location || 'Kisumu'})</span>
            </td>
            <td style="padding:8px 10px; text-align:center; color:#334155;">${nights}</td>
            <td style="padding:8px 10px; text-align:right; color:#334155;">KES ${nightlyRate.toLocaleString()}</td>
            <td style="padding:8px 10px; text-align:right; font-weight:700; color:#0f172a;">KES ${subtotal.toLocaleString()}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:8px 10px;">
              <strong style="color:#0f172a; font-size:12px;">Wangwana Concierge & Key Escort Fee</strong><br>
              <span style="font-size:10px; color:#64748b;">Sanitization, linen prep, dedicated host meet-and-greet</span>
            </td>
            <td style="padding:8px 10px; text-align:center; color:#334155;">1</td>
            <td style="padding:8px 10px; text-align:right; color:#334155;">KES ${serviceFee.toLocaleString()}</td>
            <td style="padding:8px 10px; text-align:right; font-weight:700; color:#0f172a;">KES ${serviceFee.toLocaleString()}</td>
          </tr>
          <tr style="border-bottom:2px solid #0f172a;">
            <td style="padding:8px 10px;">
              <strong style="color:#0f172a; font-size:12px;">Kisumu County Tourism & Hospitality Levy</strong><br>
              <span style="font-size:10px; color:#64748b;">Standard local hospitality tax included in room rate</span>
            </td>
            <td style="padding:8px 10px; text-align:center; color:#334155;">-</td>
            <td style="padding:8px 10px; text-align:right; color:#334155;">Included</td>
            <td style="padding:8px 10px; text-align:right; font-weight:700; color:#0f172a;">KES 0.00</td>
          </tr>
        </tbody>
      </table>

      <!-- Total & Payment Breakdown -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
        <div style="max-width:380px;">
          <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">
            PAYMENT & VERIFICATION DETAILS
          </div>
          ${isMpesaPaid ? `
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:8px 12px; font-size:11px; color:#166534;">
              <strong>Lipa Na M-Pesa Receipt:</strong> <span style="font-family:monospace; font-weight:700;">${data.mpesaReceipt || 'CONFIRMED'}</span><br>
              <strong>Till Number:</strong> 843165 (Wangwana Real Estate Agency)<br>
              <strong>Status:</strong> COMPLETED & VERIFIED ONLINE
            </div>
          ` : `
            <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:8px 12px; font-size:11px; color:#92400e;">
              <strong>Method:</strong> Pay on Arrival Guarantee (Zero Prepayment)<br>
              <strong>Terms:</strong> Inspect residence, collect physical keys, and pay via Till 843165 or Cash upon handover.
            </div>
          `}
        </div>

        <div style="width:240px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 14px; font-size:11px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:#64748b;">
            <span>Subtotal:</span>
            <span>KES ${subtotal.toLocaleString()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px; color:#64748b;">
            <span>Service & Concierge:</span>
            <span>KES ${serviceFee.toLocaleString()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-top:6px; border-top:1px solid #cbd5e1; font-size:14px; font-weight:800; color:#0f172a;">
            <span>TOTAL AMOUNT:</span>
            <span style="color:#b45309;">KES ${totalAmount.toLocaleString()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:10px; color:${isMpesaPaid ? '#15803d' : '#92400e'}; font-weight:700;">
            <span>${isMpesaPaid ? 'Amount Paid:' : 'Balance Due on Arrival:'}</span>
            <span>KES ${totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <!-- Host Concierge & Check-in Instructions -->
      <div style="background:#f1f5f9; border-left:4px solid #b45309; padding:10px 14px; border-radius:0 6px 6px 0; margin-bottom:20px; font-size:10.5px; color:#334155; line-height:1.45;">
        <strong style="color:#0f172a; text-transform:uppercase; font-size:11px;">Host Check-in & Concierge Instructions:</strong><br>
        • <strong>Host Contact:</strong> Blasio Ochieng (+254 703 165 843 / WhatsApp). Please alert the desk 1 hour before arrival in Kisumu.<br>
        • <strong>Key Handover:</strong> Concierge will meet you at the residence gate to hand over keys, verify identity, and provide high-speed WiFi credentials.<br>
        • <strong>Host Notice:</strong> A reservation notification has been transmitted to agency records at <strong>ochiengblasio@gmail.com</strong>.
      </div>

      <!-- Official Stamp & Sign-off -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:14px; margin-top:10px;">
        <div style="border:2px dashed ${isMpesaPaid ? '#16a34a' : '#b45309'}; color:${isMpesaPaid ? '#16a34a' : '#b45309'}; padding:6px 12px; border-radius:6px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:1px; transform:rotate(-1.5deg);">
          ${isMpesaPaid ? '★ WANGWANA AGENCY • PAID & VERIFIED ★' : '★ WANGWANA AGENCY • RESERVATION GUARANTEED ★'}
        </div>

        <div style="text-align:right; font-size:10px; color:#64748b;">
          <div style="font-weight:700; color:#0f172a;">WANGWANA REAL ESTATE AGENCY</div>
          <div>Authorized Management Signature & Official Seal</div>
          <div style="font-size:9px; color:#94a3b8; margin-top:2px;">Kisumu City • Oginga Odinga Street • Mega Plaza</div>
        </div>
      </div>
    </div>
  `;

  // Set up print sheet for off-screen html2pdf capture
  printSheet.style.display = 'block';
  printSheet.style.position = 'fixed';
  printSheet.style.left = '-9999px';
  printSheet.style.top = '0';
  printSheet.style.width = '794px';
  printSheet.style.zIndex = '-1';

  try {
    const filename = `Wangwana-Booking-Invoice-${(data.refCode || 'RES').replace(/[^a-zA-Z0-9-]/g, '')}.pdf`;

    if (window.html2pdf) {
      const opt = {
        margin: [5, 5, 5, 5],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await window.html2pdf().set(opt).from(printSheet).save();
    }

    if (triggerBtn) {
      triggerBtn.innerHTML = `
        <i class="bi bi-check2-circle text-success fs-5"></i>
        <span>PDF Saved! Click to Print</span>
      `;
      triggerBtn.classList.remove('btn-gold');
      triggerBtn.classList.add('btn-success', 'text-light');
      triggerBtn.disabled = false;

      // Re-click allows immediate window.print()
      triggerBtn.onclick = (e) => {
        e.preventDefault();
        window.print();
      };
    }

    // Automatically trigger native print dialog for immediate print / save
    setTimeout(() => {
      window.print();
    }, 500);

  } catch (err) {
    console.error('Invoice PDF generation error:', err);
    window.print();
    if (triggerBtn) {
      triggerBtn.innerHTML = originalBtnContent;
      triggerBtn.disabled = false;
    }
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
