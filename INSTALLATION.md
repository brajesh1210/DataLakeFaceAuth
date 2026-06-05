# DataLake Workforce Portal - Installation Guide

> **NHAI Hackathon 7.0 Submission**  
> Choose the installation method that works best for you

---

## 🎯 OPTION 1: Direct APK Install (Recommended - 2 minutes)

### Download Pre-Built APK

| Architecture | Size | Download Link |
|-------------|------|---------------|
| **arm64-v8a** (Modern phones, recommended) | 38 MB | https://drive.google.com/file/d/1ldVJA0sAaUYbLV_eRsIDi3aIabzyudCY/view?usp=sharing |
| **armeabi-v7a** (Older 32-bit phones) | 29 MB | https://drive.google.com/file/d/1yM87yhrV-R3rTbnnXXGvrLI7kg24JwZW/view?usp=sharing |

### Installation Steps

1. **Download** the appropriate APK to your Android phone
2. **Enable Unknown Sources:**
   - Settings → Apps → Special access → Install unknown apps
   - Select your file manager → Allow
3. **Tap the APK file** to install
4. **Open "DataLake"** from home screen
5. **Grant permissions** when prompted (Camera, Location, Vibration)

### Device Requirements
- Android 8.0 (API 26) or higher
- Front camera (essential)
- Minimum 3 GB RAM
- 100 MB free storage

---

## 🔑 Demo Credentials

| Role | Employee ID | Password |
|------|------------|----------|
| Administrator | ADMIN | admin123 |
| Employee | Any value | Any value |

### Pre-seeded Test Employees
- Rajesh Kumar (EMP101)
- Priya Sharma (EMP102)
- Amit Singh (EMP103)

---

## ⚙️ OPTION 2: Build from Source (15 minutes)

For reviewers who want to verify source code or modify the app.

### Prerequisites

| Software | Required Version |
|----------|------------------|
| Node.js | 18 or higher |
| JDK | 17 (Critical - not 8, 11, or 21) |
| Android Studio | Latest with SDK 34 |
| Android NDK | 26.1.10909125 |

### Build Steps

```
# 1. Extract source_code folder

# 2. Install dependencies (3-5 minutes)
npm install --legacy-peer-deps

# 3. Start Metro bundler
npx react-native start --reset-cache

# 4. In a NEW terminal, build and run
npx react-native run-android
```

First build takes 8-12 minutes.

### Build Release APK

```
cd android
gradlew clean
gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/`

---

## ⚠️ Critical Configuration

These are pre-configured and must NOT be changed:

```
android/gradle.properties:
  newArchEnabled=false       (REQUIRED for Vision Camera v4)
  hermesEnabled=true         (JavaScript performance)
```

CameraX is forced to version 1.4.0 to avoid riscv64 ABI compatibility issues.

---

## 🧪 Testing Workflow

### Admin Test (3 minutes)
1. Open app → Splash → Login screen
2. Enter `ADMIN` and `admin123`
3. **HOLD** the authenticate button for 1.5 seconds (wait for vibration)
4. Admin Master Portal opens with 5 tabs:
   - **Core:** View today's stats
   - **Logs:** All attendance records  
   - **Monthly:** Calendar ledger per employee
   - **Leaves:** Pending leave applications
   - **Register:** Onboard new employee

### Employee Test (3 minutes)
1. Logout from admin
2. Login with any Employee ID (e.g., `EMP456`) and any password
3. **HOLD** authenticate button
4. Employee Portal Hub opens
5. Tap **"Check In"** → Camera opens
6. Position face in oval, follow liveness prompt
7. Apply for leave (only today/future dates allowed)
8. Later, tap **"Check Out"** for second face scan

### Offline Mode Test
1. Enable Airplane Mode
2. Mark attendance → works completely offline
3. Apply for leave → saves locally
4. Disable Airplane Mode
5. Watch sync badge turn green
6. Toast notification confirms AWS sync

---

## 🆘 Troubleshooting

### Issue: APK won't install
**Solution:** Enable "Install unknown apps" for your file manager in Settings → Security

### Issue: "App not installed" error
**Solution:** Uninstall any existing version first, then install fresh

### Issue: Camera doesn't open
**Solution:** Settings → Apps → DataLake → Permissions → Grant Camera access

### Issue: Build fails with NDK error
**Solution:** Install NDK 26.1.10909125 via Android Studio SDK Manager

### Issue: "Frame Processors not available" during build
**Solution:**
```
cd android
gradlew clean
cd ..
npx react-native start --reset-cache
npx react-native run-android
```

### Issue: Database not initialized on first launch
**Solution:** Force close app and reopen

---

## 📊 Expected Performance

On a mid-range Android device:

| Operation | Expected Time |
|-----------|--------------|
| App cold start | ~2 seconds |
| Face detection | ~80 ms per frame |
| Complete authentication | ~500 ms |
| Database operations | < 50 ms |

All ML processing happens on-device with zero network calls.

---

## 📂 Project Structure

```
source_code/
├── src/
│   ├── components/     # 19 reusable UI components
│   ├── screens/
│   │   ├── admin/      # 5-tab Admin Portal
│   │   └── employee/   # Employee Hub + Leave + Profile
│   ├── services/       # ML, Database, Encryption, Sync
│   ├── hooks/          # Custom React hooks
│   ├── store/          # Zustand state management
│   ├── theme/          # Design tokens
│   ├── navigation/     # React Navigation
│   ├── types/          # TypeScript interfaces
│   └── assets/
│       ├── models/     # TFLite model (< 1 MB)
│       └── images/     # Highway image, app icons
├── android/            # Android native config
├── ios/                # iOS native config
└── package.json
```

---

## 🔗 Resources

- **GitHub Repository:** https://github.com/brajesh1210/DataLakeFaceAuth
- **Pre-built APK (arm64):** https://drive.google.com/file/d/1ldVJA0sAaUYbLV_eRsIDi3aIabzyudCY/view?usp=sharing
- **Pre-built APK (32-bit):** https://drive.google.com/file/d/1yM87yhrV-R3rTbnnXXGvrLI7kg24JwZW/view?usp=sharing
- **Technical Documentation:** See Technical_Documentation.pdf

---

## ✅ Verification Checklist

After installation, verify these features work:

- [ ] App opens to Workforce Portal splash screen
- [ ] Login as ADMIN/admin123 succeeds (with 1.5s hold)
- [ ] Admin Portal displays 5 tabs
- [ ] Camera opens for Mark Attendance
- [ ] Face detection draws live overlay
- [ ] Liveness challenge detects correctly
- [ ] Attendance saves successfully
- [ ] Employee login works with any credentials
- [ ] Apply Leave form blocks past dates
- [ ] Calendar shows colored status dots
- [ ] Airplane mode test passes

---

**Built for NHAI Hackathon 7.0**  
**Powered by Digital India**  
**Jai Hind**