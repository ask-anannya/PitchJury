import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import type { QuantitativeAnalysis, DeepAnalysisJson, ArchetypeScore } from '@/contexts/SessionContext';
import { getPanelByKey } from '@/lib/personas';
import { Gavel, ArrowRight } from 'lucide-react';

function scoreColorValue(score: number): string {
  if (score >= 7.5) return '#16A34A';
  if (score >= 5.0) return '#D97706';
  return '#DC2626';
}

function severityColor(severity: string): string {
  if (severity === 'High') return '#DC2626';
  if (severity === 'Medium') return '#D97706';
  return '#16A34A';
}

function verdictColor(label: string): string {
  switch (label) {
    case 'STRONG SUBMISSION':
      return '#16A34A';
    case 'PROCEED WITH CAUTION':
      return '#D97706';
    case 'REVISE BEFORE PITCHING':
      return '#C2410C';
    case 'SIGNIFICANT REWORK NEEDED':
      return '#DC2626';
    default:
      return '#D97706';
  }
}

function gaugeColor(index: number): string {
  if (index >= 0.7) return '#16A34A';
  if (index >= 0.4) return '#D97706';
  return '#DC2626';
}

function gaugeLabel(index: number): string {
  if (index >= 0.7) return 'High Alignment';
  if (index >= 0.4) return 'Moderate Alignment';
  return 'Split Panel';
}

function npsLabel(nps: number): string {
  if (nps >= 50) return 'Excellent';
  if (nps >= 0) return 'Good';
  if (nps >= -30) return 'Average';
  return 'Poor';
}

export default function DeepAnalysisPage() {
  const navigate = useNavigate();
  const { session } = useSession();

  const quant = session.quantitativeAnalysis;
  const analysis = session.deepAnalysisJson;
  const simCount = session.simulationOutputs.length;

  const panel = getPanelByKey(session.audienceCategory);
  const repCount = panel ? panel.personas.filter((p) => p.isRepresentative).length : 0;

  // Gate: do not render until deep_analysis_json is populated
  if (!analysis || !quant || simCount === 0) {
    return (
      <div className="min-h-screen bg-[#0C1525] flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-[10px] uppercase tracking-[0.5em] text-[#C9A84C]">Deep Analysis</div>
        <div className="text-2xl font-bold text-[#F5F0E6]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          The panel is still deliberating...
        </div>
        <div className="text-sm text-[#8899AA] italic max-w-md text-center">
          Quantitative aggregation and strategic analysis are being computed. This may take a moment.
        </div>
        <div className="w-48 h-1 bg-[#152035] rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-[#C9A84C] rounded-full animate-pulse"
            style={{ width: '60%' }}
          />
        </div>
      </div>
    );
  }

  // --- Section 1: Score Overview ---
  const scoreOverview = quant ? (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-5 text-center space-y-2">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#8899AA]">Aggregated Score</div>
        <div className="text-4xl font-black" style={{ color: scoreColorValue(quant.aggregate_score), fontFamily: "'Playfair Display', Georgia, serif" }}>
          {quant.aggregate_score}
        </div>
        <div className="text-xs text-[#8899AA]">Mean of {simCount} personas</div>
      </div>
      <div className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-5 text-center space-y-2">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#8899AA]">Weighted Score</div>
        <div className="text-4xl font-black" style={{ color: scoreColorValue(quant.weighted_score), fontFamily: "'Playfair Display', Georgia, serif" }}>
          {quant.weighted_score}
        </div>
        <div className="text-xs text-[#8899AA]">Weighted by panel composition</div>
      </div>
      <div className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-5 text-center space-y-2">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#8899AA]">Std. Deviation</div>
        <div className="text-4xl font-black" style={{ color: '#C9A84C', fontFamily: "'Playfair Display', Georgia, serif" }}>
          {quant.score_std_deviation}
        </div>
        <div className="text-xs text-[#8899AA]">Panel: {quant.panel_alignment}</div>
      </div>
    </div>
  ) : null;

  // --- Section 2: Panel Sentiment ---
  const sentimentSection = quant ? (
    <div className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-6 space-y-5">
      <div className="space-y-3">
        <div className="text-sm text-[#F5F0E6] font-semibold mb-2">Sentiment Distribution</div>
        <div className="flex h-5 rounded-full overflow-hidden">
          {quant.sentiment_distribution.strongly_positive > 0 && (
            <div className="h-full bg-[#15803D]" style={{ width: `${quant.sentiment_distribution.strongly_positive_pct}%` }} />
          )}
          {quant.sentiment_distribution.positive > 0 && (
            <div className="h-full bg-[#16A34A]" style={{ width: `${quant.sentiment_distribution.positive_pct}%` }} />
          )}
          {quant.sentiment_distribution.neutral > 0 && (
            <div className="h-full bg-[#D97706]" style={{ width: `${quant.sentiment_distribution.neutral_pct}%` }} />
          )}
          {quant.sentiment_distribution.negative > 0 && (
            <div className="h-full bg-[#DC2626]" style={{ width: `${quant.sentiment_distribution.negative_pct}%` }} />
          )}
          {quant.sentiment_distribution.strongly_negative > 0 && (
            <div className="h-full bg-[#991B1B]" style={{ width: `${quant.sentiment_distribution.strongly_negative_pct}%` }} />
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="text-[#4ADE80]">Strongly Positive: {quant.sentiment_distribution.strongly_positive} ({quant.sentiment_distribution.strongly_positive_pct}%)</span>
          <span className="text-[#86EFAC]">Positive: {quant.sentiment_distribution.positive} ({quant.sentiment_distribution.positive_pct}%)</span>
          <span className="text-[#FBBF24]">Neutral: {quant.sentiment_distribution.neutral} ({quant.sentiment_distribution.neutral_pct}%)</span>
          <span className="text-[#F87171]">Negative: {quant.sentiment_distribution.negative} ({quant.sentiment_distribution.negative_pct}%)</span>
          <span className="text-[#FCA5A5]">Strongly Negative: {quant.sentiment_distribution.strongly_negative} ({quant.sentiment_distribution.strongly_negative_pct}%)</span>
        </div>
      </div>

      <div className="border-t border-white/10 pt-5">
        <div className="text-sm text-[#F5F0E6] font-semibold mb-3">Proceed Rate</div>
        <div className="flex items-center gap-4">
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#C9A84C] rounded-full transition-[width] duration-700" style={{ width: `${quant.proceed_rate}%` }} />
          </div>
          <div className="text-xl font-bold text-[#C9A84C] whitespace-nowrap" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {quant.proceed_rate}%
          </div>
        </div>
        <div className="text-xs text-[#8899AA] mt-1">Would proceed to next step</div>
      </div>

      <div className="border-t border-white/10 pt-5">
        <div className="text-sm text-[#F5F0E6] font-semibold mb-3">Weighted Approval Likelihood</div>
        <div className="flex items-center gap-4">
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#0EA5E9] rounded-full transition-[width] duration-700" style={{ width: `${quant.weighted_approval_likelihood}%` }} />
          </div>
          <div className="text-xl font-bold text-[#0EA5E9] whitespace-nowrap" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {quant.weighted_approval_likelihood}%
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // --- Section 3: Score Distribution ---
  const scoreDistSection = quant && quant.score_distribution ? (
    <div className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-6 space-y-4">
      <div className="text-sm text-[#F5F0E6] font-semibold mb-2">Score Distribution</div>
      <div className="grid grid-cols-10 gap-2 items-end" style={{ minHeight: 160 }}>
        {Object.entries(quant.score_distribution)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(([score, count]) => {
            const maxCount = Math.max(...Object.values(quant.score_distribution));
            const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const color = scoreColorValue(parseInt(score));
            return (
              <div key={score} className="flex flex-col items-center gap-1.5">
                <div className="text-[10px] text-[#8899AA] font-medium">{count}</div>
                <div
                  className="w-full rounded-t-sm transition-[height] duration-700"
                  style={{ height: `${Math.max(heightPct, 4)}%`, background: color, minHeight: 4 }}
                />
                <div className="text-[10px] text-[#8899AA]">{score}</div>
              </div>
            );
          })}
      </div>
    </div>
  ) : null;

  // --- Section 4: Consensus Objections ---
  const consensusSection = quant && quant.consensus_objections && quant.consensus_objections.length > 0 ? (
    <div className="space-y-3">
      {quant.consensus_objections.map((obj, idx) => (
        <div key={idx} className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-[#F5F0E6] leading-relaxed flex-1">{obj.objection}</p>
            <span
              className="text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded shrink-0"
              style={{ background: `${severityColor(obj.severity)}18`, color: severityColor(obj.severity) }}
            >
              {obj.severity}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-[#8899AA] bg-black/30 px-2 py-1 rounded">
              Raised by {obj.raised_by_count} ({obj.raised_by_pct}%)
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {obj.raised_by_archetypes.map((arch) => (
              <span key={arch} className="text-[10px] text-[#AABBCC] bg-[#1A2C47] border border-white/[0.06] rounded px-2 py-0.5">
                {arch}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  ) : null;

  // --- Section 5: Kill Criteria Frequency ---
  const killCriteriaSection = quant && quant.kill_criteria_frequency && Object.keys(quant.kill_criteria_frequency).length > 0 ? (
    <div className="space-y-3">
      {Object.entries(quant.kill_criteria_frequency).map(([criterion, data]) => {
        const displayName = criterion
          .replace(/_/g, ' ')
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        return (
          <div key={criterion} className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[#F5F0E6] leading-relaxed">{displayName}</p>
              <span
                className="text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded shrink-0"
                style={{ background: `${severityColor(data.severity)}18`, color: severityColor(data.severity) }}
              >
                {data.severity}
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#DC2626] transition-[width] duration-700" style={{ width: `${Math.min(data.pct, 100)}%` }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-[#8899AA] bg-black/30 px-2 py-1 rounded">
                {data.count} of {simCount} personas ({data.pct}%)
              </span>
            </div>
          </div>
        );
      })}
    </div>
  ) : null;

  // --- Section 6: Archetype Scores ---
  const archetypeSection = quant && quant.archetype_scores && quant.archetype_scores.length > 0 ? (
    <div className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-2 px-3 text-[10px] uppercase tracking-[0.2em] text-[#C9A84C]">Archetype</th>
            <th className="text-right py-2 px-3 text-[10px] uppercase tracking-[0.2em] text-[#C9A84C]">Count</th>
            <th className="text-right py-2 px-3 text-[10px] uppercase tracking-[0.2em] text-[#C9A84C]">Avg Score</th>
            <th className="text-right py-2 px-3 text-[10px] uppercase tracking-[0.2em] text-[#C9A84C]">Approval %</th>
            <th className="text-left py-2 px-3 text-[10px] uppercase tracking-[0.2em] text-[#C9A84C]">Sentiment</th>
            <th className="text-right py-2 px-3 text-[10px] uppercase tracking-[0.2em] text-[#C9A84C]">Proceed %</th>
          </tr>
        </thead>
        <tbody>
          {quant.archetype_scores.map((arch: ArchetypeScore, idx: number) => (
            <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.03]">
              <td className="py-2.5 px-3 text-[#F5F0E6] font-medium">{arch.archetype}</td>
              <td className="py-2.5 px-3 text-right text-[#8899AA]">{arch.persona_count}</td>
              <td className="py-2.5 px-3 text-right font-bold" style={{ color: scoreColorValue(arch.average_score) }}>
                {arch.average_score}
              </td>
              <td className="py-2.5 px-3 text-right text-[#8899AA]">{arch.average_approval_likelihood}%</td>
              <td className="py-2.5 px-3">
                <span
                  className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded"
                  style={{
                    background: `${scoreColorValue(arch.average_score)}18`,
                    color: scoreColorValue(arch.average_score),
                  }}
                >
                  {arch.dominant_sentiment}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right text-[#C9A84C] font-semibold">{arch.proceed_rate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : null;

  // --- Section 7: NPS Breakdown ---
  const npsSection = quant && quant.nps_aggregate ? (
    <div className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-6 space-y-5">
      <div className="text-center space-y-1">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#8899AA]">Panel NPS</div>
        <div className="text-4xl font-black" style={{ color: scoreColorValue((quant.nps_aggregate.mean + 100) / 20), fontFamily: "'Playfair Display', Georgia, serif" }}>
          {quant.nps_aggregate.mean}
        </div>
        <div className="text-xs text-[#8899AA]">{npsLabel(quant.nps_aggregate.mean)}</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg bg-[#15803D]/10 border border-[#15803D]/20">
          <div className="text-lg font-bold text-[#4ADE80]">{quant.nps_aggregate.promoters_pct}%</div>
          <div className="text-[10px] uppercase tracking-wide text-[#8899AA]">Promoters</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-[#D97706]/10 border border-[#D97706]/20">
          <div className="text-lg font-bold text-[#FBBF24]">{quant.nps_aggregate.passives_pct}%</div>
          <div className="text-[10px] uppercase tracking-wide text-[#8899AA]">Passives</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20">
          <div className="text-lg font-bold text-[#F87171]">{quant.nps_aggregate.detractors_pct}%</div>
          <div className="text-[10px] uppercase tracking-wide text-[#8899AA]">Detractors</div>
        </div>
      </div>
    </div>
  ) : null;

  // --- Section 8: Panel Alignment Index ---
  const alignmentSection = quant ? (
    <div className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-[#F5F0E6] font-semibold">Panel Alignment Index</div>
        <span
          className="text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded"
          style={{ background: `${gaugeColor(quant.panel_alignment_index)}18`, color: gaugeColor(quant.panel_alignment_index) }}
        >
          {gaugeLabel(quant.panel_alignment_index)}
        </span>
      </div>
      <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${Math.max(quant.panel_alignment_index * 100, 4)}%`, background: gaugeColor(quant.panel_alignment_index) }}
        />
      </div>
      <div className="text-xs text-[#8899AA]">
        {quant.panel_alignment_index.toFixed(2)} — {gaugeLabel(quant.panel_alignment_index)}
      </div>
    </div>
  ) : null;

  // --- Section 9: Key Takeaways ---
  const keyThemesSection = analysis && analysis.key_themes && analysis.key_themes.length > 0 ? (
    <div className="space-y-3">
      {analysis.key_themes.map((theme, idx) => (
        <div key={idx} className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-5 space-y-3">
          <h3 className="text-lg font-bold text-[#F5F0E6]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {theme.theme_name}
          </h3>
          <p className="text-sm text-[#AABBCC] leading-relaxed">{theme.description}</p>
          <div className="bg-[#1A2C47] border border-white/[0.06] rounded-lg p-4 space-y-2">
            <p className="text-sm italic text-[#8899AA] leading-relaxed">&ldquo;{theme.representative_quote}&rdquo;</p>
            <p className="text-xs text-[#C9A84C]">— {theme.quoted_by_persona}, {theme.quoted_by_archetype}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded"
              style={{ background: `${severityColor(theme.theme_severity)}18`, color: severityColor(theme.theme_severity) }}
            >
              {theme.theme_severity}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-[#8899AA] bg-black/30 px-2 py-1 rounded">
              {theme.prevalence_pct}% prevalence
            </span>
          </div>
        </div>
      ))}
    </div>
  ) : null;

  const divergenceSection = analysis && analysis.archetype_divergence && analysis.archetype_divergence.length > 0 ? (
    <div className="space-y-3">
      <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3 flex items-center gap-2">
        Archetype Divergence
        <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
      </div>
      {analysis.archetype_divergence.map((div, idx) => (
        <div key={idx} className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-5 space-y-3">
          <p className="text-sm text-[#F5F0E6] leading-relaxed">{div.description}</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex-1 text-center p-3 rounded-lg bg-[#1A2C47] border border-white/[0.06]">
              <div className="text-xs text-[#8899AA] mb-1">{div.archetype_a}</div>
              <div className="text-xl font-bold" style={{ color: scoreColorValue(div.archetype_a_avg_score) }}>
                {div.archetype_a_avg_score}
              </div>
            </div>
            <div className="text-[#C9A84C] text-lg font-bold">vs</div>
            <div className="flex-1 text-center p-3 rounded-lg bg-[#1A2C47] border border-white/[0.06]">
              <div className="text-xs text-[#8899AA] mb-1">{div.archetype_b}</div>
              <div className="text-xl font-bold" style={{ color: scoreColorValue(div.archetype_b_avg_score) }}>
                {div.archetype_b_avg_score}
              </div>
            </div>
          </div>
          <p className="text-xs text-[#AABBCC] italic">{div.key_disagreement}</p>
        </div>
      ))}
    </div>
  ) : null;

  const strengthsSection = analysis && analysis.strengths && analysis.strengths.length > 0 ? (
    <div className="space-y-3">
      <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3 flex items-center gap-2">
        Strengths
        <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
      </div>
      {analysis.strengths.map((s, idx) => (
        <div key={idx} className="bg-[#152035] border border-[#16A34A]/20 rounded-[14px] p-5 space-y-3">
          <p className="text-sm text-[#F5F0E6] leading-relaxed">{s.strength}</p>
          <div className="bg-[#1A2C47] border border-white/[0.06] rounded-lg p-4 space-y-2">
            <p className="text-sm italic text-[#8899AA] leading-relaxed">&ldquo;{s.supporting_quote}&rdquo;</p>
            <p className="text-xs text-[#C9A84C]">— {s.quoted_by_persona}</p>
          </div>
          <span className="text-[10px] uppercase tracking-wide text-[#4ADE80] bg-[#15803D]/10 px-2 py-1 rounded">
            Endorsed by {s.endorsement_pct}%
          </span>
        </div>
      ))}
    </div>
  ) : null;

  const strategicVerdictSection = analysis && analysis.strategic_verdict ? (
    <div className="space-y-3">
      <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3 flex items-center gap-2">
        Strategic Verdict
        <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
      </div>
      <div
        className="rounded-[14px] p-8 text-center space-y-4 border"
        style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))',
          borderColor: 'rgba(201,168,76,0.3)',
        }}
      >
        <div
          className="text-3xl md:text-4xl font-black uppercase tracking-wide"
          style={{
            color: verdictColor(analysis.strategic_verdict.label),
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          {analysis.strategic_verdict.label}
        </div>
        <p className="text-base text-[#F5F0E6] leading-relaxed max-w-2xl mx-auto">
          {analysis.strategic_verdict.rationale}
        </p>
        <div className="flex justify-center gap-3">
          <span
            className="text-[10px] uppercase tracking-[0.3em] font-semibold px-3 py-1.5 rounded"
            style={{
              background: `${verdictColor(analysis.strategic_verdict.label)}18`,
              color: verdictColor(analysis.strategic_verdict.label),
              border: `1px solid ${verdictColor(analysis.strategic_verdict.label)}30`,
            }}
          >
            Confidence: {analysis.strategic_verdict.confidence}
          </span>
        </div>
        {analysis.strategic_verdict.key_blocker && (
          <div className="mt-4 p-4 rounded-lg bg-[#1A2C47] border border-white/[0.06] max-w-xl mx-auto">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#C9A84C] mb-1">Key Blocker</div>
            <p className="text-sm text-[#F5F0E6]">{analysis.strategic_verdict.key_blocker}</p>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="container max-w-4xl py-10 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-[10px] uppercase tracking-[0.55em] text-[#C9A84C]">Focus Group Results</div>
        <h1 className="text-4xl font-black text-[#F5F0E6] leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Deep <em className="text-[#E8C97A]">Analysis</em>
        </h1>
        <p className="text-sm text-[#8899AA] italic">
          Quantitative analysis across {simCount} persona simulations
        </p>
      </div>

      {/* Section 1 — Score Overview */}
      <div className="space-y-3">
        <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3 flex items-center gap-2">
          Score Overview
          <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
        </div>
        {scoreOverview}
      </div>

      {/* Section 2 — Panel Sentiment */}
      <div className="space-y-3">
        <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3 flex items-center gap-2">
          Panel Sentiment
          <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
        </div>
        {sentimentSection}
      </div>

      {/* Section 3 — Score Distribution */}
      <div className="space-y-3">
        <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3 flex items-center gap-2">
          Score Distribution
          <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
        </div>
        {scoreDistSection}
      </div>

      {/* Section 4 — Consensus Objections */}
      <div className="space-y-3">
        <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3 flex items-center gap-2">
          Consensus Objections
          <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
        </div>
        {consensusSection || (
          <div className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-5 text-center text-sm text-[#8899AA]">
            No consensus objections found
          </div>
        )}
      </div>

      {/* Section 5 — Kill Criteria Frequency */}
      <div className="space-y-3">
        <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3 flex items-center gap-2">
          Kill Criteria Frequency
          <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
        </div>
        {killCriteriaSection || (
          <div className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-5 text-center text-sm text-[#8899AA]">
            No kill criteria triggered
          </div>
        )}
      </div>

      {/* Section 6 — Archetype Scores */}
      <div className="space-y-3">
        <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3 flex items-center gap-2">
          Archetype Scores
          <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
        </div>
        {archetypeSection || (
          <div className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-5 text-center text-sm text-[#8899AA]">
            No archetype data available
          </div>
        )}
      </div>

      {/* Section 7 — NPS Breakdown */}
      <div className="space-y-3">
        <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3 flex items-center gap-2">
          NPS Breakdown
          <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
        </div>
        {npsSection || (
          <div className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-5 text-center text-sm text-[#8899AA]">
            No NPS data available
          </div>
        )}
      </div>

      {/* Section 8 — Panel Alignment Index */}
      <div className="space-y-3">
        <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3 flex items-center gap-2">
          Panel Alignment Index
          <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
        </div>
        {alignmentSection || (
          <div className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-5 text-center text-sm text-[#8899AA]">
            No alignment data available
          </div>
        )}
      </div>

      {/* Section 9 — Key Takeaways */}
      <div className="space-y-3">
        <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3 flex items-center gap-2">
          Key Takeaways
          <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
        </div>
        {keyThemesSection || (
          <div className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] p-5 text-center text-sm text-[#8899AA]">
            No key themes available
          </div>
        )}
      </div>

      {/* Archetype Divergence */}
      {divergenceSection}

      {/* Strengths */}
      {strengthsSection}

      {/* Strategic Verdict */}
      {strategicVerdictSection}

      {/* Enter the Room */}
      <div
        className="mt-8 p-8 rounded-[14px] text-center border"
        style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))',
          borderColor: 'rgba(201,168,76,0.3)',
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.5em] text-[#C9A84C] mb-3">You have reviewed the full analysis</div>
        <div className="text-2xl font-bold text-[#F5F0E6] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Are you ready to defend yourself?
        </div>
        <div className="text-sm text-[#8899AA] italic mb-6">
          {repCount} reviewers are waiting. You have 5 exchanges.
        </div>
        <button
          onClick={() => navigate('/defence')}
          className="inline-flex items-center gap-2.5 bg-[#C9A84C] text-[#0C1525] border-none rounded-lg px-10 py-3.5 cursor-pointer text-[15px] font-bold uppercase tracking-wide transition-all duration-200 hover:bg-[#E8C97A] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(201,168,76,0.3)]"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            animation: 'btnPulse 2.5s ease-in-out infinite',
          }}
        >
          <Gavel className="w-4 h-4" />
          Enter the Room
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <style>{`
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(201,168,76,0); }
        }
      `}</style>
    </div>
  );
}
