"""
Train a simple biased classifier on sample_hiring.csv and save it as model.pkl.
Use this model with the Model Audit feature to test fairness metric computation + SHAP.

Run:
  python generate_sample.py          # first, generate the dataset
  python train_sample_model.py       # then train and save the model
"""

import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# ── Load data ────────────────────────────────────────────────────────────────
df = pd.read_csv("sample_hiring.csv")

# ── Encode categoricals ──────────────────────────────────────────────────────
le_map = {}
cat_cols = ["gender", "race", "education", "zipcode"]
df_enc = df.copy()
for col in cat_cols:
    le = LabelEncoder()
    df_enc[col] = le.fit_transform(df[col].astype(str))
    le_map[col] = le

# ── Feature / target split ───────────────────────────────────────────────────
feature_cols = ["age", "gender", "race", "education", "experience_years", "aptitude_score", "zipcode"]
X = df_enc[feature_cols]
y = df_enc["hired"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ── Train ────────────────────────────────────────────────────────────────────
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# ── Evaluate ─────────────────────────────────────────────────────────────────
y_pred = clf.predict(X_test)
print("Model performance on test set:")
print(classification_report(y_test, y_pred))

# ── Save ─────────────────────────────────────────────────────────────────────
with open("model.pkl", "wb") as f:
    pickle.dump(clf, f)

print("\nSaved model to model.pkl")
print("Upload sample_hiring.csv + model.pkl to the Model Audit tab.")
print("Set target_column = 'hired', sensitive_attributes = 'gender, race, age'")
