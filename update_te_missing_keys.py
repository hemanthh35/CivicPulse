import json

# Load te.json
with open('frontend/src/assets/i18n/te.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Add missing keys to complaints section
new_keys = {
    "issueTitle": "సమస్య శీర్షిక",
    "category": "వర్గం",
    "description": "వివరణ",
    "priority": "ప్రాధాన్యత",
    "low": "తక్కువ",
    "medium": "మధ్యస్థ",
    "high": "అధిక"
}

# Update complaints section
for key, value in new_keys.items():
    data["complaints"][key] = value

# Save back
with open('frontend/src/assets/i18n/te.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Telugu translation keys added successfully!")
