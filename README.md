⚖️ Unbiased AI Decision
Ensuring fairness and detecting bias in automated decisions — before they cause real harm.

Google Solutions Challenge 2026 submission.

🚀 Links
Asset	URL
🌐 Live MVP	https://your-mvp-url.web.app
📊 Project Deck	https://your-deck-link.com
🎬 Demo Video	https://youtu.be/your-demo-id
💻 GitHub	https://github.com/yourhandle/unbiased-ai-decision
📋 Problem Statement
Automated systems increasingly decide who gets hired, approved for loans, or flagged in healthcare. When trained on flawed historical data, these models quietly repeat and amplify societal discrimination across protected groups — with no visibility into the harm being done.

🛠️ What It Does
Unbiased AI Decision is a general-purpose bias auditing platform. Organizations upload a dataset (and optionally a trained model) and receive a structured, actionable fairness report.

Detection
Dataset Audit — auto-detects sensitive attributes (gender, race, age, income, ZIP code, and more); flags distributional imbalances
Model Audit — computes 5 industry-standard fairness metrics across every sensitive attribute
SHAP Explainability — reveals which features drive predictions and whether sensitive attributes carry disproportionate weight
Downloadable PDF Report — structured findings with severity ratings and mitigation steps
Fairness Metrics Computed
Metric	Flags When	Why It Matters
Demographic Parity Difference	diff > 0.10	Detects systemic exclusion
Equalized Odds (TPR/FPR)	diff > 0.10	Ensures equal accuracy across groups
Disparate Impact Ratio	ratio < 0.80	Legal compliance — the "80% rule"
Predictive Parity	diff > 0.10	Prevents precision gaps across groups
FNR Difference	diff > 0.10	Avoids systematic denial in high-stakes domains
Sensitive Attributes Supported
Gender · Race/Ethnicity · Age · Religion · Disability · Income · Education · ZIP/Postal Code · Nationality · Custom user-defined attributes

🏗️ Tech Stack
Backend          Python 3.11 · FastAPI · Uvicorn
ML / Fairness    Scikit-learn · Fairlearn · IBM AIF360 · SHAP
Data             Pandas · NumPy
Report           fpdf2 (PDF generation)
Frontend         React 18 · Vite · Tailwind CSS · Recharts
Cloud            Google Cloud Run · Vertex AI · Firebase · Cloud Run
Containers       Docker · Docker Compose · Nginx
