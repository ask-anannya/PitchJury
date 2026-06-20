import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import { audiencePanels, getPanelByKey, getRepresentativePersonas } from '@/lib/personas';
import type { AudiencePanel, Persona } from '@/lib/personas';

// Legacy output format (for VerdictViewer compatibility)
export interface RoastOutput {
  persona_name: string;
  persona_role: string;
  score: number;
  score_rationale: string;
  verdict: string;
  sharpest_objection: { quote: string; objection: string };
  section_breakdown: Array<{ section: string; quote: string; critique: string }>;
  what_would_change_my_mind: string;
}

export interface ConsensusObjection {
  objection: string;
  raised_by: string[];
  count: number;
}

export interface DefenceMessage {
  role: 'user' | 'panel';
  speaker?: string;
  content: string;
}

// New quantitative simulation types
export interface SimulationOutput {
  persona_key: string;
  persona_name: string;
  persona_archetype: string;
  persona_role: string;
  weight_pct: number;
  quantitative: {
    score: number;
    confidence: number;
    investment_or_approval_likelihood: number;
    would_proceed_to_next_step: boolean;
    kill_criteria_triggered: Record<string, boolean>;
    sentiment: string;
    nps_equivalent: number;
    willingness_to_pay_signal: string;
  };
  qualitative: {
    verdict: string;
    score_rationale: string;
    sharpest_objection: { quote: string; objection: string };
    section_breakdown: Array<{ section: string; quote: string; critique: string }>;
    what_would_change_my_mind: string;
  };
}

export interface ArchetypeScore {
  archetype: string;
  persona_count: number;
  average_score: number;
  average_approval_likelihood: number;
  dominant_sentiment: string;
  proceed_rate: number;
}

export interface QuantitativeAnalysis {
  aggregate_score: number;
  weighted_score: number;
  score_std_deviation: number;
  panel_alignment: string;
  sentiment_distribution: {
    strongly_positive: number;
    positive: number;
    neutral: number;
    negative: number;
    strongly_negative: number;
    strongly_positive_pct: number;
    positive_pct: number;
    neutral_pct: number;
    negative_pct: number;
    strongly_negative_pct: number;
  };
  proceed_rate: number;
  weighted_approval_likelihood: number;
  kill_criteria_frequency: Record<string, { count: number; pct: number; severity: string }>;
  archetype_scores: ArchetypeScore[];
  score_distribution: Record<string, number>;
  consensus_objections: Array<{
    objection: string;
    raised_by_count: number;
    raised_by_pct: number;
    raised_by_archetypes: string[];
    severity: string;
  }>;
  nps_aggregate: {
    mean: number;
    promoters_pct: number;
    passives_pct: number;
    detractors_pct: number;
  };
  panel_alignment_index: number;
  consensus_verdict: string;
  top_rewrite_target: string;
}

export interface KeyTheme {
  theme_name: string;
  description: string;
  representative_quote: string;
  quoted_by_persona: string;
  quoted_by_archetype: string;
  prevalence_pct: number;
  theme_severity: string;
}

export interface ArchetypeDivergence {
  description: string;
  archetype_a: string;
  archetype_b: string;
  archetype_a_avg_score: number;
  archetype_b_avg_score: number;
  key_disagreement: string;
}

export interface StrengthItem {
  strength: string;
  supporting_quote: string;
  quoted_by_persona: string;
  endorsement_pct: number;
}

export interface StrategicVerdict {
  label: string;
  rationale: string;
  confidence: string;
  key_blocker: string;
}

export interface DeepAnalysisJson {
  key_themes: KeyTheme[];
  archetype_divergence: ArchetypeDivergence[];
  strengths: StrengthItem[];
  strategic_verdict: StrategicVerdict;
}

export interface SessionData {
  sessionId: string | null;
  extractedDocumentText: string;
  audienceCategory: string;
  harshnessLevel: 'Constructive' | 'Direct' | 'Brutal';
  activePersonas: Persona[];
  allRoastOutputs: RoastOutput[];
  simulationOutputs: SimulationOutput[];
  aggregateScore: number | null;
  consensusVerdict: string;
  consensusObjections: ConsensusObjection[];
  quantitativeAnalysis: QuantitativeAnalysis | null;
  archetypeScores: ArchetypeScore[] | null;
  deepAnalysisJson: DeepAnalysisJson | null;
  defenceTranscript: DefenceMessage[];
  shareUrl: string;
  isLoading: boolean;
  loadingMessage: string;
  meetPanelShown: boolean;
  scoreRevealed: boolean;
}

interface SessionContextType {
  session: SessionData;
  setDocumentText: (text: string) => void;
  selectAudience: (categoryKey: string) => void;
  setHarshness: (level: 'Constructive' | 'Direct' | 'Brutal') => void;
  runFocusGroup: () => Promise<void>;
  addDefenceMessage: (msg: DefenceMessage) => Promise<void>;
  generateShareableCard: () => Promise<void>;
  markMeetPanelShown: () => void;
  markScoreRevealed: () => void;
  resetSession: () => void;
}

const defaultSession: SessionData = {
  sessionId: null,
  extractedDocumentText: '',
  audienceCategory: '',
  harshnessLevel: 'Constructive',
  activePersonas: [],
  allRoastOutputs: [],
  simulationOutputs: [],
  aggregateScore: null,
  consensusVerdict: '',
  consensusObjections: [],
  quantitativeAnalysis: null,
  archetypeScores: null,
  deepAnalysisJson: null,
  defenceTranscript: [],
  shareUrl: '',
  isLoading: false,
  loadingMessage: '',
  meetPanelShown: false,
  scoreRevealed: false,
};

export const SessionContext = createContext<SessionContextType | null>(null);

function simOutputToRoast(output: SimulationOutput): RoastOutput {
  return {
    persona_name: output.persona_name,
    persona_role: output.persona_role,
    score: output.quantitative.score,
    score_rationale: output.qualitative.score_rationale,
    verdict: output.qualitative.verdict,
    sharpest_objection: output.qualitative.sharpest_objection,
    section_breakdown: output.qualitative.section_breakdown,
    what_would_change_my_mind: output.qualitative.what_would_change_my_mind,
  };
}

function cleanJson(text: string): string {
  let clean = text;
  const fenceMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (fenceMatch) clean = fenceMatch[1];
  else clean = text.replace(/```json\n?|\n?```/g, '');
  clean = clean.trim();
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }
  return clean;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionData>(defaultSession);

  const createSession = useCallback(async (data: Partial<SessionData>) => {
    const { data: result, error } = await supabase
      .from('sessions')
      .insert({
        extracted_document_text: data.extractedDocumentText || '',
        audience_category: data.audienceCategory || '',
        harshness_level: data.harshnessLevel || 'Constructive',
      })
      .select('session_id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    if (!result?.session_id) {
      throw new Error('Failed to create session: no session_id returned');
    }
    return result.session_id as string;
  }, []);

  const updateSession = useCallback(async (sessionId: string, updates: Record<string, unknown>) => {
    const { error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('session_id', sessionId);
    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(`Database update error: ${error.message}`);
    }
  }, []);

  const callAiAction = useCallback(async (prompt: string): Promise<string> => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-action`;
    const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Edge Function error ${response.status}: ${errText || response.statusText}`);
    }

    const data = await response.json();
    if (!data || typeof data.text !== 'string') {
      throw new Error('Empty or invalid response from AI service');
    }
    return data.text;
  }, []);

  const setDocumentText = useCallback((text: string) => {
    setSession((prev) => ({ ...prev, extractedDocumentText: text }));
  }, []);

  const selectAudience = useCallback((categoryKey: string) => {
    const panel = getPanelByKey(categoryKey);
    setSession((prev) => ({
      ...prev,
      audienceCategory: categoryKey,
      activePersonas: panel?.personas || [],
    }));
  }, []);

  const setHarshness = useCallback((level: 'Constructive' | 'Direct' | 'Brutal') => {
    setSession((prev) => ({ ...prev, harshnessLevel: level }));
  }, []);

  const runFocusGroup = useCallback(async () => {
    setSession((prev) => ({ ...prev, isLoading: true, loadingMessage: 'Assembling your panel...' }));

    try {
      let sessionId = session.sessionId;
      if (!sessionId) {
        sessionId = await createSession({
          extractedDocumentText: session.extractedDocumentText,
          audienceCategory: session.audienceCategory,
          harshnessLevel: session.harshnessLevel,
        });
        setSession((prev) => ({ ...prev, sessionId }));
      }

      const totalPersonas = session.activePersonas.length;

      // AI Action 1: Parallel simulation calls per persona
      setSession((prev) => ({ ...prev, loadingMessage: `The panel is reading your document...` }));
      const simPrompts = session.activePersonas.map((persona) => {
        return `You are ${persona.name}, ${persona.role}.

Background: ${persona.background}

Your evaluation lens: ${persona.evaluation_lens}

The document submitted for review:
---
${session.extractedDocumentText}
---

Analyse this document from your specific professional perspective. You must quote directly from the document before critiquing any section — never critique without a specific quote.

Respond ONLY in the following JSON format. No preamble, no markdown fences, no explanation outside the JSON:

{
  "persona_key": "${persona.key}",
  "persona_name": "${persona.name}",
  "persona_archetype": "${persona.archetype}",
  "persona_role": "${persona.role}",
  "weight_pct": ${persona.weight_pct},

  "quantitative": {
    "score": 6,
    "confidence": 0.8,
    "investment_or_approval_likelihood": 35,
    "would_proceed_to_next_step": true,
    "kill_criteria_triggered": {
      "market_too_small_or_unclear": false,
      "team_critical_gap": true,
      "no_defensible_moat": true,
      "insufficient_traction": true,
      "weak_timing_rationale": true,
      "financial_inconsistencies": false,
      "security_or_compliance_failure": false,
      "unsupported_accuracy_claims": false
    },
    "sentiment": "neutral",
    "nps_equivalent": 6,
    "willingness_to_pay_signal": "moderate"
  },

  "qualitative": {
    "verdict": "one sentence overall verdict in your professional voice",
    "score_rationale": "one sentence explaining your score",
    "sharpest_objection": {
      "quote": "exact text quoted directly from the document",
      "objection": "your objection referencing that specific quote"
    },
    "section_breakdown": [
      {
        "section": "section name",
        "quote": "exact text quoted directly from this section",
        "critique": "your critique referencing the quote specifically"
      }
    ],
    "what_would_change_my_mind": "one specific thing that would genuinely update your assessment"
  }
}

CRITICAL RULES:
1. Every section critique must include a direct quote from the document. No quote, no critique.
2. Your verdict and critiques must be written in your specific professional voice, not generic AI feedback.
3. kill_criteria_triggered: set each boolean based on whether you genuinely identified that issue in this specific document.
4. investment_or_approval_likelihood: your honest percentage probability that you would personally proceed based on this document alone. Range 0-100.
5. sentiment must be exactly one of: "strongly_positive", "positive", "neutral", "negative", "strongly_negative"
6. nps_equivalent: how likely you are to recommend this to a peer. Range -100 to 100.
7. Harshness level for this session: ${session.harshnessLevel}`;
      });

      // Initialize simulation_outputs as empty array before any calls fire
      setSession((prev) => ({ ...prev, simulationOutputs: [] }));
      await updateSession(sessionId, { simulation_outputs: [] });

      // Batched parallel calls: groups of 3 personas max per batch to avoid rate limits
      const BATCH_SIZE = 3;
      const CALL_TIMEOUT = 120000; // 120s — matches edge function upstream timeout
      const MAX_RETRIES = 2;
      const BATCH_DELAY_MS = 1500; // brief pause between batches to ease rate limits
      const simOutputs: SimulationOutput[] = [];

      const callWithRetry = async (prompt: string): Promise<SimulationOutput | null> => {
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            if (attempt > 0) await new Promise((r) => setTimeout(r, attempt * 2000));
            const text = await Promise.race([
              callAiAction(prompt),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), CALL_TIMEOUT)
              ),
            ]);
            const clean = cleanJson(text);
            return JSON.parse(clean) as SimulationOutput;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (attempt === MAX_RETRIES) {
              console.error(`Persona simulation failed after ${MAX_RETRIES + 1} attempts:`, msg);
              return null;
            }
            console.warn(`Persona attempt ${attempt + 1} failed, retrying:`, msg);
          }
        }
        return null;
      };

      for (let batchStart = 0; batchStart < simPrompts.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, simPrompts.length);
        const batch = simPrompts.slice(batchStart, batchEnd);

        setSession((prev) => ({
          ...prev,
          loadingMessage: `Reading your document (${Math.min(batchEnd, totalPersonas)} of ${totalPersonas})...`,
        }));

        if (batchStart > 0) await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));

        const batchResults = await Promise.all(batch.map(callWithRetry));

        const validBatch = batchResults.filter(Boolean) as SimulationOutput[];
        simOutputs.push(...validBatch);

        // Append to state — never replace
        setSession((prev) => ({
          ...prev,
          simulationOutputs: [...prev.simulationOutputs, ...validBatch],
        }));
        await updateSession(sessionId, { simulation_outputs: simOutputs });
      }

      // Completion gate: aggregation fires when at least 60% responded (or min 5)
      const minRequired = Math.max(5, Math.ceil(totalPersonas * 0.6));
      if (simOutputs.length < minRequired) {
        console.warn(`Simulation incomplete: ${simOutputs.length}/${totalPersonas} — skipping aggregation`);
        throw new Error(`Simulation incomplete: only ${simOutputs.length} of ${totalPersonas} personas responded. Please try again.`);
      }

      // Convert to legacy RoastOutput for backwards compatibility
      const legacyRoasts = simOutputs.map(simOutputToRoast);

      setSession((prev) => ({
        ...prev,
        simulationOutputs: simOutputs,
        allRoastOutputs: legacyRoasts,
      }));
      await updateSession(sessionId, {
        simulation_outputs: simOutputs,
        all_roast_outputs: legacyRoasts,
      });

      // AI Action 2: Quantitative Aggregation — only fires when sufficient sim outputs collected
      setSession((prev) => ({ ...prev, loadingMessage: 'Computing weighted scores and kill criteria...' }));
      const aggregatePrompt = `You are a quantitative analyst. You have received simulation outputs from ${simOutputs.length} professional personas who evaluated the following document.

Simulation outputs:
---
${JSON.stringify(simOutputs)}
---

Compute the following aggregated statistics and return them as JSON only. No preamble, no markdown fences.

Use the weight_pct field from each persona to compute weighted averages where indicated.

{
  "aggregate_score": 6.2,
  "weighted_score": 6.1,
  "score_std_deviation": 1.2,
  "panel_alignment": "split",

  "sentiment_distribution": {
    "strongly_positive": 2,
    "positive": 8,
    "neutral": 25,
    "negative": 12,
    "strongly_negative": 3,
    "strongly_positive_pct": 4,
    "positive_pct": 16,
    "neutral_pct": 50,
    "negative_pct": 24,
    "strongly_negative_pct": 6
  },

  "proceed_rate": 42,
  "weighted_approval_likelihood": 38.5,

  "kill_criteria_frequency": {
    "market_too_small_or_unclear": {"count": 8, "pct": 16, "severity": "Low"},
    "team_critical_gap": {"count": 35, "pct": 70, "severity": "High"},
    "no_defensible_moat": {"count": 28, "pct": 56, "severity": "High"},
    "insufficient_traction": {"count": 22, "pct": 44, "severity": "Medium"},
    "weak_timing_rationale": {"count": 30, "pct": 60, "severity": "High"},
    "financial_inconsistencies": {"count": 15, "pct": 30, "severity": "Medium"},
    "security_or_compliance_failure": {"count": 5, "pct": 10, "severity": "Low"},
    "unsupported_accuracy_claims": {"count": 18, "pct": 36, "severity": "Medium"}
  },

  "archetype_scores": [
    {
      "archetype": "YC Partner",
      "persona_count": 2,
      "average_score": 6.0,
      "average_approval_likelihood": 32,
      "dominant_sentiment": "neutral",
      "proceed_rate": 50
    }
  ],

  "score_distribution": {
    "1": 0, "2": 1, "3": 3, "4": 5, "5": 8,
    "6": 15, "7": 12, "8": 4, "9": 1, "10": 1
  },

  "consensus_objections": [
    {
      "objection": "description of the shared concern",
      "raised_by_count": 28,
      "raised_by_pct": 56,
      "raised_by_archetypes": ["YC Partner", "Devil's Advocate", "Market Skeptic"],
      "severity": "High"
    }
  ],

  "nps_aggregate": {
    "mean": 12,
    "promoters_pct": 30,
    "passives_pct": 45,
    "detractors_pct": 25
  },

  "panel_alignment_index": 0.72,

  "consensus_verdict": "one sentence accurately representing the panel overall assessment",

  "top_rewrite_target": "the section name receiving the most critical attention across the panel"
}

COMPUTATION RULES:
1. aggregate_score: simple mean of all persona scores
2. weighted_score: mean weighted by weight_pct
3. score_std_deviation: standard deviation of all scores
4. panel_alignment: "aligned" if std_dev < 1.0, "moderate" if 1.0-1.8, "split" if > 1.8
5. proceed_rate: percentage of personas with would_proceed_to_next_step = true
6. weighted_approval_likelihood: weighted mean of investment_or_approval_likelihood
7. kill_criteria_frequency: for each criterion, count how many personas triggered it and compute percentage. Severity: High if pct > 50, Medium if 25-50, Low if below 25
8. archetype_scores: group by persona_archetype, compute averages within each group
9. consensus_objections: identify 3-5 themes that appear across multiple persona critiques
10. panel_alignment_index: 1.0 minus (std_deviation / 5.0), capped 0-1
11. nps_aggregate: compute from nps_equivalent values. Promoters = nps_equivalent >= 70, Detractors = nps_equivalent <= 30, Passives = in between.`;

      let quantData: QuantitativeAnalysis;
      try {
        const aggregateText = await callAiAction(aggregatePrompt);
        const aggregateClean = cleanJson(aggregateText);
        quantData = JSON.parse(aggregateClean);
      } catch {
        // Fallback computation
        const scores = simOutputs.map((s) => s.quantitative.score);
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const weights = simOutputs.map((s) => s.weight_pct);
        const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
        const weightedAvg = simOutputs.reduce((sum, s) => sum + s.quantitative.score * s.weight_pct, 0) / weightSum;
        const mean = avg;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        let alignment = 'moderate';
        if (stdDev < 1.0) alignment = 'aligned';
        else if (stdDev > 1.8) alignment = 'split';
        const proceedCount = simOutputs.filter((s) => s.quantitative.would_proceed_to_next_step).length;
        const proceedRate = Math.round((proceedCount / simOutputs.length) * 100);
        const approvalLikelihoods = simOutputs.map((s) => s.quantitative.investment_or_approval_likelihood);
        const weightedApproval = simOutputs.reduce((sum, s) => sum + s.quantitative.investment_or_approval_likelihood * s.weight_pct, 0) / weightSum;

        quantData = {
          aggregate_score: Math.round(avg * 10) / 10,
          weighted_score: Math.round(weightedAvg * 10) / 10,
          score_std_deviation: Math.round(stdDev * 100) / 100,
          panel_alignment: alignment,
          sentiment_distribution: {
            strongly_positive: 0, positive: 0, neutral: 0, negative: 0, strongly_negative: 0,
            strongly_positive_pct: 0, positive_pct: 0, neutral_pct: 0, negative_pct: 0, strongly_negative_pct: 0,
          },
          proceed_rate: proceedRate,
          weighted_approval_likelihood: Math.round(weightedApproval * 10) / 10,
          kill_criteria_frequency: {},
          archetype_scores: [],
          score_distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 0 },
          consensus_objections: [],
          nps_aggregate: { mean: 0, promoters_pct: 0, passives_pct: 0, detractors_pct: 0 },
          panel_alignment_index: Math.max(0, Math.min(1, 1.0 - stdDev / 5.0)),
          consensus_verdict: 'The panel delivered mixed feedback with several areas requiring attention.',
          top_rewrite_target: '',
        };
      }

      setSession((prev) => ({
        ...prev,
        aggregateScore: quantData.aggregate_score,
        consensusVerdict: quantData.consensus_verdict,
        consensusObjections: (quantData.consensus_objections || []).map((o) => ({
          objection: o.objection,
          raised_by: o.raised_by_archetypes || [],
          count: o.raised_by_count,
        })),
        quantitativeAnalysis: quantData,
        archetypeScores: quantData.archetype_scores || [],
      }));
      await updateSession(sessionId, {
        aggregate_score: quantData.aggregate_score,
        consensus_verdict: quantData.consensus_verdict,
        consensus_objections: quantData.consensus_objections || [],
        quantitative_analysis: quantData,
        archetype_scores: quantData.archetype_scores || [],
      });

      // AI Action 3: Deep Analysis — only fires after quantitative_analysis is fully populated
      if (!quantData || !quantData.aggregate_score) {
        throw new Error('Quantitative analysis is incomplete — cannot generate deep analysis');
      }

      setSession((prev) => ({ ...prev, loadingMessage: 'Generating strategic analysis...' }));
      const deepAnalysisPrompt = `Based on the following simulation outputs and quantitative analysis from a professional panel review, produce a deep analysis report.

Quantitative analysis:
---
${JSON.stringify(quantData)}
---

Full simulation outputs (for qualitative pattern extraction):
---
${JSON.stringify(simOutputs)}
---

Respond in JSON only. No preamble, no markdown fences:

{
  "key_themes": [
    {
      "theme_name": "3-5 word theme name",
      "description": "one sentence describing this pattern of criticism",
      "representative_quote": "exact quote from one reviewer that best captures this theme",
      "quoted_by_persona": "name of the reviewer",
      "quoted_by_archetype": "their archetype",
      "prevalence_pct": 60,
      "theme_severity": "High"
    }
  ],

  "archetype_divergence": [
    {
      "description": "one sentence describing where two archetypes significantly disagreed",
      "archetype_a": "YC Partner",
      "archetype_b": "Technical Co-Investor",
      "archetype_a_avg_score": 7.2,
      "archetype_b_avg_score": 4.8,
      "key_disagreement": "one sentence on what specifically they disagreed about"
    }
  ],

  "strengths": [
    {
      "strength": "one sentence describing something the panel broadly praised",
      "supporting_quote": "exact quote from one reviewer",
      "quoted_by_persona": "name",
      "endorsement_pct": 75
    }
  ],

  "strategic_verdict": {
    "label": "REVISE BEFORE PITCHING",
    "rationale": "Two sentences explaining the overall verdict based on the quantitative data.",
    "confidence": "Medium",
    "key_blocker": "The single most important thing standing between this and a positive outcome"
  }
}

RULES:
1. Exactly 3 key_themes. Each must be supported by at least 25% of personas.
2. 1-3 archetype_divergence entries where average scores differ by more than 1.5 points.
3. 2-3 strengths. These must be genuine positives from the panel, not softening of negatives.
4. strategic_verdict label must be exactly one of: STRONG SUBMISSION, PROCEED WITH CAUTION, REVISE BEFORE PITCHING, SIGNIFICANT REWORK NEEDED.
5. Base the label on weighted_score: 8+ = STRONG SUBMISSION, 6.5-7.9 = PROCEED WITH CAUTION, 5-6.4 = REVISE BEFORE PITCHING, below 5 = SIGNIFICANT REWORK NEEDED.
6. All quotes must be exact quotes from the simulation_outputs, not paraphrases.`;

      let deepAnalysisData: DeepAnalysisJson;
      try {
        const deepAnalysisText = await callAiAction(deepAnalysisPrompt);
        const deepAnalysisClean = cleanJson(deepAnalysisText);
        deepAnalysisData = JSON.parse(deepAnalysisClean);
      } catch {
        deepAnalysisData = {
          key_themes: [],
          archetype_divergence: [],
          strengths: [],
          strategic_verdict: {
            label: 'PROCEED WITH CAUTION',
            rationale: 'The panel delivered mixed feedback with several areas requiring attention before this is ready to present.',
            confidence: 'Medium',
            key_blocker: 'Insufficient evidence to support core claims.',
          },
        };
      }

      setSession((prev) => ({ ...prev, deepAnalysisJson: deepAnalysisData }));
      await updateSession(sessionId, { deep_analysis_json: deepAnalysisData });
    } catch (error) {
      console.error('Focus group error:', error);
      throw error;
    } finally {
      setSession((prev) => ({ ...prev, isLoading: false, loadingMessage: '' }));
    }
  }, [session, createSession, updateSession, callAiAction]);

  const addDefenceMessage = useCallback(async (msg: DefenceMessage) => {
    const sessionId = session.sessionId;
    if (!sessionId) return;

    const newTranscript = [...session.defenceTranscript, msg];
    setSession((prev) => ({ ...prev, defenceTranscript: newTranscript }));
    await updateSession(sessionId, { defence_transcript: newTranscript });
  }, [session, updateSession]);

  const generateShareableCard = useCallback(async () => {
    const sessionId = session.sessionId;
    if (!sessionId) return;

    setSession((prev) => ({ ...prev, isLoading: true, loadingMessage: 'Generating shareable card...' }));

    try {
      const topObjection = session.consensusObjections[0]?.objection || '';
      const prompt = `Based on the following focus group session data, produce the content for a shareable panel card in JSON format only. No preamble, no markdown fences:

Audience category: ${session.audienceCategory}
Simulation outputs: ${JSON.stringify(session.simulationOutputs.slice(0, 10))}
Aggregate score: ${session.aggregateScore}
Consensus verdict: ${session.consensusVerdict}
Top consensus objection: ${topObjection}

Output format:

{
  "headline": "a punchy 10-word-or-less headline summarising the panel verdict written as something the presenter would share on LinkedIn",
  "aggregate_score": 6.2,
  "persona_scorecards": [
    {
      "name": "Persona Name",
      "role": "Role",
      "score": 7,
      "one_line": "their verdict in their voice under 15 words"
    }
  ],
  "top_objection": "the single most important objection from the panel in plain language",
  "share_text": "a ready-to-post LinkedIn and X caption including the score, a tease of the top objection, and a hook question. Under 200 characters."
}`;

      try {
        const text = await callAiAction(prompt);
        let clean = text;
        const fenceMatch = text.match(/```json\s*([\s\S]*?)```/);
        if (fenceMatch) clean = fenceMatch[1];
        else clean = text.replace(/```json\n?|\n?```/g, '');
        clean = clean.trim();
        const firstBrace = clean.indexOf('{');
        const lastBrace = clean.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          clean = clean.slice(firstBrace, lastBrace + 1);
        }
        JSON.parse(clean); // validate
      } catch {
        // Card generation prompt failed validation, but we still proceed with share URL
      }

      const shareUrl = `${window.location.origin}/card/${sessionId}`;
      setSession((prev) => ({ ...prev, shareUrl }));
      await updateSession(sessionId, { share_url: shareUrl });
    } finally {
      setSession((prev) => ({ ...prev, isLoading: false, loadingMessage: '' }));
    }
  }, [session, callAiAction, updateSession]);

  const markMeetPanelShown = useCallback(() => {
    setSession((prev) => ({ ...prev, meetPanelShown: true }));
  }, []);

  const markScoreRevealed = useCallback(() => {
    setSession((prev) => ({ ...prev, scoreRevealed: true }));
  }, []);

  const resetSession = useCallback(() => {
    setSession(defaultSession);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        setDocumentText,
        selectAudience,
        setHarshness,
        runFocusGroup,
        addDefenceMessage,
        generateShareableCard,
        markMeetPanelShown,
        markScoreRevealed,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    console.warn('useSession called outside SessionProvider — HMR race condition');
    return {
      session: defaultSession,
      setDocumentText: () => {},
      selectAudience: () => {},
      setHarshness: () => {},
      runFocusGroup: async () => {},
      addDefenceMessage: async () => {},
      generateShareableCard: async () => {},
      markMeetPanelShown: () => {},
      markScoreRevealed: () => {},
      resetSession: () => {},
    } as SessionContextType;
  }
  return ctx;
}
