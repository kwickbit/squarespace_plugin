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

// Run initialization when DOM is loaded or defer if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initKwickbit);
} else {
  // DOM already loaded, wait for potential bootstrap data to be ready
  console.log('DOM already loaded, waiting for bootstrap data');
  setTimeout(initKwickbit, 500);
}
