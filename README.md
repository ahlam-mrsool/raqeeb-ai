# 🛡️ Absher Raqeeb AI - رقيب أبشر

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/react-19-blue.svg)](https://reactjs.org/)
[![Hackathon Project](https://img.shields.io/badge/project-hackathon_mvp-orange.svg)]()

> **⚠️ Hackathon MVP Notice**: This is a proof-of-concept (PoC) developed for a hackathon to demonstrate a novel approach to fraud detection in government platforms. It uses synthetic data and is not intended for production use without significant enhancements.

**Absher Raqeeb AI** is a sophisticated multi-layer fraud detection system designed for government platforms. It combines behavioral analysis, AI/ML models, sequence pattern detection, and graph-based network analysis to detect fraudulent transactions in real-time.

## 🎥 Demo

**[Watch Live Demo Video](https://drive.google.com/file/d/15HCAuWhfzSLYWMd_2UO5S06kiTvHpQc2/view?usp=sharing)**

See the system in action: real-time risk assessment, interactive graph visualization, and comprehensive fraud detection across all four layers.

---

## 🎯 Project Context

### Hackathon MVP

This project was developed as a **Minimum Viable Product (MVP)** for a hackathon with the following goals:

- ✅ **Demonstrate feasibility** of a 4-layer fraud detection architecture
- ✅ **Prove concept** of combining traditional ML with graph-based intelligence
- ✅ **Showcase innovation** in sequence pattern analysis for bot detection
- ✅ **Validate approach** using synthetic but realistic data

### What This IS

- ✅ A working proof-of-concept with real ML models
- ✅ An innovative architecture for fraud detection
- ✅ A demonstration of advanced cybersecurity concepts
- ✅ A foundation for future production development

### What This IS NOT

- ❌ Production-ready software
- ❌ Trained on real fraud data
- ❌ Fully optimized or hardened
- ❌ An official Absher platform product

---

## 📋 Overview

Absher Raqeeb (رقيب أبشر - "Absher Watchman") is an advanced security intelligence platform that protects government services from fraud through a unique 4-layer architecture:

### ✨ Key Features

- 🔍 **4 Integrated Risk Layers**:
  - **Behavioral Risk**: Immediate behavior analysis (0-50 points)
  - **AI/ML Risk**: 3 complementary ML models (0-40 points)
  - **Sequence Risk**: Session pattern analysis (0-30 points)
  - **Graph Risk**: Network & connection analysis (0-50 points)

- 🤖 **Advanced ML Models**:
  - RandomForest Classifier (98.88% accuracy on synthetic data)
  - IsolationForest (unsupervised anomaly detection)
  - MLP Neural Network (96.25% accuracy on synthetic data)

- 🕸️ **Interactive Graph Visualization**: Visualize connections between IPs, devices, and document hashes using D3.js force-directed graphs

- 📊 **Comprehensive Dashboard**: Detailed risk breakdown, analytics, real-time transaction feed, and database view

- ⚡ **Real-time Evaluation**: Instant results with clear, actionable explanations in both English and Arabic

- 🌐 **Bilingual Support**: Full RTL support with Arabic explanations for Saudi Arabian government services

---

## 🏗️ Technology Stack

### Backend
- **Flask** - Python web framework for API
- **scikit-learn** - ML models (RandomForest, IsolationForest, MLPClassifier)
- **NumPy** - Data processing
- **Joblib** - Model persistence

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **D3.js** - Interactive graph visualization
- **Recharts** - Data visualization charts
- **Lucide React** - Icon library

---

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Setup Instructions

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd absher-raqeeb-ai
```

#### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install flask numpy scikit-learn joblib
```

#### 3. Train ML Models
```bash
# Run training script (generates synthetic data and trains models)
python train_model.py
```

This will create models in the `models/` directory:
- `security_risk_model.pkl` (RandomForest)
- `isolation_forest_model.pkl` (IsolationForest)
- `neural_network_model.pkl` (MLPClassifier)
- `scaler.pkl` (StandardScaler)

#### 4. Frontend Setup
```bash
cd frontend
npm install
```

---

## 🚀 Running the Application

### 1. Start Backend Server
```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Run Flask server
python app.py
```

Server will run on `http://localhost:5000`

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

Application will be available at `http://localhost:5173`

---

## 📖 Usage

### Evaluate a Transaction

Send a POST request to `/evaluate`:
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

### Response
```json
{
  "behavior_risk": 50,
  "ai_risk": 40,
  "sequence_risk": 16,
  "graph_risk": 42,
  "total_risk": 100,
  "decision": "BLOCK",
  "reasons": ["new_device", "big_location_jump", ...],
  "reason_details": ["Operation from new device...", ...]
}
```

### Decision Types

| Risk Range | Decision | Description |
|------------|----------|-------------|
| 0-30 | ALLOW | Allow transaction |
| 31-60 | ALERT | Alert for monitoring |
| 61-80 | CHALLENGE | Request additional verification |
| 81-100 | BLOCK | Block and review |

---

## 🔬 The Four Layers - Detailed Explanation

### 1️⃣ Behavioral Risk Layer (0-50 points)

Analyzes immediate behavioral signals:
- **New/unknown device** (+25 points)
- **Large location change** (>500 km) (+20 points)
- **Unusual access time** (2-5 AM) (+15 points)
- **High operation frequency** (>5 ops in 24h) (+10 points)
- **Sensitive service request** (+20 points)

**Why it works**: Combines multiple weak signals into a strong indicator of suspicious behavior.

---

### 2️⃣ AI/ML Risk Layer (0-40 points)

Employs three complementary ML models:

#### **RandomForest Classifier** (Supervised)
- **Accuracy**: 98.88% on synthetic training data
- **How it works**: 150 decision trees vote on risk probability
- **Contribution**: 0-25 points (probability × 25)

#### **IsolationForest** (Unsupervised)
- **How it works**: Detects anomalies by isolation principle
- **Contribution**: 0-25 points (anomaly score × 80)

#### **MLP Neural Network** (Deep Learning)
- **Accuracy**: 96.25% on synthetic training data
- **Architecture**: 32 → 16 → 8 neurons with ReLU activation
- **Contribution**: 0-25 points (probability × 25)

**Ensemble Result**:
```python
total_ai_risk = min(rf_risk + iso_risk + nn_risk, 40)
```

**8 Input Features**:
1. `device_is_known` (0/1)
2. `location_change_km` (0-2000)
3. `hour_of_day` (0-23)
4. `ops_last_24h` (0-20)
5. `is_sensitive_service` (0/1)
6. `session_length` (1-10)
7. `sensitive_count` (0-3)
8. `repeated_flag` (0/1)

---

### 3️⃣ Sequence Risk Layer (0-30 points)

Detects suspicious session patterns:

1. **Repeated login/payment attempts** (+5 points)
   - 3+ logins or 2+ payments = credential stuffing

2. **Multiple sensitive services** (+8 points)
   - 2+ sensitive actions in one session

3. **Sensitive action too early** (+15 points)
   - login → sensitive_service directly (bot-like)

4. **Long session** (+8 points)
   - 7+ steps = reconnaissance pattern

5. **Pattern drift** (+10 points)
   - Deviation from user's normal behavior

**Example**:
```python
seq = ["login", "renew_passport", "payment"]
# Sensitive too early = 15 points
# Total = 15 points ✅
```

---

### 4️⃣ Graph Risk Layer (0-50 points)

Analyzes connections to known fraud cases:

- **IP shared with fraud** (+10 per case, max 30)
- **Device linked to fraud** (+12 per case, max 35)
- **Document hash reused** (+8 per case, max 25)
- **Sequence similarity** (+5 if >60% similar to fraud patterns)

**Example**:
```python
# IP used in 2 fraud cases
ip_risk = 10 * 2 = 20 points

# Device linked to 1 fraud case
device_risk = 12 * 1 = 12 points

# Sequence 85% similar to known fraud
similarity_bonus = 5 points

total = 20 + 12 + 5 = 37 points ✅
```

---

## 📊 ML Models & Training

### Training Data

- **4,000 synthetic samples** (3,200 training + 800 test)
- **Generated using rule-based logic** to simulate realistic fraud scenarios
- **Balanced dataset** with proper class weighting
- **Note**: In production, this would be replaced with real historical fraud data

### Model Performance (on Synthetic Data)

| Model | Accuracy | Precision | Recall | F1-Score |
|-------|----------|-----------|--------|----------|
| RandomForest | 98.88% | 0.997 | 0.989 | 0.993 |
| Neural Network | 96.25% | 0.970 | 0.985 | 0.977 |
| IsolationForest | Unsupervised | - | - | - |

> **Note**: These metrics are on synthetic data. Real-world performance would need validation on actual fraud cases.

---

## 🕸️ Graph Visualization

### Features

- **Interactive D3.js force-directed graph**
- **Nodes**: IPs, devices, document hashes
- **Edges**: Connections between assets
- **Color-coded**: By asset type and risk level
- **Draggable**: Pan, zoom, and explore connections

### How to Use

1. Navigate to "Graph Visualization" tab
2. Click "Update Graph"
3. Drag nodes to explore connections
4. Hover for details

---

## 📁 Project Structure
```
absher-raqeeb-ai/
├── app.py                          # Flask backend API
├── train_model.py                  # ML model training script
├── models/                         # Trained ML models
│   ├── security_risk_model.pkl
│   ├── isolation_forest_model.pkl
│   ├── neural_network_model.pkl
│   └── scaler.pkl
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main React component
│   │   └── ...
│   ├── package.json
│   └── ...
├── LICENSE                         # MIT License
└── README.md                       # This file
```

---

## 🔧 API Endpoints

### `POST /evaluate`

Evaluate a new transaction for fraud risk.

**Request Body**:
```json
{
  "user_id": "string",
  "device_is_known": boolean,
  "location_change_km": number,
  "hour_of_day": number,
  "ops_last_24h": number,
  "is_sensitive_service": boolean,
  "session_sequence": ["string"],
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
  "decision": "ALLOW|ALERT|CHALLENGE|BLOCK",
  "reasons": ["string"],
  "reason_details": ["string"]
}
```

---

### `POST /confirm-fraud`

Register a confirmed fraud case for graph learning.

**Request Body**:
```json
{
  "ip_address": "string",
  "device_id": "string",
  "doc_hash": "string",
  "session_sequence": ["string"]
}
```

**Response**:
```json
{
  "status": "registered"
}
```

---

### `GET /graph-data`

Retrieve graph visualization data.

**Response**:
```json
{
  "nodes": [
    {"id": "string", "label": "string", "type": "ip|device|doc"}
  ],
  "links": [
    {"source": "string", "target": "string"}
  ]
}
```

---

## 🧪 Testing

### Manual Testing via UI

1. Navigate to "Dashboard" tab
2. Click "Manual Test Panel" (expand form)
3. Input test scenarios:
   - Normal user: low risk values
   - Suspicious: new device + location change
   - Bot attack: repeated logins + fast execution
4. Click "Evaluate" and review results

### Example Test Scenarios

**Low Risk**:
```json
{
  "device_is_known": true,
  "location_change_km": 10,
  "hour_of_day": 14,
  "session_sequence": ["login", "home", "logout"]
}
// Expected: ALLOW (risk < 30)
```

**High Risk**:
```json
{
  "device_is_known": false,
  "location_change_km": 900,
  "hour_of_day": 3,
  "session_sequence": ["login", "login", "renew_passport", "payment"]
}
// Expected: BLOCK (risk > 80)
```

---

## 🔒 MVP Limitations & Security

### Current Limitations

This is a **hackathon MVP** with the following limitations:

#### Data & Training
- ⚠️ **Synthetic Training Data**: Models trained on generated data, not real fraud cases
- ⚠️ **In-Memory Storage**: No persistent database (data lost on restart)
- ⚠️ **Limited Dataset**: Only 4,000 training samples

#### Security
- ⚠️ **CORS Open**: Allows all origins (`*`) - must restrict in production
- ⚠️ **No Authentication**: No user authentication or API keys
- ⚠️ **No Rate Limiting**: Vulnerable to DoS attacks
- ⚠️ **Minimal Input Validation**: Trusts client inputs

#### Scalability
- ⚠️ **Single-threaded**: Flask development server (not production-ready)
- ⚠️ **No Caching**: Recalculates everything on each request
- ⚠️ **No Load Balancing**: Cannot handle high traffic

### Production Requirements

To make this production-ready, you would need:

✅ **Data Layer**
- Train on real historical fraud data (10,000+ cases)
- Implement PostgreSQL/MongoDB for persistence
- Add data encryption at rest and in transit

✅ **Security Layer**
- JWT authentication with role-based access control
- Rate limiting (e.g., 100 requests/minute per user)
- Input validation and sanitization
- HTTPS only with proper certificates
- API key management

✅ **Infrastructure**
- Deploy with Gunicorn/uWSGI (not Flask dev server)
- Add Redis for caching and session management
- Implement load balancing (nginx/HAProxy)
- Set up monitoring (Prometheus/Grafana)
- Add structured logging (ELK stack)

✅ **ML Operations**
- Continuous model retraining pipeline
- A/B testing for model improvements
- Feature store for consistent feature engineering
- Model versioning and rollback capability

✅ **Testing & QA**
- Comprehensive unit tests (>80% coverage)
- Integration tests for all API endpoints
- Performance testing under load
- Security penetration testing

---

## 🚧 Future Development Roadmap

### Phase 1: Production Hardening
- [ ] Database integration (PostgreSQL)
- [ ] Authentication & authorization (JWT)
- [ ] Rate limiting and security headers
- [ ] Comprehensive input validation
- [ ] Production-grade server (Gunicorn)

### Phase 2: Enhanced ML
- [ ] Train on real fraud data
- [ ] Add more sophisticated features
- [ ] Implement model retraining pipeline
- [ ] Add model explainability (SHAP values)
- [ ] A/B testing framework

### Phase 3: Advanced Features
- [ ] Real-time alert system
- [ ] Admin dashboard for case management
- [ ] Historical trend analysis
- [ ] Fraud analyst tools
- [ ] Automated case triage

### Phase 4: Enterprise Scale
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] Multi-region support
- [ ] 99.99% uptime SLA
- [ ] SOC 2 compliance

---

## 👥 Contributing

This is an open-source hackathon project. Contributions are welcome!

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Areas Needing Help

- 🐛 **Bug Fixes**: Report or fix issues
- 📖 **Documentation**: Improve guides and examples
- 🧪 **Testing**: Add unit/integration tests
- 🎨 **UI/UX**: Enhance frontend design
- 🤖 **ML Models**: Improve model accuracy
- 🔒 **Security**: Identify and fix vulnerabilities

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**MIT License Summary**: You can use, modify, and distribute this code freely, even for commercial purposes. Just include the original license and copyright notice.

---

## 🙏 Acknowledgments

- Built as a hackathon project to demonstrate innovative fraud detection techniques
- Inspired by real-world fraud detection systems from Stripe, PayPal, and Square
- Research based on industry best practices from Akamai, F5 Labs, and Imperva
- Designed for Saudi Arabian government platforms (Absher concept)
- Special thanks to the open-source community for amazing tools and libraries

---

## 📧 Contact & Support

### Questions?
- Open an issue on GitHub for bug reports or feature requests
- Check existing issues before creating a new one

### Hackathon Judges
This project demonstrates:
- ✅ Novel 4-layer architecture for fraud detection
- ✅ Real ML implementation (not mock data)
- ✅ Graph-based intelligence for fraud networks
- ✅ Practical application to government services
- ✅ Clean, well-documented code
- ✅ Interactive visualization of complex data

---

## ⚠️ Disclaimer

This is a proof-of-concept developed for educational and demonstration purposes as part of a hackathon. It is **not affiliated with** the official Absher platform or the Saudi Arabian government. 

**Do not use in production** without significant security hardening, real data validation, and proper testing.

---

**Made with ❤️ for secure government platforms**

*Absher Raqeeb AI - Demonstrating the future of intelligent fraud detection*
