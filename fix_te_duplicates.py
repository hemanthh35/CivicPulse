import json

# Load te.json
with open('frontend/src/assets/i18n/te.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Remove the duplicate keys we added
keys_to_remove = ['priority', 'low', 'medium', 'high']

for key in keys_to_remove:
    if key in data["complaints"]:
        del data["complaints"][key]

# Save back
with open('frontend/src/assets/i18n/te.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✓ Removed duplicate Telugu keys successfully!")
