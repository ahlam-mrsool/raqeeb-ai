from flask import Flask, request, jsonify
import numpy as np
import joblib
from difflib import SequenceMatcher

# ================== APP & MODELS ==================

app = Flask(__name__)

# تحميل النماذج المدربة من train_model.py
rf_model = joblib.load("models/security_risk_model.pkl")
iso_model = joblib.load("models/isolation_forest_model.pkl")
nn_model = joblib.load("models/neural_network_model.pkl")
scaler = joblib.load("models/scaler.pkl")


# Allow CORS for local dashboard
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    return response


# ================== MOCK DATA (للسلوك + السيكوانس) ==================

user_normal_sequences = {
    "U1": ["login", "home", "renew_id", "upload_doc", "logout"],
    "U2": ["login", "home", "vehicle", "logout"],
    # باقي المستخدمين نعتبر ما عندهم نمط معروف
}

# ================== FRAUD GRAPH (Asset-Centric) ==================

# نخزن هنا الـ IPs / devices / doc_hashes اللي شاركت في معاملات احتيال مؤكدة
risky_assets = {
    "ip": {},         # ip -> {"fraud_count": int, "last_sequences": [list[str], ...]}
    "device_id": {},  # device_id -> نفس الفكرة
    "doc_hash": {},   # doc_hash -> نفس الفكرة
}


def normalize_sequence(seq):
    """تأكد إن السيكوانس عبارة عن list[str] بدون فراغات."""
    if not seq:
        return []
    if isinstance(seq, str):
        # "login,home,renew_id" -> ["login", "home", "renew_id"]
        seq = [s.strip() for s in seq.split(",") if s.strip()]
    else:
        seq = [str(s).strip() for s in seq if str(s).strip()]
    return seq


def sequence_similarity(seq_a, seq_b):
    """
    مقياس بسيط للتشابه بين مسارين:
    ratio = عدد الخطوات المشتركة / عدد الخطوات المميزة الكلّي.
    """
    a = normalize_sequence(seq_a)
    b = normalize_sequence(seq_b)

    return SequenceMatcher(None, a, b).ratio()


def register_fraud_case(ip=None, device_id=None, doc_hash=None, session_sequence=None):
    """
    نحفظ الـ assets اللي شاركت في معاملة نعتبرها احتيال مؤكّد.
    نحفظ أيضاً العلاقات بين الـ assets (مثلاً نفس الـ IP استخدم نفس الـ Device).
    """
    seq = normalize_sequence(session_sequence)

    # IP
    if ip:
        stats = risky_assets["ip"].setdefault(ip, {
            "fraud_count": 0,
            "last_sequences": [],
            "related_devices": [],
            "related_docs": []
        })
        stats["fraud_count"] += 1
        if seq:
            stats["last_sequences"].append(seq)
        if device_id and device_id not in stats["related_devices"]:
            stats["related_devices"].append(device_id)
        if doc_hash and doc_hash not in stats["related_docs"]:
            stats["related_docs"].append(doc_hash)

    # Device
    if device_id:
        stats = risky_assets["device_id"].setdefault(device_id, {
            "fraud_count": 0,
            "last_sequences": [],
            "related_ips": [],
            "related_docs": []
        })
        stats["fraud_count"] += 1
        if seq:
            stats["last_sequences"].append(seq)
        if ip and ip not in stats["related_ips"]:
            stats["related_ips"].append(ip)
        if doc_hash and doc_hash not in stats["related_docs"]:
            stats["related_docs"].append(doc_hash)

    # Document hash
    if doc_hash:
        stats = risky_assets["doc_hash"].setdefault(doc_hash, {
            "fraud_count": 0,
            "last_sequences": [],
            "related_ips": [],
            "related_devices": []
        })
        stats["fraud_count"] += 1
        if seq:
            stats["last_sequences"].append(seq)
        if ip and ip not in stats["related_ips"]:
            stats["related_ips"].append(ip)
        if device_id and device_id not in stats["related_devices"]:
            stats["related_devices"].append(device_id)


def compute_graph_risk(ip=None, device_id=None, doc_hash=None, session_sequence=None):
    """
    نحسب Network / Graph Risk على أساس:
      - كم مرة هذا الـ IP شارك في fraud cases سابقة
      - كم مرة هذا الـ device_id شارك
      - كم مرة هذا الـ doc_hash شارك
      - وهل الـ session الحالية تشبه سيكوانسات احتيال سابقة لنفس الـ assets
    نرجّع:
      graph_risk (0-50), reason_codes, reason_details
      
    ملاحظة: Graph risk يعتبر إشارة قوية جداً لأنها تعتمد على احتيال مؤكد،
    لذلك نعطيها وزن أعلى من الطبقات الأخرى.
    """
    total_risk = 0
    reason_codes = []
    reason_details = []

    current_seq = normalize_sequence(session_sequence)

    # ---- IP ----
    ip_info = risky_assets["ip"].get(ip)
    if ip and ip_info and ip_info["fraud_count"] > 0:
        # زيادة الوزن: 10 → 12 نقطة لكل حالة احتيال
        add = min(12 * ip_info["fraud_count"], 35)
        total_risk += add
        reason_codes.append("shared_ip_with_high_risk")
        reason_details.append(
            f"IP {ip} شارك في {ip_info['fraud_count']} معاملات احتيال مؤكدة (+{add} نقاط مخاطرة)."
        )

        best_sim = 0.0
        for fraud_seq in ip_info["last_sequences"]:
            sim = sequence_similarity(current_seq, fraud_seq)
            best_sim = max(best_sim, sim)

        if best_sim >= 0.6:
            # زيادة وزن التشابه: 5 → 8 نقاط
            extra = 8
            total_risk += extra
            reason_codes.append("sequence_like_past_fraud_ip")
            reason_details.append(
                f"مسار الجلسة الحالية يشبه ({int(best_sim*100)}٪) مسارات احتيال سابقة من نفس الـ IP (+{extra} نقاط)."
            )

    # ---- Device ID ----
    dev_info = risky_assets["device_id"].get(device_id)
    if device_id and dev_info and dev_info["fraud_count"] > 0:
        # زيادة الوزن: 12 → 18 نقطة لكل حالة احتيال (الجهاز أهم من IP)
        add = min(18 * dev_info["fraud_count"], 40)
        total_risk += add
        reason_codes.append("shared_device_with_high_risk")
        reason_details.append(
            f"الجهاز {device_id} مرتبط بـ {dev_info['fraud_count']} معاملات احتيال مؤكدة (+{add} نقاط)."
        )

        best_sim = 0.0
        for fraud_seq in dev_info["last_sequences"]:
            sim = sequence_similarity(current_seq, fraud_seq)
            best_sim = max(best_sim, sim)

        if best_sim >= 0.6:
            # زيادة وزن التشابه: 5 → 8 نقاط
            extra = 8
            total_risk += extra
            reason_codes.append("sequence_like_past_fraud_device")
            reason_details.append(
                f"مسار الجلسة الحالية قريب ({int(best_sim*100)}٪) من مسارات احتيال سابقة على نفس الجهاز (+{extra} نقاط)."
            )

    # ---- Document Hash ----
    doc_info = risky_assets["doc_hash"].get(doc_hash)
    if doc_hash and doc_info and doc_info["fraud_count"] > 0:
        # زيادة الوزن: 8 → 12 نقطة لكل حالة احتيال
        add = min(12 * doc_info["fraud_count"], 30)
        total_risk += add
        reason_codes.append("shared_doc_with_high_risk")
        reason_details.append(
            f"تم إعادة استخدام نفس بصمة الوثيقة {doc_hash} في {doc_info['fraud_count']} معاملات احتيال (+{add} نقاط)."
        )

        best_sim = 0.0
        for fraud_seq in doc_info["last_sequences"]:
            sim = sequence_similarity(current_seq, fraud_seq)
            best_sim = max(best_sim, sim)

        if best_sim >= 0.6:
            # زيادة وزن التشابه: 5 → 8 نقاط
            extra = 8
            total_risk += extra
            reason_codes.append("sequence_like_past_fraud_doc")
            reason_details.append(
                f"مسار الجلسة الحالية مشابه ({int(best_sim*100)}٪) لمسارات احتيال سابقة لوثائق مماثلة (+{extra} نقاط)."
            )

    # زيادة السقف: 40 → 50 نقطة (لأن Graph risk إشارة قوية جداً)
    total_risk = min(total_risk, 50)
    return total_risk, reason_codes, reason_details


# ================== REASONS TEXT ==================

def explain_reason(reason: str) -> str:
    # أسباب سلوكية
    if reason == "new_device":
        return "تم تنفيذ العملية من جهاز جديد لم يُستخدم من قبل لهذا الحساب."
    if reason == "big_location_jump":
        return "هناك قفزة كبيرة في الموقع الجغرافي مقارنة بالاستخدام السابق."
    if reason == "unusual_time":
        return "وقت تنفيذ العملية غير معتاد على نمط استخدام الحساب."
    if reason == "sensitive_service":
        return "الخدمة المطلوبة ذات حساسية عالية (مثل تجديد هوية أو تفويض مركبة)."
    if reason == "high_frequency_ops":
        return "عدد العمليات في آخر 24 ساعة أعلى من المعتاد."

    # أسباب AI / شذوذ
    if reason.startswith("ml_supervised_high_risk_proba:"):
        val = reason.split(":")[1]
        return f"النموذج الإشرافي (RandomForest) أعطى احتمال مخاطرة عالي ({val})."
    if reason.startswith("ml_nn_high_risk_proba:"):
        val = reason.split(":")[1]
        return f"الشبكة العصبية (Neural Network) أعطت احتمال مخاطرة عالي ({val})."
    if reason == "ml_unsupervised_anomaly_detected":
        return "نموذج العزلة (Isolation Forest) اكتشف نمطاً شاذاً لهذه العملية."
    if reason == "ml_models_boosted_by_behavioral_flags":
        return "نماذج الذكاء الاصطناعي أعطت مخاطرة متوسطة، لكن وجود إشارات سلوكية قوية (جهاز جديد، قفزة موقع، وقت غير معتاد) يزيد من المخاطرة الإجمالية."
    if reason == "ml_models_low_confidence_risk":
        return "نماذج الذكاء الاصطناعي أعطت مستوى مخاطرة متوسط بناءً على المتغيرات الحالية."

    # أسباب تسلسل الأحداث
    if reason == "repeated_actions":
        return "هناك تكرار غير منطقي لخطوات مثل تسجيل الدخول أو الدفع داخل نفس الجلسة."
    if reason == "too_many_otp_challenges":
        return "عدد محاولات التحقق (OTP) متكرر بشكل مريب، مما يشير إلى محاولة اختراق أو سوء استخدام."
    if reason == "multiple_sensitive_services":
        return "تم تنفيذ أكثر من خدمة حساسة في نفس الجلسة، وهذا يزيد من احتمال سوء الاستخدام."
    if reason == "sensitive_too_early":
        return "تم الوصول إلى خدمة حساسة مباشرة بعد تسجيل الدخول بدون أي تصفح اعتيادي."
    if reason == "long_session_many_ops":
        return "الجلسة تحتوي على عدد كبير من الخطوات والعمليات، وهذا سلوك غير معتاد."
    if reason == "rare_navigation_pattern":
        return "مسار الجلسة خطي بدون أي استكشاف للواجهات، وهو أقرب لسلوك آلي من سلوك مستخدم بشري."


    # لو ما عرفناه، رجّعيه زي ما هو
    return reason


# ================== RISK LAYERS ==================

def compute_behavior_risk(req):
    """
    نحسب Behavior Risk بناءً على:
    - جهاز جديد (أقل وزن إذا كان كل شيء طبيعي)
    - قفزة موقع (مهمة جداً إذا مع جهاز جديد + خدمة حساسة)
    - وقت غير معتاد (أقل وزن إذا الجهاز معروف)
    - ضغط عمليات (عتبة أعلى)
    - خدمة حساسة (أقل وزن إذا كل شيء طبيعي، أعلى إذا مع مخاطر أخرى)
    
    الهدف: موازنة بين عدم الإفراط في الحظر وعدم الإفراط في السماح
    """
    risk = 0
    reasons = []

    device_is_new = not req["device_is_known"]
    location_jump = req["location_change_km"] > 500
    unusual_time = req["hour_of_day"] in [2, 3, 4, 5]
    high_frequency = req["ops_last_24h"] > 8  # رفع العتبة من 5 إلى 8
    is_sensitive = req["is_sensitive_service"]
    
    # نحسب عدد "الإشارات الحمراء" لتحديد السياق
    red_flags = sum([
        device_is_new,
        location_jump,
        unusual_time,
        high_frequency,
        is_sensitive
    ])

    # 1) جهاز جديد - وزن أقل إذا كان كل شيء طبيعي
    if device_is_new:
        if red_flags >= 3:  # إذا فيه مخاطر أخرى → وزن أعلى
            risk += 20
        elif is_sensitive:  # جهاز جديد + خدمة حساسة
            risk += 18
        else:  # جهاز جديد فقط (كل شيء طبيعي)
            risk += 12  # كان 25، نخففه
        reasons.append("new_device")

    # 2) قفزة موقع كبيرة - مهمة جداً في سياق معين
    if location_jump:
        if device_is_new and is_sensitive:
            # أسوأ سيناريو: جهاز جديد + قفزة موقع + خدمة حساسة
            risk += 20  # خففنا من 25 إلى 20 عشان ما نصل للسقف بسرعة
        elif device_is_new or is_sensitive:
            # جهاز جديد أو خدمة حساسة (واحد منهم)
            risk += 12  # خففنا من 15 إلى 12
        else:
            # قفزة موقع فقط (جهاز معروف + خدمة عادية)
            risk += 8  # إشارة خفيفة - قد يكون سفر شرعي
        reasons.append("big_location_jump")

    # 3) وقت غير معتاد - أقل وزن إذا الجهاز معروف
    if unusual_time:
        if device_is_new:
            risk += 12  # وقت غير معتاد + جهاز جديد = مريب
        else:
            risk += 8  # وقت غير معتاد فقط (قد يكون سفر أو عمل ليل)
        reasons.append("unusual_time")

    # 4) ضغط عمليات - رفع العتبة لتقليل False Positives
    if high_frequency:
        if req["ops_last_24h"] > 15:  # عتبة عالية جداً
            risk += 15
        else:
            risk += 8  # كان 10، نخففه قليلاً
        reasons.append("high_frequency_ops")

    # 5) خدمة حساسة - وزن أقل إذا كل شيء طبيعي
    if is_sensitive:
        if red_flags >= 4:  # إذا فيه 4+ مخاطر → وزن أعلى
            risk += 18
        elif red_flags >= 3:  # إذا فيه 3 مخاطر
            risk += 12  # خففنا من 18 إلى 12
        elif device_is_new or location_jump:
            # خدمة حساسة + جهاز جديد أو قفزة موقع
            risk += 10  # خففنا من 12 إلى 10
        else:
            # خدمة حساسة فقط (كل شيء طبيعي)
            risk += 8  # كان 15، نخففه - الخدمة الحساسة بحد ذاتها مو مبرر للحظر
        reasons.append("sensitive_service")

    # سقف للـ behavior risk (عشان ما يسيطر على السكور الكلي)
    # خففنا من 60 إلى 50 لتوازن أفضل مع الطبقات الأخرى
    return min(risk, 50), reasons

def ai_anomaly_score(req):
    """
    نحسب AI risk باستخدام 3 نماذج:
      - RandomForestClassifier (إشرافي)
      - IsolationForest (كشف شذوذ)
      - MLPClassifier (شبكة عصبية)
    على 8 features:
      device_is_known, location_change_km, hour_of_day, ops_last_24h,
      is_sensitive_service, session_length, sensitive_count, repeated_flag
    """
    # 1) استنتاج ملخص الجلسة من السيكوانس الحقيقية
    seq = req.get("session_sequence", []) or []
    if isinstance(seq, str):
        seq = [s.strip() for s in seq.split(",") if s.strip()]

    session_length = len(seq)
    sensitive_count = sum(1 for a in seq if a in SENSITIVE_ACTIONS)
    repeated_flag = 1 if (seq.count("login") >= 3 or seq.count("payment") >= 2) else 0

    # 2) بناء الـ feature vector بنفس ترتيب التدريب
    x = np.array([[
        int(req["device_is_known"]),
        float(req["location_change_km"]),
        float(req["hour_of_day"]),
        float(req["ops_last_24h"]),
        int(req["is_sensitive_service"]),
        float(session_length),
        float(sensitive_count),
        float(repeated_flag),
    ]])

    reasons = []

    # ----- 2.1 RandomForest (إشرافي) -----
    proba_risky = rf_model.predict_proba(x)[0][1]
    rf_risk = int(proba_risky * 25)
    # خفض العتبة من 0.6 إلى 0.5 لتقليل False Negatives
    if proba_risky > 0.5:
        reasons.append(f"ml_supervised_high_risk_proba:{round(proba_risky, 2)}")

    # ----- 2.2 IsolationForest (أنومالي) -----
    iso_pred = iso_model.predict(x)[0]       # -1 = anomaly, 1 = normal
    iso_score = iso_model.decision_function(x)[0]
    iso_risk = 0
    if iso_pred == -1:
        iso_risk = min(int(abs(iso_score) * 80), 25)
        reasons.append("ml_unsupervised_anomaly_detected")

    # ----- 2.3 MLP Neural Network -----
    x_scaled = scaler.transform(x)
    nn_pred_proba = nn_model.predict_proba(x_scaled)[0][1]
    nn_risk = int(nn_pred_proba * 25)
    # خفض العتبة من 0.6 إلى 0.5 لتقليل False Negatives
    if nn_pred_proba > 0.5:
        reasons.append(f"ml_nn_high_risk_proba:{round(nn_pred_proba, 2)}")

    # ----- 2.4 تجميع مخاطرة الـ AI -----
    total_ai_risk = min(rf_risk + iso_risk + nn_risk, 40)
    
    # 🔹 Boost AI risk إذا فيه إشارات سلوكية قوية (حتى لو النماذج ما رصدتها بقوة)
    # هذا يضمن إن AI risk يساهم حتى في الحالات اللي النماذج ما توقعتها بدقة
    behavioral_red_flags = sum([
        not req.get("device_is_known", True),
        req.get("location_change_km", 0) > 500,
        req.get("hour_of_day", 12) in [2, 3, 4, 5],
        req.get("ops_last_24h", 0) > 8,
        req.get("is_sensitive_service", False)
    ])
    
    # إذا فيه 3+ إشارات سلوكية، نعطي boost للـ AI risk
    if behavioral_red_flags >= 3 and total_ai_risk < 20:
        # Boost: نضيف 5-10 نقاط إضافية إذا AI risk منخفض لكن فيه إشارات سلوكية قوية
        boost = min(10, 20 - total_ai_risk)
        total_ai_risk += boost
        if boost > 0 and "ml_models_boosted_by_behavioral_flags" not in reasons:
            reasons.append("ml_models_boosted_by_behavioral_flags")
    
    # 🔹 لو أقل من 3 اعتبره 0 (ما يضيف شي على القرار - فقط noise)
    if total_ai_risk < 3:
      return 0, []

    if not reasons and total_ai_risk > 0:
        reasons.append("ml_models_low_confidence_risk")

    return total_ai_risk, reasons


SENSITIVE_ACTIONS = {
    "renew_id",
    "vehicle_registration",
    "issue_passport",
    "renew_passport",
    "issue_work_permit",
    "renew_work_permit",
    "submit_tax_declaration",
    "view_tax_obligations",
    "register_property",
    "update_property_data",
}

NON_SENSITIVE_ACTIONS = {
    "home",
    "view",
    "view_personal_data",
    "services",
    "inquiry",
    "search",
    "login",
    "upload_doc",
    "payment",
    "logout",
}

def is_sensitive_action(action):
    return action in SENSITIVE_ACTIONS

def sequence_risk(user_id, seq):
    """
    تحليل تسلسل الجلسة - طبقة خفيفة (0–30 نقطة تقريباً)
    تركز على:
      - التكرار الغريب (login/payment/OTP)
      - كثرة الخدمات الحساسة
      - الوصول السريع لخدمة حساسة
      - مسار خطي بدون استكشاف (نمط آلي / attack path)
    """
    risk, reasons = 0, []

    # 1) تكرار تسجيل الدخول أو الدفع بشكل مبالغ فيه
    if seq.count("login") >= 3 or seq.count("payment") >= 2:
        risk += 8
        reasons.append("repeated_actions")

    # 1-b) محاولات OTP متكررة (تشبه brute-force أو misuse)
    otp_count = seq.count("verify_otp")
    if otp_count >= 3:
        # 3 محاولات أو أكثر في نفس الجلسة = سلوك مريب
        risk += 6
        reasons.append("too_many_otp_challenges")

    # 2) أكثر من خدمة حساسة في نفس الجلسة
    sensitive_count = sum(1 for a in seq if is_sensitive_action(a))
    if sensitive_count >= 2:
        risk += 8
        reasons.append("multiple_sensitive_services")

    # 3) خدمة حساسة مباشرة بعد تسجيل الدخول (بدون أي تصفح)
    if len(seq) > 1 and seq[0] == "login" and seq[1] in SENSITIVE_ACTIONS:
        risk += 10
        reasons.append("sensitive_too_early")

    # 4) جلسة طويلة جداً (حوسة / كثرة خطوات)
    if len(seq) >= 7:
        risk += 4
        reasons.append("long_session_many_ops")

    # 5) Rare navigation pattern (بدون صفحات غير حساسة = يشبه سلوك بوت)
    non_sensitive_steps = ["home", "view_personal_data", "services"]
    has_exploration = any(a in non_sensitive_steps for a in seq)

    # لو طول السلسلة >= 5 وما فيه أي صفحة استكشافية → نعتبره نمط نادر
    if not has_exploration and len(seq) >= 5:
        risk += 7
        reasons.append("rare_navigation_pattern")

    # سقف للـ sequence layer عشان ما تحرق السكور الكلي
    return min(risk, 30), reasons




def final_decision(score):
    if score <= 30:
        return "ALLOW"
    if score <= 60:
        return "ALERT"
    if score <= 80:
        return "CHALLENGE"
    return "BLOCK_REVIEW"  # Block transaction and send to admin for review


# ================== API ENDPOINT ==================
@app.route("/graph-data", methods=["GET"])
def graph_data():
    """
    نبني graph يظهر:
    1. العقد (Nodes): IPs, Devices, Docs (مع حجم حسب fraud_count)
    2. الروابط (Links):
       - Asset-to-Asset: عندما IP و Device و Doc يظهرون معاً في نفس fraud case
       - Asset-to-Sequence: عندما asset يستخدم sequence معينة
    3. Clusters: assets مرتبطة ببعض = fraud network
    """
    nodes = []
    links = []
    link_set = set()  # لتجنب الروابط المكررة

    # Set to avoid duplicates
    existing_ids = set()

    # Helper to add unique node with metadata
    def add_node(node_id, label, ntype, fraud_count=0):
        if node_id not in existing_ids:
            nodes.append({
                "id": node_id,
                "label": label,
                "type": ntype,
                "fraud_count": fraud_count,
                "size": min(8 + fraud_count * 3, 30)  # حجم العقدة حسب عدد الاحتيالات
            })
            existing_ids.add(node_id)

    # 1) إضافة IPs مع fraud_count
    for ip, details in risky_assets["ip"].items():
        add_node(ip, f"IP: {ip}", "ip", details["fraud_count"])
        
        # ربط IP مع Devices المرتبطة
        for device in details.get("related_devices", []):
            if device in risky_assets["device_id"]:
                link_key = (ip, device, "ip-device")
                if link_key not in link_set:
                    links.append({
                        "source": ip,
                        "target": device,
                        "type": "asset-asset",
                        "strength": 1
                    })
                    link_set.add(link_key)
        
        # ربط IP مع Docs المرتبطة
        for doc in details.get("related_docs", []):
            if doc in risky_assets["doc_hash"]:
                link_key = (ip, doc, "ip-doc")
                if link_key not in link_set:
                    links.append({
                        "source": ip,
                        "target": doc,
                        "type": "asset-asset",
                        "strength": 1
                    })
                    link_set.add(link_key)

    # 2) إضافة Devices مع fraud_count
    for dev, details in risky_assets["device_id"].items():
        add_node(dev, f"Device: {dev}", "device", details["fraud_count"])
        
        # ربط Device مع IPs المرتبطة (لو ما ربطناه قبل)
        for ip_addr in details.get("related_ips", []):
            if ip_addr in risky_assets["ip"]:
                link_key = (ip_addr, dev, "ip-device")
                if link_key not in link_set:
                    links.append({
                        "source": ip_addr,
                        "target": dev,
                        "type": "asset-asset",
                        "strength": 1
                    })
                    link_set.add(link_key)
        
        # ربط Device مع Docs المرتبطة
        for doc in details.get("related_docs", []):
            if doc in risky_assets["doc_hash"]:
                link_key = (dev, doc, "device-doc")
                if link_key not in link_set:
                    links.append({
                        "source": dev,
                        "target": doc,
                        "type": "asset-asset",
                        "strength": 1
                    })
                    link_set.add(link_key)

    # 3) إضافة Docs مع fraud_count
    for doc, details in risky_assets["doc_hash"].items():
        add_node(doc, f"Doc: {doc}", "doc", details["fraud_count"])
        
        # ربط Doc مع IPs و Devices (لو ما ربطناه قبل)
        for ip_addr in details.get("related_ips", []):
            if ip_addr in risky_assets["ip"]:
                link_key = (ip_addr, doc, "ip-doc")
                if link_key not in link_set:
                    links.append({
                        "source": ip_addr,
                        "target": doc,
                        "type": "asset-asset",
                        "strength": 1
                    })
                    link_set.add(link_key)
        
        for device in details.get("related_devices", []):
            if device in risky_assets["device_id"]:
                link_key = (device, doc, "device-doc")
                if link_key not in link_set:
                    links.append({
                        "source": device,
                        "target": doc,
                        "type": "asset-asset",
                        "strength": 1
                    })
                    link_set.add(link_key)

    # 4) إضافة Sequences كعقد منفصلة (اختياري - يمكن إخفاؤها)
    # نضيف sequence summary كعقدة واحدة لكل asset
    for ip, details in risky_assets["ip"].items():
        if details["last_sequences"]:
            seq_id = f"seq_{ip}"
            seq_label = f"Seq: {len(details['last_sequences'])} patterns"
            add_node(seq_id, seq_label, "sequence", len(details["last_sequences"]))
            links.append({
                "source": ip,
                "target": seq_id,
                "type": "asset-sequence",
                "strength": 0.5
            })

    return jsonify({
        "nodes": nodes,
        "links": links,
        "stats": {
            "total_ips": len(risky_assets["ip"]),
            "total_devices": len(risky_assets["device_id"]),
            "total_docs": len(risky_assets["doc_hash"]),
            "total_fraud_cases": sum(
                d["fraud_count"] for d in risky_assets["ip"].values()
            )
        }
    })


@app.route("/evaluate", methods=["POST"])
def evaluate():
    req = request.json or {}

    # إقراء الحقول الأساسية من الـ frontend
    user_id = req.get("user_id", "U1")
    device_is_known = bool(req.get("device_is_known", True))
    location_change_km = float(req.get("location_change_km", 0))
    hour_of_day = int(req.get("hour_of_day", 12))
    ops_last_24h = int(req.get("ops_last_24h", 0))
    is_sensitive_service = bool(req.get("is_sensitive_service", False))
    session_sequence = req.get("session_sequence", [])

    # حقول الـ graph الجديدة
    ip_address = req.get("ip_address")
    device_id = req.get("device_id")
    doc_hash = req.get("doc_hash")

    # نبني object موحد نمرره للفانكشنات
    features = {
        "user_id": user_id,
        "device_is_known": device_is_known,
        "location_change_km": location_change_km,
        "hour_of_day": hour_of_day,
        "ops_last_24h": ops_last_24h,
        "is_sensitive_service": is_sensitive_service,
        "session_sequence": session_sequence,
    }

    # ----- الطبقات الأربع -----
    behavior_risk, behavior_reasons = compute_behavior_risk(features)
    ai_risk, ai_reasons = ai_anomaly_score(features)
    seq_risk_val, seq_reasons = sequence_risk(user_id, session_sequence)

    graph_risk, graph_reason_codes, graph_reason_details = compute_graph_risk(
        ip=ip_address,
        device_id=device_id,
        doc_hash=doc_hash,
        session_sequence=session_sequence,
    )

    # ----- مجموع المخاطر -----
    total_risk = behavior_risk + ai_risk + seq_risk_val + graph_risk
    total_risk = min(int(round(total_risk)), 100)
    decision = final_decision(total_risk)

    # ----- أسباب المخاطرة -----
    reasons = behavior_reasons + ai_reasons + seq_reasons + graph_reason_codes

    # الأسباب النصية:
    reason_details = []

    # سلوك + AI + Sequence (نحوّلها لنص بالعربي)
    for code in behavior_reasons + ai_reasons + seq_reasons:
        reason_details.append(explain_reason(code))

    # Graph: نستخدم النصوص التفصيلية اللي رجعناها من compute_graph_risk
    reason_details.extend(graph_reason_details)

    return jsonify({
        "behavior_risk": behavior_risk,
        "ai_risk": ai_risk,
        "sequence_risk": seq_risk_val,
        "graph_risk": graph_risk,
        "total_risk": total_risk,
        "decision": decision,
        "reasons": reasons,
        "reason_details": reason_details,
    })

@app.route("/confirm-fraud", methods=["POST"])
def confirm_fraud():
    """
    هذا الاندبوينت يُستخدم بعد التحقق البشري من الحالة.
    نعلم من خلاله الرسم الشبكي أن هذا الـ IP / Device / Doc مرتبط فعليًا بحالة احتيال مؤكدة.
    """
    req = request.json or {}

    ip = req.get("ip_address")
    device_id = req.get("device_id")
    doc_hash = req.get("doc_hash")
    session_sequence = req.get("session_sequence", [])

    register_fraud_case(
        ip=ip,
        device_id=device_id,
        doc_hash=doc_hash,
        session_sequence=session_sequence,
    )

    return jsonify({"status": "registered"})

if __name__ == "__main__":
    app.run(debug=True)
