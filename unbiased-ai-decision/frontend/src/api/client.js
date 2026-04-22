import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const client = axios.create({ baseURL: BASE_URL });

/**
 * POST /audit/dataset
 * @param {File} file  CSV file
 * @param {string} targetColumn
 * @param {string} sensitiveAttributes  comma-separated column names (optional)
 */
export async function auditDataset(file, targetColumn, sensitiveAttributes = "") {
  const form = new FormData();
  form.append("file", file);
  form.append("target_column", targetColumn);
  if (sensitiveAttributes) form.append("sensitive_attributes", sensitiveAttributes);
  const { data } = await client.post("/audit/dataset", form);
  return data;
}

/**
 * POST /audit/model
 * @param {File} datasetFile  CSV with ground-truth labels
 * @param {string} targetColumn
 * @param {string} sensitiveAttributes  comma-separated column names
 * @param {File|null} modelFile  optional pickled sklearn model
 * @param {string} predictionColumn  alternative to model file
 */
export async function auditModel(
  datasetFile,
  targetColumn,
  sensitiveAttributes,
  modelFile = null,
  predictionColumn = ""
) {
  const form = new FormData();
  form.append("dataset_file", datasetFile);
  form.append("target_column", targetColumn);
  form.append("sensitive_attributes", sensitiveAttributes);
  if (modelFile) form.append("model_file", modelFile);
  if (predictionColumn) form.append("prediction_column", predictionColumn);
  const { data } = await client.post("/audit/model", form);
  return data;
}

/**
 * GET /report/{auditId}  → opens PDF download
 */
export function getReportUrl(auditId) {
  return `${BASE_URL}/report/${auditId}`;
}

/**
 * GET /audit/{auditId}
 */
export async function getAudit(auditId) {
  const { data } = await client.get(`/audit/${auditId}`);
  return data;
}
