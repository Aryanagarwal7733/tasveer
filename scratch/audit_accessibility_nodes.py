import re

content = open("index.html", encoding="utf-8").read()

print("==================================================================")
print("ACCESSIBILITY & LIGHTHOUSE DOM NODE AUDIT")
print("==================================================================")

# Check 1: Buttons without text or aria-label
buttons_without_label = []
for match in re.finditer(r'<button([^>]*)>(.*?)</button>', content, re.DOTALL):
    attrs, inner = match.groups()
    clean_inner = re.sub(r'<[^>]+>', '', inner).strip()
    if not clean_inner and 'aria-label' not in attrs:
        buttons_without_label.append(match.group(0)[:60])

print(f"\n1. Icon Buttons missing `aria-label`: {len(buttons_without_label)}")
for b in buttons_without_label[:10]:
    print(f"   - {b}")

# Check 2: Images missing alt attribute
imgs_without_alt = []
for match in re.finditer(r'<img([^>]*)>', content):
    attrs = match.group(1)
    if 'alt=' not in attrs:
        imgs_without_alt.append(match.group(0)[:60])

print(f"\n2. Images missing `alt` attribute: {len(imgs_without_alt)}")
for img in imgs_without_alt[:10]:
    print(f"   - {img}")

# Check 3: Inputs missing id or aria-label
inputs_without_label = []
for match in re.finditer(r'<input([^>]*)>', content):
    attrs = match.group(1)
    if 'type="hidden"' in attrs or 'type="file"' in attrs:
        continue
    if 'aria-label' not in attrs and 'id=' not in attrs:
        inputs_without_label.append(match.group(0)[:60])

print(f"\n3. Input fields missing `aria-label` or ID: {len(inputs_without_label)}")

print("\n==================================================================")
