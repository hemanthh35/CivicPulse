import json

# Load te.json
with open('frontend/src/assets/i18n/te.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Add new nav keys to Telugu
new_nav_keys = {
    "reportIssue": "సమస్యను నివేదించండి",
    "rewards": "పురస్కారాలు",
    "assignedIssues": "నియమించిన సమస్యలు"
}

# Update nav section
for key, value in new_nav_keys.items():
    data["nav"][key] = value

# Save back
with open('frontend/src/assets/i18n/te.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✓ Telugu navbar translations updated!")
