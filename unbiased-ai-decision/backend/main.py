"""
Unbiased AI Decision - Backend API
Bias detection & fairness auditing for datasets and ML models
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import numpy as np
import pickle
import io
import uuid
import json
import tempfile
import os
from typing import Optional, List
import warnings
warnings.filterwarnings("ignore")

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
app = FastAPI(
    title="Unbiased AI Decision API",
    description="Bias detection and fairness auditing for datasets and ML models",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-memory audit store ───────────────────────────────────────────────────
audit_store: dict = {}

# ─── Known sensitive attributes (auto-detection) ─────────────────────────────
SENSITIVE_KEYWORDS = [
    "gender", "sex", "age", "race", "ethnicity", "religion",
    "disability", "income", "education", "zip", "postal",
    "nationality", "country", "region", "location", "marital",
    "pregnant", "color", "colour", "caste", "class"
]

# ─── Helpers ──────────────────────────────────────────────────────────────────

def detect_sensitive_attributes(df: pd.DataFrame) -> List[str]:
    """Auto-detect sensitive attribute columns by keyword matching on column names."""
    detected = []
    for col in df.columns:
        col_norm = col.lower().replace(" ", "_").replace("-", "_")
        for kw in SENSITIVE_KEYWORDS:
            if kw in col_norm:
                detected.append(col)
                break
    return detected


def compute_dataset_stats(df: pd.DataFrame, sensitive_cols: List[str]) -> dict:
    """Compute distribution stats and imbalance flags for each sensitive attribute."""
    stats = {}
    for col in sensitive_cols:
        if col not in df.columns:
            continue
        vc = df[col].value_counts(normalize=True).round(4)
        dist = {str(k): float(v) for k, v in vc.items()}
        stats[col] = {
            "distribution": dist,
            "unique_values": int(df[col].nunique()),
            "missing_pct": round(float(df[col].isnull().mean()) * 100, 2),
            "imbalance_flagged": max(dist.values()) > 0.70 if dist else False,
            "dominant_group": max(dist, key=dist.get) if dist else None,
        }
    return stats


# ─── Fairness Metric Functions ────────────────────────────────────────────────

def _group_positive_rates(y_pred: np.ndarray, col: str, df: pd.DataFrame) -> dict:
    rates = {}
    for g in df[col].dropna().unique():
        mask = df[col] == g
        if mask.sum() == 0:
            continue
        rates[str(g)] = round(float(y_pred[mask.values].mean()), 4)
    return rates


def demographic_parity(y_pred: np.ndarray, col: str, df: pd.DataFrame) -> dict:
    """Difference in positive prediction rates across groups."""
    rates = _group_positive_rates(y_pred, col, df)
    if len(rates) < 2:
        return {"rates_by_group": rates, "difference": 0.0, "flagged": False}
    diff = round(max(rates.values()) - min(rates.values()), 4)
    return {"rates_by_group": rates, "difference": diff, "flagged": diff > 0.10}


def equalized_odds(y_true: np.ndarray, y_pred: np.ndarray, col: str, df: pd.DataFrame) -> dict:
    """TPR and FPR difference across groups."""
    tpr_by_group, fpr_by_group = {}, {}
    for g in df[col].dropna().unique():
        mask = df[col] == g
        yt = y_true[mask.values]
        yp = y_pred[mask.values]
        tp = int(((yp == 1) & (yt == 1)).sum())
        fn = int(((yp == 0) & (yt == 1)).sum())
        fp = int(((yp == 1) & (yt == 0)).sum())
        tn = int(((yp == 0) & (yt == 0)).sum())
        tpr = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        tpr_by_group[str(g)] = round(float(tpr), 4)
        fpr_by_group[str(g)] = round(float(fpr), 4)

    tpr_diff = round(max(tpr_by_group.values()) - min(tpr_by_group.values()), 4) if len(tpr_by_group) >= 2 else 0.0
    fpr_diff = round(max(fpr_by_group.values()) - min(fpr_by_group.values()), 4) if len(fpr_by_group) >= 2 else 0.0
    return {
        "tpr_by_group": tpr_by_group,
        "fpr_by_group": fpr_by_group,
        "tpr_difference": tpr_diff,
        "fpr_difference": fpr_diff,
        "flagged": tpr_diff > 0.10 or fpr_diff > 0.10,
    }


def disparate_impact(y_pred: np.ndarray, col: str, df: pd.DataFrame) -> dict:
    """Ratio of min to max positive rate (should be >= 0.80)."""
    rates = _group_positive_rates(y_pred, col, df)
    if len(rates) < 2 or max(rates.values()) == 0:
        return {"rates_by_group": rates, "ratio": 1.0, "flagged": False, "interpretation": "N/A"}
    ratio = round(min(rates.values()) / max(rates.values()), 4)
    return {
        "rates_by_group": rates,
        "ratio": ratio,
        "flagged": ratio < 0.80,
        "interpretation": "Passes 80% rule" if ratio >= 0.80 else "Fails 80% rule – legal risk",
    }


def predictive_parity(y_true: np.ndarray, y_pred: np.ndarray, col: str, df: pd.DataFrame) -> dict:
    """Precision (PPV) difference across groups."""
    ppv = {}
    for g in df[col].dropna().unique():
        mask = df[col] == g
        yt = y_true[mask.values]
        yp = y_pred[mask.values]
        tp = int(((yp == 1) & (yt == 1)).sum())
        fp = int(((yp == 1) & (yt == 0)).sum())
        ppv[str(g)] = round(float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0, 4)
    diff = round(max(ppv.values()) - min(ppv.values()), 4) if len(ppv) >= 2 else 0.0
    return {"precision_by_group": ppv, "difference": diff, "flagged": diff > 0.10}


def fnr_difference(y_true: np.ndarray, y_pred: np.ndarray, col: str, df: pd.DataFrame) -> dict:
    """False Negative Rate difference across groups."""
    fnr = {}
    for g in df[col].dropna().unique():
        mask = df[col] == g
        yt = y_true[mask.values]
        yp = y_pred[mask.values]
        fn = int(((yp == 0) & (yt == 1)).sum())
        tp = int(((yp == 1) & (yt == 1)).sum())
        fnr[str(g)] = round(float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0, 4)
    diff = round(max(fnr.values()) - min(fnr.values()), 4) if len(fnr) >= 2 else 0.0
    return {"fnr_by_group": fnr, "difference": diff, "flagged": diff > 0.10}


def count_flags(fairness_metrics: dict) -> int:
    count = 0
    for attr_metrics in fairness_metrics.values():
        for metric in attr_metrics.values():
            if isinstance(metric, dict) and metric.get("flagged"):
                count += 1
    return count


# ─── API Endpoints ────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {"service": "Unbiased AI Decision API", "version": "1.0.0", "status": "running"}


@app.post("/api/audit/dataset", tags=["Audit"])
async def audit_dataset(
    file: UploadFile = File(..., description="CSV dataset file"),
    target_column: str = Form(..., description="Name of the target/label column"),
    sensitive_attributes: Optional[str] = Form(
        None, description="Comma-separated column names (leave blank for auto-detect)"
    ),
):
    """
    Audit a CSV dataset for distributional bias across sensitive attributes.
    Returns per-attribute distribution statistics and imbalance flags.
    """
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    if target_column not in df.columns:
        raise HTTPException(
            status_code=422,
            detail=f"Target column '{target_column}' not found. Available: {list(df.columns)}"
        )

    # Resolve sensitive attributes
    if sensitive_attributes and sensitive_attributes.strip():
        sens_cols = [s.strip() for s in sensitive_attributes.split(",") if s.strip() in df.columns]
    else:
        sens_cols = detect_sensitive_attributes(df)

    dataset_stats = compute_dataset_stats(df, sens_cols)
    flagged_count = sum(1 for s in dataset_stats.values() if s.get("imbalance_flagged"))

    if target_column in df.columns:
        vc = df[target_column].value_counts(normalize=True).round(4)
        class_dist = {str(k): float(v) for k, v in vc.items()}
    else:
        class_dist = {}

    audit_id = str(uuid.uuid4())
    result = {
        "audit_id": audit_id,
        "type": "dataset",
        "filename": file.filename,
        "rows": len(df),
        "columns": len(df.columns),
        "all_columns": list(df.columns),
        "target_column": target_column,
        "detected_sensitive_attributes": sens_cols,
        "dataset_stats": dataset_stats,
        "class_distribution": class_dist,
        "missing_values_total": int(df.isnull().sum().sum()),
        "summary": {
            "total_sensitive_attributes": len(sens_cols),
            "flagged_imbalances": flagged_count,
            "risk": "High" if flagged_count >= 3 else "Medium" if flagged_count >= 1 else "Low",
        },
    }
    audit_store[audit_id] = result
    return result


@app.post("/api/audit/model", tags=["Audit"])
async def audit_model(
    dataset_file: UploadFile = File(..., description="CSV dataset with ground-truth labels"),
    target_column: str = Form(...),
    sensitive_attributes: str = Form(..., description="Comma-separated sensitive column names"),
    model_file: Optional[UploadFile] = File(None, description="Pickled sklearn-compatible model"),
    prediction_column: Optional[str] = Form(
        None, description="Column name with pre-computed predictions (alternative to model file)"
    ),
):
    """
    Audit a trained ML model for fairness across sensitive attributes.
    Computes Demographic Parity, Equalized Odds, Disparate Impact,
    Predictive Parity, and FNR Difference.
    Optionally runs SHAP feature importance if a model file is provided.
    """
    try:
        content = await dataset_file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    if target_column not in df.columns:
        raise HTTPException(status_code=422, detail=f"Target column '{target_column}' not found.")

    sens_cols = [s.strip() for s in sensitive_attributes.split(",") if s.strip() in df.columns]
    if not sens_cols:
        raise HTTPException(status_code=422, detail="No valid sensitive attribute columns found.")

    y_true = df[target_column].values.astype(int)

    # ── Get predictions ──────────────────────────────────────────────────────
    model = None
    shap_importance = None

    if model_file:
        try:
            raw = await model_file.read()
            model = pickle.loads(raw)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not load model pickle: {e}")

        feature_cols = [c for c in df.columns if c not in [target_column] + sens_cols]
        X = df[feature_cols].select_dtypes(include=[np.number]).fillna(0)

        try:
            y_pred = model.predict(X).astype(int)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Model prediction failed: {e}")

        # SHAP explainability
        try:
            import shap
            if len(X) > 500:
                X_sample = X.sample(500, random_state=42)
            else:
                X_sample = X
            explainer = shap.Explainer(model, X_sample)
            sv = explainer(X_sample)
            mean_abs = np.abs(sv.values).mean(axis=0)
            feat_importance = sorted(
                zip(X_sample.columns.tolist(), mean_abs.tolist()),
                key=lambda x: x[1], reverse=True
            )[:12]
            shap_importance = [{"feature": f, "importance": round(v, 5)} for f, v in feat_importance]
        except Exception:
            shap_importance = None  # SHAP is best-effort

    elif prediction_column and prediction_column in df.columns:
        y_pred = df[prediction_column].values.astype(int)
    else:
        raise HTTPException(
            status_code=422,
            detail="Provide either a model file or a prediction_column in the dataset."
        )

    # ── Compute fairness metrics ─────────────────────────────────────────────
    fairness_metrics: dict = {}
    for col in sens_cols:
        fairness_metrics[col] = {
            "demographic_parity": demographic_parity(y_pred, col, df),
            "equalized_odds": equalized_odds(y_true, y_pred, col, df),
            "disparate_impact": disparate_impact(y_pred, col, df),
            "predictive_parity": predictive_parity(y_true, y_pred, col, df),
            "fnr_difference": fnr_difference(y_true, y_pred, col, df),
        }

    total_flags = count_flags(fairness_metrics)
    risk = "High" if total_flags >= 5 else "Medium" if total_flags >= 2 else "Low"
    recommendations = {
        "High": (
            "Multiple fairness violations detected. Recommended actions: "
            "(1) Apply dataset reweighing or resampling. "
            "(2) Use adversarial debiasing during training. "
            "(3) Apply post-processing threshold calibration per group. "
            "(4) Conduct human review before deployment."
        ),
        "Medium": (
            "Moderate bias detected. Recommended actions: "
            "(1) Review flagged metrics by group. "
            "(2) Consider targeted threshold adjustment. "
            "(3) Increase representation of underserved groups in training data."
        ),
        "Low": (
            "Low bias detected. "
            "Continue monitoring after deployment with periodic re-audits. "
            "Set up drift detection for sensitive attribute distributions."
        ),
    }

    audit_id = str(uuid.uuid4())
    result = {
        "audit_id": audit_id,
        "type": "model",
        "filename": dataset_file.filename,
        "rows": len(df),
        "sensitive_attributes": sens_cols,
        "fairness_metrics": fairness_metrics,
        "shap_feature_importance": shap_importance,
        "summary": {
            "total_flags": total_flags,
            "bias_risk": risk,
            "recommendation": recommendations[risk],
        },
    }
    audit_store[audit_id] = result
    return result


@app.get("/api/audit/{audit_id}", tags=["Audit"])
def get_audit(audit_id: str):
    """Retrieve a previously computed audit result by ID."""
    if audit_id not in audit_store:
        raise HTTPException(status_code=404, detail="Audit ID not found.")
    return audit_store[audit_id]


@app.get("/api/report/{audit_id}", tags=["Report"])
def generate_report(audit_id: str):
    """Generate and download a PDF bias audit report."""
    if audit_id not in audit_store:
        raise HTTPException(status_code=404, detail="Audit ID not found.")

    result = audit_store[audit_id]

    try:
        from fpdf import FPDF

        class PDF(FPDF):
            def header(self):
                self.set_fill_color(15, 23, 42)
                self.rect(0, 0, 210, 25, "F")
                self.set_y(7)
                self.set_font("Helvetica", "B", 14)
                self.set_text_color(6, 182, 212)
                self.cell(0, 10, "UNBIASED AI DECISION", ln=False, align="L")
                self.set_font("Helvetica", "", 9)
                self.set_text_color(148, 163, 184)
                self.cell(0, 10, "Bias Audit Report", ln=True, align="R")
                self.set_text_color(0, 0, 0)
                self.ln(5)

            def footer(self):
                self.set_y(-15)
                self.set_font("Helvetica", "I", 8)
                self.set_text_color(148, 163, 184)
                self.cell(0, 10, f"Page {self.page_no()} | Unbiased AI Decision | Confidential", align="C")

        pdf = PDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=20)

        # ── Title block ──────────────────────────────────────────────────────
        pdf.set_font("Helvetica", "B", 18)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 12, "Bias Audit Report", ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(100, 116, 139)
        pdf.cell(0, 6, f"Audit ID: {audit_id}", ln=True)
        pdf.cell(0, 6, f"Audit Type: {result.get('type', 'N/A').upper()}", ln=True)
        pdf.cell(0, 6, f"File: {result.get('filename', 'N/A')}", ln=True)
        pdf.cell(0, 6, f"Rows Analysed: {result.get('rows', 'N/A'):,}", ln=True)
        pdf.ln(6)

        # ── Summary box ──────────────────────────────────────────────────────
        summary = result.get("summary", {})
        risk = summary.get("bias_risk", summary.get("risk", "N/A"))
        risk_colors = {"High": (239, 68, 68), "Medium": (245, 158, 11), "Low": (34, 197, 94)}
        rc = risk_colors.get(risk, (100, 116, 139))

        pdf.set_fill_color(248, 250, 252)
        pdf.set_draw_color(226, 232, 240)
        pdf.rect(10, pdf.get_y(), 190, 30, "DF")
        pdf.set_xy(15, pdf.get_y() + 5)
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*rc)
        pdf.cell(0, 8, f"Overall Bias Risk: {risk}", ln=True)
        pdf.set_xy(15, pdf.get_y())
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(51, 65, 85)
        if result.get("type") == "model":
            pdf.cell(0, 6, f"Total Flags: {summary.get('total_flags', 0)}", ln=True)
        else:
            pdf.cell(0, 6, f"Imbalances Flagged: {summary.get('flagged_imbalances', 0)}", ln=True)
        pdf.ln(8)

        # ── Recommendation ───────────────────────────────────────────────────
        rec = summary.get("recommendation", "")
        if rec:
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(0, 8, "Recommendation", ln=True)
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(51, 65, 85)
            pdf.multi_cell(0, 6, rec)
            pdf.ln(4)

        # ── Model Fairness Metrics ────────────────────────────────────────────
        if result.get("type") == "model":
            pdf.set_font("Helvetica", "B", 13)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(0, 10, "Fairness Metrics by Sensitive Attribute", ln=True)

            metric_labels = {
                "demographic_parity": "Demographic Parity Difference",
                "equalized_odds": "Equalized Odds",
                "disparate_impact": "Disparate Impact Ratio",
                "predictive_parity": "Predictive Parity",
                "fnr_difference": "False Negative Rate Difference",
            }

            for attr, metrics in result.get("fairness_metrics", {}).items():
                pdf.set_font("Helvetica", "B", 11)
                pdf.set_fill_color(241, 245, 249)
                pdf.set_text_color(6, 182, 212)
                pdf.cell(0, 8, f"  Attribute: {attr}", ln=True, fill=True)

                for key, label in metric_labels.items():
                    m = metrics.get(key, {})
                    flagged = m.get("flagged", False)
                    pdf.set_font("Helvetica", "B" if flagged else "", 10)
                    pdf.set_text_color(239, 68, 68) if flagged else pdf.set_text_color(51, 65, 85)

                    if key == "demographic_parity":
                        val = f"Diff={m.get('difference', 'N/A')}"
                    elif key == "equalized_odds":
                        val = f"TPR Diff={m.get('tpr_difference', 'N/A')}, FPR Diff={m.get('fpr_difference', 'N/A')}"
                    elif key == "disparate_impact":
                        val = f"Ratio={m.get('ratio', 'N/A')} ({m.get('interpretation', '')})"
                    elif key == "predictive_parity":
                        val = f"Diff={m.get('difference', 'N/A')}"
                    elif key == "fnr_difference":
                        val = f"Diff={m.get('difference', 'N/A')}"
                    else:
                        val = ""

                    status = "⚠ FLAGGED" if flagged else "✓ OK"
                    pdf.cell(0, 7, f"    {label}: {val}  [{status}]", ln=True)
                pdf.ln(3)

        # ── Dataset Stats ─────────────────────────────────────────────────────
        if result.get("type") == "dataset":
            pdf.set_font("Helvetica", "B", 13)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(0, 10, "Dataset Distribution Analysis", ln=True)

            for attr, stats in result.get("dataset_stats", {}).items():
                pdf.set_font("Helvetica", "B", 11)
                pdf.set_fill_color(241, 245, 249)
                pdf.set_text_color(6, 182, 212)
                pdf.cell(0, 8, f"  {attr}", ln=True, fill=True)
                pdf.set_font("Helvetica", "", 10)
                pdf.set_text_color(51, 65, 85)
                for grp, pct in stats.get("distribution", {}).items():
                    pdf.cell(0, 6, f"    {grp}: {pct*100:.1f}%", ln=True)
                flagged = stats.get("imbalance_flagged", False)
                if flagged:
                    pdf.set_text_color(239, 68, 68)
                    pdf.cell(0, 6, "    ⚠ Distribution imbalance flagged (>70% dominant group)", ln=True)
                pdf.set_text_color(51, 65, 85)
                pdf.ln(2)

        # ── SHAP ─────────────────────────────────────────────────────────────
        shap_data = result.get("shap_feature_importance")
        if shap_data:
            pdf.set_font("Helvetica", "B", 13)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(0, 10, "SHAP Feature Importance (Top 10)", ln=True)
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(51, 65, 85)
            for i, item in enumerate(shap_data[:10], 1):
                pdf.cell(0, 6, f"  {i}. {item['feature']}: {item['importance']:.5f}", ln=True)
            pdf.ln(4)

        # ── Methodology note ─────────────────────────────────────────────────
        pdf.set_font("Helvetica", "I", 9)
        pdf.set_text_color(148, 163, 184)
        pdf.multi_cell(0, 5,
            "Methodology: Metrics computed using industry-standard fairness definitions. "
            "Thresholds: Demographic Parity / Predictive Parity / FNR difference > 0.10 flagged; "
            "Equalized Odds TPR/FPR difference > 0.10 flagged; Disparate Impact < 0.80 flagged (80% rule). "
            "Aligned with OECD AI Principles, EU AI Act, and Google Responsible AI guidelines."
        )

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        pdf.output(tmp.name)
        tmp.close()

        return FileResponse(
            tmp.name,
            media_type="application/pdf",
            filename=f"bias_audit_report_{audit_id[:8]}.pdf",
        )

    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="PDF generation requires fpdf2. Install it with: pip install fpdf2"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")


@app.get("/api/audits", tags=["Audit"])
def list_audits():
    """List all audit IDs stored in the current session."""
    return {
        "audits": [
            {"audit_id": k, "type": v.get("type"), "rows": v.get("rows")}
            for k, v in audit_store.items()
        ]
    }
