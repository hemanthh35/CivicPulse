import json

# Load the te.json file
with open('frontend/src/assets/i18n/te.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Update dashboard section
data['dashboard'] = {
    'title': 'డ్యాష్‌బోర్డ్',
    'welcome': 'తిరిగి స్వాగతం',
    'subtitle': 'మీ సమాజాన్ని మెరుగుపరచడం, ఒక నివేదన సమయంలో',
    'overview': 'సమీక్ష',
    'quickActions': 'శీఘ్ర చర్యలు',
    'personalInfo': 'వ్యక్తిగత సమాచారం మరియు భద్రత',
    'fullName': 'పూర్తి పేరు',
    'emailAddress': 'ఇమెయిల్ చిరునామా',
    'mobileNumber': 'మొబైల్ నంబర్',
    'accountType': 'ఖాతా రకం',
    'notProvided': 'అందించలేదు',
    'twoFactorAuth': 'రెండు-అంశ ప్రమాణీకరణ',
    'twoFactorEnabled': 'మెరుగైన భద్రత ప్రారంభించబడింది. లాగిన్ చేస్తున్నప్పుడు మీకు ఇమెయిల్ ద్వారా OTP లభిస్తుంది.',
    'twoFactorDisabled': 'లాగిన్‌లో ఇమెయిల్ ధృవీకరణను ప్రారంభించడం ద్వారా భద్రత యొక్క అదనపు పొరను జోడించండి.',
    'enableTwoFactor': 'రెండు-అంశ ప్రమాణీకరణను ప్రారంభించండి',
    'travelFlag': 'ప్రయాణ ఫ్లాగ్',
    'travelFlagEnabled': 'ప్రారంభించబడింది: మీ ఫిర్యాదులు కార్మికులకు కేటాయించే ముందు నియంత్రించబడతాయి.',
    'travelFlagDisabled': 'ప్రయాణం చేస్తున్నప్పుడు మీ ఫిర్యాదులను ముందుగా అడ్మిన్ ద్వారా సమీక్షించడానికి ప్రారంభించండి.',
    'totalReports': 'మొత్తం నివేదనలు',
    'resolved': 'పరిష్కరించిన',
    'pending': 'పెండింగ్',
    'inProgress': 'ప్రక్రియలో',
    'trackReports': 'మీ నివేదనలను ట్రాక్ చేయండి',
    'reportNewIssue': 'కొత్త సమస్యను నివేదించండి',
    'viewLeaderboard': 'లీడర్‌బోర్డ్ చూడండి',
    'myRewards': 'నా బహుమతులు',
    'allReports': 'మీ అన్ని నివేదనలు',
    'total': 'మొత్తం',
    'loading': 'మీ నివేదనలు లోడ్ చేస్తున్నారు...',
    'noReports': 'ఇంకా నివేదనలు లేవు',
    'noReportsDesc': 'మీ సమాజంలో సమస్యలను నివేదించడం ద్వారా తేడా చేయడం ప్రారంభించండి',
    'createFirstReport': 'మీ మొదటి నివేదనను సృష్టించండి',
    'reported': 'నివేదించబడింది',
    'reportedOn': 'నివేదించబడింది:',
    'id': 'ID:',
    'totalComplaints': 'మొత్తం ఫిర్యాదులు',
    'recentActivity': 'ఇటీవలి కార్యకలాపం',
    'myComplaints': 'నా ఫిర్యాదులు',
    'assignedComplaints': 'కేటాయించిన ఫిర్యాదులు',
    'points': 'పాయింట్‌లు',
    'badges': 'బ్యాడ్జ్‌లు',
    'rating': 'రేటింగ్',
    'performance': 'పనితీరు',
    'resolutionTime': 'సగటు పరిష్కార సమయం',
    'satisfactionRate': 'సంతృప్తి రేటు'
}

# Save the updated file
with open('frontend/src/assets/i18n/te.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('✓ Telugu dashboard translations updated successfully!')
