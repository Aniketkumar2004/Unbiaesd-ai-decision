# ⚖️ Unbiased AI Decision

> **Ensuring fairness and detecting bias in automated decisions — before they cause real harm.**

Google Solutions Challenge 2026 submission.

---

## 🚀 Links

| Asset | URL |
|---|---|
| 🌐 Live MVP | `https://your-mvp-url.web.app` |
| 📊 Project Deck | `https://your-deck-link.com` |
| 🎬 Demo Video | `https://youtu.be/your-demo-id` |
| 💻 GitHub | `https://github.com/yourhandle/unbiased-ai-decision` |

---

## 📋 Problem Statement

Automated systems increasingly decide who gets hired, approved for loans, or flagged in
healthcare. When trained on flawed historical data, these models quietly repeat and amplify
societal discrimination across protected groups — with no visibility into the harm being done.

---

## 🛠️ What It Does

**Unbiased AI Decision** is a general-purpose bias auditing platform. Organizations upload a
dataset (and optionally a trained model) and receive a structured, actionable fairness report.

### Detection
- **Dataset Audit** — auto-detects sensitive attributes (gender, race, age, income, ZIP code,
  and more); flags distributional imbalances
- **Model Audit** — computes 5 industry-standard fairness metrics across every sensitive attribute
- **SHAP Explainability** — reveals which features drive predictions and whether sensitive
  attributes carry disproportionate weight
- **Downloadable PDF Report** — structured findings with severity ratings and mitigation steps

### Fairness Metrics Computed

| Metric | Flags When | Why It Matters |
|---|---|---|
| Demographic Parity Difference | diff > 0.10 | Detects systemic exclusion |
| Equalized Odds (TPR/FPR) | diff > 0.10 | Ensures equal accuracy across groups |
| Disparate Impact Ratio | ratio < 0.80 | Legal compliance — the "80% rule" |
| Predictive Parity | diff > 0.10 | Prevents precision gaps across groups |
| FNR Difference | diff > 0.10 | Avoids systematic denial in high-stakes domains |

### Sensitive Attributes Supported
Gender · Race/Ethnicity · Age · Religion · Disability · Income · Education ·
ZIP/Postal Code · Nationality · Custom user-defined attributes

---

## 🏗️ Tech Stack

```
Backend          Python 3.11 · FastAPI · Uvicorn
ML / Fairness    Scikit-learn · Fairlearn · IBM AIF360 · SHAP
Data             Pandas · NumPy
Report           fpdf2 (PDF generation)
Frontend         React 18 · Vite · Tailwind CSS · Recharts
Cloud            Google Cloud Run · Vertex AI · Firebase · Cloud Run
Containers       Docker · Docker Compose · Nginx
```

---

## ⚡ Quickstart (Local)

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker (optional but recommended)

---

### Option A — Docker Compose (Recommended)

```bash
git clone https://github.com/yourhandle/unbiased-ai-decision.git
cd unbiased-ai-decision

docker compose up --build
```

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

---

### Option B — Manual

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 🧪 Testing with Sample Data

Generate a synthetic biased hiring dataset and model:

```bash
cd sample_data

# 1. Install dependencies
pip install pandas numpy scikit-learn

# 2. Generate 1,000-row hiring dataset with intentional bias
python generate_sample.py
# → sample_hiring.csv

# 3. Train and save a biased classifier
python train_sample_model.py
# → model.pkl
```

Then upload to the app:
- **Dataset Audit** → upload `sample_hiring.csv`, target = `hired`
- **Model Audit** → upload `sample_hiring.csv` + `model.pkl`, target = `hired`,
  sensitive attributes = `gender, race, age`

You should see **High** bias risk with multiple flags on gender and race.

---

## 📡 API Reference

Interactive docs at `http://localhost:8000/docs`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/audit/dataset` | Upload CSV → dataset distribution audit |
| `POST` | `/api/audit/model` | Upload CSV + model → full fairness audit |
| `GET` | `/api/audit/{id}` | Retrieve audit result by ID |
| `GET` | `/api/report/{id}` | Download PDF report |
| `GET` | `/api/audits` | List all session audits |

**Dataset Audit — form fields:**
```
file                  CSV file (required)
target_column         Name of label column (required)
sensitive_attributes  Comma-separated column names (optional — auto-detects if blank)
```

**Model Audit — form fields:**
```
dataset_file          CSV file with ground-truth labels (required)
target_column         Name of label column (required)
sensitive_attributes  Comma-separated column names (required)
model_file            Pickled sklearn-compatible model (optional)
prediction_column     Pre-computed prediction column name (alternative to model_file)
```

---

## 📁 Project Structure

```
unbiased-ai-decision/
├── backend/
│   ├── main.py               # FastAPI app — all endpoints + metric functions
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Root component + hero page
│   │   ├── api/client.js     # Axios API wrapper
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── UploadSection.jsx   # Step wizard for file upload + config
│   │       ├── Dashboard.jsx       # Results dashboard
│   │       ├── MetricCard.jsx      # Individual fairness metric card
│   │       ├── ShapChart.jsx       # SHAP feature importance chart
│   │       └── DistributionChart.jsx  # Attribute distribution charts
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── sample_data/
│   ├── generate_sample.py    # Generates biased hiring dataset
│   └── train_sample_model.py # Trains + saves sample model.pkl
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 🗺️ Roadmap

- [x] Dataset distribution audit with auto-detection
- [x] 5-metric model fairness audit
- [x] SHAP feature explainability
- [x] PDF bias audit report
- [ ] Automated mitigation: reweighing, adversarial debiasing
- [ ] Post-processing threshold calibration per group
- [ ] Continuous monitoring for deployed models
- [ ] EU AI Act & OECD compliance report templates
- [ ] Firebase auth + multi-user audit history
- [ ] GCP Vertex AI model evaluation integration

---

## 📐 Fairness Thresholds & Methodology

All thresholds follow industry-standard guidelines:

- **Demographic Parity / Predictive Parity / FNR Difference** — flagged if group difference > 0.10
- **Equalized Odds** — flagged if TPR or FPR difference > 0.10 across groups
- **Disparate Impact** — flagged if ratio < 0.80 (the "80% rule" from EEOC guidelines)

Aligned with: OECD AI Principles · EU AI Act (Article 9/10) · Google Responsible AI · IEEE Ethically Aligned Design

---

## 👥 Team

Built for the Google Solutions Challenge 2026.

---

## 📄 License

MIT License — see `LICENSE` for details.
