# Unbiased AI - Algorithm CVE Auditor

```text
  _    _       _     _                    _          _____ 
 | |  | |     | |   (_)                  | |   /\   |_   _|
 | |  | |_ __ | |__  _  __ _ ___  ___  __| |  /  \    | |  
 | |  | | '_ \| '_ \| |/ _` / __|/ _ \/ _` | / /\ \   | |  
 | |__| | | | | |_) | | (_| \__ \  __/ (_| |/ ____ \ _| |_ 
  \____/|_| |_|_.__/|_|\__,_|___/\___|\__,_/_/    \_\_____|
```

## 📖 Overview
Unbiased AI is a comprehensive, enterprise-ready dual-stack application designed to audit machine learning algorithms, datasets, and models for statistical blockages and discriminatory biases. Traditional Continuous Integration/Continuous Deployment (CI/CD) pipelines check for security vulnerabilities and bugs, but they lack the ability to mathematically audit fairness. Unbiased AI bridges this gap.
It helps data scientists, compliance officers, and engineers identify, quantify, and explain biases in data structures and predictions, ensuring fair and equitable outcomes for protected attributes (e.g., age, gender, race, demographic location). By integrating advanced language models, the application not only flags numeric disparities but generates human-readable mitigation strategies to address the root causes of biased data.
---
## ✨ Features
- **Automated CSV Dataset Analysis**: Programmatically uploads datasets to run automated detection algorithms checking for class imbalances and variance clustering.
- **Parametric Bias Scoring**: Calculates a robust, normalized "Bias Score" providing a quantitative assessment of fairness across diverse demographic segments.
- **AI-Powered Insights & Explanations**: Translates strictly mathematical variance and bias flags into detailed, human-readable explanations. It also yields prescriptive mitigation strategies to neutralize identified biases.
- **Permanent History & Report Management**: Audits are securely versioned and cataloged using Firebase Firestore, allowing compliance teams to track algorithmic equity over time.
- **Interactive, Accessible Dashboard**: A sleek frontend UI that visualizes metric disparity, provides score charts, and allows one-click report generation.
---
## 🛠 Tech Stack
### ⚙️ Backend
- **Framework**: FastAPI (Python 3.9+) - utilized for high-performance, asynchronous REST API generation.
- **Database**: Firebase Admin SDK (Firestore) - provides NoSQL document storage for historical reports and workspace metadata.
- **Data Engineering**: `pandas`, `numpy`, and `scikit-learn` - for vectorized analysis, variance computation, and demographic clustering.
- **AI Integration**: Advanced Language Models - configured to safely parse statistical data and formulate mitigation plans.
### 🖥 Frontend
- **Framework**: Next.js (React 18+) with App Router navigation.
- **Language**: TypeScript - ensuring type-safety across complex payload parsing.
- **Styling**: Tailwind CSS - for rapid, highly customizable design implementations.
- **Deployment**: Vercel-ready platform architecture.
---
## 📊 System Architecture
1. **Client Layer**: The Next.js dashboard requests datasets and submits them via standard `multipart/form-data`.
2. **Analysis Engine (FastAPI)**: Validates bounds, processes the `.csv` in memory iteratively, and extracts variance vectors. If biases cross the heuristic thresholds, it generates an internal bias profile.
3. **Intel Layer**: Flags are securely pushed to an external language model prompt structure. The AI calculates semantic meaning and returns a parsed explanation.
4. **Storage Layer**: Processed results and raw scores are serialized and vaulted into Firestore collections (`projects`, `datasets`, `reports`).
---
## 🔌 Detailed API Reference
The backend exposes a highly structured RESTful API. Base URL: `http://localhost:8000`
### 1. Analysis & Explainability
#### `POST /analyze`
Analyzes an uploaded dataset computationally to index potential discriminative parameters.
- **Request Type**: `multipart/form-data`
- **Parameters**: 
  - `file` (File): The raw `.csv` array dataset.
- **Internal Processing**: 
  1. Securely buffers the data stream via `pandas`.
  2. Maps standard demographic aliases (e.g., `age`, `gender`, `ethnicity`).
  3. Calculates normalization and variance metrics across class dimensions.
  4. Formulates a compound `Bias Score` (0 = unbiased, 100 = completely disproportionate).
- **Successful Response Example (`200 OK`)**:
  ```json
  {
    "status": "success",
    "filename": "customer_data_q3.csv",
    "bias_score": 45,
    "detected_issues": [
      "Gender imbalance detected: class exceeds 70% normalization threshold.",
      "Age variance flag: Standard deviation < 5 indicates clustering."
    ],
    "timestamp": "2026-04-08T18:30:00Z"
  }
  ```
#### `POST /explain`
Generates a highly-detailed, natural-language explanation and mitigation layout based on raw computation metrics.
- **Request Type**: `application/json`
- **Body**:
  ```json
  {
    "bias_score": 45,
    "issues": [
      "Gender imbalance detected",
      "Age variance flag"
    ],
    "context": "Credit scoring algorithmic dataset"
  }
  ```
- **Internal Processing**: Ingests the JSON payload, formats a highly contextual zero-shot prompt with the advanced language model, and streams back the synthesized mitigation.
- **Successful Response Example (`200 OK`)**:
  ```json
  {
    "status": "success",
    "explanation": "The dataset demonstrates a heavy male skew, representing over 75% of the data. Furthermore, the age grouping is strictly centralized around the 25-30 demographic. This will cause downstream classification algorithms to overfit towards younger males.\n\n**Mitigation Strategy:**\n1. Implement SMOTE (Synthetic Minority Over-sampling Technique) to algorithmically pad the underrepresented groups.\n2. Apply stratified k-fold cross-validation during train/test splits."
  }
  ```
### 2. Project & History Management
#### `GET /projects`
Fetches active organizational projects and auditing scopes.
- **Successful Response Example (`200 OK`)**:
  ```json
  {
    "projects": [
      {
        "id": "proj_94b1a",
        "name": "Q3 Consumer Credit Audit",
        "created_at": "2026-04-01T10:00:00Z",
        "status": "active"
      }
    ]
  }
  ```
#### `GET /datasets`
Retrieves indexing metadata for previously assimilated `.csv` files.
- **Successful Response Example (`200 OK`)**:
  ```json
  {
    "datasets": [
      {
        "id": "ds_102",
        "filename": "q3_cleaned.csv",
        "size_kb": 1405,
        "rows": 10400,
        "uploaded_at": "2026-04-05T12:00:00Z"
      }
    ]
  }
  ```
#### `GET /history`
Pulls chronicled algorithm risk reports mapping historical compliance.
- **Successful Response Example (`200 OK`)**:
  ```json
  {
    "reports": [
      {
        "report_id": "rep_9x81",
        "dataset_name": "q3_cleaned.csv",
        "bias_score": 45,
        "resolution_status": "pending_review",
        "generated_at": "2026-04-08T18:30:00Z"
      }
    ]
  }
  ```
---
## 🔐 Environment Variables
You must maintain `.env` files in both your frontend and backend directories.
**Backend (`backend/.env`)**
```env
# AI API Key bindings
API_KEY=your_genai_api_key
# Firebase Environment variables (Alternatively, place a serviceAccount.json in /config)
FIREBASE_PROJECT_ID=unbiased-ai-production
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@unbiased-ai-production.iam.gserviceaccount.com
```
**Frontend (`frontend/.env.local`)**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
---
## 🚀 Getting Started
### Prerequisites
Ensure you have the following mapped to your system PATH:
- **Node.js** (v18.0.0 or higher) / **npm** 
- **Python** (v3.9 or higher)
- **Git**
### Installation Guide
#### 1. Repository Cloning
```bash
git clone https://github.com/your-username/unbiased-ai-main.git
cd unbiased-ai-main/unbiased-ai-main
```
#### 2. Backend Initialization
Initialize the virtual Python environment to encapsulate dependencies.
```bash
cd backend
python -m venv venv
# Windows syntax
venv\Scripts\activate
# Mac/Linux syntax
source venv/bin/activate
# Install compiled wheel requirements
pip install -r requirements.txt
# Start the local development server (Asynchronous Uvicorn)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*The API will boot at `http://localhost:8000`. Swagger documentation is automatically available at `http://localhost:8000/docs`.*
#### 3. Frontend Initialization
Boot up a secondary terminal layer and compile the Next JS runtime.
```bash
cd frontend
# Install package-lock configuration
npm install
# Build & Run Fast-Refresh Dev Server
npm run dev
```
*The Dashboard interface will launch at `http://localhost:3000`.*
---
## 📁 Repository Deep Dive
```text
unbiased-ai-main/
├── backend/
│   ├── app/
│   │   ├── config/          # Infrastructure binders (Firebase schema, API credentials)
│   │   ├── routes/          # Isolated API controllers (analyze.py)
│   │   ├── services/        # Abstraction layer for complex math & LLM prompts (bias_service.py)
│   │   └── main.py          # FastAPI application origin & CORS middleware mappings
│   └── requirements.txt
└── frontend/
    ├── app/                 # Next.js 14 App Router layout (page.tsx, layout.tsx)
    ├── components/          # Reusable Tailwind atomic design chunks (Cards, Modals)
    ├── public/              # Static SVG and Font declarations
    ├── tailwind.config.ts   # Core UI token engine
    └── package.json
```
---
## 📜 License
This software is distributed under the proprietary **MIT License**. See `LICENSE` for structural declarations and liability warranties.
