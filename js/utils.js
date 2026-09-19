// Utility functions for Wangwana Airbnb

// Centralized contact numbers for Wangwana Kisumu
export const CONTACT_PHONE = '0703165843';
export const CONTACT_PHONE_INTL = '+254703165843';
export const WHATSAPP_PHONE = '254703165843';

/**
 * Initializes date constraints ensuring check-in is today or later,
 * and check-out is strictly after check-in.
 */
export function initDateConstraints() {
  const today = new Date().toISOString().split('T')[0];

  const checkInInputs = document.querySelectorAll('input[type="date"][id*="checkIn"], input[type="date"][id*="CheckIn"]');
  const checkOutInputs = document.querySelectorAll('input[type="date"][id*="checkOut"], input[type="date"][id*="CheckOut"]');

  checkInInputs.forEach(inInput => {
    inInput.min = today;
    if (!inInput.value) {
      // Default to tomorrow
      const d = new Date();
      d.setDate(d.getDate() + 1);
      inInput.value = d.toISOString().split('T')[0];
    }
  });

  checkOutInputs.forEach(outInput => {
    // Default to day after tomorrow
    if (!outInput.value) {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      outInput.value = d.toISOString().split('T')[0];
    }
  });

  // Wire up change events
  checkInInputs.forEach(inInput => {
    inInput.addEventListener('change', () => {
      checkOutInputs.forEach(outInput => {
        outInput.min = inInput.value;
        if (outInput.value && outInput.value <= inInput.value) {
          const nextDay = new Date(inInput.value);
          nextDay.setDate(nextDay.getDate() + 1);
          outInput.value = nextDay.toISOString().split('T')[0];
        }
        // Trigger change event if listeners exist
        outInput.dispatchEvent(new Event('input'));
      });
    });
  });
}

/**
 * Enhanced form validation and submit handler
 * @param {string} formId
 * @param {Function} onSubmitSuccess
 */
export function setupFormValidation(formId, onSubmitSuccess) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add('was-validated');
      return;
    }

    if (typeof onSubmitSuccess === 'function') {
      onSubmitSuccess(form);
    } else {
      const existingAlert = form.querySelector('.form-alert');
      if (existingAlert) existingAlert.remove();

      const alertDiv = document.createElement('div');
      alertDiv.className = 'alert alert-success mt-3 form-alert';
      alertDiv.setAttribute('role', 'alert');
      alertDiv.textContent = 'Thank you! Your submission has been received.';
      form.appendChild(alertDiv);
      form.reset();
    }
  });
}

// Backward compatibility exports
export const initDatePicker = initDateConstraints;
export const validateForm = setupFormValidation;

/**
 * Calculates number of nights between two date strings
 * @param {string} checkInStr
 * @param {string} checkOutStr
 * @returns {number}
 */
export function calculateNights(checkInStr, checkOutStr) {
  if (!checkInStr || !checkOutStr) return 1;
  const start = new Date(checkInStr);
  const end = new Date(checkOutStr);
  const diffTime = end.getTime() - start.getTime();
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 1;
}
