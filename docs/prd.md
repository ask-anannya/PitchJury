# Requirements Document

## 1. Application Overview

### 1.1 Application Name
Roast my deck

### 1.2 Description
A tool that allows users to upload a PDF document (pitch deck, resume, or proposal), select a target audience, and run a simulated AI focus group where 5-7 professional personas react to the document. Users receive an aggregate score, individual persona breakdowns, and a consensus report. They then enter a 5-round defence session inside an animated courtroom where they argue back against the room. After the defence, a shareable panel card is generated.

## 2. Page Structure and Functionality

### 2.1 Page Structure
```
├── Screen 1: Setup
├── Screen 2: Focus Group Report
├── Screen 3: Defence Room
└── Screen 4: Shareable Panel Card
```

### 2.2 Screen 1 — Setup

#### 2.2.1 PDF Upload Section
- File upload field accepting PDF files
- Upon upload, extract text content from PDF
- Display extracted text in an editable text area labeled \"Review extracted text — correct any errors before proceeding\"
- Store final content as session variable `extracted_document_text` when Run Focus Group button is clicked

#### 2.2.2 Audience Category Selector
- Section titled \"Who is your audience?\"
- Four selectable cards:
  - Seed Investors
  - Enterprise Buyers
  - Hiring Managers at Tech Companies
  - Series A Investors
- One card selected at a time
- Store category name as `audience_category`
- Load corresponding persona panel into `active_personas`

#### 2.2.3 Harshness Dial
- Three options: Constructive / Direct / Brutal
- Default: Constructive
- Store selection as `harshness_level`

#### 2.2.4 Run Focus Group Button
- Disabled until PDF uploaded and audience selected
- Triggers full AI pipeline when clicked

### 2.3 Screen 2 — Focus Group Report

#### 2.3.1 Header Section
- Display audience category
- Show aggregate score as X.X/10
- Display consensus verdict (one sentence)

#### 2.3.2 Persona Card Row
- One card per persona showing:
  - Name
  - Role
  - Individual score
  - One-line verdict
  - Sharpest objection with direct quote in italics
- Clicking card expands to show full section breakdown
- Three rewrite buttons per expanded card:
  - Shorter + Punchier
  - More Specific
  - Full Panel Rewrite

#### 2.3.3 Points of Consensus Block
- Display objections raised by 3 or more personas
- Ranked by count

#### 2.3.4 Before/After Rewrite Panel
- Show original and rewritten worst section side by side
- Display \"What Changed\" bullets below

#### 2.3.5 Enter the Room Button
- Triggers defence room animation
- Loads Screen 3

### 2.4 Screen 3 — Defence Room

#### 2.4.1 Courtroom Animation
- Full-screen animated courtroom sequence
- Personas displayed as illustrated avatars at balustrade
- Defence chat embedded directly in the room
- Use complete HTML implementation provided in specification file at /workspace/app-bn2wrjsgz11d/tasks/medo_full_spec.md

#### 2.4.2 Persona Avatars
- Display 5-7 professional personas as illustrated avatars
- Persona images:
  - https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260517/Gemini_Generated_Image_675ujo675ujo675u.png
  - https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260517/Gemini_Generated_Image_d76deyd76deyd76d.png
  - https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260517/Gemini_Generated_Image_isd49gisd49gisd4.png
  - https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260517/yc.png
- Avatars positioned at balustrade
- Visual indication when persona is speaking

#### 2.4.3 Defence Chat Interface
- Embedded chat within courtroom scene
- 5-round defence session
- Display exchange counter showing remaining rounds
- User input text area for defence arguments
- Send button to submit defence
- Display chat messages from both user and personas
- Show typing indicators when personas are responding

#### 2.4.4 Session Completion
- After 5 rounds, display completion banner
- Show \"Generate Panel Card\" button
- Button triggers generation of Screen 4

### 2.5 Screen 4 — Shareable Panel Card

#### 2.5.1 Panel Card Display
- Rendered from AI Action 8 output
- Public shareable URL
- Display final evaluation results

## 3. Business Rules and Logic

### 3.1 PDF Processing Flow
- User uploads PDF file
- System extracts text content
- User reviews and edits extracted text if needed
- User selects audience category
- User sets harshness level
- User clicks Run Focus Group to initiate AI analysis

### 3.2 AI Focus Group Generation
- Use `large-language-model` skill (Gemini 2.5 Flash via SSE streaming through Edge Functions)
- Generate responses from 5-7 professional personas based on selected audience category
- Each persona provides:
  - Individual score
  - One-line verdict
  - Sharpest objection with direct quote from document
  - Full section breakdown
- Calculate aggregate score
- Generate consensus verdict
- Identify points of consensus (objections raised by 3+ personas)

### 3.3 Rewrite Functionality
- Three rewrite options per persona section:
  - Shorter + Punchier: condense content while maintaining impact
  - More Specific: add detail and specificity
  - Full Panel Rewrite: comprehensive revision based on all feedback
- Generate before/after comparison
- Highlight what changed

### 3.4 Defence Session Rules
- Exactly 5 rounds of exchange
- User submits defence argument each round
- Personas respond to user's defence
- Visual indication of speaking persona
- Exchange counter decrements after each round
- Session ends after 5 rounds
- Generate Panel Card button appears upon completion

### 3.5 Persona Assignment by Audience Category

#### Seed Investors
- YC Partner
- Angel Investor
- Pre-seed VC
- Startup Advisor
- Tech Entrepreneur

#### Enterprise Buyers
- CTO
- VP of Engineering
- Procurement Manager
- IT Director
- Business Analyst

#### Hiring Managers at Tech Companies
- Engineering Manager
- HR Director
- Technical Recruiter
- Team Lead
- VP of Engineering

#### Series A Investors
- Series A VC Partner
- Growth Investor
- Investment Analyst
- Portfolio Manager
- Venture Partner

### 3.6 AI Actions
- All AI interactions use `large-language-model` skill
- Gemini 2.5 Flash model via SSE streaming through Edge Functions
- Persona prompts, AI action definitions, and database schema detailed in /workspace/app-bn2wrjsgz11d/tasks/medo_full_spec.md

## 4. Exception and Boundary Cases

| Scenario | Handling |
|----------|----------|
| User uploads non-PDF file | Display error message prompting PDF files only |
| PDF text extraction fails | Display error message indicating extraction failure |
| PDF contains no extractable text | Display message indicating no text content found |
| User attempts to run focus group without selecting audience | Keep Run Focus Group button disabled |
| User attempts to run focus group without uploading PDF | Keep Run Focus Group button disabled |
| AI service unavailable | Display error message indicating service unavailable |
| Defence session interrupted | Preserve session state for resumption |
| User attempts to send empty defence message | Disable send button when input is empty |
| Network error during streaming response | Display error and allow retry |

## 5. Acceptance Criteria

1. User uploads a PDF file and extracted text displays in editable text area
2. User selects one of four audience categories
3. User sets harshness level and clicks Run Focus Group
4. Focus Group Report displays with aggregate score, consensus verdict, and persona cards
5. User clicks Enter the Room and courtroom animation plays
6. User completes 5 rounds of defence in Defence Room with persona responses
7. User clicks Generate Panel Card and shareable card is created
8. User accesses shareable public URL for Panel Card

## 6. Out of Scope for Current Release

- Support for file formats other than PDF
- Batch processing of multiple documents
- Saving draft sessions for later completion
- User account system and login
- History of previous evaluations
- Editing or regenerating Panel Card after creation
- Downloading Panel Card as image or PDF
- Social sharing integrations beyond public URL
- Custom persona creation
- Adjusting number of defence rounds
- Real-time collaboration features
- Mobile app versions
- Offline mode
- Multi-language support
- Analytics dashboard
- Payment or subscription features