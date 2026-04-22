"""
Generate a synthetic hiring dataset for testing Unbiased AI Decision.

Intentional biases introduced:
  - Women have lower hiring rate than men (demographic parity violation)
  - Black applicants have lower hiring rate (disparate impact violation)
  - Older applicants (>50) have lower hiring rate (age bias)

Run:  python generate_sample.py
Output: sample_hiring.csv  (1000 rows)
"""

import pandas as pd
import numpy as np

np.random.seed(42)
N = 1000

genders    = np.random.choice(["Male", "Female", "Non-binary"], N, p=[0.52, 0.44, 0.04])
races      = np.random.choice(["White", "Black", "Hispanic", "Asian", "Other"], N, p=[0.50, 0.20, 0.15, 0.10, 0.05])
ages       = np.random.randint(22, 65, N)
education  = np.random.choice(["High School", "Bachelor", "Master", "PhD"], N, p=[0.20, 0.45, 0.28, 0.07])
experience = np.clip(np.random.normal(8, 5, N).astype(int), 0, 30)
score      = np.clip(np.random.normal(70, 15, N).astype(int), 0, 100)
zipcode    = np.random.choice(["10001", "90210", "60601", "77002", "30301"], N)

# Base hiring probability from merit
p_hire = (score / 100) * 0.6 + (experience / 30) * 0.3

# Introduce biases
p_hire[genders == "Female"] *= 0.72        # gender bias
p_hire[races == "Black"] *= 0.68           # racial bias
p_hire[races == "Hispanic"] *= 0.75        # racial bias
p_hire[ages > 50] *= 0.65                  # age bias

p_hire = np.clip(p_hire, 0, 1)
hired = (np.random.rand(N) < p_hire).astype(int)

df = pd.DataFrame({
    "age":        ages,
    "gender":     genders,
    "race":       races,
    "education":  education,
    "experience_years": experience,
    "aptitude_score":   score,
    "zipcode":    zipcode,
    "hired":      hired,
})

df.to_csv("sample_hiring.csv", index=False)
print(f"Generated sample_hiring.csv ({N} rows)")
print(f"Overall hire rate: {hired.mean():.1%}")
print("\nHire rate by gender:")
print(df.groupby("gender")["hired"].mean().round(3))
print("\nHire rate by race:")
print(df.groupby("race")["hired"].mean().round(3))
print("\nHire rate by age group:")
df["age_group"] = pd.cut(df["age"], bins=[21,30,40,50,65], labels=["22-30","31-40","41-50","51-64"])
print(df.groupby("age_group")["hired"].mean().round(3))
