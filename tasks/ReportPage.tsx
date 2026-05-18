import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Gavel, Quote, ArrowRight, Loader2, ChevronDown, ChevronUp, RefreshCw, Scissors, Target, Users } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { getPanelByKey } from '@/lib/personas';
import type { RoastOutput } from '@/contexts/SessionContext';

function getScoreColorValue(score: number): string {
  if (score <= 4) return '#EF4444';
  if (score <= 7) return '#C9A84C';
  return '#0D9488';
}

function getScoreLabel(score: number): string {
  if (score <= 3) return 'Troubling';
  if (score <= 5) return 'Needs Work';
  if (score <= 7) return 'Promising';
  return 'Strong';
}

export default function ReportPage() {
  const navigate = useNavigate();
  const { session, rewriteSection, markScoreRevealed } = useSession();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [rewriteLoading, setRewriteLoading] = useState<string | null>(null);
  const [rewriteResults, setRewriteResults] = useState<Record<string, string>>({});
  const [animatedScore, setAnimatedScore] = useState(0);
  const [revealPhase, setRevealPhase] = useState(session.scoreRevealed ? 'done' : 'initial');
  const [contentVisible, setContentVisible] = useState(session.scoreRevealed);
  const scoreRef = useRef(0);

  const panel = getPanelByKey(session.audienceCategory);
  const actualScore = session.aggregateScore || 0;
  const scoreColor = getScoreColorValue(actualScore);

  // Score reveal animation
  useEffect(() => {
    if (session.scoreRevealed) {
      setAnimatedScore(actualScore);
      return;
    }

    // Phase 0.3s: Score counter starts (duration 1.8s)
    const startTime = Date.now();
    const duration = 1800;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * actualScore;
      scoreRef.current = current;
      setAnimatedScore(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const scoreTimer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 300);

    // Phase 2.1s: Verdict visible
    const verdictTimer = setTimeout(() => {
      setRevealPhase('verdict');
    }, 2100);

    // Phase 3.0s: Cards visible
    const cardsTimer = setTimeout(() => {
      setRevealPhase('cards');
    }, 3000);

    // Phase 3.8s: Full content visible
    const fullTimer = setTimeout(() => {
      setContentVisible(true);
      markScoreRevealed();
    }, 3800);

    return () => {
      clearTimeout(scoreTimer);
      clearTimeout(verdictTimer);
      clearTimeout(cardsTimer);
      clearTimeout(fullTimer);
    };
  }, [session.scoreRevealed, actualScore, markScoreRevealed]);

  const toggleCard = (key: string) => {
    setExpandedCard(expandedCard === key ? null : key);
  };

  const handleRewrite = async (type: 'shorter' | 'specific' | 'full', roast: RoastOutput) => {
    const sectionText = roast.section_breakdown[0]?.quote || roast.sharpest_objection.quote;
    const cacheKey = `${roast.persona_name}-${type}`;
    setRewriteLoading(cacheKey);
    try {
      const personaNames = session.allRoastOutputs.map((r) => r.persona_name).join(', ');
      const objections = session.allRoastOutputs
        .map((r) => r.sharpest_objection.objection)
        .join('\n');
      const result = await rewriteSection(type, sectionText, personaNames, objections);
      setRewriteResults((prev) => ({ ...prev, [cacheKey]: result }));
    } catch {
      toast.error('Rewrite failed');
    } finally {
      setRewriteLoading(null);
    }
  };

  const verdictWords = session.consensusVerdict.split(' ');

  // Find persona image by matching roast name to persona name
  const getPersonaImage = (roastName: string) => {
    for (const p of panel?.personas || []) {
      if (p.name === roastName || roastName.includes(p.name)) {
        return p.image;
      }
    }
    return undefined;
  };

  return (
    <div className="container max-w-5xl py-10 space-y-8 animate-in fade-in duration-700">
      {/* Score Reveal Overlay */}
      {!session.scoreRevealed && revealPhase !== 'done' && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: '#F5F0E6',
            transition: 'opacity 0.8s ease',
            opacity: contentVisible ? 0 : 1,
            pointerEvents: contentVisible ? 'none' : 'auto',
          }}
        >
          <div className="flex flex-col items-center gap-6">
            {/* Animated score */}
            <div
              className="font-serif font-bold"
              style={{
                fontSize: 96,
                color: scoreColor,
                fontFamily: "'EB Garamond', Georgia, serif",
                lineHeight: 1,
                transition: 'color 0.5s ease',
              }}
            >
              {animatedScore.toFixed(1)}
            </div>

            {/* Score label */}
            <div
              style={{
                opacity: revealPhase === 'verdict' || revealPhase === 'cards' || revealPhase === 'done' ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
            >
              <span
                className="uppercase"
                style={{
                  fontSize: 13,
                  letterSpacing: '0.22em',
                  color: scoreColor,
                  fontFamily: "'EB Garamond', Georgia, serif",
                }}
              >
                {getScoreLabel(actualScore)}
              </span>
            </div>

            {/* Verdict word-by-word fade */}
            <div
              className="text-center max-w-xl px-6"
              style={{
                opacity: revealPhase === 'verdict' || revealPhase === 'cards' || revealPhase === 'done' ? 1 : 0,
                transition: 'opacity 0.6s ease',
              }}
            >
              <p className="text-lg text-muted-foreground text-pretty">
                {verdictWords.map((word, i) => (
                  <span
                    key={i}
                    style={{
                      opacity: revealPhase === 'verdict' || revealPhase === 'cards' || revealPhase === 'done' ? 1 : 0,
                      transition: `opacity 0.4s ${2100 + i * 80}ms ease`,
                    }}
                  >
                    {word}{' '}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            {panel?.label || session.audienceCategory}
          </Badge>
        </div>
        <div className="flex items-baseline gap-3">
          <h1
            className="text-5xl font-bold"
            style={{ color: scoreColor, transition: 'color 0.5s ease' }}
          >
            {actualScore.toFixed(1)}
          </h1>
          <span className="text-2xl text-muted-foreground">/ 10</span>
        </div>
        <p className="text-lg text-muted-foreground text-pretty max-w-3xl">
          {session.consensusVerdict}
        </p>
      </div>

      {/* Persona Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        {session.allRoastOutputs.map((roast) => (
          <Card
            key={roast.persona_name}
            className={`cursor-pointer transition-all duration-200 hover:shadow-hover shadow-card overflow-hidden ${
              expandedCard === roast.persona_name ? 'ring-1 ring-primary' : ''
            }`}
            onClick={() => toggleCard(roast.persona_name)}
          >
            {/* Persona image */}
            <div className="relative h-28 bg-muted/40 overflow-hidden">
              <img
                src={getPersonaImage(roast.persona_name) || ''}
                alt={roast.persona_name}
                className="w-full h-full object-contain object-bottom"
              />
              {/* Bottom gradient fade */}
              <div
                className="absolute bottom-0 left-0 right-0 h-10"
                style={{
                  background: 'linear-gradient(0deg, hsl(var(--card)), transparent)',
                }}
              />
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">{roast.persona_name}</h3>
                  <p className="text-sm text-muted-foreground">{roast.persona_role}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: getScoreColorValue(roast.score) }}
                >
                  {roast.score}
                </div>
              </div>
              <p className="text-sm text-pretty">{roast.verdict}</p>
              <div className="bg-muted/50 rounded-md p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Quote className="w-3 h-3" />
                  <span>Sharpest objection</span>
                </div>
                <p className="text-sm italic text-pretty">"{roast.sharpest_objection.quote}"</p>
                <p className="text-sm text-pretty">{roast.sharpest_objection.objection}</p>
              </div>
              <div className="flex justify-center">
                {expandedCard === roast.persona_name ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardContent>

            {expandedCard === roast.persona_name && (
              <CardContent className="pt-0 border-t space-y-4 animate-in fade-in duration-300">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4 pr-4">
                    {roast.section_breakdown.map((section, idx) => (
                      <div key={idx} className="space-y-2">
                        <h4 className="text-sm font-semibold">{section.section}</h4>
                        <p className="text-sm italic text-muted-foreground">"{section.quote}"</p>
                        <p className="text-sm text-pretty">{section.critique}</p>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">What would change my mind:</span>{' '}
                        {roast.what_would_change_my_mind}
                      </p>
                    </div>
                  </div>
                </ScrollArea>

                {/* Rewrite Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRewrite('shorter', roast);
                    }}
                    disabled={rewriteLoading === `${roast.persona_name}-shorter`}
                  >
                    <Scissors className="w-3 h-3 mr-1" />
                    Shorter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRewrite('specific', roast);
                    }}
                    disabled={rewriteLoading === `${roast.persona_name}-specific`}
                  >
                    <Target className="w-3 h-3 mr-1" />
                    Specific
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRewrite('full', roast);
                    }}
                    disabled={rewriteLoading === `${roast.persona_name}-full`}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Full Panel
                  </Button>
                </div>

                {rewriteResults[`${roast.persona_name}-shorter`] && (
                  <div className="bg-muted/30 rounded-md p-3 space-y-1">
                    <p className="text-xs font-medium text-primary">Shorter + Punchier</p>
                    <p className="text-sm text-pretty">{rewriteResults[`${roast.persona_name}-shorter`]}</p>
                  </div>
                )}
                {rewriteResults[`${roast.persona_name}-specific`] && (
                  <div className="bg-muted/30 rounded-md p-3 space-y-1">
                    <p className="text-xs font-medium text-primary">More Specific</p>
                    <p className="text-sm text-pretty">{rewriteResults[`${roast.persona_name}-specific`]}</p>
                  </div>
                )}
                {rewriteResults[`${roast.persona_name}-full`] && (
                  <div className="bg-muted/30 rounded-md p-3 space-y-1">
                    <p className="text-xs font-medium text-primary">Full Panel Rewrite</p>
                    <p className="text-sm text-pretty">{rewriteResults[`${roast.persona_name}-full`]}</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Points of Consensus */}
      {session.consensusObjections.length > 0 && (
        <div
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                Points of Consensus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {session.consensusObjections.map((obj, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-md">
                  <Badge variant="secondary">{obj.count} personas</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-pretty">{obj.objection}</p>
                    <p className="text-xs text-muted-foreground">Raised by: {obj.raised_by.join(', ')}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Priority Fix Box */}
      {session.topRewriteTarget && (
        <div
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <Card
            className="shadow-card overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #FEF9E7, #FDF2E9)',
              borderColor: 'rgba(201,168,76,0.4)',
            }}
          >
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span style={{ color: '#C9A84C' }}>🎯</span>
                <h3
                  className="font-bold uppercase"
                  style={{
                    fontSize: 13,
                    letterSpacing: '0.18em',
                    color: '#C9A84C',
                    fontFamily: "'EB Garamond', Georgia, serif",
                  }}
                >
                  Priority Fix
                </h3>
              </div>
              <p className="text-base text-pretty">
                The panel spent the most time on your{' '}
                <span className="font-bold" style={{ color: '#C9A84C' }}>
                  {session.topRewriteTarget}
                </span>
                . Rewriting this section would move the needle most.
              </p>
              <div
                className="w-full rounded-md overflow-hidden"
                style={{ height: 6, background: '#EDE8DA' }}
              >
                <div
                  className="h-full rounded-md"
                  style={{
                    width: '85%',
                    background: 'linear-gradient(90deg, #C9A84C, #E8C97A)',
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#0D9488', fontSize: 14 }}>✓</span>
                <p className="text-sm text-muted-foreground">
                  {session.activePersonas.length} of {session.activePersonas.length} personas flagged this
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Before/After Rewrite */}
      {session.rewriteJson && (
        <div
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Before / After Rewrite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-primary uppercase tracking-wide">Original</p>
                  <div className="bg-muted/30 rounded-md p-4">
                    <p className="text-sm text-pretty text-muted-foreground">{session.rewriteJson.original}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-primary uppercase tracking-wide">Rewritten</p>
                  <div className="bg-primary/5 rounded-md p-4 border border-primary/20">
                    <p className="text-sm text-pretty">{session.rewriteJson.rewritten}</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">What Changed</p>
                <p className="text-sm text-pretty whitespace-pre-line">{session.rewriteJson.what_changed}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enter the Room */}
      <div
        className="flex justify-center pt-6 pb-12"
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <Button size="lg" onClick={() => navigate('/defence')} className="px-10 text-lg">
          <Gavel className="w-5 h-5 mr-2" />
          Enter the Room
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
