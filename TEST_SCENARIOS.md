# Test Scenarios for Absher Foresight AI

This document provides comprehensive test scenarios to demonstrate the robustness of the fraud detection system.

---

## 🎯 **SCENARIO 1: Normal User - Low Risk (ALLOW)**

### **Input**:
```json
{
  "user_id": "U1",
  "device_is_known": true,
  "location_change_km": 50,
  "hour_of_day": 14,
  "ops_last_24h": 2,
  "is_sensitive_service": false,
  "session_sequence": ["login", "home", "view_personal_data", "logout"],
  "ip_address": "IP_100",
  "device_id": "D1",
  "doc_hash": null
}
```

### **Expected Results**:
- **Behavior Risk**: 0-5 points (normal device, low location change, normal time, low ops)
- **AI Risk**: 0-10 points (models should see normal pattern)
- **Sequence Risk**: 0 points (normal navigation pattern)
- **Graph Risk**: 0 points (no prior fraud associations)
- **Total Risk**: **15-25 points**
- **Decision**: **ALLOW** ✅
- **Reasons**: Minimal or none

### **Why This Works**:
- Normal user behavior pattern
- Known device, reasonable location, normal time
- No suspicious sequence patterns
- No graph associations

---

## 🎯 **SCENARIO 2: New Device + Sensitive Service (ALERT)**

### **Input**:
```json
{
  "user_id": "U2",
  "device_is_known": false,
  "location_change_km": 200,
  "hour_of_day": 15,
  "ops_last_24h": 1,
  "is_sensitive_service": true,
  "session_sequence": ["login", "renew_id", "upload_doc", "payment"],
  "ip_address": "IP_101",
  "device_id": "D2",
  "doc_hash": "DOC_A"
}
```

### **Expected Results**:
- **Behavior Risk**: 40 points
  - New device: +25
  - Sensitive service: +15
- **AI Risk**: 15-25 points (models detect new device + sensitive service)
- **Sequence Risk**: 10 points
  - Sensitive service too early: +10
- **Graph Risk**: 0 points (no prior fraud)
- **Total Risk**: **65-75 points**
- **Decision**: **ALERT** or **CHALLENGE** ⚠️
- **Reasons**: 
  - "تم تنفيذ العملية من جهاز جديد"
  - "الخدمة المطلوبة ذات حساسية عالية"
  - "تم الوصول إلى خدمة حساسة مباشرة بعد تسجيل الدخول"

### **Why This Works**:
- New device is high-risk indicator
- Sensitive service accessed immediately after login
- AI models should flag this combination

---

## 🎯 **SCENARIO 3: Location Jump + Unusual Time (CHALLENGE)**

### **Input**:
```json
{
  "user_id": "U3",
  "device_is_known": true,
  "location_change_km": 800,
  "hour_of_day": 3,
  "ops_last_24h": 8,
  "is_sensitive_service": true,
  "session_sequence": ["login", "home", "renew_passport", "payment"],
  "ip_address": "IP_102",
  "device_id": "D3",
  "doc_hash": "DOC_B"
}
```

### **Expected Results**:
- **Behavior Risk**: 42 points
  - Location jump (known device + sensitive): +12
  - Unusual time (3 AM): +15
  - High frequency ops: +10
  - Sensitive service: +15
- **AI Risk**: 20-30 points (multiple red flags)
- **Sequence Risk**: 0-4 points (normal sequence)
- **Graph Risk**: 0 points
- **Total Risk**: **62-76 points**
- **Decision**: **CHALLENGE** ⚠️⚠️
- **Reasons**:
  - "هناك قفزة كبيرة في الموقع الجغرافي"
  - "وقت تنفيذ العملية غير معتاد"
  - "عدد العمليات في آخر 24 ساعة أعلى من المعتاد"

### **Why This Works**:
- Multiple behavioral anomalies
- Geographic impossibility (800km jump)
- Unusual time suggests automated attack or account compromise

---

## 🎯 **SCENARIO 4: Repeated Login Attempts (BLOCK)**

### **Input**:
```json
{
  "user_id": "U4",
  "device_is_known": false,
  "location_change_km": 1200,
  "hour_of_day": 4,
  "ops_last_24h": 12,
  "is_sensitive_service": true,
  "session_sequence": ["login", "login", "login", "renew_id", "payment", "payment"],
  "ip_address": "IP_103",
  "device_id": "D4",
  "doc_hash": "DOC_C"
}
```

### **Expected Results**:
- **Behavior Risk**: 65 points
  - New device: +25
  - Location jump (new device + sensitive): +20
  - Unusual time: +15
  - High frequency: +10
  - Sensitive service: +15 (but capped interactions)
- **AI Risk**: 30-40 points (all models should flag this)
- **Sequence Risk**: 18 points
  - Repeated logins: +8
  - Repeated payments: +8
  - Sensitive too early: +10 (but might overlap)
- **Graph Risk**: 0 points
- **Total Risk**: **85-95 points**
- **Decision**: **BLOCK** 🚫
- **Reasons**:
  - Multiple behavioral flags
  - "هناك تكرار غير منطقي لخطوات مثل تسجيل الدخول"
  - "النموذج الإشرافي أعطى احتمال مخاطرة عالي"

### **Why This Works**:
- Classic brute-force/account takeover pattern
- Multiple login attempts suggest credential stuffing
- Repeated payments suggest automated fraud
- All risk layers converge on high risk

---

## 🎯 **SCENARIO 5: Graph-Based Risk (Known Fraud IP)**

### **Setup**: First confirm a fraud case:
```json
POST /confirm-fraud
{
  "ip_address": "IP_200",
  "device_id": "D10",
  "doc_hash": "DOC_FRAUD",
  "session_sequence": ["login", "renew_id", "payment"]
}
```

### **Then Test**:
```json
{
  "user_id": "U5",
  "device_is_known": true,
  "location_change_km": 100,
  "hour_of_day": 14,
  "ops_last_24h": 1,
  "is_sensitive_service": false,
  "session_sequence": ["login", "home", "view_personal_data"],
  "ip_address": "IP_200",  // ← Same IP as confirmed fraud!
  "device_id": "D10",      // ← Same device!
  "doc_hash": "DOC_FRAUD"  // ← Same document!
}
```

### **Expected Results**:
- **Behavior Risk**: 0-5 points (normal behavior)
- **AI Risk**: 0-10 points (normal pattern)
- **Sequence Risk**: 0 points
- **Graph Risk**: 40 points (capped)
  - IP fraud: +10 (1 case)
  - Device fraud: +12 (1 case)
  - Doc fraud: +8 (1 case)
  - Sequence similarity: +5 (if similar)
  - **Total**: 35-40 points
- **Total Risk**: **40-55 points**
- **Decision**: **ALERT** or **CHALLENGE** ⚠️
- **Reasons**:
  - "IP IP_200 شارك في 1 معاملات احتيال مؤكدة"
  - "الجهاز D10 مرتبط بـ 1 معاملات احتيال مؤكدة"
  - "تم إعادة استخدام نفس بصمة الوثيقة DOC_FRAUD"

### **Why This Works**:
- Demonstrates graph-based detection
- Even with normal behavior, graph risk flags it
- Shows system learns from confirmed fraud

---

## 🎯 **SCENARIO 6: Bot-Like Linear Navigation (BLOCK)**

### **Input**:
```json
{
  "user_id": "U6",
  "device_is_known": false,
  "location_change_km": 1500,
  "hour_of_day": 2,
  "ops_last_24h": 15,
  "is_sensitive_service": true,
  "session_sequence": ["login", "renew_id", "vehicle_registration", "issue_passport", "payment"],
  "ip_address": "IP_104",
  "device_id": "D5",
  "doc_hash": "DOC_D"
}
```

### **Expected Results**:
- **Behavior Risk**: 70 points
  - New device: +25
  - Location jump (new + sensitive): +20
  - Unusual time: +15
  - High frequency: +10
  - Sensitive service: +15
- **AI Risk**: 30-40 points
- **Sequence Risk**: 25 points
  - Multiple sensitive services: +8
  - Sensitive too early: +10
  - Rare navigation (no exploration): +7
- **Graph Risk**: 0 points
- **Total Risk**: **95-100 points** (capped at 100)
- **Decision**: **BLOCK** 🚫
- **Reasons**:
  - All behavioral flags
  - "مسار الجلسة خطي بدون أي استكشاف"
  - "تم تنفيذ أكثر من خدمة حساسة في نفس الجلسة"

### **Why This Works**:
- Bot-like behavior (linear, no exploration)
- Multiple sensitive services in one session
- All risk layers at maximum

---

## 🎯 **SCENARIO 7: OTP Brute-Force Pattern (CHALLENGE/BLOCK)**

### **Input**:
```json
{
  "user_id": "U7",
  "device_is_known": false,
  "location_change_km": 600,
  "hour_of_day": 1,
  "ops_last_24h": 6,
  "is_sensitive_service": true,
  "session_sequence": ["login", "verify_otp", "verify_otp", "verify_otp", "verify_otp", "renew_id"],
  "ip_address": "IP_105",
  "device_id": "D6",
  "doc_hash": null
}
```

### **Expected Results**:
- **Behavior Risk**: 50 points
  - New device: +25
  - Location jump: +12
  - Unusual time: +15
  - Sensitive service: +15
- **AI Risk**: 20-30 points
- **Sequence Risk**: 16 points
  - Too many OTP challenges: +6
  - Sensitive too early: +10
- **Graph Risk**: 0 points
- **Total Risk**: **70-85 points**
- **Decision**: **CHALLENGE** or **BLOCK** ⚠️🚫
- **Reasons**:
  - "محاولات OTP متكررة (تشبه brute-force أو misuse)"
  - "تم الوصول إلى خدمة حساسة مباشرة بعد تسجيل الدخول"

### **Why This Works**:
- OTP brute-force is a real attack vector
- Multiple OTP attempts suggest account takeover attempt
- System correctly flags this pattern

---

## 🎯 **SCENARIO 8: Legitimate Travel (Edge Case - ALLOW)**

### **Input**:
```json
{
  "user_id": "U8",
  "device_is_known": true,
  "location_change_km": 900,  // Large jump, but...
  "hour_of_day": 10,          // Normal time
  "ops_last_24h": 1,          // Low frequency
  "is_sensitive_service": false,  // Not sensitive
  "session_sequence": ["login", "home", "view_personal_data", "services", "logout"],
  "ip_address": "IP_106",
  "device_id": "D7",
  "doc_hash": null
}
```

### **Expected Results**:
- **Behavior Risk**: 8 points
  - Location jump (known device, non-sensitive): +8
- **AI Risk**: 0-5 points (normal pattern)
- **Sequence Risk**: 0 points (normal navigation)
- **Graph Risk**: 0 points
- **Total Risk**: **8-15 points**
- **Decision**: **ALLOW** ✅
- **Reasons**: Minimal (just location change)

### **Why This Works**:
- Shows system doesn't over-penalize legitimate travel
- Known device + non-sensitive service = low risk
- Context-aware scoring works correctly

---

## 🎯 **SCENARIO 9: Graph Risk with Similar Sequence (CHALLENGE)**

### **Setup**: Confirm fraud with sequence:
```json
POST /confirm-fraud
{
  "ip_address": "IP_300",
  "device_id": "D20",
  "session_sequence": ["login", "renew_id", "upload_doc", "payment"]
}
```

### **Then Test with Similar Sequence**:
```json
{
  "user_id": "U9",
  "device_is_known": true,
  "location_change_km": 50,
  "hour_of_day": 14,
  "ops_last_24h": 1,
  "is_sensitive_service": true,
  "session_sequence": ["login", "renew_id", "upload_doc", "payment"],  // ← Same sequence!
  "ip_address": "IP_300",  // ← Same IP!
  "device_id": "D20",
  "doc_hash": null
}
```

### **Expected Results**:
- **Behavior Risk**: 15 points (sensitive service)
- **AI Risk**: 10-15 points
- **Sequence Risk**: 10 points (sensitive too early)
- **Graph Risk**: 15 points
  - IP fraud: +10
  - Sequence similarity (100%): +5
- **Total Risk**: **50-55 points**
- **Decision**: **ALERT** or **CHALLENGE** ⚠️
- **Reasons**:
  - "IP IP_300 شارك في 1 معاملات احتيال مؤكدة"
  - "مسار الجلسة الحالية يشبه (100%) مسارات احتيال سابقة"

### **Why This Works**:
- Demonstrates sequence similarity detection
- Graph risk adds context even with normal behavior
- Shows system learns attack patterns

---

## 🎯 **SCENARIO 10: Multiple Fraud Cases on Same Asset (BLOCK)**

### **Setup**: Confirm 3 fraud cases with same IP:
```json
POST /confirm-fraud (3 times)
{
  "ip_address": "IP_400",
  "device_id": "D30",
  "session_sequence": ["login", "renew_id", "payment"]
}
```

### **Then Test**:
```json
{
  "user_id": "U10",
  "device_is_known": false,
  "location_change_km": 800,
  "hour_of_day": 3,
  "ops_last_24h": 10,
  "is_sensitive_service": true,
  "session_sequence": ["login", "renew_id", "payment"],
  "ip_address": "IP_400",  // ← IP with 3 fraud cases!
  "device_id": "D30",
  "doc_hash": null
}
```

### **Expected Results**:
- **Behavior Risk**: 65 points
- **AI Risk**: 30-40 points
- **Sequence Risk**: 10 points
- **Graph Risk**: 40 points (capped)
  - IP fraud (3 cases): +30 (capped)
  - Device fraud (3 cases): +35 (capped)
  - Sequence similarity: +5
- **Total Risk**: **100 points** (capped)
- **Decision**: **BLOCK** 🚫
- **Reasons**:
  - "IP IP_400 شارك في 3 معاملات احتيال مؤكدة (+30 نقاط)"
  - "الجهاز D30 مرتبط بـ 3 معاملات احتيال مؤكدة (+35 نقاط)"

### **Why This Works**:
- Shows cumulative graph risk
- Multiple fraud cases = higher risk
- System correctly identifies repeat offenders

---

## 📊 **SUMMARY TABLE**

| Scenario | Behavior | AI | Sequence | Graph | Total | Decision |
|----------|----------|----|----|----|-------|----------|
| 1. Normal User | 0-5 | 0-10 | 0 | 0 | 15-25 | ALLOW ✅ |
| 2. New Device | 40 | 15-25 | 10 | 0 | 65-75 | ALERT/CHALLENGE ⚠️ |
| 3. Location Jump | 42 | 20-30 | 0-4 | 0 | 62-76 | CHALLENGE ⚠️⚠️ |
| 4. Repeated Logins | 65 | 30-40 | 18 | 0 | 85-95 | BLOCK 🚫 |
| 5. Known Fraud IP | 0-5 | 0-10 | 0 | 40 | 40-55 | ALERT/CHALLENGE ⚠️ |
| 6. Bot Pattern | 70 | 30-40 | 25 | 0 | 95-100 | BLOCK 🚫 |
| 7. OTP Brute-Force | 50 | 20-30 | 16 | 0 | 70-85 | CHALLENGE/BLOCK ⚠️🚫 |
| 8. Legitimate Travel | 8 | 0-5 | 0 | 0 | 8-15 | ALLOW ✅ |
| 9. Similar Sequence | 15 | 10-15 | 10 | 15 | 50-55 | ALERT/CHALLENGE ⚠️ |
| 10. Multiple Frauds | 65 | 30-40 | 10 | 40 | 100 | BLOCK 🚫 |

---

## 🧪 **TESTING INSTRUCTIONS**

1. **Start Backend**: `python app.py`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Use Manual Test Form**: Go to Dashboard → Manual Test Panel
4. **Enter Scenario Data**: Copy JSON input (without outer structure)
5. **Submit**: Click "تقييم" (Evaluate)
6. **Verify Results**: Check risk breakdown matches expected
7. **For Graph Scenarios**: First confirm fraud, then test with same assets

---

## ✅ **VALIDATION CHECKLIST**

- [ ] Scenario 1: Normal user gets ALLOW
- [ ] Scenario 2: New device + sensitive = ALERT/CHALLENGE
- [ ] Scenario 3: Location jump + unusual time = CHALLENGE
- [ ] Scenario 4: Repeated logins = BLOCK
- [ ] Scenario 5: Graph risk works after fraud confirmation
- [ ] Scenario 6: Bot pattern = BLOCK
- [ ] Scenario 7: OTP brute-force = CHALLENGE/BLOCK
- [ ] Scenario 8: Legitimate travel = ALLOW
- [ ] Scenario 9: Sequence similarity detection works
- [ ] Scenario 10: Multiple fraud cases = higher risk

---

## 🎯 **PRESENTATION TIPS**

1. **Start with Scenario 1** (normal user) to show system doesn't over-flag
2. **Show Scenario 4** (repeated logins) to demonstrate strong detection
3. **Demonstrate Scenario 5** (graph risk) to show learning capability
4. **Use Scenario 8** (legitimate travel) to show context-awareness
5. **End with Scenario 10** (multiple frauds) to show cumulative risk

These scenarios demonstrate the system's **robustness**, **context-awareness**, and **learning capability**.

