import css from './index.css';

function injectCss(css: string): void {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

injectCss(css);

export interface KwickBitConfig {
    integrationId: string;
}

class KwickBitSquarespace {
    config: KwickBitConfig;
    rawCartData: any;
    baseUrl: string = process.env.NUXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000';

    constructor(config: KwickBitConfig = {} as KwickBitConfig) {
        this.rawCartData = null;
        this.config = config;
    }

    initialize(): void {
        this.checkForSuccessParameter();
        this.extractCartData();
        this.insertPaymentButton();
    }

    showProcessingOverlay(): HTMLDivElement {
        const overlay = document.createElement('div');
        overlay.className = 'kwickbit-overlay';
        overlay.id = 'kwickbit-processing-overlay';
        overlay.innerHTML = `
      <div class="kwickbit-overlay-message">Processing your order...</div>
      <div class="kwickbit-overlay-subtext">You should receive an order confirmation email shortly</div>
      <div class="kwickbit-spinner"></div>
    `;
        document.body.appendChild(overlay);
        overlay.offsetHeight;
        overlay.classList.add('visible');
        return overlay;
    }

    checkForSuccessParameter(): void {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('kb_payment') === 'success') {
            this.showProcessingOverlay();
            history.replaceState(null, '', window.location.pathname);
            this.clearCart(0, 10, () => {
                window.location.href = window.location.origin;
            });
        }
    }

    extractCartData(): any {
        const cartRoot = document.getElementById('sqs-cart-root');
        if (!cartRoot) return null;
        const scriptElement = cartRoot.querySelector('script[type="application/json"]');
        if (!scriptElement?.textContent) return null;

        try {
            this.rawCartData = JSON.parse(scriptElement?.textContent);
            return this.rawCartData;
        } catch (e) {
            console.error('Parse error:', e);
            return null;
        }
    }

    clearCart(retryCount = 0, maxRetries = 10, onComplete: (() => void) | null = null): boolean {
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

        const clickNext = (index: number) => {
            if (index >= removeButtons.length) {
                if (onComplete) onComplete();
                else window.location.reload();
                return;
            }
            (removeButtons[index] as HTMLButtonElement).click();
            setTimeout(() => clickNext(index + 1), 300);
        };

        clickNext(0);
        return true;
    }

    sendCheckoutRequest(): void {
        if (!this.rawCartData) return console.error('Missing cart data');

        this.updateQuantitiesFromDOM();

        const mappedItems = this.rawCartData.cart.items.map((item: any) => ({
            currency: item.unitPrice.currencyCode,
            image_url: item.image?.url,
            name: item.productName,
            price: Number(item.unitPrice.decimalValue),
            quantity: item.quantity
        }));

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `${this.baseUrl}/checkout/squarespace`;

        const formFields = {
            'callbackFailedUrl': window.location.href.split('?')[0],
            'callbackSuccessUrl': `${window.location.href.split('?')[0]}?kb_payment=success`,
            'ecommerceMetadata': JSON.stringify(this.rawCartData),
            'integrationId': this.config.integrationId,
            'items': JSON.stringify(mappedItems),
        };

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

    updateQuantitiesFromDOM(): void {
        if (!this.rawCartData?.cart?.items) return;

        this.rawCartData.cart.items = this.rawCartData.cart.items.filter((item: any) => {
            const input = document.querySelector(`input[aria-label*="${item.productName}"]`) as HTMLInputElement;
            if (!input) return false; // Item removed from cart

            const newQuantity = parseInt(input.value);
            item.quantity = newQuantity;
            item.itemTotal = {
                ...item.itemTotal,
                value: item.unitPrice.value * newQuantity,
                decimalValue: (item.unitPrice.value * newQuantity / Math.pow(10, item.unitPrice.fractionalDigits)).toFixed(item.unitPrice.fractionalDigits)
            };
            return true;
        });
    }

    insertPaymentButton(): void {
        const checkForCartSummary = () => {
            const cartSummary = document.querySelector('.cart-summary');
            if (!cartSummary) return setTimeout(checkForCartSummary, 500);

            const button = document.createElement('div');
            button.className = 'kwickbit-button';
            button.innerHTML = `
        <div class="kwickbit-text">
          <div class="kwickbit-primary">Pay with crypto</div>
          <div class="kwickbit-secondary">Powered by KwickBit</div>
        </div>
        <img src="https://kwickbit.com/storage/2023/10/Kwickbit_logo.svg" alt="KwickBit Logo" class="kwickbit-logo">
      `;

            button.addEventListener('click', () => this.sendCheckoutRequest());
            cartSummary.appendChild(button);
        };

        checkForCartSummary();
    }
}

export default function initKwickBit (config: KwickBitConfig) {
    const kwickbit = new KwickBitSquarespace(config);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => kwickbit.initialize());
    } else {
        kwickbit.initialize();
    }
    return kwickbit;
};
