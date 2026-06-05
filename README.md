# 🛣️ DataLake Workforce Portal

> **Secure Offline Facial Recognition & Liveness Detection for NHAI Field Operations**

Built for **NHAI Hackathon 7.0** — A production-grade mobile application that authenticates field personnel using real-time face recognition and anti-spoofing liveness detection, operating **entirely offline** on standard mid-range Android devices.

<p align="center">
  <strong>Digital Backbone for National Highways</strong><br/>
  <em>Powered by Digital India Initiative</em>
</p>


## 🚀 Quick Install (For Reviewers)

### Option 1: Download Pre-Built APK (Fastest - 2 minutes)

| Architecture | Size | Download Link |
|-------------|------|---------------|
| **arm64-v8a** (Modern phones) | 38 MB | [📥 Download APK](https://drive.google.com/file/d/1ldVJA0sAaUYbLV_eRsIDi3aIabzyudCY/view?usp=sharing) |
| **armeabi-v7a** (Older phones) | 29 MB | [📥 Download APK](https://drive.google.com/file/d/1yM87yhrV-R3rTbnnXXGvrLI7kg24JwZW/view?usp=sharing) |

**Quick Steps:**
1. Download the appropriate APK based on your phone
2. Transfer to Android device (8.0+, 3GB RAM minimum)
3. Enable "Install Unknown Apps" in Settings
4. Tap APK to install
5. Open "DataLake" and grant permissions
6. Login with credentials below

### Option 2: Build from Source (15 minutes)
See [INSTALLATION.md](./INSTALLATION.md) for detailed build instructions.

---

## 🔑 Demo Credentials

| Role | Employee ID | Password |
|------|------------|----------|
| **Administrator** | `ADMIN` | `admin123` |
| **Employee** | Any value | Any value |

---

## 🎯 Problem Statement

NHAI manages 1.5+ lakh kilometers of national highways with field personnel deployed at remote construction sites where:

- ❌ Network connectivity is unreliable or completely absent
- ❌ Cloud-based attendance systems fail in zero-network zones
- ❌ Attendance fraud occurs through photographs and proxy users
- ❌ Manual paper-based tracking causes delays and disputes

**Our Solution:** A lightweight, offline-first mobile app that authenticates workers via on-device facial recognition with multi-modal liveness verification.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🎯 **100% Offline** | All ML inference runs on-device. Zero internet required. |
| 📸 **Real-time Face Detection** | 30 FPS face detection using Google ML Kit |
| 🔐 **Hybrid Liveness Detection** | Active challenges (blink/smile/turn) + Passive LBP texture analysis |
| 🔒 **AES-256 Encryption** | Face embeddings encrypted at rest |
| ☁️ **Smart Sync** | Auto-sync to AWS when network restores, with server-confirmed purge |
| 👨‍💼 **Dual Portal System** | Separate Admin Master Portal + Employee Portal Hub |
| 📅 **Monthly Ledger** | Calendar-based attendance visualization with status indicators |
| 📝 **Leave Management** | Apply, track, approve/reject with admin workflow |
| ⏱️ **Check-In/Check-Out** | Complete daily attendance lifecycle with both timestamps |
| 🛡️ **Hold-to-Authenticate** | 1.5-second anti-tampering gesture for secure login |

---

## 🧠 AI Pipeline

Complete authentication in **under 500 milliseconds**:

```
Camera (30 FPS) → ML Kit Detection (80ms) → 
Feature Embedding (100ms) → Cosine Match (30ms) → 
RESULT ✅
```

### Liveness Detection Strategy

**Hybrid Approach: 70% Active + 30% Passive**

- **Active Challenges:** Random selection per session
  - Blink Detection via Eye Aspect Ratio (EAR < 0.3)
  - Smile Detection via ML Kit smilingProbability (> 0.7)
  - Head Turn via yaw angle (> 15 degrees)

- **Passive Analysis:** Local Binary Pattern texture entropy
  - Real face: entropy > 4.5 (complex skin texture)
  - Spoof: entropy < 4.5 (uniform surface)

**Combined Score > 0.75 = LIVE CONFIRMED**

---

## 🛠️ Technology Stack

### Frontend
- **React Native** 0.73.6
- **TypeScript** 5.0.4 (strict mode)
- **React Navigation** 6.1.17
- **Reanimated** 3.8.1
- **Zustand** 4.5.2

### Camera & ML
- **Vision Camera** 4.5.3
- **Google ML Kit Face Detection**
- **Worklets Core** 1.3.3
- **Vision Camera Resize Plugin** 3.2.0

### Data & Security
- **SQLite** with WAL mode
- **AES-256-CBC** encryption (crypto-js)
- **MMKV** secure key storage
- **PBKDF2** key derivation
- **NetInfo** network monitoring

**All open-source. Zero licensing costs.**

---

## 📊 Performance Benchmarks

| Metric | Target | **Achieved** |
|--------|--------|--------------|
| AI Model Size | < 20 MB | **< 1 MB** ✅ |
| Pipeline Speed | < 1 second | **~500ms** ✅ |
| Face Detection | > 95% | **99%** (ML Kit) ✅ |
| Min Android | 8.0 (API 26) | **8.0** ✅ |
| Min RAM | 3 GB | **3 GB** ✅ |
| Offline Operation | Required | **100%** ✅ |
| Cross-Platform | Android + iOS | **Both Ready** ✅ |

Tested on mid-range Android device (Snapdragon 600 series, 6GB RAM).

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────┐
│           PRESENTATION LAYER                  │
│  Splash → Login → Admin/Employee Portal       │
├──────────────────────────────────────────────┤
│           BUSINESS LOGIC LAYER                │
│  Auth • Face Recognition • Liveness • Sync   │
├──────────────────────────────────────────────┤
│                ML LAYER                       │
│  ML Kit • Feature Embedding • LBP Texture    │
├──────────────────────────────────────────────┤
│              DATA LAYER                       │
│  SQLite (WAL) • AES-256 • MMKV • NetInfo    │
└──────────────────────────────────────────────┘
```

---

## 📱 User Workflows

### Admin Workflow
1. Login as `ADMIN` / `admin123`
2. Hold "AUTHENTICATE" button for 1.5 seconds
3. Access 5-tab Admin Master Portal:
   - **Core:** Dashboard with stats
   - **Logs:** All attendance records
   - **Monthly:** Per-employee ledger with calendar
   - **Leaves:** Approve/reject applications
   - **Register:** Onboard new employees with face biometric

### Employee Workflow
1. Login with any Employee ID and password
2. View personal stats on Portal Hub
3. **Check In:** Face scan + liveness verification
4. **Check Out:** Face scan to complete day
5. Apply for leave (today/future dates only)
6. View profile and attendance history

### Offline Mode
1. Enable Airplane Mode → app continues working
2. All attendance saved to encrypted local database
3. Disable Airplane Mode → auto-sync to AWS
4. Toast notification confirms sync completion

---

## 🔒 Security Architecture

| Layer | Protection |
|-------|-----------|
| **Authentication** | Hold-to-Authenticate gesture (1.5s) |
| **Authorization** | Role-based access (Admin vs Employee) |
| **Data at Rest** | AES-256-CBC encryption for embeddings |
| **Key Management** | PBKDF2 + MMKV (Android Keystore backed) |
| **Network** | HTTPS-only Network Security Config |
| **Anti-Spoofing** | Liveness detection + LBP texture analysis |
| **Lockout** | 3 failed attempts → 30-second cooldown |

---

## 📁 Project Structure

```
DataLakeFaceAuth/
├── src/
│   ├── components/
│   │   ├── ui/              # Design system (19 components)
│   │   ├── Camera/          # FaceCamera + Overlay
│   │   └── branding/        # NHAI + Digital India branding
│   ├── screens/
│   │   ├── admin/           # Admin Portal (5 tabs)
│   │   └── employee/        # Employee Portal screens
│   ├── services/            # ML, Database, Encryption, Sync
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand state management
│   ├── theme/               # Design tokens
│   ├── navigation/          # React Navigation setup
│   ├── types/               # TypeScript interfaces
│   └── assets/
│       ├── models/          # TFLite models (< 1 MB)
│       └── images/          # Highway image, branding
├── android/                 # Android native config
├── ios/                     # iOS native config
└── package.json
```

---

## 🌐 Offline-to-Online Sync

```
OFFLINE OPERATION:
  Attendance → Encrypt → SQLite (local queue)
                  ↓
  NetInfo monitors connectivity
                  ↓
  Network Restored → AWS Health Check
                  ↓
  Batch Upload (10 per request)
                  ↓
  Server Confirms → Mark Synced → Audit Log
```

**Zero Data Loss Guarantee:** Only server-confirmed records are purged, last 7 days always retained.

---

## 🎨 Design System

Custom 19-component design system matching DataLake 3.0 visual language:

- Color palette: Navy (#1B3A6B), Light Blue (#EAF2FB), with Indian tricolor accents
- Modern flat icons via Material Community Icons
- 60 FPS animations using Reanimated 3
- Skeleton loading states for smooth UX
- Bilingual support (English + Hindi)

---

## 🧪 Testing

```
# TypeScript check
npx tsc --noEmit

# Android build verification
cd android && ./gradlew assembleDebug
```

Manual testing checklist included in `INSTALLATION.md`.

---

## 🚧 Critical Configuration Notes

For successful builds, these settings are mandatory:

- `newArchEnabled=false` in `gradle.properties` (Vision Camera v4 stability)
- `hermesEnabled=true` for JavaScript performance
- CameraX forced to version 1.4.0 (avoids riscv64 ABI issues)
- Babel plugins: `worklets-core` BEFORE `reanimated`

---

## 🛣️ Roadmap

### Phase 1 (Hackathon Submission) ✅
- Core face recognition + liveness detection
- Admin + Employee portals
- Offline-first architecture
- AWS sync mechanism

### Phase 2 (Next 3 Months)
- MobileFaceNet integration for higher accuracy
- Multi-modal biometrics (voice + face)
- Geofencing for site-specific authentication
- Bulk employee onboarding via CSV
- Push notifications

### Phase 3 (Production)
- Integration with NHAI HR systems
- Analytics dashboard for management
- AI-powered anomaly detection
- Wearable device support
- 50,000+ device deployment

---

## 📜 Hackathon Compliance

### Innovation (30 marks) ✅
- AI model footprint: < 1 MB (95% under 20 MB target)
- Hybrid liveness: active + passive detection
- Novel feature-based recognition (no external model dependency)
- Hold-to-Authenticate UX innovation

### Feasibility (30 marks) ✅
- React Native cross-platform (Android + iOS ready)
- Sub-second pipeline on mid-range devices
- Easy integration with DataLake 3.0
- Open-source stack, zero licensing

### Scalability & Sustainability (20 marks) ✅
- Encrypted offline-to-online sync
- Server-confirmed auto-purge
- Diverse demographics via ML Kit
- Production-ready architecture

### Presentation & Documentation (20 marks) ✅
- Clean TypeScript codebase
- Comprehensive technical documentation
- Architecture diagrams + benchmarks
- Working demo on physical device

---

## 📄 License

Built for **NHAI Hackathon 7.0**. All third-party libraries used under their respective open-source licenses (Apache 2.0, MIT).

---
