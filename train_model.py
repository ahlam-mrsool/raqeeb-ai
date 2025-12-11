# train_model.py
#
# سكربت يولّد بيانات مصطنعة، يدرب 3 نماذج:
# 1) RandomForestClassifier            -> مصنف إشرافي
# 2) IsolationForest                  -> كشف شذوذ غير إشرافي
# 3) MLPClassifier (Neural Network)   -> شبكة عصبية بسيطة
#
# الموديل يتدرّب على 8 خصائص (features) منها:
# - خصائص سلوكية (جهاز معروف، تغيير الموقع، الوقت، عدد العمليات، خدمة حساسة)
# - خصائص من ملخص الجلسة (طول الجلسة، عدد الخدمات الحساسة، تكرار login/payment)
#
# ويحفظ النماذج داخل مجلد models/

import os
import numpy as np
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    accuracy_score,
    confusion_matrix
)
import joblib
from sklearn.preprocessing import StandardScaler


# -------- 1) توليد بيانات مصطنعة تشبه سلوك منصة حكومية --------
def generate_synthetic_data(n_samples=4000, random_state=42):
    rng = np.random.default_rng(random_state)

    # ----- Features سلوكية أساسية -----
    device_is_known   = rng.integers(0, 2,   size=n_samples)   # 0/1
    location_change   = rng.integers(0, 2001, size=n_samples)  # km
    hour_of_day       = rng.integers(0, 24,  size=n_samples)   # 0-23
    ops_last_24h      = rng.integers(0, 21,  size=n_samples)   # 0-20
    is_sensitive      = rng.integers(0, 2,   size=n_samples)   # 0/1

    # ----- ملخص الجلسة (sequence summary features) -----
    # عدد الخطوات في الجلسة (تقريبياً)
    session_length    = rng.integers(1, 11,  size=n_samples)   # 1-10 steps
    # كم خدمة حساسة في نفس الجلسة
    sensitive_count   = rng.integers(0, 4,   size=n_samples)   # 0-3
    # 1 لو فيه تكرار login/payment بشكل مريب
    repeated_flag     = rng.integers(0, 2,   size=n_samples)   # 0/1

    # مصفوفة X النهائية: 8 أبعاد
    #  [0] device_is_known
    #  [1] location_change
    #  [2] hour_of_day
    #  [3] ops_last_24h
    #  [4] is_sensitive
    #  [5] session_length
    #  [6] sensitive_count
    #  [7] repeated_flag
    X = np.vstack([
        device_is_known,
        location_change,
        hour_of_day,
        ops_last_24h,
        is_sensitive,
        session_length,
        sensitive_count,
        repeated_flag,
    ]).T

    # ----- labels y: 0 = طبيعي, 1 = risky -----
    y = np.zeros(n_samples, dtype=int)

    # قواعد تقريبية + noise لتوليد y
    for i in range(n_samples):
        risk_score = 0

        # (أ) نفس القواعد القديمة تقريباً
        if device_is_known[i] == 0 and is_sensitive[i] == 1 and location_change[i] > 800:
            risk_score += 3

        if 2 <= hour_of_day[i] <= 5 and ops_last_24h[i] > 5:
            risk_score += 2

        if is_sensitive[i] == 1 and location_change[i] > 500:
            risk_score += 1

        if ops_last_24h[i] > 10:
            risk_score += 1

        # (ب) قواعد لها علاقة بالسيكونس
        # أكثر من خدمة حساسة في نفس الجلسة
        if sensitive_count[i] >= 2:
            risk_score += 2

        # تكرار login/payment
        if repeated_flag[i] == 1:
            risk_score += 1

        # جلسة طويلة جداً (حوسة في الجلسة)
        if session_length[i] >= 7:
            risk_score += 1

        # (ج) شوية noise عشان الواقع مو perfect rules
        if risk_score == 0 and rng.random() < 0.03:
            risk_score = 1

        y[i] = 1 if risk_score >= 2 else 0

    return X, y


def main():
    print("Generating synthetic data...")
    X, y = generate_synthetic_data()

    print("Data shape:", X.shape)          # (4000, 8)
    print("Risky samples:", y.sum(), "/", len(y))

    # split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ---------------------------------------------------------
    # 2) RandomForestClassifier
    # ---------------------------------------------------------
    print("\nTraining RandomForest classifier...")
    clf = RandomForestClassifier(
        n_estimators=150,
        max_depth=8,
        random_state=42,
        class_weight="balanced"
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc_rf = accuracy_score(y_test, y_pred)
    print(f"\nRandomForest Accuracy: {acc_rf * 100:.2f}%")
    print("\nConfusion Matrix (RF):")
    print(confusion_matrix(y_test, y_pred))
    print("\nClassification Report (RF):")
    print(classification_report(y_test, y_pred, digits=3))

    # ---------------------------------------------------------
    # 3) IsolationForest
    # ---------------------------------------------------------
    print("\nTraining IsolationForest...")
    iso = IsolationForest(
        contamination=0.15,
        random_state=42
    )
    iso.fit(X_train)

    # ---------------------------------------------------------
    # 4) MLPClassifier (Neural Network)
    # ---------------------------------------------------------
    print("\nTraining Neural Network (MLPClassifier)...")

    mlp = MLPClassifier(
        hidden_layer_sizes=(32, 16, 8),
        activation='relu',
        solver='adam',
        max_iter=500,
        random_state=42
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    mlp.fit(X_train_scaled, y_train)
    y_pred_mlp = mlp.predict(X_test_scaled)


    acc_mlp = accuracy_score(y_test, y_pred_mlp)

    print(f"\nMLPClassifier Accuracy: {acc_mlp * 100:.2f}%")
    print("\nConfusion Matrix (MLP):")
    print(confusion_matrix(y_test, y_pred_mlp))
    print("\nClassification Report (MLP):")
    print(classification_report(y_test, y_pred_mlp, digits=3))

    # ---------------------------------------------------------
    # 5) Save models
    # ---------------------------------------------------------

    os.makedirs("models", exist_ok=True)
    joblib.dump(clf,   "models/security_risk_model.pkl")
    joblib.dump(iso,   "models/isolation_forest_model.pkl")
    joblib.dump(mlp,   "models/neural_network_model.pkl")
    joblib.dump(scaler,"models/scaler.pkl")

    print("\nModels saved:")
    print(" - models/security_risk_model.pkl")
    print(" - models/isolation_forest_model.pkl")
    print(" - models/neural_network_model.pkl")


if __name__ == "__main__":
    main()
