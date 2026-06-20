import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, Share2, Check, RotateCcw } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useSession } from '@/contexts/SessionContext';

interface CardData {
  headline: string;
  aggregate_score: number;
  persona_scorecards: Array<{
    name: string;
    role: string;
    score: number;
    one_line: string;
  }>;
  top_objection: string;
  share_text: string;
}

function getScoreColorValue(score: number): string {
  if (score <= 4) return '#EF4444';
  if (score <= 7) return '#C9A84C';
  return '#0D9488';
}

export default function ShareableCardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { resetSession, session } = useSession();
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    loadSession(id);
  }, [id]);

  const loadSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Session not found');
        return;
      }

      const allRoasts = data.all_roast_outputs || [];
      const aggregateScore = data.aggregate_score || 0;
      const consensusVerdict = data.consensus_verdict || '';
      const topObjection = data.consensus_objections?.[0]?.objection || '';

      const personaScorecards = allRoasts.map((r: { persona_name: string; persona_role: string; score: number; verdict: string }) => ({
        name: r.persona_name,
        role: r.persona_role,
        score: r.score,
        one_line: r.verdict,
      }));

      const scoreLabel = aggregateScore <= 5 ? 'Needs Work' : aggregateScore <= 7 ? 'Promising' : 'Strong';
      const topObjShort = topObjection.slice(0, 70);
      const shareText = `I put my deck in front of ${personaScorecards.length} experts. They scored it ${aggregateScore}/10 (${scoreLabel}). Top objection: "${topObjShort}${topObjection.length > 70 ? '...' : ''}" — what would you fix first?`;

      setCardData({
        headline: consensusVerdict.slice(0, 60) || 'Focus Group Results',
        aggregate_score: aggregateScore,
        persona_scorecards: personaScorecards,
        top_objection: topObjection,
        share_text: shareText,
      });
    } catch {
      toast.error('Failed to load card');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, shareMethod: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');

    if (typeof pendo !== 'undefined') {
      pendo.track('verdict_shared', {
        session_id: id || '',
        share_method: shareMethod,
        aggregate_score: cardData?.aggregate_score ?? 0,
      });
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl py-20 text-center">
        <p className="text-muted-foreground">Loading panel card...</p>
      </div>
    );
  }

  if (!cardData) {
    return (
      <div className="container max-w-4xl py-20 text-center">
        <p className="text-muted-foreground">Card not found</p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-12 space-y-8 animate-in fade-in duration-700">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-balance">Your Verdict</h1>
        <p className="text-muted-foreground text-pretty">Your focus group results, ready to share.</p>
      </div>

      <Card className="border-2 shadow-card">
        <CardContent className="p-8 space-y-8">
          {/* Headline */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-balance">{cardData.headline}</h2>
            <div className="flex items-baseline justify-center gap-2">
              <span
                className="text-5xl font-bold"
                style={{ color: getScoreColorValue(cardData.aggregate_score) }}
              >
                {cardData.aggregate_score.toFixed(1)}
              </span>
              <span className="text-xl text-muted-foreground">/ 10</span>
            </div>
          </div>

          {/* Persona Scorecards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cardData.persona_scorecards.map((persona, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: getScoreColorValue(persona.score) }}
                >
                  {persona.score}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium truncate">{persona.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{persona.role}</p>
                  <p className="text-xs text-pretty">{persona.one_line}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Top Objection */}
          {cardData.top_objection && (
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs text-primary border-primary/40">Top Objection</Badge>
              <p className="text-sm text-pretty">{cardData.top_objection}</p>
            </div>
          )}


        </CardContent>
      </Card>

      {/* Share Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => copyToClipboard(cardData.share_text, 'share_text')}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy Share Text'}
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => copyToClipboard(window.location.href, 'link')}
        >
          <Share2 className="w-4 h-4" />
          Copy Link
        </Button>
      </div>

      {/* Run Again */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          variant="ghost"
          className="flex items-center gap-2 px-8 border border-primary/40 hover:bg-primary/5"
          onClick={() => {
            if (typeof pendo !== 'undefined') {
              pendo.track('session_reset', {
                previous_session_id: id || '',
                previous_audience_category: session.audienceCategory || '',
                previous_aggregate_score: cardData?.aggregate_score ?? 0,
              });
            }
            resetSession();
            navigate('/');
          }}
        >
          <RotateCcw className="w-4 h-4" />
          Roast Another Deck →
        </Button>
      </div>
    </div>
  );
}
