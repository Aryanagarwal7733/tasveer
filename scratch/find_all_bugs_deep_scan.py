import urllib.request
import json
import os
import re

print("==================================================================")
print("[DEEP SCAN] EXHAUSTIVE BUG DETECTOR FOR INDEX.HTML & ADMIN.HTML")
print("==================================================================")

index_html = open("index.html", encoding="utf-8").read()
admin_html = open("admin.html", encoding="utf-8").read()

bugs_found = []

# 1. Check all onclick handlers in index.html and admin.html
for html_name, html_content in [("index.html", index_html), ("admin.html", admin_html)]:
    onclicks = re.findall(r'onclick=["\']([^"\']+)["\']', html_content)
    for oc in onclicks:
        fn_match = re.match(r'^\s*([a-zA-Z0-9_$]+)\s*\(', oc)
        if fn_match:
            fn_name = fn_match.group(1)
            if fn_name in ['if', 'return', 'alert', 'console', 'event', 'preventDefault', 'stopPropagation']:
                continue
            found_in_js = False
            for jsf in ['app.js', 'admin.js', 'cloud-db.js', 'hd-upload.js'] + [os.path.join('js', f) for f in os.listdir('js') if f.endswith('.js')]:
                if os.path.exists(jsf):
                    txt = open(jsf, encoding='utf-8', errors='ignore').read()
                    if f'window.{fn_name}' in txt or f'function {fn_name}' in txt:
                        found_in_js = True
                        break
            if not found_in_js:
                bugs_found.append(f"[{html_name}] Inline onclick function `{fn_name}` is NOT EXPOSED in any JS file!")

# 2. Check all getElementById in JS files that don't exist in HTML
dom_ids_index = set(re.findall(r'id=["\']([^"\']+)["\']', index_html))
dom_ids_admin = set(re.findall(r'id=["\']([^"\']+)["\']', admin_html))
all_dom_ids = dom_ids_index.union(dom_ids_admin)

for jsf in ['app.js', 'admin.js', 'cloud-db.js', 'hd-upload.js'] + [os.path.join('js', f) for f in os.listdir('js') if f.endswith('.js')]:
    if os.path.exists(jsf):
        txt = open(jsf, encoding='utf-8', errors='ignore').read()
        get_ids = re.findall(r'getElementById\(["\']([^"\']+)["\']\)', txt)
        for gid in get_ids:
            if gid not in all_dom_ids:
                bugs_found.append(f"[{jsf}] References DOM ID `{gid}` which does NOT exist in index.html or admin.html!")

# 3. Check for any leftover undefined image URLs or broken placeholders
broken_imgs = re.findall(r'src=["\'](undefined|null|placeholder|\[object Object\])["\']', index_html + admin_html)
if broken_imgs:
    bugs_found.append(f"Found broken image placeholder src: {broken_imgs}")

print(f"\nTOTAL BUGS DETECTED: {len(bugs_found)}")
for idx, b in enumerate(bugs_found, 1):
    print(f"   {idx:>2}. {b}")

if not bugs_found:
    print("ZERO BUGS FOUND IN DEEP SCAN!")
