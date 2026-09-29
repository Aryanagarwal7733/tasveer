import glob, os, re

old_id = "photo-1579783902614-a3fb3927b675"
new_url = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop"

files = glob.glob('js/*.js') + glob.glob('*.js') + glob.glob('*.html') + ['db.json']
replaced_files = []

for fpath in files:
    if os.path.exists(fpath):
        content = open(fpath, encoding='utf-8', errors='ignore').read()
        if old_id in content:
            # Replace any occurrence of the old URL with the new guaranteed working Unsplash image URL
            new_content = re.sub(
                r'https://images\.unsplash\.com/photo-1579783902614-a3fb3927b675[^\'"\s]*',
                new_url,
                content
            )
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            replaced_files.append(fpath)

print(f"[OK] Replaced broken 404 Unsplash ID in {len(replaced_files)} files:")
for rf in replaced_files:
    print(f"   - {rf}")
