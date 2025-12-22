# CivicPulse Multi-Language Implementation Guide

## Overview
Your website now supports three languages:
- **English** (Default) - en
- **Hindi** - hi  
- **Telugu** - te

All translation files are located in: `frontend/src/assets/i18n/`

---

## How to Use Translations in Components

### 1. **In HTML Templates (Using Translation Pipe)**

Simply replace hardcoded text with the `translate` pipe:

```html
<!-- OLD -->
<h1>Report Issue</h1>

<!-- NEW -->
<h1>{{ 'complaints.reportIssue' | translate }}</h1>
```

### 2. **In TypeScript Components (Using TranslateService)**

```typescript
import { TranslateService } from '@ngx-translate/core';

constructor(private translate: TranslateService) {}

getMessage() {
  this.translate.get('complaints.successCreate').subscribe((res: string) => {
    console.log(res); // Shows translated message
  });
}
```

### 3. **Language Switcher (Already in app.component)**

```typescript
changeLanguage(language: string): void {
  this.currentLanguage = language;
  this.translate.use(language);
  localStorage.setItem('language', language);
}

// Available languages
languages = ['en', 'hi', 'te'];
```

---

## Translation File Structure

All translations follow this nested structure in JSON:

```json
{
  "section": {
    "key": "value"
  }
}
```

**Example:**
```json
{
  "complaints": {
    "reportIssue": "Report Issue",
    "title": "Complaints",
    "myComplaints": "My Complaints"
  }
}
```

---

## Key Translation Sections

1. **app** - App name, title, tagline
2. **nav** - Navigation menu items
3. **auth** - Login, Register, Authentication
4. **home** - Home page content
5. **dashboard** - Dashboard labels
6. **complaints** - Complaint management
7. **worker** - Worker dashboard
8. **admin** - Admin panel
9. **moderation** - Moderation panel
10. **rewards** - Rewards and badges
11. **leaderboard** - Leaderboard
12. **profile** - User profile
13. **common** - Common UI elements (Yes, No, Save, Cancel, etc.)
14. **messages** - Success/Error messages
15. **footer** - Footer content

---

## Migration Checklist

### Phase 1: Navigation & Headers
- [ ] Replace all navigation labels with translation keys
- [ ] Update header titles
- [ ] Update page subtitles

### Phase 2: Forms & Inputs
- [ ] Form labels (Email, Password, Name, etc.)
- [ ] Placeholder texts
- [ ] Button labels (Submit, Cancel, Save, Delete, etc.)
- [ ] Form validation messages

### Phase 3: Data Display
- [ ] Table headers
- [ ] Status labels (Pending, Resolved, In Progress, etc.)
- [ ] Badge names
- [ ] Card titles and descriptions

### Phase 4: Modals & Alerts
- [ ] Modal titles and descriptions
- [ ] Confirmation messages
- [ ] Success/Error alerts
- [ ] Warning messages

### Phase 5: Dynamic Messages
- [ ] Success messages
- [ ] Error messages
- [ ] Loading messages
- [ ] Empty state messages

---

## Example: Converting a Component

### BEFORE (Hardcoded Text)
```html
<div class="complaints-container">
  <h1>My Complaints</h1>
  <button class="btn btn-primary">Report Issue</button>
  
  <div *ngIf="complaints.length === 0">
    <p>No complaints found</p>
  </div>
  
  <div *ngFor="let complaint of complaints">
    <h3>{{ complaint.title }}</h3>
    <p>Status: {{ complaint.status }}</p>
    <button>View</button>
    <button>Edit</button>
    <button>Delete</button>
  </div>
</div>
```

### AFTER (With Translations)
```html
<div class="complaints-container">
  <h1>{{ 'complaints.myComplaints' | translate }}</h1>
  <button class="btn btn-primary">{{ 'complaints.reportIssue' | translate }}</button>
  
  <div *ngIf="complaints.length === 0">
    <p>{{ 'complaints.noComplaints' | translate }}</p>
  </div>
  
  <div *ngFor="let complaint of complaints">
    <h3>{{ complaint.title }}</h3>
    <p>{{ 'common.status' | translate }}: {{ complaint.status }}</p>
    <button>{{ 'common.view' | translate }}</button>
    <button>{{ 'common.edit' | translate }}</button>
    <button>{{ 'common.delete' | translate }}</button>
  </div>
</div>
```

---

## Environment-Specific Translation

You can also use translations with dynamic content:

```typescript
// In TypeScript
this.translate.get('messages.welcome', { name: this.user.name })
  .subscribe((res: string) => {
    console.log(res);
  });

// In Translation File (hi.json)
"messages": {
  "welcome": "स्वागत है, {{name}}!"
}
```

---

## Best Practices

1. **Use Consistent Keys**: Follow the nested structure consistently
2. **Avoid Hardcoding**: Never hardcode UI text in components
3. **Use Common Keys**: Reuse keys from "common" section (Yes, No, Save, etc.)
4. **Translation Keys Should Be Lowercase**: Use camelCase for nested keys
5. **Keep Translations Updated**: When adding new features, add translation keys first

---

## Testing Translations

1. **Test All Languages**: Switch between en, hi, and te
2. **Check RTL Support**: If adding RTL language (like Arabic), enable it
3. **Verify Alignment**: Ensure UI aligns properly with long/short translations
4. **Test Responsiveness**: Language change shouldn't break responsive design

---

## Adding New Language

To add a new language (e.g., Kannada - kn):

1. Create `frontend/src/assets/i18n/kn.json`
2. Copy structure from `en.json` and translate
3. Update `app.component.ts` languages array:
   ```typescript
   languages = ['en', 'hi', 'te', 'kn'];
   ```

---

## Current Language Files

- ✅ **en.json** - English (Complete)
- ✅ **hi.json** - Hindi (Complete)
- ✅ **te.json** - Telugu (Complete)

All translation keys are comprehensive and ready for implementation!

---

## Quick Implementation Steps

1. **Update app.module.ts** ✅ (Already done)
2. **Create translation files** ✅ (Already done)
3. **Update components** (Next step)
   - Replace hardcoded strings with `{{ 'key' | translate }}`
4. **Add language switcher to header** (Next step)
5. **Test all languages** (Next step)

