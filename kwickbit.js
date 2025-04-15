(function() {
  let transformedItems = [];

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
  `;
  document.head.appendChild(style);

  function checkForSuccessParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('kb_payment') === 'success') {
      clearCartViaAPI();
      // Remove the parameter from URL to prevent multiple clears
      history.replaceState(null, '', window.location.pathname);
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

  function clearCartViaAPI(retryCount = 0, maxRetries = 10) {
    // Find all remove buttons in the cart
    const removeButtons = document.querySelectorAll('button.cart-row-remove');

    if (!removeButtons || removeButtons.length === 0) {
      if (retryCount < maxRetries) {
        setTimeout(() => clearCartViaAPI(retryCount + 1, maxRetries), 500);
        return false;
      } else {
        return false;
      }
    }

    // Click each remove button with a slight delay between clicks
    function clickButtonsSequentially(index) {
      if (index >= removeButtons.length) {
        window.location.reload();
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