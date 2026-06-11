# Commute Manager (Work Attendance App)

**Program Name:** Commute Manager (`출퇴근 관리` / `出退勤管理`)  
**Version:** 1.0.0  
**Package ID:** `com.googlecalenderapp`

A React Native mobile application for managing office attendance dates, commute times, Google Calendar integration, attendance history, and settings (multi-language, CSV export, email).

---

## Development Environment & Packages

### Required Environment

| Item | Version |
|------|---------|
| Node.js | 18 or higher (20.x recommended) |
| npm | 8+ |
| JDK | 17 (for Android APK build) |
| Android SDK | API 34 (Android 14) |
| Android Build Tools | 34.x |

### Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| expo | ~51.0.28 | React Native framework & build tools |
| react | 18.2.0 | UI library |
| react-native | 0.74.5 | Mobile runtime |
| typescript | ~5.3.3 | Type-safe development |

### Navigation & UI

| Package | Version | Purpose |
|---------|---------|---------|
| @react-navigation/native | ^6.1.18 | App navigation |
| @react-navigation/material-top-tabs | ^6.6.14 | Top tab menu |
| react-native-tab-view | ^3.5.2 | Tab view component |
| react-native-pager-view | 6.3.0 | Swipeable tabs |
| react-native-safe-area-context | 4.10.5 | Safe area layout |
| react-native-screens | 3.31.1 | Native screen containers |
| @react-native-picker/picker | 2.7.5 | Year/month/day pickers |

### Data & Storage

| Package | Version | Purpose |
|---------|---------|---------|
| @react-native-async-storage/async-storage | 1.23.1 | Local data persistence |

### Google Calendar Integration

| Package | Version | Purpose |
|---------|---------|---------|
| expo-auth-session | ~5.5.2 | OAuth authentication |
| expo-web-browser | ~13.0.3 | OAuth browser flow |
| expo-crypto | ~13.0.2 | Cryptographic utilities |

### Settings Features (Export & Email)

| Package | Version | Purpose |
|---------|---------|---------|
| expo-file-system | ~17.0.1 | CSV file creation |
| expo-sharing | ~12.0.1 | Share / save CSV files |
| expo-mail-composer | ~13.0.1 | Native email composer |
| expo-document-picker | ~12.0.2 | File attachment selection |

### Install & Run

```bash
nodebrew use v20.18.0   # or any Node 18+
npm install
npm run android:emu     # Android emulator
npm start               # Expo dev server
```

### Build APK

```bash
npm run build:apk
# Output: dist/出退勤管理-v1.0.0.apk
```

A pre-built APK is also committed in the repository:

```
dist/出退勤管理-v1.0.0.apk
```

---

## Supported Android Versions

| | |
|---|---|
| **Minimum** | Android 6.0 (API 23, Marshmallow) |
| **Target** | Android 14 (API 34) |
| **Compile SDK** | API 34 |

The app runs on **Android 6.0 and above**. It is optimized for Android 14.

---

## Features

The app features a **cute top banner** with **five link-button menus overlaid on the banner image**: **Dates · Times · Google · History · Settings**. The default display language is **Japanese** (configurable to Korean or English in Settings).

---

### 1. Set Work Dates (出勤日指定)

Select office attendance days on a monthly calendar.

**How to use:**
- Choose **year** and **month** using the same dropdown pickers as Attendance History
- Tap a date to mark it as an office day (green circle)
- Double-tap quickly on a marked date to unmark it
- **Japanese national holidays** are shown with a **red circle** on the calendar
- Legend at the bottom: green dot = office day, red dot = holiday

![Set Work Dates](docs/images/en/screen-work-date.png)

---

### 2. Commute Times (出退勤時間入力)

Enter clock-in and clock-out times for each day of the selected month.

**How to use:**
- Select **year** and **month** using the same dropdown pickers as Attendance History
- In the **Bulk Apply** section, enter clock-in / clock-out times and tap **Apply** (full-width button, same width as **Save**)
- Edit each day individually with compact **HH hours MM minutes** inputs
- Tap **Reset** (next to the title) to clear all times for the month to **00:00**
- Tap **Save** to store data and show a preview list below the button

**Save preview (same format as Attendance History):**
- **First line:** `[Work hours:total]` — sum of daily work hours for the month (same decimal format)
- Each saved row: `YYYY/MM/DD(weekday) HH:MM-HH:MM (work hours)`, center-aligned
- Work hours = clock-out − clock-in − **lunch + dinner break** (from Settings), shown in parentheses as a decimal (e.g. `9.0` for 9 hours, `9.5` for 9.5 hours)
- Example:
```
[Work hours:160.0]
2026/06/03(Wed) 09:00-18:00 (8.0)
2026/06/04(Thu) 09:00-18:00 (8.0)
```

**Day labels and card colors:**
- Each row shows `YYYY/MM/DD(weekday):type` (e.g. `2026/06/03(Wed):Office`)
- **Weekday, not marked on calendar** → `:Remote` (blue card)
- **Weekday, marked as office day** → `:Office` (green card)
- **Saturday, Sunday, or Japanese holiday, not marked** → `:Holiday` (pink card) — not shown as Remote
- **Saturday, Sunday, or holiday marked on calendar** → `:Office` by default (green card); tap the date label (▼) to open a popup and switch between **Office** and **Remote**

**Bulk apply rules:**
- Applies to eligible **weekdays** in the selected month (both office and remote weekdays)
- **Excludes Saturdays, Sundays, and Japanese national holidays**, including:
  - Fixed holidays, Happy Monday holidays, Vernal/Autumnal Equinox days
  - Substitute holidays (振替休日) and Citizens' holidays (国民の休日)
- The screen shows the number of eligible days (e.g. `Excludes Sat/Sun & JP holidays · N days`)

![Commute Times](docs/images/en/screen-commute-time.png)

---

### 3. Google Calendar (Googleカレンダー連携)

Connect a Google account for calendar integration.

**How to use:**
- Select year and month
- Tap **Select Google Account** to sign in (or **Change Account** to switch)
- A privacy note explains that you can choose the Google account on your device

**Setup:** Set `EXPO_PUBLIC_GOOGLE_CLIENT_ID` in `.env` (see `.env.example`).

![Google Calendar](docs/images/en/screen-google-calendar.png)

---

### 4. Attendance History (出勤履歴確認)

View monthly attendance records.

**How to use:**
- Select year and month with dropdown pickers
- The list updates automatically for the selected month
- **First line:** `[Work hours:total]` — sum of daily work hours for all days in the month
- Each row shows `YYYY/MM/DD(weekday) HH:MM-HH:MM (work hours)`, **center-aligned**
- Work hours in parentheses use the same decimal format as the save preview (lunch and dinner breaks excluded)
- Example:
```
[Work hours:160.0]
2026/06/03(Wed) 09:00-18:00 (8.0)
2026/06/04(Thu) 09:00-18:00 (8.0)
```
- Card colors match Commute Times: green = office, blue = remote, pink = holiday

![Attendance History](docs/images/en/screen-attendance-history.png)

---

### 5. Settings (設定)

Display language, break time, attendance report (CSV), and email.

#### 5-1. Display Language
Choose **Japanese**, **Korean**, or **English**. All screens update immediately.

#### 5-2. Break Time Settings (휴계시간 설정)
- Card: **Break Time (Lunch, Dinner)** under category **Break Time Settings**
- **Lunch break** (excluded from work hours) — default **1 hour** (`01:00`)
- **Dinner break** (excluded from work hours) — default **0 hours** (`00:00`)
- Edit **hour** and **minute** for lunch and dinner independently (HH hours MM minutes)
- Opening the card loads the last saved values; tap the full-width **Save** button below the dinner field to apply both at once
- Saved break times are subtracted when calculating work hours on History, save preview, and CSV export

#### 5-3. Attendance Report (CSV) (근태장표출력(CSV))
- Select export month
- Tap the full-width **Export** button to generate and share a CSV file (uses break times from §5-2)

**CSV format example:**
```
2026年 06月 出勤履歴
01日: 出勤時刻:09:00、退勤時刻:18:00、稼働時間:08時間00分
...
[総勤務時間:160時間00分]
```

#### 5-4. Send Email
- Enter recipient, subject, and body
- Attach files (including exported CSV)
- Tap the full-width **Send Email** button to open the device mail app

![Settings](docs/images/en/screen-settings.png)

---

## Feature Updates

| Item | Description |
|------|-------------|
| Default language | **Japanese** on first launch (changeable in Settings) |
| Year/month picker | **Work Dates**, **Commute Times**, **History**, and **Google** screens share the same dropdown style |
| Calendar holidays | Japanese holidays shown as **red circles** on the work-date calendar |
| Commute day types | Weekends/holidays show **:Holiday** (not Remote) unless marked on the calendar |
| Holiday work days | Sat/Sun/holiday marked as office day defaults to **:Office**; tap label to switch Office/Remote via popup |
| Bulk apply button | **Apply** button is **full width**, same as **Save** |
| History layout | Date lines are **center-aligned**; colors match commute screen |
| Work hours display | History and save preview show **(9.0)** / **(9.5)** style hours after clock-in/out (lunch + dinner breaks excluded) |
| Break time settings | **Break Time (Lunch, Dinner)** card — editable HH/MM fields, full-width **Save** saves lunch+dinner together; **Attendance Report (CSV)** card for export |
| Settings buttons | **Export**, break-time **Save**, and **Send Email** buttons are **full width** |
| Total work hours | First line **`[Work hours:total]`** sums daily work hours on History and save preview |
| Save preview format | Matches **Attendance History** line format (`YYYY/MM/DD(weekday) HH:MM-HH:MM (hours)`) |
| Bulk time entry | Excludes **weekends** and **Japanese holidays** from bulk apply |
| Time input UI | Per-day editing uses compact **HH:MM** inputs |
| Google screen | Account select/change only (register button and schedule lists removed) |
| Settings tab | Display language, attendance CSV export, email with attachments |
| APK download | Pre-built APK available at `dist/出退勤管理-v1.0.0.apk` in the repository |
| Holiday logic | `src/utils/japaneseHolidays.ts`, `src/utils/commuteDayType.ts`, `src/utils/workDuration.ts` |
| App layout | **Cute top banner** + **link-button navigation on banner** |
| Menu labels | Shortened to **Dates · Times · Google · History · Settings** |
| Reset times | **Reset** on Commute Times clears all month times to **00:00** |

---

## Project Structure

```
googleCalenderApp/
├── App.tsx                    # Main app & tab navigation
├── src/
│   ├── screens/               # Feature screens
│   ├── components/            # Banner, calendar, shared UI
│   ├── context/               # Data & language context
│   ├── i18n/                  # Translations (ja/ko/en)
│   ├── utils/                 # Date, storage, CSV, holidays, commute day-type utilities
│   └── services/              # Google Calendar API
├── docs/images/
│   ├── en/                    # English screen captures
│   ├── ja/                    # Japanese screen captures
│   └── ko/                    # Korean screen captures
├── assets/                    # App icon, banner & splash
├── android/                   # Native Android project
└── dist/                      # Built APK output
```

---

## License

Private project.
