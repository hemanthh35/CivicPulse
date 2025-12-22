# CivicPulse Multi-Language (i18n) - Quick Start Guide

## ✅ What's Already Done

1. **Translation Library Installed**: `@ngx-translate/core` and `@ngx-translate/http-loader`
2. **App Module Configured**: ngx-translate module added to AppModule
3. **Translation Files Created**:
   - `frontend/src/assets/i18n/en.json` ✅ (500+ keys)
   - `frontend/src/assets/i18n/hi.json` ✅ (500+ keys - Hindi)
   - `frontend/src/assets/i18n/te.json` ✅ (500+ keys - Telugu)
4. **Language Switching**: Built into `app.component.ts`

---

## 📋 Quick Implementation Checklist

### Step 1: Add Language Switcher to Header (30 minutes)
Edit your `app.component.html` and add one of the language selector options from `LANGUAGE_SWITCHER_EXAMPLE.html`

### Step 2: Replace Hardcoded Text in Components
For each component, replace hardcoded strings with translation keys.

**Priority Order:**
1. Authentication pages (Login, Register)
2. Navigation menu
3. Dashboard
4. Complaints management
5. Admin panel
6. Worker dashboard
7. Leaderboard

### Step 3: Test All Languages
- Switch between English, Hindi, Telugu
- Verify all text displays correctly
- Check alignment and responsiveness

---

## 🔄 How to Convert a Component

### Example 1: Simple Text Replacement

**BEFORE:**
```html
<h1>My Complaints</h1>
<p>You have {{ count }} complaints</p>
<button>Report Issue</button>
```

**AFTER:**
```html
<h1>{{ 'complaints.myComplaints' | translate }}</h1>
<p>{{ 'complaints.total' | translate }} {{ count }}</p>
<button>{{ 'complaints.reportIssue' | translate }}</button>
```

---

### Example 2: With Conditions

**BEFORE:**
```html
<div *ngIf="status === 'pending'">Pending</div>
<div *ngIf="status === 'in-progress'">In Progress</div>
<div *ngIf="status === 'resolved'">Resolved</div>
```

**AFTER:**
```html
<div *ngIf="status === 'pending'">{{ 'complaints.pending' | translate }}</div>
<div *ngIf="status === 'in-progress'">{{ 'complaints.inProgress' | translate }}</div>
<div *ngIf="status === 'resolved'">{{ 'complaints.resolved' | translate }}</div>
```

---

### Example 3: In Component TypeScript

**BEFORE:**
```typescript
export class MyComponent {
  getMessage() {
    return "Complaint created successfully!";
  }
}
```

**AFTER:**
```typescript
import { TranslateService } from '@ngx-translate/core';

export class MyComponent {
  constructor(private translate: TranslateService) {}

  getMessage() {
    this.translate.get('complaints.successCreate').subscribe((res: string) => {
      console.log(res);
    });
  }
}
```

---

### Example 4: Status/Priority Labels

**BEFORE:**
```typescript
getStatusColor(status: string): string {
  if (status === 'pending') return 'warning';
  if (status === 'in-progress') return 'info';
  if (status === 'resolved') return 'success';
  return 'secondary';
}

getStatusLabel(status: string): string {
  if (status === 'pending') return 'Pending';
  if (status === 'in-progress') return 'In Progress';
  if (status === 'resolved') return 'Resolved';
  return 'Unknown';
}
```

**AFTER:**
```typescript
import { TranslateService } from '@ngx-translate/core';

export class MyComponent {
  constructor(private translate: TranslateService) {}

  getStatusColor(status: string): string {
    // Keep same logic
    if (status === 'pending') return 'warning';
    if (status === 'in-progress') return 'info';
    if (status === 'resolved') return 'success';
    return 'secondary';
  }

  getStatusLabel(status: string): string {
    // In template use: {{ 'complaints.' + status | translate }}
    // OR use the direct mapping approach
    const statusMap: { [key: string]: string } = {
      'pending': 'complaints.pending',
      'in-progress': 'complaints.inProgress',
      'resolved': 'complaints.resolved'
    };
    return statusMap[status] || 'common.unknown';
  }
}
```

**In Template:**
```html
<span [ngClass]="'badge badge-' + getStatusColor(complaint.status)">
  {{ 'complaints.' + complaint.status | translate }}
</span>
```

---

## 📚 Available Translation Keys

All keys are available in your JSON files. Here are some commonly used ones:

### Navigation
- `nav.home` - Home
- `nav.dashboard` - Dashboard
- `nav.complaints` - Complaints
- `nav.leaderboard` - Leaderboard

### Common Actions
- `common.save` - Save
- `common.delete` - Delete
- `common.cancel` - Cancel
- `common.submit` - Submit
- `common.edit` - Edit
- `common.add` - Add

### Complaints
- `complaints.reportIssue` - Report Issue
- `complaints.myComplaints` - My Complaints
- `complaints.status` - Status
- `complaints.pending` - Pending
- `complaints.inProgress` - In Progress
- `complaints.resolved` - Resolved

### Messages
- `messages.welcome` - Welcome!
- `messages.sessionExpired` - Session expired
- `messages.confirmDelete` - Are you sure?

---

## 🎨 Language Names in i18n

```typescript
// Already in app.component.ts
languageNames: { [key: string]: string } = {
  'en': 'English',
  'hi': 'हिन्दी',
  'te': 'తెలుగు'
};
```

---

## 🔍 Finding Translation Keys

### Search Method 1: By Feature
Open the translation file (en.json) and look for the section:
- `app.*` - General app info
- `auth.*` - Login/Register
- `complaints.*` - Complaints feature
- `admin.*` - Admin panel
- `worker.*` - Worker dashboard

### Search Method 2: By Common Text
```bash
# In en.json, search for the English text you want to translate
# For example, searching "My Complaints" shows the key: complaints.myComplaints
```

### Search Method 3: Use the Guide
Refer to `I18N_IMPLEMENTATION_GUIDE.md` for all available sections and keys.

---

## ✨ Special Translation Features

### 1. Using Interpolation in Translations

**Translation File (en.json):**
```json
{
  "messages": {
    "welcome": "Welcome, {{name}}!"
  }
}
```

**Component:**
```typescript
this.translate.get('messages.welcome', { name: 'John' })
  .subscribe((res: string) => console.log(res));
// Output: "Welcome, John!"
```

### 2. Using Pluralization

```html
{{ 'complaints.total' | translate: { count: complaintCount } }}
```

### 3. Async Translation in Services

```typescript
this.translate.get(['button.submit', 'button.cancel']).subscribe(
  (translations: { [key: string]: string }) => {
    this.submitLabel = translations['button.submit'];
    this.cancelLabel = translations['button.cancel'];
  }
);
```

---

## 🚀 Testing Your Implementation

### Test Checklist
- [ ] Switch to Hindi - all text should be in Hindi
- [ ] Switch to Telugu - all text should be in Telugu
- [ ] Switch back to English - verify correct display
- [ ] Refresh page - language should persist
- [ ] Check console for any translation key errors
- [ ] Verify UI alignment with longer translations
- [ ] Test on mobile/responsive view

### Debug Translation Issues

```typescript
// In console, check if translation loaded
this.translate.get('any.key').subscribe(
  (res) => console.log('Translation found:', res),
  (err) => console.error('Translation missing:', err)
);
```

---

## 📱 Example: Complete Login Page Conversion

**Current (Hardcoded):**
```html
<div class="login-form">
  <h2>Login</h2>
  <form [formGroup]="form">
    <div>
      <label>Email</label>
      <input type="email" placeholder="Enter your email">
    </div>
    <div>
      <label>Password</label>
      <input type="password" placeholder="Enter password">
    </div>
    <button type="submit">Login</button>
    <a href="/register">Don't have account? Sign up</a>
  </form>
</div>
```

**Converted (With Translations):**
```html
<div class="login-form">
  <h2>{{ 'auth.login' | translate }}</h2>
  <form [formGroup]="form">
    <div>
      <label>{{ 'auth.email' | translate }}</label>
      <input type="email" [placeholder]="'auth.email' | translate">
    </div>
    <div>
      <label>{{ 'auth.password' | translate }}</label>
      <input type="password" [placeholder]="'auth.password' | translate">
    </div>
    <button type="submit">{{ 'auth.loginButton' | translate }}</button>
    <a href="/register">{{ 'auth.noAccount' | translate }} <strong>{{ 'auth.signup' | translate }}</strong></a>
  </form>
</div>
```

---

## 🎯 Next Steps

1. **Add Language Switcher** to navbar (see LANGUAGE_SWITCHER_EXAMPLE.html)
2. **Start with Authentication Pages** (Login, Register) - highest priority
3. **Convert Components One by One** using the examples above
4. **Test Each Language** as you go
5. **Remove Old English Translation Files** if not using old system

---

## 📞 Support

All translation keys are in:
- `frontend/src/assets/i18n/en.json` - English (Reference)
- `frontend/src/assets/i18n/hi.json` - Hindi
- `frontend/src/assets/i18n/te.json` - Telugu

For quick lookup, search the JSON files for the English text you want to translate!

---

**Status**: ✅ All infrastructure is set up and ready for component migration!
