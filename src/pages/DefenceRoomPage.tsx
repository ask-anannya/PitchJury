import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { DefenceMessage } from '@/contexts/SessionContext';

const PANEL_NAMES: Record<string, string> = {
  seed_investors: 'Seed Investor Panel',
  enterprise_buyers: 'Enterprise Buyer Panel',
  hiring_managers: 'Hiring Manager Panel',
  series_a_investors: 'Series A Panel',
};

export default function DefenceRoomPage() {
  const navigate = useNavigate();
  const { session, addDefenceMessage, generateShareableCard } = useSession();
  const [exchanges, setExchanges] = useState(5);
  const [isWaiting, setIsWaiting] = useState(false);
  const [messages, setMessages] = useState<DefenceMessage[]>([
    { role: 'panel', speaker: 'The Panel', content: 'The room is ready. State your opening defence.' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [speakingKeys, setSpeakingKeys] = useState<string[]>([]);
  const [bubbleTexts, setBubbleTexts] = useState<Record<string, string>>({});
  const [showDone, setShowDone] = useState(false);
  const [entranceDone, setEntranceDone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const panel = session.activePersonas;
  const panelName = PANEL_NAMES[session.audienceCategory] || 'Focus Group Panel';

  useEffect(() => {
    const timer = setTimeout(() => setEntranceDone(true), 4200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const parsePanelResponse = (raw: string) => {
    const lines = raw.split('\n').filter((l) => l.trim());
    const parts: { name: string; role: string; text: string }[] = [];
    let current: { name: string; role: string; text: string } | null = null;
    for (const line of lines) {
      // Try [Name, Role]: text format first
      let m = line.match(/^\[([^,\]]+),([^\]]+)\]:\s*(.+)/);
      if (!m) {
        // Also try "Name, Role: text" without brackets (common Gemini output)
        m = line.match(/^([^:]+),\s*([^:]+):\s*(.+)/);
      }
      if (m) {
        if (current) parts.push(current);
        current = { name: m[1].trim(), role: m[2].trim(), text: m[3].trim() };
      } else if (current) {
        current.text += ' ' + line.trim();
      }
    }
    if (current) parts.push(current);
    if (parts.length === 0) parts.push({ name: 'The Panel', role: '', text: raw });
    return parts;
  };

  const findKey = (name: string) => {
    const n = name.toLowerCase();
    const match = panel.find((p) => n.includes(p.name.toLowerCase().split(' ')[0]));
    return match?.key;
  };

  // Strip all asterisks from AI-generated text
  const renderStyledText = (text: string) => {
    return <span>{text.replace(/\*/g, '')}</span>;
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isWaiting || exchanges <= 0) return;

    setIsWaiting(true);
    setInputValue('');

    const userMsg: DefenceMessage = { role: 'user', speaker: 'You', content: text };
    setMessages((prev) => [...prev, userMsg]);
    await addDefenceMessage(userMsg);

    if (typeof pendo !== 'undefined') {
      pendo.track('defence_message_sent', {
        session_id: session.sessionId || '',
        audience_category: session.audienceCategory,
        exchange_number: 6 - exchanges,
        exchanges_remaining: exchanges - 1,
        message_length: text.length,
        total_messages_so_far: messages.length,
      });
    }

    // Pick random speakers for typing animation
    const shuffled = [...panel].sort(() => Math.random() - 0.5);
    const typingSpeakers = shuffled.slice(0, 2).map((p) => p.key);
    setSpeakingKeys(typingSpeakers);
    setBubbleTexts(Object.fromEntries(typingSpeakers.map((k) => [k, '…'])));

    try {
      const transcriptText = messages
        .map((m) => `${m.role === 'user' ? 'You' : m.speaker}: ${m.content}`)
        .join('\n');

      const personaNamesAndRoles = panel.map((p) => `${p.name}, ${p.role}`).join('\n');
      const prompt = `You are moderating a focus group panel called "${panelName}" consisting of: ${personaNamesAndRoles}.\n\nThe original document that was reviewed:\n---\n${session.extractedDocumentText}\n---\n\nThe panel original assessments:\n---\n${JSON.stringify(session.allRoastOutputs)}\n---\n\nThe defence conversation so far:\n---\n${transcriptText}\n---\n\nThe presenter latest message: ${text}\n\nWrite the panel collective response. Follow these rules exactly:\n\n1. Name each persona who speaks. Choose the 2 to 3 most relevant given the topic of the presenter defence.\n2. At least one persona must push back on every defence message. The panel never fully capitulates.\n3. A persona may update their position ONLY if the presenter has provided a specific verifiable fact, number, or piece of evidence not present in the original document. If they do update, name what specifically changed their view.\n4. A persona who is not updated holds their position and explains briefly why the argument was insufficient.\n5. Any persona may ask a follow-up question if the defence raises a new issue worth probing.\n6. Keep the total response under 250 words.\n7. Format each response as: [Persona Name, Role]: their response.\n\nIMMUTABLE RULE: At least one persona pushes back. Always. The room never unanimously agrees with the presenter.`;

      const raw = await callAiAction(prompt);
      const parts = parsePanelResponse(raw);

      const speakingK = parts.map((p) => findKey(p.name)).filter(Boolean) as string[];
      const fullText = parts.map((p) => p.text).join(' ');
      setSpeakingKeys(speakingK.length ? speakingK : typingSpeakers);
      setBubbleTexts(Object.fromEntries((speakingK.length ? speakingK : typingSpeakers).map((k) => [k, fullText.length > 80 ? fullText.substring(0, 77) + '…' : fullText])));

      setTimeout(() => {
        setSpeakingKeys([]);
        setBubbleTexts({});
      }, 5000);

      parts.forEach((part) => {
        const panelMsg: DefenceMessage = {
          role: 'panel',
          speaker: part.name + (part.role ? ', ' + part.role : ''),
          content: part.text,
        };
        setMessages((prev) => [...prev, panelMsg]);
        addDefenceMessage(panelMsg);
      });

      const newExchanges = exchanges - 1;
      setExchanges(newExchanges);

      if (newExchanges <= 0) {
        setShowDone(true);

        if (typeof pendo !== 'undefined') {
          pendo.track('defence_session_completed', {
            session_id: session.sessionId || '',
            audience_category: session.audienceCategory,
            total_messages: messages.length + 1 + parts.length,
            aggregate_score: session.aggregateScore ?? 0,
          });
        }
      }
    } catch {
      toast.error('Failed to get panel response');
    } finally {
      setIsWaiting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleGenerateCard = async () => {
    try {
      await generateShareableCard();
      if (session.sessionId) {
        navigate(`/card/${session.sessionId}`);
      }
    } catch {
      toast.error('Failed to generate card');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#0A0806', fontFamily: "'Cormorant Garamond', serif" }}>
      {/* Google Fonts */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Cormorant+Garamond:wght@300;400;500;600&display=swap" />

      {/* ENTRANCE ANIMATION */}
      {!entranceDone && (
        <div id="entrance" className="fixed inset-0 z-[100] pointer-events-none">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[18px] animate-[preFade_0.5s_0.9s_ease_forwards] z-10 pointer-events-auto" style={{ background: '#0A0806' }}>
            <div className="w-[52px] h-[52px] border rounded-full flex items-center justify-center" style={{ borderColor: 'rgba(201,168,76,0.35)' }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#C9A84C" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="font-['Playfair_Display'] text-xs tracking-[0.4em] uppercase animate-[pulse_0.9s_ease_infinite_alternate]" style={{ color: 'rgba(201,168,76,0.6)' }}>
              Entering the Room
            </div>
          </div>
          <div className="absolute inset-0 animate-[gavelFlash_0.12s_1.05s_ease_forwards] z-[9]" style={{ background: 'rgba(201,168,76,0.05)' }} />
          {[0, 1, 2].map((i) => (
            <div key={i} className="absolute top-1/2 left-1/2 rounded-full animate-[rippleOut_1.1s_ease_forwards]" style={{ width: 8, height: 8, border: '1px solid rgba(201,168,76,0.5)', transform: 'translate(-50%, -50%)', animationDelay: `${1.05 + i * 0.15}s` }} />
          ))}
          <div className="absolute inset-0 z-[8] pointer-events-none animate-[burst_2s_1s_ease_forwards]" style={{ background: 'radial-gradient(ellipse at 50% 50%,#FFFEF5 0%,#FFF8DC 25%,transparent 65%)' }} />
          <div className="absolute inset-0 z-[7] overflow-hidden pointer-events-none animate-[raysShow_2s_1s_ease_forwards]">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="absolute top-1/2 left-1/2 w-[120%] h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,248,200,0.5),transparent)', transformOrigin: 'left center', transform: `rotate(${i * 20}deg)` }} />
            ))}
          </div>
          <div className="absolute inset-0 flex z-[6] pointer-events-none">
            <div className="w-1/2 h-full relative overflow-hidden animate-[openL_1.5s_1.1s_cubic-bezier(0.4,0,0.2,1)_forwards]" style={{ borderRight: '2px solid #C9A84C', transformOrigin: 'left center', background: 'linear-gradient(135deg,#1C0E06,#2A1408 50%,#1C0E06)' }}>
              <div className="absolute top-[7%] left-[7%] right-[7%] h-[27%] rounded-[2px]" style={{ border: '1px solid rgba(201,168,76,0.28)', background: 'linear-gradient(135deg,rgba(201,168,76,0.04),transparent)' }} />
              <div className="absolute top-[38%] left-[7%] right-[7%] h-[20%] rounded-[2px]" style={{ border: '1px solid rgba(201,168,76,0.28)', background: 'linear-gradient(135deg,rgba(201,168,76,0.04),transparent)' }} />
              <div className="absolute top-[62%] left-[7%] right-[7%] h-[28%] rounded-[2px]" style={{ border: '1px solid rgba(201,168,76,0.28)', background: 'linear-gradient(135deg,rgba(201,168,76,0.04),transparent)' }} />
              <div className="absolute top-1/2 right-3 w-[14px] h-[26px] rounded-[7px]" style={{ border: '2px solid #C9A84C', background: 'linear-gradient(180deg,#E8C97A,#C9A84C)', boxShadow: '0 0 10px rgba(201,168,76,0.4)', transform: 'translateY(-50%)' }} />
            </div>
            <div className="w-1/2 h-full relative overflow-hidden animate-[openR_1.5s_1.1s_cubic-bezier(0.4,0,0.2,1)_forwards]" style={{ borderLeft: '2px solid #C9A84C', transformOrigin: 'right center', background: 'linear-gradient(135deg,#1C0E06,#2A1408 50%,#1C0E06)' }}>
              <div className="absolute top-[7%] left-[7%] right-[7%] h-[27%] rounded-[2px]" style={{ border: '1px solid rgba(201,168,76,0.28)', background: 'linear-gradient(135deg,rgba(201,168,76,0.04),transparent)' }} />
              <div className="absolute top-[38%] left-[7%] right-[7%] h-[20%] rounded-[2px]" style={{ border: '1px solid rgba(201,168,76,0.28)', background: 'linear-gradient(135deg,rgba(201,168,76,0.04),transparent)' }} />
              <div className="absolute top-[62%] left-[7%] right-[7%] h-[28%] rounded-[2px]" style={{ border: '1px solid rgba(201,168,76,0.28)', background: 'linear-gradient(135deg,rgba(201,168,76,0.04),transparent)' }} />
              <div className="absolute top-1/2 left-3 w-[14px] h-[26px] rounded-[7px]" style={{ border: '2px solid #C9A84C', background: 'linear-gradient(180deg,#E8C97A,#C9A84C)', boxShadow: '0 0 10px rgba(201,168,76,0.4)', transform: 'translateY(-50%)' }} />
            </div>
          </div>
        </div>
      )}

      {/* COURTROOM */}
      <div className="fixed inset-0 animate-[roomIn_0.4s_2.7s_ease_forwards]" style={{ background: 'linear-gradient(180deg,#140A04 0%,#1E0E06 30%,#2A1508 60%,#361C0A 100%)' }}>
        {/* ceiling */}
        <div className="absolute top-0 left-0 right-0 h-[14%]" style={{ background: 'linear-gradient(180deg,#080503,#140A04)', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
          {[18, 38, 62, 82].map((left, i) => (
            <div key={i} className="absolute bottom-0 w-[2px]" style={{ left: `${left}%`, height: i % 2 === 0 ? 50 : 65, background: 'linear-gradient(180deg,transparent,rgba(201,168,76,0.5))' }}>
              <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 w-[100px] h-[50px] rounded-[50%]" style={{ background: 'radial-gradient(ellipse,rgba(255,235,180,0.1) 0%,transparent 70%)' }} />
            </div>
          ))}
        </div>

        {/* back wall */}
        <div className="absolute top-[14%] left-0 right-0 bottom-[36%]" style={{ background: 'linear-gradient(180deg,#221008,#341808)' }}>
          <div className="absolute bottom-0 left-0 right-0 h-[42%]" style={{ background: '#1E0C06', borderTop: '2px solid #C9A84C' }}>
            <div className="absolute inset-[6px]" style={{ border: '1px solid rgba(201,168,76,0.18)' }} />
          </div>
          {/* seal */}
          <div className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] animate-[sealIn_0.8s_3.2s_ease_forwards]" style={{ opacity: 0 }}>
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="44" stroke="#C9A84C" strokeWidth="1.5" strokeDasharray="4 3" />
              <circle cx="50" cy="50" r="37" stroke="#C9A84C" strokeWidth="0.5" />
              <polygon points="50,16 57,37 80,37 62,51 69,72 50,59 31,72 38,51 20,37 43,37" fill="none" stroke="#C9A84C" strokeWidth="1" />
              <text x="50" y="91" fontFamily="serif" fontSize="7" fill="#C9A84C" textAnchor="middle" letterSpacing="3">VERITAS</text>
            </svg>
          </div>
        </div>

        {/* pilasters */}
        {[{ cls: 'left-[10%]' }, { cls: 'left-[21%]' }, { cls: 'right-[10%]' }, { cls: 'right-[21%]' }].map((p, i) => (
          <div key={i} className={`absolute top-[14%] bottom-[36%] w-[22px] ${p.cls}`} style={{ background: 'linear-gradient(90deg,#221008,#3E2010,#221008)', border: '1px solid rgba(201,168,76,0.15)' }}>
            <div className="absolute top-0 left-0 right-0 h-[18px]" style={{ background: '#4A2818', borderBottom: '1.5px solid #C9A84C' }} />
            <div className="absolute bottom-0 left-0 right-0 h-[18px]" style={{ background: '#4A2818', borderTop: '1.5px solid #C9A84C' }} />
          </div>
        ))}

        {/* floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[36%]" style={{ background: 'linear-gradient(180deg,#1E0C06,#120803)', borderTop: '2px solid #C9A84C' }}>
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(201,168,76,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.06) 1px,transparent 1px)', backgroundSize: '70px 70px', transform: 'perspective(360px) rotateX(52deg) translateY(-18px)', transformOrigin: 'bottom' }} />
        </div>

        {/* balustrade */}
        <div className="absolute bottom-[36%] left-[6%] right-[6%] h-[70px] animate-[balIn_0.8s_3s_cubic-bezier(0.2,0.8,0.3,1)_forwards]" style={{ opacity: 0 }}>
          <div className="absolute top-0 left-0 right-0 h-[10px] rounded-[2px]" style={{ background: 'linear-gradient(180deg,#E8C97A,#C9A84C)', boxShadow: '0 2px 10px rgba(201,168,76,0.35)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-[7px] rounded-[2px]" style={{ background: 'linear-gradient(180deg,#C9A84C,#8A6020)' }} />
          <div className="absolute top-[10px] bottom-[7px] left-3 right-3 flex justify-between items-stretch">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="flex-[0_0_5px] rounded-[3px] relative" style={{ background: 'linear-gradient(180deg,#E8C97A,#C9A84C 50%,#906820)' }}>
                <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full" style={{ background: '#E8C97A' }} />
              </div>
            ))}
          </div>
        </div>

        {/* PERSONAS */}
        <div className="absolute left-[4%] right-[4%] flex justify-around items-end" style={{ bottom: 'calc(36% + 52px)' }}>
          {panel.map((p, i) => (
            <div
              key={p.key}
              className={`flex flex-col items-center cursor-pointer transition-transform duration-200 relative ${speakingKeys.includes(p.key) ? '-translate-y-1.5' : ''}`}
              style={{
                opacity: entranceDone ? 1 : 0,
                transform: entranceDone ? (speakingKeys.includes(p.key) ? 'translateY(-6px)' : 'translateY(0)') : 'translateY(25px)',
                transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.2,0.8,0.3,1)',
                transitionDelay: entranceDone ? `${i * 0.14}s` : '0s',
              }}
            >
              {/* speech bubble */}
              {bubbleTexts[p.key] && (
                <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 w-[170px] z-20 animate-[bubbleIn_0.25s_ease] rounded-lg p-2.5 text-[11.5px] leading-relaxed" style={{ background: 'rgba(245,240,232,0.95)', border: '1.5px solid #C9A84C', color: '#1A0A04', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                  {bubbleTexts[p.key] === '…' ? (
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map((j) => (
                        <span key={j} className="w-[5px] h-[5px] rounded-full animate-[dotBounce_0.9s_ease_infinite]" style={{ background: '#C9A84C', animationDelay: `${j * 0.15}s` }} />
                      ))}
                    </div>
                  ) : (
                    bubbleTexts[p.key]
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[7px] border-transparent" style={{ borderTopColor: '#C9A84C' }} />
                </div>
              )}
              {/* name label — above avatar */}
              <div className="mb-[6px] font-['Playfair_Display'] text-[9px] font-bold tracking-[0.12em] uppercase text-center leading-tight max-w-[95px]" style={{ color: '#C9A84C', textShadow: '0 0 10px rgba(201,168,76,0.5)' }}>
                {p.name}
              </div>
              {/* avatar — bigger, fills card */}
              <div
                className="w-[90px] h-[115px] rounded-lg overflow-hidden relative transition-all duration-300"
                style={{
                  background: '#1a1510',
                  border: speakingKeys.includes(p.key) ? '2px solid #E8C97A' : '1.5px solid rgba(201,168,76,0.35)',
                  boxShadow: speakingKeys.includes(p.key)
                    ? '0 0 24px rgba(201,168,76,0.6), 0 0 48px rgba(201,168,76,0.25), inset 0 0 20px rgba(201,168,76,0.08)'
                    : '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover object-center"
                />
                {/* subtle vignette */}
                <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 -20px 20px rgba(10,8,6,0.4), inset 0 0 0 1px rgba(201,168,76,0.08)' }} />
              </div>
              {/* spotlight cone */}
              <div className="absolute bottom-[-14px] left-1/2 -translate-x-1/2 w-[100px] h-[90px] pointer-events-none -z-10" style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(255,235,180,0.1) 0%,transparent 70%)' }} />
            </div>
          ))}
        </div>

        {/* CHAT PANEL */}
        <div className="absolute bottom-0 left-0 right-0 h-[36%] flex flex-col" style={{ background: 'rgba(8,5,3,0.9)', borderTop: '1px solid rgba(201,168,76,0.25)', backdropFilter: 'blur(8px)' }}>
          {/* chat header */}
          <div className="flex items-center justify-between px-5 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
            <span className="font-['Playfair_Display'] text-xs font-normal tracking-[0.3em] uppercase" style={{ color: 'rgba(201,168,76,0.7)' }}>
              {panelName}
            </span>
            <span className="text-[13px] tracking-[0.1em]" style={{ color: 'rgba(201,168,76,0.5)', fontFamily: "'Cormorant Garamond', serif" }}>
              Exchange <span style={{ color: '#C9A84C', fontWeight: 600 }}>{exchanges}</span>/5
            </span>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(201,168,76,0.2) transparent' }}>
            {messages.map((msg, idx) => {
              // For panel messages, find the specific speaker avatar
              const speakerPersona = msg.role === 'panel' && msg.speaker
                ? panel.find((p) => msg.speaker!.toLowerCase().includes(p.name.toLowerCase()))
                : null;
              return (
                <div
                  key={idx}
                  className={`flex gap-3 items-start max-w-[92%] animate-[msgIn_0.25s_ease] ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''}`}
                >
                  {msg.role === 'user' ? (
                    <div className="w-[32px] h-[32px] rounded overflow-hidden shrink-0 flex items-center justify-center" style={{ border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(201,168,76,0.15)' }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#C9A84C" strokeWidth="1.5">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-[32px] h-[40px] rounded overflow-hidden shrink-0 bg-[#1a1510]" style={{ border: '1px solid rgba(201,168,76,0.25)' }}>
                      <img
                        src={speakerPersona?.image || panel[0]?.image || ''}
                        alt={msg.speaker || 'Panel'}
                        className="w-full h-full object-contain object-bottom"
                      />
                    </div>
                  )}
                  <div
                    className="py-3 px-4 rounded-xl text-[13.5px] leading-relaxed shadow-lg"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      background: msg.role === 'user' ? 'rgba(201,168,76,0.14)' : 'rgba(20,30,50,0.85)',
                      border: msg.role === 'user' ? '1.5px solid rgba(201,168,76,0.35)' : '1.5px solid rgba(201,168,76,0.22)',
                      color: msg.role === 'user' ? '#E8C97A' : 'rgba(245,240,232,0.92)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <span
                      className="text-[10px] font-bold tracking-[0.1em] uppercase block mb-1.5"
                      style={{ color: '#C9A84C' }}
                    >
                      {msg.speaker}
                    </span>
                    {renderStyledText(msg.content)}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* input */}
          {!showDone ? (
            <div className="flex gap-[10px] px-5 py-[10px] shrink-0" style={{ borderTop: '1px solid rgba(201,168,76,0.12)' }}>
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isWaiting}
                placeholder="State your defence..."
                className="flex-1 rounded-md px-[14px] py-2 text-sm outline-none resize-none transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(201,168,76,0.06)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  color: '#F5F0E8',
                  fontFamily: "'Cormorant Garamond', serif",
                  height: 40,
                  lineHeight: 1.3,
                }}
              />
              <button
                onClick={handleSend}
                disabled={isWaiting || !inputValue.trim()}
                className="rounded-md px-4 text-xs tracking-[0.15em] whitespace-nowrap transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(201,168,76,0.2)]"
                style={{
                  background: 'rgba(201,168,76,0.12)',
                  border: '1px solid rgba(201,168,76,0.4)',
                  color: '#C9A84C',
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                Send
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-[10px] py-[14px]" style={{ background: 'rgba(201,168,76,0.06)', borderTop: '1px solid rgba(201,168,76,0.2)' }}>
              <span className="text-[13px] tracking-[0.15em] uppercase" style={{ color: 'rgba(201,168,76,0.6)', fontFamily: "'Cormorant Garamond', serif" }}>
                Defence complete
              </span>
              <button
                onClick={handleGenerateCard}
                className="bg-transparent border px-7 py-2 text-xs tracking-[0.2em] uppercase cursor-pointer animate-[cardPulse_2.5s_ease_infinite]"
                style={{ borderColor: '#C9A84C', color: '#C9A84C', fontFamily: "'Playfair_Display', serif" }}
              >
                See Your Verdict →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes preFade { to { opacity: 0; pointer-events: none; } }
        @keyframes gavelFlash { 50% { opacity: 1; } }
        @keyframes rippleOut { 0% { width: 8px; height: 8px; opacity: 0.8; } 100% { width: 350px; height: 350px; opacity: 0; } }
        @keyframes burst { 0% { opacity: 0; } 15% { opacity: 1; } 45% { opacity: 0.7; } 100% { opacity: 0; } }
        @keyframes raysShow { 0% { opacity: 0; } 20% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes openL { to { transform: perspective(1400px) rotateY(-108deg); } }
        @keyframes openR { to { transform: perspective(1400px) rotateY(108deg); } }
        @keyframes roomIn { to { opacity: 1; } }
        @keyframes sealIn { to { opacity: 0.55; } }
        @keyframes balIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bubbleIn { from { opacity: 0; transform: translateX(-50%) translateY(6px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes dotBounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-5px); } }
        @keyframes msgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cardPulse { 0%, 100% { box-shadow: 0 0 6px rgba(201,168,76,0.15); } 50% { box-shadow: 0 0 18px rgba(201,168,76,0.35); } }
      `}</style>
    </div>
  );
}
