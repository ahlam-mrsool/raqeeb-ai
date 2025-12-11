# 🛡️ Absher Raqeeb AI - نظام كشف الاحتيال متعدد الطبقات
https://drive.google.com/file/d/15HCAuWhfzSLYWMd_2UO5S06kiTvHpQc2/view?usp=sharing
<div dir="ltr">

## English Summary

**Absher Raqeeb AI** is a multi-layer fraud detection system for government platforms that combines behavioral analysis, AI/ML models, sequence pattern detection, and graph-based network analysis to detect fraud attempts in real-time.

### Key Features

- **4 Integrated Layers**: Behavioral, AI/ML, Sequence, and Graph Risk
- **3 ML Models**: RandomForest (98.88% accuracy), IsolationForest, Neural Network (96.25% accuracy)
- **Interactive Graph Visualization**: D3.js force-directed graph
- **Real-time Evaluation**: Instant results with clear explanations
- **Comprehensive Dashboard**: Detailed risk breakdown, analytics, and database view

### Quick Start

```bash
# Backend
python -m venv venv
source venv/bin/activate
pip install flask numpy scikit-learn joblib
python train_model.py
python app.py

# Frontend
cd frontend
npm install
npm run dev
```

For detailed documentation, see [LAYERS_DETAILED_EXPLANATION.md](./LAYERS_DETAILED_EXPLANATION.md).

</div>

---

## 📋 نظرة عامة

**Absher Raqeeb AI** هو نظام متقدم لكشف الاحتيال في المنصات الحكومية يستخدم نهجاً متعدد الطبقات يجمع بين تحليل السلوك، نماذج الذكاء الاصطناعي، تحليل تسلسل الجلسة، والرسم الشبكي للكشف عن محاولات الاحتيال في الوقت الفعلي.

### ✨ الميزات الرئيسية

- 🔍 **4 طبقات متكاملة** لتقييم المخاطر:
  - **Behavioral Risk**: تحليل السلوك الفوري (0-50 نقطة)
  - **AI/ML Risk**: 3 نماذج ML مكملة (0-40 نقطة)
  - **Sequence Risk**: تحليل أنماط الجلسة (0-30 نقطة)
  - **Graph Risk**: تحليل الشبكات والارتباطات (0-50 نقطة)

- 🤖 **نماذج ML متقدمة**:
  - RandomForest Classifier (98.88% دقة)
  - IsolationForest (كشف شذوذ غير إشرافي)
  - MLP Neural Network (96.25% دقة)

- 🕸️ **رسم شبكي تفاعلي**: تصور ارتباطات IPs، Devices، وDocument Hashes

- 📊 **لوحة تحكم شاملة**: عرض تفصيلي للمخاطر، التحليلات، وقاعدة البيانات

- ⚡ **تقييم في الوقت الفعلي**: نتائج فورية مع تفسيرات واضحة

---

## 🏗️ البنية التقنية

### Backend
- **Flask** - إطار عمل Python للـ API
- **scikit-learn** - نماذج ML (RandomForest, IsolationForest, MLPClassifier)
- **NumPy** - معالجة البيانات
- **Joblib** - حفظ وتحميل النماذج

### Frontend
- **React 19** - مكتبة UI
- **Vite** - Build tool
- **Tailwind CSS** - تصميم الواجهة
- **D3.js** - رسم شبكي تفاعلي
- **Recharts** - رسوم بيانية
- **Lucide React** - أيقونات

---

## 📦 التثبيت

### المتطلبات
- Python 3.8+
- Node.js 18+
- npm أو yarn

### خطوات التثبيت

#### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd absher-foresight-ai
```

#### 2. إعداد Backend

```bash
# إنشاء بيئة افتراضية
python -m venv venv

# تفعيل البيئة الافتراضية
# على macOS/Linux:
source venv/bin/activate
# على Windows:
venv\Scripts\activate

# تثبيت المكتبات
pip install flask numpy scikit-learn joblib
```

#### 3. تدريب النماذج

```bash
# تشغيل سكربت التدريب
python train_model.py
```

سيتم إنشاء النماذج في مجلد `models/`:
- `security_risk_model.pkl` (RandomForest)
- `isolation_forest_model.pkl` (IsolationForest)
- `neural_network_model.pkl` (MLPClassifier)
- `scaler.pkl` (StandardScaler)

#### 4. إعداد Frontend

```bash
cd frontend
npm install
```

---

## 🚀 التشغيل

### 1. تشغيل Backend

```bash
source venv/bin/activate  # macOS/Linux

venv\Scripts\activate  # Windows

python app.py
```

الخادم سيعمل على `http://localhost:5000`

### 2. تشغيل Frontend

```bash
cd frontend
npm run dev
```

التطبيق سيكون متاحاً على `http://localhost:5173`

---

## 📖 الاستخدام

### تقييم معاملة

أرسل POST request إلى `/evaluate`:

```json
{
  "user_id": "U1",
  "device_is_known": false,
  "location_change_km": 800,
  "hour_of_day": 3,
  "ops_last_24h": 12,
  "is_sensitive_service": true,
  "session_sequence": ["login", "renew_id", "upload_doc"],
  "ip_address": "192.168.1.100",
  "device_id": "D1",
  "doc_hash": "DOC_A"
}
```

### الاستجابة

```json
{
  "behavior_risk": 50,
  "ai_risk": 40,
  "sequence_risk": 16,
  "graph_risk": 42,
  "total_risk": 100,
  "decision": "BLOCK_REVIEW",
  "reasons": ["new_device", "big_location_jump", ...],
  "reason_details": ["تم تنفيذ العملية من جهاز جديد...", ...]
}
```

### القرارات (Decisions)

- **ALLOW** (0-30 نقطة): السماح بالمعاملة
- **ALERT** (31-60 نقطة): تنبيه للمراقبة
- **CHALLENGE** (61-80 نقطة): طلب تحقق إضافي
- **BLOCK_REVIEW** (81-100 نقطة): حظر وتحويل للمراجعة

---

## 🔬 الطبقات الأربع - شرح تفصيلي

### 1️⃣ Behavioral Risk (مخاطر السلوك)

**النطاق**: 0-50 نقطة

**ما تكتشفه**:
- جهاز جديد لم يُستخدم من قبل
- قفزة جغرافية كبيرة (>500 كم)
- وقت غير معتاد (2-5 صباحاً)
- ضغط عمليات عالي (>8 عمليات في 24 ساعة)
- طلب خدمة حساسة

**كيف تعمل**:
- تحسب عدد "الإشارات الحمراء" لتحديد السياق
- نفس الإشارة لها وزن مختلف حسب وجود إشارات أخرى
- مثال: جهاز جديد فقط = 12 نقطة، جهاز جديد + خدمة حساسة = 18 نقطة

**مثال**:
```python
# جهاز جديد + قفزة موقع + وقت غير معتاد + خدمة حساسة
red_flags = 4
risk = 20 (new device) + 20 (location jump) + 12 (unusual time) + 12 (sensitive)
     = 64 → محدود بـ 50 نقطة ✅
```

---

### 2️⃣ AI/ML Risk (نماذج الذكاء الاصطناعي)

**النطاق**: 0-40 نقطة

**النماذج المستخدمة**:

#### **RandomForest Classifier** (إشرافي)
- **دقة**: 98.88%
- **كيف يعمل**: 150 شجرة قرار تصوّت، النتيجة = الأغلبية
- **المساهمة**: 0-25 نقطة (احتمال المخاطرة × 25)

#### **IsolationForest** (غير إشرافي)
- **كيف يعمل**: يكتشف الشذوذ بناءً على العزلة
- **المساهمة**: 0-25 نقطة (درجة الشذوذ × 80)

#### **MLP Neural Network** (شبكة عصبية)
- **دقة**: 96.25%
- **البنية**: 32 → 16 → 8 خلايا عصبية
- **المساهمة**: 0-25 نقطة (احتمال المخاطرة × 25)

**التجميع**:
```python
total_ai_risk = min(rf_risk + iso_risk + nn_risk, 40)
```

**Behavioral Boost**:
- إذا 3+ إشارات سلوكية + AI risk < 20 → نضيف 5-10 نقاط
- يضمن مساهمة AI حتى في الحالات المحافظة

**مثال**:
```python
rf_risk = 23 (0.95 probability)
iso_risk = 25 (anomaly detected)
nn_risk = 25 (1.0 probability)
total = 73 → محدود بـ 40 نقطة ✅
```

---

### 3️⃣ Sequence Risk (تحليل تسلسل الجلسة)

**النطاق**: 0-30 نقطة

**الأنماط المكتشفة**:

1. **تكرار login/payment** (8 نقاط)
   - 3+ login أو 2+ payment = brute-force

2. **OTP Abuse** (6 نقاط)
   - 3+ محاولات OTP = misuse

3. **خدمات حساسة متعددة** (8 نقاط)
   - 2+ خدمات حساسة في جلسة واحدة

4. **وصول سريع لخدمة حساسة** (10 نقاط)
   - login → خدمة حساسة مباشرة (بدون تصفح)

5. **جلسة طويلة** (4 نقاط)
   - 7+ خطوات

6. **مسار خطي بدون استكشاف** (7 نقاط)
   - يشبه bot behavior

**مثال**:
```python
seq = ["login", "renew_id", "verify_otp", "verify_otp", "verify_otp"]
# OTP abuse (3) = 6 نقاط
# Sensitive too early = 10 نقاط
# Total = 16 نقطة ✅
```

---

### 4️⃣ Graph Risk (الرسم الشبكي والارتباطات)

**النطاق**: 0-50 نقطة

**ما تكتشفه**:
- IP شارك في معاملات احتيال مؤكدة
- Device مرتبط باحتيال مؤكد
- Document Hash مستخدم في احتيال مؤكد
- مسار الجلسة يشبه مسارات احتيال سابقة

**الحسابات**:
```python
# IP: 12 نقطة لكل حالة احتيال (محدود بـ 35)
# Device: 18 نقطة لكل حالة احتيال (محدود بـ 40)
# Doc: 12 نقطة لكل حالة احتيال (محدود بـ 30)
# Sequence Similarity: +8 نقاط إذا التشابه >= 60%
```

**مثال**:
```python
# IP شارك في 2 حالات احتيال
ip_risk = 12 * 2 = 24 نقطة

# Device شارك في 1 حالة احتيال
device_risk = 18 * 1 = 18 نقطة

# Doc شارك في 3 حالات احتيال
doc_risk = 12 * 3 = 30 نقطة (محدود)

# Sequence similarity = 85%
similarity_bonus = 8 نقاط

total = 24 + 18 + 30 + 8 = 80 → محدود بـ 50 نقطة ✅
```

---

## 📊 النماذج والتدريب

### بيانات التدريب

- **4,000 عينة** (3,200 تدريب + 800 اختبار)
- **بيانات مصطنعة** مبنية على سيناريوهات واقعية
- **8 خصائص**:
  1. `device_is_known` (0/1)
  2. `location_change_km` (0-2000)
  3. `hour_of_day` (0-23)
  4. `ops_last_24h` (0-20)
  5. `is_sensitive_service` (0/1)
  6. `session_length` (1-10)
  7. `sensitive_count` (0-3)
  8. `repeated_flag` (0/1)

### أداء النماذج

| النموذج | الدقة | Precision | Recall | F1-Score |
|---------|-------|-----------|--------|----------|
| RandomForest | 98.88% | 0.997 | 0.989 | 0.993 |
| Neural Network | 96.25% | 0.970 | 0.985 | 0.977 |
| IsolationForest | - | - | - | - |

---

## 🕸️ الرسم الشبكي (Graph Visualization)

### الميزات

- **عقد (Nodes)**: IPs، Devices، Document Hashes
- **روابط (Links)**: ارتباطات بين Assets
- **أحجام ديناميكية**: حسب عدد حالات الاحتيال
- **ألوان مميزة**: حسب نوع الـ Asset
- **تفاعلي**: يمكن السحب والتحريك

### كيفية الاستخدام

1. افتح تبويب "خريطة الارتباطات (Graph Network)"
2. اضغط "تحديث خريطة الارتباطات"
3. استخدم الماوس للسحب والتحريك

---

## 📁 هيكل المشروع

```
absher-foresight-ai/
├── app.py                      # Flask backend
├── train_model.py              # تدريب النماذج
├── models/                     # النماذج المدربة
│   ├── security_risk_model.pkl
│   ├── isolation_forest_model.pkl
│   ├── neural_network_model.pkl
│   └── scaler.pkl
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # المكون الرئيسي
│   │   └── ...
│   ├── package.json
│   └── ...
├── LAYERS_DETAILED_EXPLANATION.md  # شرح تفصيلي للطبقات
├── TECHNICAL_REVIEW.md        # مراجعة تقنية
├── TECHNICAL_HIGHLIGHTS.md    # نقاط قوة تقنية
└── TEST_SCENARIOS.md          # سيناريوهات اختبار
```

---

## 🔧 API Endpoints

### `POST /evaluate`

تقييم معاملة جديدة.

**Request Body**:
```json
{
  "user_id": "string",
  "device_is_known": boolean,
  "location_change_km": number,
  "hour_of_day": number,
  "ops_last_24h": number,
  "is_sensitive_service": boolean,
  "session_sequence": array,
  "ip_address": "string",
  "device_id": "string",
  "doc_hash": "string"
}
```

**Response**:
```json
{
  "behavior_risk": number,
  "ai_risk": number,
  "sequence_risk": number,
  "graph_risk": number,
  "total_risk": number,
  "decision": "string",
  "reasons": array,
  "reason_details": array
}
```

### `POST /confirm-fraud`

تسجيل حالة احتيال مؤكدة.

**Request Body**:
```json
{
  "ip_address": "string",
  "device_id": "string",
  "doc_hash": "string",
  "session_sequence": array
}
```

### `GET /graph-data`

الحصول على بيانات الرسم الشبكي.

**Response**:
```json
{
  "nodes": array,
  "links": array,
  "stats": {
    "total_ips": number,
    "total_devices": number,
    "total_docs": number,
    "total_fraud_cases": number
  }
}
```

---

## 🧪 الاختبار

راجع ملف `TEST_SCENARIOS.md` لسيناريوهات اختبار شاملة.

### مثال سريع:

```python
# سيناريو: جهاز جديد + قفزة موقع + خدمة حساسة
request = {
    "device_is_known": False,
    "location_change_km": 800,
    "hour_of_day": 3,
    "ops_last_24h": 12,
    "is_sensitive_service": True,
    "session_sequence": ["login", "renew_id", "upload_doc"]
}

# النتيجة المتوقعة: total_risk >= 60 (ALERT أو أعلى)
```

---

## 📚 الوثائق الإضافية

- **[LAYERS_DETAILED_EXPLANATION.md](./LAYERS_DETAILED_EXPLANATION.md)**: شرح تفصيلي لكل طبقة مع أمثلة
- **[TECHNICAL_REVIEW.md](./TECHNICAL_REVIEW.md)**: مراجعة تقنية شاملة
- **[TECHNICAL_HIGHLIGHTS.md](./TECHNICAL_HIGHLIGHTS.md)**: نقاط قوة تقنية
- **[TEST_SCENARIOS.md](./TEST_SCENARIOS.md)**: سيناريوهات اختبار

---

## 🎯 القرارات (Decisions)

| النطاق | القرار | الوصف |
|--------|--------|-------|
| 0-30 | ALLOW | السماح بالمعاملة |
| 31-60 | ALERT | تنبيه للمراقبة |
| 61-80 | CHALLENGE | طلب تحقق إضافي |
| 81-100 | BLOCK_REVIEW | حظر وتحويل للمراجعة |

---

## 🔒 الأمان

### ملاحظات مهمة:

- ⚠️ **CORS**: مفتوح حالياً للتطوير (`*`). يجب تقييده في الإنتاج
- ⚠️ **البيانات**: حالياً في الذاكرة. يجب استخدام قاعدة بيانات في الإنتاج
- ⚠️ **التحقق**: يجب إضافة input validation في الإنتاج
- ⚠️ **المصادقة**: يجب إضافة نظام مصادقة في الإنتاج

---

## 🚧 التطوير المستقبلي

- [ ] إضافة قاعدة بيانات (PostgreSQL/MongoDB)
- [ ] نظام مصادقة وتفويض
- [ ] Input validation شامل
- [ ] Logging وMonitoring
- [ ] Unit tests وIntegration tests
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Real-time alerts system

---

## 👥 المساهمة

نرحب بالمساهمات! يرجى:

1. Fork المشروع
2. إنشاء branch للميزة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى Branch (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).


---

**Made with ❤️ for secure platforms**

