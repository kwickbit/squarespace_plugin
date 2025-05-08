(function() {
  // Load CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/gh/kwickbit/squarespace_plugin@main/kwickbit.css';
  document.head.appendChild(link);

  // Default configuration
  const defaultConfig = {
    apiKey: '',
    dynamicLinkId: '',
    baseUrl: 'http://localhost:3000',
    buttonText: 'Pay with crypto',
    buttonSubtext: 'Powered by KwickBit'
  };

  class KwickbitSquarespace {
    constructor(config = {}) {
      this.config = { ...defaultConfig, ...config };
      this.rawCartData = null;
    }

    initialize() {
      this.checkForSuccessParameter();
      this.extractCartData();
      this.insertPaymentButton();
    }

    showProcessingOverlay() {
      const overlay = document.createElement('div');
      overlay.className = 'kwickbit-overlay';
      overlay.id = 'kwickbit-processing-overlay';

      overlay.innerHTML = `
        <div class="kwickbit-overlay-message">Processing your order...</div>
        <div class="kwickbit-overlay-subtext">You should receive an order confirmation email shortly</div>
        <div class="kwickbit-spinner"></div>
      `;

      document.body.appendChild(overlay);
      overlay.offsetHeight; // Force reflow
      overlay.classList.add('visible');

      return overlay;
    }

    checkForSuccessParameter() {
      const urlParams = new URLSearchParams(window.location.search);

      if (urlParams.get('kb_payment') === 'success') {
        this.showProcessingOverlay();
        history.replaceState(null, '', window.location.pathname);

        this.clearCart(0, 10, () => {
          window.location.href = window.location.origin;
        });
      }
    }

    extractCartData() {
      const cartRoot = document.getElementById('sqs-cart-root');
      if (!cartRoot) return null;

      const scriptElement = cartRoot.querySelector('script[type="application/json"]');
      if (!scriptElement) return null;

      try {
        this.rawCartData = JSON.parse(scriptElement.textContent);
        return this.rawCartData;
      } catch (e) {
        console.error('Parse error:', e);
        return null;
      }
    }

    clearCart(retryCount = 0, maxRetries = 10, onComplete = null) {
      const removeButtons = document.querySelectorAll('button.cart-row-remove');

      if (!removeButtons || removeButtons.length === 0) {
        if (retryCount < maxRetries) {
          setTimeout(() => this.clearCart(retryCount + 1, maxRetries, onComplete), 500);
          return false;
        } else {
          if (onComplete) onComplete();
          return false;
        }
      }

      // Click buttons sequentially
      const clickNext = (index) => {
        if (index >= removeButtons.length) {
          if (onComplete) onComplete();
          else window.location.reload();
          return;
        }
        removeButtons[index].click();
        setTimeout(() => clickNext(index + 1), 300);
      };

      clickNext(0);

      return true;
    }

    sendCheckoutRequest() {
      if (!this.rawCartData) {
        console.error('No cart data available');
        return;
      }

      if (!this.config.apiKey || !this.config.dynamicLinkId) {
        console.error('Missing required configuration: apiKey or dynamicLinkId');
        return;
      }

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${this.config.baseUrl}/checkout/squarespace`;

      const formFields = {
        'ecommerceMetadata': JSON.stringify(this.rawCartData),
        'apiKey': this.config.apiKey,
        'callbackSuccessUrl': `${window.location.href.split('?')[0]}?kb_payment=success`,
        'callbackFailedUrl': window.location.href.split('?')[0],
        'dynamicLinkId': this.config.dynamicLinkId,
        'formDetails': JSON.stringify({})
      };

      // Add all form fields
      Object.entries(formFields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    }

    insertPaymentButton() {
      const checkForCartSummary = () => {
        const cartSummary = document.querySelector('.cart-summary');

        if (!cartSummary) {
          setTimeout(checkForCartSummary, 500);
          return;
        }

        // Create payment button
        const button = document.createElement('div');
        button.className = 'kwickbit-button';
        button.innerHTML = `
          <div class="kwickbit-text">
            <div class="kwickbit-primary">${this.config.buttonText}</div>
            <div class="kwickbit-secondary">${this.config.buttonSubtext}</div>
          </div>
          <img src="https://kwickbit.com/storage/2023/10/Kwickbit_logo.svg" alt="KwickBit Logo" class="kwickbit-logo">
        `;

        button.addEventListener('click', () => this.sendCheckoutRequest());
        cartSummary.appendChild(button);
      };

      checkForCartSummary();
    }
  }

  // Export global initialization function
  window.initKwickbit = function(config) {
    const kwickbit = new KwickbitSquarespace(config);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => kwickbit.initialize());
    } else {
      kwickbit.initialize();
    }

    return kwickbit;
  };
})();
