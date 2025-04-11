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
      console.log('Transformed items:', transformedItems);

      return cart;
    } catch (e) {
      console.error('Parse error:', e);
      return null;
    }
  }

  function sendCheckoutRequest() {
    // Create form element
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'http://localhost:3000/squarespace-checkout';
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

    // Success URL
    const successUrlInput = document.createElement('input');
    successUrlInput.type = 'hidden';
    successUrlInput.name = 'callbackSuccessUrl';
    successUrlInput.value = 'https://example.com/success';
    form.appendChild(successUrlInput);

    // Failed URL
    const failedUrlInput = document.createElement('input');
    failedUrlInput.type = 'hidden';
    failedUrlInput.name = 'callbackFailedUrl';
    failedUrlInput.value = 'https://example.com/failed';
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
    extractCartData();
    insertSimpleElement();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
