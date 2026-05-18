import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { getPanelByKey } from '@/lib/personas';
import VerdictViewer from '@/components/VerdictViewer';

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
  const { session, markScoreRevealed } = useSession();
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

  const verdictWords = session.consensusVerdict.split(' ');

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

      {/* Verdict Viewer */}
      <div
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <VerdictViewer
          roasts={session.allRoastOutputs.filter((r) =>
            session.activePersonas.some((p) => p.isRepresentative && p.name === r.persona_name)
          )}
          personas={session.activePersonas.filter((p) => p.isRepresentative)}
        />
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





    </div>
  );
}
