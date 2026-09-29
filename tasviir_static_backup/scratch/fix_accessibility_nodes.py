import re

def fix_html_accessibility(filepath):
    content = open(filepath, encoding='utf-8').read()
    
    # 1. Fix icon buttons missing aria-label
    def replace_button(match):
        full = match.group(0)
        attrs = match.group(1)
        inner = match.group(2)
        clean_inner = re.sub(r'<[^>]+>', '', inner).strip()
        
        if 'aria-label' in attrs or clean_inner:
            return full
        
        # Determine appropriate aria-label based on onclick or class
        label = "Action Button"
        if 'close' in attrs.lower() or 'fa-times' in inner.lower():
            label = "Close Modal"
        elif 'search' in attrs.lower() or 'fa-search' in inner.lower():
            label = "Search Catalog"
        elif 'user' in attrs.lower() or 'fa-user' in inner.lower():
            label = "User Account Login"
        elif 'theme' in attrs.lower() or 'fa-moon' in inner.lower() or 'fa-sun' in inner.lower():
            label = "Toggle Dark Light Theme"
        elif 'cart' in attrs.lower() or 'fa-shopping-cart' in inner.lower():
            label = "Open Shopping Cart"
        elif 'wishlist' in attrs.lower() or 'fa-heart' in inner.lower():
            label = "View Wishlist"
            
        return f'<button{attrs} aria-label="{label}">{inner}</button>'

    content = re.sub(r'<button([^>]*)>(.*?)</button>', replace_button, content, flags=re.DOTALL)

    # 2. Fix images missing alt attribute
    def replace_img(match):
        full = match.group(0)
        attrs = match.group(1)
        if 'alt=' in attrs:
            return full
        return f'<img{attrs} alt="Tasveer Photo Frame Art Product">'

    content = re.sub(r'<img([^>]*)>', replace_img, content)

    # 3. Fix icon anchor tags <a> missing aria-label or text
    def replace_a(match):
        full = match.group(0)
        attrs = match.group(1)
        inner = match.group(2)
        clean_inner = re.sub(r'<[^>]+>', '', inner).strip()
        if 'aria-label' in attrs or clean_inner:
            return full
        label = "Social Link"
        if 'facebook' in inner.lower() or 'fa-facebook' in inner.lower():
            label = "Facebook Page"
        elif 'instagram' in inner.lower() or 'fa-instagram' in inner.lower():
            label = "Instagram Profile"
        elif 'whatsapp' in inner.lower() or 'fa-whatsapp' in inner.lower():
            label = "Contact on WhatsApp"
        elif 'phone' in inner.lower() or 'fa-phone' in inner.lower():
            label = "Call Store Phone"
        return f'<a{attrs} aria-label="{label}">{inner}</a>'

    content = re.sub(r'<a([^>]*)>(.*?)</a>', replace_a, content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"[OK] Enhanced accessibility (a11y) in {filepath}!")

fix_html_accessibility("index.html")
fix_html_accessibility("admin.html")
