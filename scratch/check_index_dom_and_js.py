import urllib.request
import re

def main():
    try:
        html = urllib.request.urlopen('http://127.0.0.1:8085/index.html').read().decode('utf-8')
        html_ids = set(re.findall(r'id=["\']([^"\']+)["\']', html))
        print(f"Total DOM IDs in index.html: {len(html_ids)}")

        critical_ids = [
            'product-details-overlay',
            'product-details-drawer',
            'cart-drawer-overlay',
            'checkout-drawer-overlay',
            'cart-items-body',
            'cart-items-list',
            'chk-order-summary-list',
            'chk-subtotal-val',
            'chk-total-val',
            'chk-cust-name',
            'chk-cust-phone',
            'chk-cust-address',
            'chk-cust-pincode',
            'drawer-prod-title',
            'drawer-photo-preview',
            'drawer-final-price'
        ]

        for cid in critical_ids:
            present = cid in html_ids
            status = "FOUND [OK]" if present else "MISSING [FAIL]"
            print(f"DOM ID [{cid:<25}]: {status}")

    except Exception as e:
        print(f"Error checking index.html: {e}")

if __name__ == '__main__':
    main()
