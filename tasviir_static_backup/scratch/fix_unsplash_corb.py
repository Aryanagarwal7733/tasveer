import json

db_path = "db.json"
with open(db_path, "r", encoding="utf-8") as f:
    db = json.load(f)

count = 0
products = db.get("products", [])
for p in products:
    img = p.get("image", "")
    if "unsplash.com" in img:
        if "?w=" in img and "&auto=format" not in img:
            base = img.split("?")[0]
            p["image"] = f"{base}?w=600&auto=format&fit=crop"
            count += 1
        elif "?" not in img:
            p["image"] = f"{img}?w=600&auto=format&fit=crop"
            count += 1

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(db, f, ensure_ascii=False, indent=2)

print(f"[OK] Updated {count} Unsplash image URLs in db.json for CORB compliance!")
