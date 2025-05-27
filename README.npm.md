# KwickBit Squarespace Plugin

Accept stablecoin payments on your Squarespace store using KwickBit.

## 🔧 Installation

To enable crypto payments via KwickBit on your Squarespace store:

1. Go to your Squarespace **Config > Pages > Custom Code (bottom of the page) > Code Injection**
2. Paste the following script into the **Header** section:

```html
<script src="https://cdn.jsdelivr.net/npm/@kwickbit/squarespace-plugin@latest/dist/index.min.js"></script>
<script>
  window.initKwickbit.default({
    integrationId: 'your-integration-id',
  });
</script>
```