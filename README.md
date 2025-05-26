# KwickBit Squarespace Plugin

This repository contains the code for the KwickBit integration on Squarespace, enabling merchants to accept stablecoin payments directly in their store.

---

## 🧩 What it does

- Injects a **"Pay with crypto"** button into Squarespace’s cart UI
- Gathers cart items and metadata
- Redirects users to KwickBit’s hosted checkout
- Handles post-payment redirects and clears the cart if payment is successful

---

## 🧪 How to Test

You can use the `window.initKwickbit` call in a Squarespace Code Injection (footer):

```html
<script src="https://cdn.jsdelivr.net/npm/@kwickbit/squarespace-plugin@latest/dist/index.min.js"></script>
<script>
  window.initKwickbit.default({
    apiKey: 'your-api-key-here',
    dynamicLinkId: 'your-link-id',
    integrationId: 'your-integration-id',
  });
</script>
```

---

## 🌍 Environment-specific Deployment URLs

When we deploy, we append the environment name to the `version` **except for production**.

| Environment | CDN URL |
|------------|---------|
| `local`    | https://cdn.jsdelivr.net/npm/@kwickbit/squarespace-plugin@local/dist/index.min.js |
| `dev`      | https://cdn.jsdelivr.net/npm/@kwickbit/squarespace-plugin@dev/dist/index.min.js |
| `staging`  | https://cdn.jsdelivr.net/npm/@kwickbit/squarespace-plugin@staging/dist/index.min.js |
| `prod`     | https://cdn.jsdelivr.net/npm/@kwickbit/squarespace-plugin@latest/dist/index.min.js |

> Use the matching tag depending on which backend (local, dev, staging, prod) you want your Squarespace plugin to connect to.
> 🔧 The `local` environment is mapped to `http://localhost:3000`  
> This is useful for testing the plugin with a locally running backend.

---

## 🚀 Deployment & Versioning

### ✅ CI/CD via GitHub Actions

This repo is configured with an **automated publish pipeline**:
- It builds the bundle
- Publishes to **npm** at `@kwickbit/squarespace-plugin`
- Uses a version defined dynamically from CI input

### ⚠️ Important:
> Once a version has been published, **it cannot be published again.**  
> Therefore, **always provide a new `package_version` input** when triggering a new deployment.  
> The CI will handle tagging and publishing under the appropriate npm dist-tag (`local`, `dev`, `staging`, or `latest` for `prod`).

### 📦 npm Packaging Note

> ⚠️ `.npmignore` is **ignored** since `"files"` is defined in `package.json`.

Since we're using:

```json
"files": [
  "dist/",
  "README.md"
]
```

Then `.npmignore` has no effect.  
Better to stick to using field `"files"` in `package.json` than using `.npmignore`.


---

## 📁 Files of Interest

- `src/index.ts`: Main plugin logic
- `dist/index.min.js`: Published CDN bundle
- `README.npm.md`: README shown on npm
- `.github/workflows/`: CI pipeline definition
