/**
 * Kwickbit Squarespace Integration
 */

/**
 * Extract bootstrap data from DOM
 */
function getBootstrapData() {
  try {
    const bootstrapElement = document.getElementById('bootstrap');
    if (!bootstrapElement || !bootstrapElement.textContent) {
      console.error('Bootstrap element not found or empty');
      return null;
    }

    return JSON.parse(bootstrapElement.textContent);
  } catch (error) {
    console.error('Error parsing bootstrap data:', error);
    return null;
  }
}

/**
 * Transform Squarespace cart data to Kwickbit format
 */
function transformCartData(bootstrapData) {
  if (!bootstrapData.shoppingCart?.items || bootstrapData.shoppingCart.items.length === 0) {
    return [];
  }

  return bootstrapData.shoppingCart.items.map(item => {
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

/**
 * Initialize Kwickbit integration
 */
function initKwickbit() {
  console.log('Initializing Kwickbit integration');

  const bootstrapData = getBootstrapData();
  if (!bootstrapData) {
    console.error('Failed to get bootstrap data');
    return;
  }

  const items = transformCartData(bootstrapData);
  console.log('Transformed cart data:', items);

  // Store the transformed items for later use
  window.kwickbitItems = items;
}

/**
 * Insert Kwickbit payment button and change greeting
 */
function insertKwickbitButton() {
  // Change greeting text
  const greetingElement = document.querySelector('p');
  if (greetingElement) {
    greetingElement.textContent = "Salut, chéri";
  }

  // Create Kwickbit payment button
  const button = document.createElement('div');
  button.className = 'kwickbit-button';
  button.innerHTML = `
    <img src="/assets/logo.svg" alt="KwickBit Logo" class="kwickbit-logo">
    <div class="kwickbit-text">
      <div class="kwickbit-primary">Pay with crypto</div>
      <div class="kwickbit-secondary">Powered by KwickBit</div>
    </div>
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

  // Style the logo
  const logo = button.querySelector('.kwickbit-logo');
  logo.style.height = '24px';
  logo.style.marginRight = '10px';

  // Style the text container
  const textDiv = button.querySelector('.kwickbit-text');
  textDiv.style.display = 'flex';
  textDiv.style.flexDirection = 'column';

  // Style primary text
  const primaryText = button.querySelector('.kwickbit-primary');
  primaryText.style.fontWeight = 'bold';
  primaryText.style.fontSize = '16px';

  // Style secondary text
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

  // Insert the button after the greeting
  if (greetingElement && greetingElement.parentNode) {
    greetingElement.parentNode.insertBefore(button, greetingElement.nextSibling);
  }
}

// Initialize and insert button when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initKwickbit();
  insertKwickbitButton();
});
