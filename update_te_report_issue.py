import json

# Read the Telugu JSON file
with open('frontend/src/assets/i18n/te.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Add report issue translations to complaints section
new_keys = {
    "reportCivicIssue": "పౌర సమస్యను నివేదించండి",
    "helpImprove": "సమస్యలను నివేదించడం ద్వారా మీ సమాజాన్ని మెరుగుపరచడానికి మాకు సహాయం చేయండి",
    "issueDetails": "సమస్య వివరాలు",
    "issueTitlePlaceholder": "సమస్య కోసం సంక్షిప్త శీర్షికను నమోదు చేయండి",
    "selectCategory": "వర్గాన్ని ఎంచుకోండి",
    "detailedDescription": "సమస్య యొక్క వివరణాత్మక వివరణను అందించండి",
    "addPhotos": "ఫోటోలను జోడించండి",
    "noFileChosen": "ఫైల్ ఎంచుకోలేదు",
    "takePhoto": "ఫోటో తీయండి",
    "uploadImages": "చిత్రాలను అప్‌లోడ్ చేయండి",
    "photosTip": "మీరు 5 వరకు ఫోటోలను జోడించవచ్చు (JPG, PNG)",
    "locationDetails": "స్థాన వివరాలు",
    "useGPS": "GPS ఉపయోగించండి",
    "locationTip": "చిట్కా: మీ స్థానాన్ని స్వయంచాలకంగా పూరించడానికి \"GPS ఉపయోగించండి\" క్లిక్ చేయండి",
    "streetAddress": "వీధి చిరునామా",
    "streetAddressPlaceholder": "వీధి చిరునామా లేదా ల్యాండ్‌మార్క్",
    "city": "నగరం",
    "state": "రాష్ట్రం",
    "pinCode": "పిన్ కోడ్",
    "pinCodePlaceholder": "6-అంకెలు",
    "findOnMap": "మ్యాప్‌లో కనుగొనండి",
    "submitReport": "నివేదికను సమర్పించండి",
    "required": "అవసరం"
}

# Add new keys to complaints section
for key, value in new_keys.items():
    data['complaints'][key] = value

# Write back to file
with open('frontend/src/assets/i18n/te.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✓ Telugu report issue translations added successfully!")
