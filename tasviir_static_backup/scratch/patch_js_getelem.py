import os, re, glob

workspace = r"c:/Users/i7-14/Desktop/project codding/website"
js_dir = os.path.join(workspace, "js")

for path in glob.glob(os.path.join(js_dir, "*.js")):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    # Replace document.getElementById with safeGet
    new_content = re.sub(r'document\.getElementById\s*\(', 'safeGet(', content)
    # Also replace document.querySelector('#id') maybe but skip for now
    if new_content != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Patched {os.path.basename(path)}")
else:
    print("All JS files processed.")
