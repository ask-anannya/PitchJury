<div align="center">

# PitchJury

### AI-Powered Pitch & Document Evaluation Platform

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Edge%20Functions-3ECF8E?style=flat&logo=supabase)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=flat&logo=google)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

**Get your pitch, product doc, or proposal torn apart by an AI panel — before the real thing does.**

---
## Deployed Link- https://app-bn2wrjsgz11d.appmedo.com
---

</div>

---

## The Problem

You spend weeks crafting a pitch deck, investment memo, or product spec. Then you walk into the room, and the questions you weren't prepared for are the ones that kill your pitch. Traditional feedback loops are slow, biased, and often too polite. Advisors and peers don't always push hard enough. And there's no way to rehearse the questions you haven't thought of yet.

## The Solution

PitchJury simulates a room full of expert evaluators — investors, enterprise buyers, hiring panels — who read your document independently and give you structured, quantitative, unsparing feedback. Each AI persona has a distinct background, evaluation lens, and weighted influence. You get a full panel debrief, a scored report, and a live Q&A defence session — all before you step into the real room.

---

## Features

### Document Ingestion
Upload a PDF (pitch deck, investment memo, product spec, job application, or any document) or paste text directly. PitchJury extracts content using `pdfjs-dist` with an OCR fallback via `tesseract.js` for scanned documents.

### Audience Selection
Choose the panel most relevant to your goals:

| Audience | Archetypes |
|---|---|
| **Seed Investors** | YC Partners, Angels, First-Cheque VCs, Market Sceptics |
| **Series A Investors** | Lead Partners, Associates, Portfolio Founders, Technical Co-investors |
| **Enterprise Buyers** | CISOs, CFOs, Procurement Leads, End Users, IT Managers |
| **Hiring Managers** | Engineering Managers, VPs of Engineering, Technical Interviewers, Recruiters |

Each panel contains 12 personas with distinct backgrounds, seniority levels, and evaluation priorities — weighted by influence.

### Harshness Control
Set the tone of the critique before the panel reads your document:
- **Constructive** — honest feedback with a supportive frame
- **Direct** — straight to the issues, no softening
- **Brutal** — maximum scrutiny, minimum mercy

### Quantitative Simulation
The 12 personas independently evaluate your document and produce:

- **Weighted aggregate score** (0–10) and standard deviation across the panel
- **Sentiment distribution** — from strongly positive to strongly negative
- **Proceed rate** — percentage of the panel that would advance you to the next step
- **Kill criteria flags** — specific red flags triggered (e.g. unclear market size, no moat, team gaps)
- **NPS equivalent** — how likely each persona is to recommend your pitch to a peer
- **Willingness-to-pay signal** — qualitative assessment of commercial intent
- **Section-by-section critiques** with direct quotes pulled from your document
- **Sharpest objection** per persona and what would genuinely change their mind

### Panel Report
An animated reveal of your aggregate score, followed by:
- Full verdict from each persona in their own voice
- Consensus objections raised across the panel
- Score breakdown by persona archetype and weight
- Kill criteria summary across the full panel

### Deep Analysis
A synthesised second-pass analysis that draws from all 12 simulation outputs to identify:
- The strongest consensus objections
- The most contested points across the panel
- Strategic recommendations for addressing weaknesses
- What the panel agrees on vs. where they diverge

### Defence Room
A live Q&A simulation where the panel interrogates you directly. You state your opening defence, the panel pushes back with the hardest questions from their evaluation, and you respond. The exchange continues for up to 5 rounds — exactly the format of a real pitch Q&A. Useful for rehearsing investor meetings, customer discovery conversations, or job interviews.

### Shareable Report Card
Generate a one-page summary card with your score, panel verdict, and key flags — designed to share with teammates or co-founders.

---

## User Flow

```
1. Upload PDF or paste document text
         │
         ▼
2. Select audience panel (Seed Investors / Series A / Enterprise Buyers / Hiring Managers)
         │
         ▼
3. Set harshness level (Constructive / Direct / Brutal)
         │
         ▼
4. 12 AI personas independently evaluate your document (in parallel, batched)
         │
         ▼
5. Quantitative aggregation — scores, sentiment, kill criteria, proceed rate
         │
         ▼
6. Panel Report — animated score reveal + per-persona verdicts
         │
         ├──▶ Deep Analysis — synthesised strategic recommendations
         │
         └──▶ Defence Room — live Q&A with the panel
                    │
                    ▼
              Shareable Report Card
```

---

## Technical Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** (rolldown-vite build)
- **Tailwind CSS** with Radix UI component primitives (shadcn/ui)
- **React Router v7** for client-side routing
- **Recharts** for score visualisations
- **Motion** (Framer Motion) for animations
- **pdfjs-dist** + **tesseract.js** for PDF text extraction and OCR

### Backend
- **Supabase** — PostgreSQL database storing session state, simulation outputs, and deep analysis results
- **Supabase Edge Functions** — serverless function proxying requests to the AI gateway
- **Gemini 2.5 Flash** via Miaoda AI gateway — powers all persona simulations, aggregation, deep analysis, and defence room Q&A

### AI Pipeline

```
Document Text
      │
      ├── × 12 persona prompts (parallel, batched in groups of 3)
      │         │
      │         ▼
      │   Gemini 2.5 Flash (via Edge Function)
      │         │
      │         ▼
      │   Structured JSON output per persona
      │   (score, sentiment, kill criteria, verdicts, critiques)
      │
      ▼
Quantitative Aggregation
      │
      ▼
Deep Analysis (single pass over all 12 outputs)
      │
      ▼
Defence Room (interactive multi-turn Q&A)
```

### Database Schema

```
sessions
├── id
├── extracted_document_text
├── audience_category
├── harshness_level
├── simulation_outputs       -- JSON array of 12 persona results
├── all_roast_outputs        -- Legacy format for VerdictViewer
├── aggregate_score
├── weighted_score
├── score_std_deviation
├── sentiment_distribution
├── kill_criteria_summary
├── proceed_rate
├── deep_analysis_json
└── created_at
```

---

## Project Structure

```
pitchjury/
├── src/
│   ├── pages/
│   │   ├── SetupPage.tsx          # Document upload + panel selection
│   │   ├── ReportPage.tsx         # Animated score reveal + verdicts
│   │   ├── DeepAnalysisPage.tsx   # Synthesised strategic analysis
│   │   ├── DefenceRoomPage.tsx    # Live Q&A with the panel
│   │   ├── ExtractorPage.tsx      # PDF/OCR extraction utility
│   │   └── ShareableCardPage.tsx  # Shareable summary card
│   ├── contexts/
│   │   └── SessionContext.tsx     # Global session state + all AI calls
│   ├── lib/
│   │   ├── personas.ts            # All 48 persona definitions across 4 panels
│   │   └── pdf-ocr.ts             # PDF extraction + tesseract OCR
│   ├── components/
│   │   ├── VerdictViewer.tsx      # Per-persona verdict cards
│   │   └── common/                # Shared UI components
│   ├── db/
│   │   └── supabase.ts            # Supabase client
│   └── routes.tsx                 # App routing
├── supabase/
│   ├── functions/
│   │   ├── ai-action/             # Edge function — proxies to Gemini
│   │   └── extract-pdf/           # Edge function — server-side PDF extraction
│   └── migrations/                # Database schema migrations
└── public/
    └── images/                    # Persona avatars and panel imagery
```

---

## Installation

### Prerequisites

- Node.js >= 20
- pnpm
- Supabase project with the migrations applied
- Gemini API access via Miaoda gateway (or substitute your own)

### Setup

**1. Clone the repository**

```bash
git clone https://github.com/ask-anannya/PitchJury.git
cd PitchJury
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Configure environment variables**

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_ID=your_app_id
```

**4. Apply database migrations**

Run the migrations in `supabase/migrations/` against your Supabase project via the Supabase dashboard or CLI.

**5. Deploy the Edge Functions**

```bash
supabase functions deploy ai-action
supabase functions deploy extract-pdf
```

Set the `INTEGRATIONS_API_KEY` secret on your Edge Functions to authenticate against the AI gateway.

**6. Start the development server**

```bash
npx vite --host 127.0.0.1
```

App available at `http://127.0.0.1:5173`

---

## Team

Built by **Akshat Shende** and **Anannya** at the Mind the Product Hackathon 2025.
