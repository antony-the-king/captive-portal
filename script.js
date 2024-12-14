// Theme Toggle Functionality
const initializeTheme = () => {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  // Get saved theme or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Optional: Add animation class
    themeToggle.classList.add('theme-toggle-animation');
    setTimeout(() => themeToggle.classList.remove('theme-toggle-animation'), 300);
  });
};

// Add MPESA_NUMBER_REGEX constant
const MPESA_NUMBER_REGEX = /^(?:254|\+254|0)?([17](0|1|2|4|5|6|7|8|9)[0-9]{6})$/;

// Elements object with null checks and debug logging
const elements = {
  packageButtons: document.querySelectorAll('.package-button'),
  mpesaNumberInput: document.getElementById('mpesa-number'),
  paymentForm: document.getElementById('payment-form'),
  paymentMessage: document.getElementById('payment-message'),
  modal: document.getElementById('payment-modal'),
  closeButton: document.querySelector('.close-button'),
  payButton: document.getElementById('pay-button')
};

// Validate elements existence with detailed logging
const validateElements = () => {
  console.log('Validating DOM elements...'); // Debug log
  const missingElements = [];
  
  Object.entries(elements).forEach(([key, element]) => {
    if (!element || (element instanceof NodeList && element.length === 0)) {
      missingElements.push(key);
      console.error(`Missing element: ${key}`); // Detailed error logging
    } else {
      console.log(`Found element: ${key}`); // Success logging
    }
  });
  
  if (missingElements.length > 0) {
    console.error('Critical elements missing:', missingElements);
    return false;
  }
  console.log('All elements validated successfully');
  return true;
};

// State Management
let selectedPackage = {
  price: null
};

// Utility Functions
const formatMpesaNumber = (number) => {
  // Remove any spaces, hyphens or special characters
  let cleaned = number.replace(/\D/g, '');
  
  // Convert to international format if needed
  if (cleaned.length === 9) {
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  }
  
  return cleaned;
};

const displayMessage = (message, isError = false) => {
  elements.paymentMessage.textContent = message;
  elements.paymentMessage.style.backgroundColor = isError ? '#ffebee' : '#e8f5e9';
  elements.paymentMessage.style.color = isError ? '#c62828' : '#2e7d32';
  elements.paymentMessage.style.padding = '1rem';
  elements.paymentMessage.style.borderRadius = '8px';
  elements.paymentMessage.style.marginTop = '1rem';
};

// Enhanced Modal Functions with better error handling and debugging
const openModal = () => {
  console.log('Attempting to open modal...'); // Debug log
  
  if (!elements.modal) {
    console.error('Modal element not found');
    return;
  }
  
  try {
    elements.modal.style.display = 'flex';
    elements.modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Focus on MPESA input when modal opens
    if (elements.mpesaNumberInput) {
      setTimeout(() => {
        elements.mpesaNumberInput.focus();
        console.log('Input field focused'); // Debug log
      }, 100);
    }
    console.log('Modal opened successfully'); // Success log
  } catch (error) {
    console.error('Error opening modal:', error);
  }
};

const closeModal = () => {
  console.log('Attempting to close modal...'); // Debug log
  
  if (!elements.modal) {
    console.error('Modal element not found');
    return;
  }
  
  try {
    elements.modal.style.display = 'none';
    elements.modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Reset form and message with validation
    if (elements.paymentForm) {
      elements.paymentForm.reset();
      console.log('Payment form reset'); // Debug log
    }
    
    if (elements.paymentMessage) {
      elements.paymentMessage.textContent = '';
      console.log('Payment message cleared'); // Debug log
    }
    
    console.log('Modal closed successfully'); // Success log
  } catch (error) {
    console.error('Error closing modal:', error);
  }
};

// Add ripple effect to button
const addRippleEffect = (event) => {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  ripple.classList.add('ripple');
  
  button.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
};

// Loading State Handler
const setLoadingState = (isLoading) => {
  const button = elements.payButton;
  if (!button) return;
  
  button.disabled = isLoading;
  button.innerHTML = isLoading 
    ? '<i class="fas fa-spinner"></i><span>Processing...</span>'
    : '<i class="fas fa-mobile-alt"></i><span>Pay with M-Pesa</span>';
  button.classList.toggle('loading', isLoading);
};

// Package data for validation
const PACKAGE_PRICES = {
  'demo': 2,
  '30min': 5,
  '1hour': 10,
  '3hours': 15,
  '6hours': 30,
  '12hours': 50,
  '24hours': 100,
  '48hours': 150,
  '7days': 300,
  '30days': 1000
};

// Validate package price
const validatePackagePrice = (price) => {
  return Object.values(PACKAGE_PRICES).includes(Number(price));
};

// Enhanced Package Selection Handler with price validation
const handlePackageSelection = (event) => {
  if (!validateElements()) return;
  
  const button = event.currentTarget;
  const price = Number(button.dataset.price);
  
  if (!price || !validatePackagePrice(price)) {
    console.error('Invalid package price:', price);
    displayMessage('Invalid package selected. Please try again.', true);
    return;
  }
  
  elements.packageButtons.forEach(btn => {
    btn.classList.remove('selected');
  });
  
  button.classList.add('selected');
  selectedPackage.price = price;
  openModal();
};

// Enhanced Payment Submission Handler
const handlePaymentSubmission = async (event) => {
  event.preventDefault();
  
  if (!validateElements()) {
    displayMessage('System error. Please try again later.', true);
    return;
  }
  
  const mpesaNumber = elements.mpesaNumberInput.value;
  
  // Validation
  if (!selectedPackage.price || !validatePackagePrice(selectedPackage.price)) {
    displayMessage('Please select a valid package first.', true);
    closeModal();
    return;
  }
  
  if (!MPESA_NUMBER_REGEX.test(mpesaNumber)) {
    displayMessage('Please enter a valid M-PESA number.', true);
    return;
  }
  
  // Show loading state
  setLoadingState(true);
  
  try {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Success message
    displayMessage('Payment request sent! Check your phone for the M-PESA prompt.', false);
    
    // Reset form after successful submission
    setTimeout(() => {
      closeModal();
      elements.paymentForm.reset();
    }, 3000);
  } catch (error) {
    console.error('Payment error:', error);
    displayMessage('Payment processing failed. Please try again.', true);
  } finally {
    setLoadingState(false);
  }
};

// Enhanced initialization with better error handling and event delegation
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Initializing...'); // Debug log
  initializeTheme();
  
  if (!validateElements()) {
    console.error('Critical elements are missing. Modal functionality will not work.');
    return;
  }

  try {
    // Initialize event listeners with error handling
    elements.packageButtons.forEach((button, index) => {
      button.addEventListener('click', (e) => {
        console.log(`Package button ${index + 1} clicked`); // Debug log
        handlePackageSelection(e);
      });
    });

    elements.closeButton.addEventListener('click', (e) => {
      console.log('Close button clicked'); // Debug log
      e.preventDefault();
      closeModal();
    });

    elements.modal.addEventListener('click', (event) => {
      if (event.target === elements.modal) {
        console.log('Modal background clicked'); // Debug log
        closeModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && elements.modal.classList.contains('show')) {
        console.log('Escape key pressed - closing modal'); // Debug log
        closeModal();
      }
    });

    elements.paymentForm.addEventListener('submit', async (e) => {
      console.log('Payment form submitted'); // Debug log
      e.preventDefault();
      setLoadingState(true);
      try {
      await handlePaymentSubmission(e);
      elements.payButton.classList.add('success');
      setTimeout(() => closeModal(), 2000);
      } catch (error) {
      elements.payButton.classList.add('error');
      setTimeout(() => elements.payButton.classList.remove('error'), 2000);
      } finally {
      setLoadingState(false);
      }
    });

    // Add ripple effect to pay button
    if (elements.payButton) {
      elements.payButton.addEventListener('click', addRippleEffect);
    }

    elements.mpesaNumberInput.addEventListener('input', (e) => {
      const isValid = MPESA_NUMBER_REGEX.test(e.target.value);
      e.target.style.borderColor = isValid ? '#4CAF50' : '#ff9800';
      console.log(`M-Pesa number validation: ${isValid ? 'valid' : 'invalid'}`); // Debug log
    });

    console.log('All event listeners initialized successfully'); // Success log
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});
