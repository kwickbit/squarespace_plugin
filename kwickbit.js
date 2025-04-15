(function() {
  let transformedItems = [];
  const ORDER_UUID = "8c86687b-32d5-4c00-9a63-4d1c08cfbab3";

  // Add CSS styles
  const style = document.createElement('style');
  style.textContent = `
    .kwickbit-button {
      display: flex;
      align-items: center;
      padding: 10px 20px;
      background: #4A56FF;
      color: white;
      border-radius: 4px;
      margin: 20px 0;
      cursor: pointer;
      width: fit-content;
    }

    .kwickbit-button:hover {
      background: #3A46EF;
    }

    .kwickbit-logo {
      height: 24px;
      margin-right: 10px;
    }

    .kwickbit-text {
      display: flex;
      flex-direction: column;
    }

    .kwickbit-primary {
      font-weight: bold;
      font-size: 16px;
    }

    .kwickbit-secondary {
      font-size: 12px;
      opacity: 0.8;
    }

    .kwickbit-overlay {
      position: fixed;
      top: 25px;
      left: 25px;
      right: 25px;
      bottom: 25px;
      background-color: rgba(240, 240, 240, 0.85);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: all;
    }

    .kwickbit-overlay.visible {
      opacity: 1;
    }

    .kwickbit-overlay-message {
      font-size: 20px;
      color: #444;
      margin-bottom: 15px;
      font-weight: 500;
    }

    .kwickbit-overlay-subtext {
      font-size: 15px;
      color: #666;
      margin-bottom: 20px;
    }

    .kwickbit-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(74, 86, 255, 0.2);
      border-radius: 50%;
      border-top-color: #4A56FF;
      animation: kwickbit-spin 1s linear infinite;
    }

    @keyframes kwickbit-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  function showProcessingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'kwickbit-overlay';
    overlay.id = 'kwickbit-processing-overlay';

    const message = document.createElement('div');
    message.className = 'kwickbit-overlay-message';
    message.textContent = 'Processing your order...';

    const subtext = document.createElement('div');
    subtext.className = 'kwickbit-overlay-subtext';
    subtext.textContent = 'You\'ll be redirected to your confirmation shortly';

    const spinner = document.createElement('div');
    spinner.className = 'kwickbit-spinner';

    overlay.appendChild(message);
    overlay.appendChild(subtext);
    overlay.appendChild(spinner);

    document.body.appendChild(overlay);

    // Force reflow before adding visible class for transition
    overlay.offsetHeight;
    overlay.classList.add('visible');

    return overlay;
  }

  function checkForSuccessParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('kb_payment') === 'success') {
      // Show overlay first
      const overlay = showProcessingOverlay();

      // Remove the parameter from URL to prevent multiple clears
      history.replaceState(null, '', window.location.pathname);

      // Clear cart then redirect to order confirmation
      clearCartViaAPI(0, 10, () => {
        const domain = window.location.origin;
        window.location.href = `${domain}/commerce/orders/${ORDER_UUID}`;
      });
    }
  }

  function transformCartData(cartData) {
    if (!cartData?.items || cartData.items.length === 0) {
      return [];
    }

    return cartData.items.map(item => {
      const imageUrl = item.image?.url || item.image?.urls?.https;

      return {
        name: item.productName || 'Unknown Product',
        quantity: item.quantity || 1,
        price: item.unitPrice?.value || 0,
        currency: item.unitPrice?.currencyCode || 'EUR',
        ...(imageUrl && { image_url: imageUrl })
      };
    });
  }

  function extractCartData() {
    const cartRoot = document.getElementById('sqs-cart-root');
    if (!cartRoot) return;

    const scriptEl = cartRoot.querySelector('script[type="application/json"]');
    if (!scriptEl) return;

    try {
      const cartData = JSON.parse(scriptEl.textContent);
      const cart = cartData.cart;

      transformedItems = transformCartData(cart);

      return cartData;
    } catch (e) {
      console.error('Parse error:', e);
      return null;
    }
  }

  function clearCartViaAPI(retryCount = 0, maxRetries = 10, onComplete = null) {
    // Find all remove buttons in the cart
    const removeButtons = document.querySelectorAll('button.cart-row-remove');

    if (!removeButtons || removeButtons.length === 0) {
      if (retryCount < maxRetries) {
        setTimeout(() => clearCartViaAPI(retryCount + 1, maxRetries, onComplete), 500);
        return false;
      } else {
        // Execute callback even if no items found or all retries exhausted
        if (onComplete && typeof onComplete === 'function') {
          onComplete();
        }
        return false;
      }
    }

    // Click each remove button with a slight delay between clicks
    function clickButtonsSequentially(index) {
      if (index >= removeButtons.length) {
        // All buttons clicked, run callback if provided
        if (onComplete && typeof onComplete === 'function') {
          onComplete();
        } else {
          window.location.reload();
        }
        return;
      }

      // Click the button
      removeButtons[index].click();

      // Wait for DOM update before clicking next button
      setTimeout(() => {
        clickButtonsSequentially(index + 1);
      }, 300);
    }

    // Start the sequential clicking process
    clickButtonsSequentially(0);
    return true;
  }

  function sendCheckoutRequest() {
    // Create form element
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'http://localhost:3000/checkout/squarespace';
    form.target = '_blank'; // Open in new tab

    // Create hidden input for items
    const itemsInput = document.createElement('input');
    itemsInput.type = 'hidden';
    itemsInput.name = 'items';
    itemsInput.value = JSON.stringify(transformedItems);
    form.appendChild(itemsInput);

    // Create hidden input for API key
    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'hidden';
    apiKeyInput.name = 'apiKey';
    apiKeyInput.value = 'b5384e0f-bb6e-491e-add4-379517618ce7';
    form.appendChild(apiKeyInput);

    // Success URL with parameter - uses current page
    const successUrlInput = document.createElement('input');
    successUrlInput.type = 'hidden';
    successUrlInput.name = 'callbackSuccessUrl';
    successUrlInput.value = `${window.location.href.split('?')[0]}?kb_payment=success`;
    form.appendChild(successUrlInput);

    // Failed URL - uses current page
    const failedUrlInput = document.createElement('input');
    failedUrlInput.type = 'hidden';
    failedUrlInput.name = 'callbackFailedUrl';
    failedUrlInput.value = window.location.href.split('?')[0];
    form.appendChild(failedUrlInput);

    // Dynamic link ID
    const dynamicLinkIdInput = document.createElement('input');
    dynamicLinkIdInput.type = 'hidden';
    dynamicLinkIdInput.name = 'dynamicLinkId';
    dynamicLinkIdInput.value = 'd54bd850-f4d9-440d-bb2e-960771b86c25';
    form.appendChild(dynamicLinkIdInput);

    // Form details
    const formDetailsInput = document.createElement('input');
    formDetailsInput.type = 'hidden';
    formDetailsInput.name = 'formDetails';
    formDetailsInput.value = JSON.stringify({});
    form.appendChild(formDetailsInput);

    // Submit form
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  function insertSimpleElement() {
    const cartSummary = document.querySelector('.cart-summary');
    if (!cartSummary) {
      setTimeout(insertSimpleElement, 500);
      return;
    }
    // Create Kwickbit payment button
    const button = document.createElement('div');
    button.className = 'kwickbit-button';
    button.innerHTML = `
      <div class="kwickbit-text">
        <div class="kwickbit-primary">Pay with crypto</div>
        <div class="kwickbit-secondary">Powered by KwickBit</div>
      </div>
      <img src="https://kwickbit.com/storage/2023/10/Kwickbit_logo.svg" alt="KwickBit Logo" class="kwickbit-logo">
    `;

    button.addEventListener('click', sendCheckoutRequest);
    cartSummary.appendChild(button);
  }

  function initialize() {
    checkForSuccessParameter();
    extractCartData();
    insertSimpleElement();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();