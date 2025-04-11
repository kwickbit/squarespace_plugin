(function() {
  let transformedItems = [];

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
    const payload = {
      items: transformedItems,
      callbackSuccessUrl: 'https://example.com/success',
      callbackFailedUrl: 'https://example.com/failed',
      formDetails: {},
      dynamicLinkId: 'd54bd850-f4d9-440d-bb2e-960771b86c25'
    };

    fetch('http://localhost:3000/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'b5384e0f-bb6e-491e-add4-379517618ce7'
      },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Checkout response:', data);
      if (data.url) {
        window.location.href = data.url;
      }
    })
    .catch(error => console.error('Checkout error:', error));
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

// Style the button
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.padding = '10px 20px';
    button.style.background = '#4A56FF';
    button.style.color = 'white';
    button.style.borderRadius = '4px';
    button.style.margin = '20px 0';
    button.style.cursor = 'pointer';
    button.style.width = 'fit-content';

    // Style logo and text
    const logo = button.querySelector('.kwickbit-logo');
    logo.style.height = '24px';
    logo.style.marginRight = '10px';

    const textDiv = button.querySelector('.kwickbit-text');
    textDiv.style.display = 'flex';
    textDiv.style.flexDirection = 'column';

    const primaryText = button.querySelector('.kwickbit-primary');
    primaryText.style.fontWeight = 'bold';
    primaryText.style.fontSize = '16px';

    const secondaryText = button.querySelector('.kwickbit-secondary');
    secondaryText.style.fontSize = '12px';
    secondaryText.style.opacity = '0.8';

    // Add hover effect
    button.addEventListener('mouseover', function() {
      this.style.background = '#3A46EF';
    });
    button.addEventListener('mouseout', function() {
      this.style.background = '#4A56FF';
    });

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
