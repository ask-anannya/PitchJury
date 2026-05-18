import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Persona } from '@/lib/personas';

interface MeetThePanelProps {
  panelLabel: string;
  personas: Persona[];
  onComplete: () => void;
}

export default function MeetThePanel({ panelLabel, personas, onComplete }: MeetThePanelProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'intro' | 'content'>('intro');
  const [isExiting, setIsExiting] = useState(false);

  const repPersonas = personas.filter((p) => p.isRepresentative);
  const otherPersonas = personas.filter((p) => !p.isRepresentative);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('content'), 2800);
    return () => clearTimeout(t1);
  }, []);

  const handleVerdictClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
      navigate('/report');
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      style={{
        background: '#0C1525',
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      {/* Radial gold glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(201,168,76,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center py-10 px-4">
        {/* Phase 1: Intro text */}
        {phase === 'intro' && (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <IntroText count={personas.length} />
          </div>
        )}

        {/* Phase 2: Content */}
        {phase === 'content' && (
          <div className="flex flex-col items-center w-full max-w-5xl animate-in fade-in duration-700">
            {/* Panel label */}
            <span className="text-xs uppercase tracking-[0.5em] text-[#C9A84C] mb-8">
              {panelLabel}
            </span>

            {/* Representative personas — compact cards with images */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {repPersonas.map((p) => (
                <RepPersonaCard key={p.key} persona={p} />
              ))}
            </div>

            {/* Divider */}
            <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.2)] to-transparent mb-8" />

            {/* Other personas — compact text list */}
            <div className="w-full max-w-3xl mb-10">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#8899AA] mb-4 text-center">
                Also on the panel ({otherPersonas.length} additional reviewers)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {otherPersonas.map((p) => (
                  <div
                    key={p.key}
                    className="bg-[#152035] border border-[rgba(201,168,76,0.12)] rounded-lg p-3"
                  >
                    <p className="text-xs font-semibold text-[#F5F0E6] truncate">{p.name}</p>
                    <p className="text-[10px] uppercase tracking-wide text-[#C9A84C] truncate">{p.role}</p>
                    <p className="text-[10px] text-[#8899AA] mt-1 line-clamp-2 leading-relaxed">{p.background}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* See the verdict button */}
            <button
              onClick={handleVerdictClick}
              className="px-10 py-2.5 rounded text-xs uppercase tracking-[0.22em] border bg-transparent hover:bg-white/5 cursor-pointer mb-10"
              style={{
                borderColor: 'rgba(201,168,76,0.38)',
                color: '#C9A84C',
                fontFamily: "'EB Garamond', Georgia, serif",
                fontSize: 12,
                letterSpacing: '0.22em',
                animation: 'pulse-shadow 2.5s ease-in-out infinite',
              }}
            >
              See the verdict →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-shadow {
          0%, 100% { box-shadow: 0 0 0 rgba(201,168,76,0); }
          50% { box-shadow: 0 0 20px rgba(201,168,76,0.15); }
        }
      `}</style>
    </div>
  );
}

function IntroText({ count }: { count: number }) {
  const items = [
    { text: 'Your document has been reviewed', delay: 100, size: 10, spacing: '0.55em', colour: '#C9A84C', uppercase: true, bold: false, italic: false },
    { text: 'Meet The ', delay: 300, size: 60, spacing: 'normal', colour: '#F5F0E6', uppercase: false, bold: true, italic: false, special: false },
    { text: 'Panel', delay: 300, size: 60, spacing: 'normal', colour: '#E8C97A', uppercase: false, bold: true, italic: true, special: true },
    { text: '', delay: 550, size: 1, spacing: 'normal', colour: '#C9A84C', uppercase: false, bold: false, italic: false, isRule: true },
    { text: `${count} professionals. One verdict.`, delay: 700, size: 15, spacing: 'normal', colour: '#8899AA', uppercase: false, bold: false, italic: true },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      {items.map((item, i) => {
        if (item.isRule) {
          return (
            <div
              key={i}
              className="my-2"
              style={{
                width: 70,
                height: 1,
                background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
                animation: `fadeUp 0.6s ${item.delay}ms ease forwards`,
                opacity: 0,
              }}
            />
          );
        }

        return (
          <span
            key={i}
            style={{
              fontSize: item.size,
              color: item.colour,
              fontFamily: item.special || i === 1 ? "'EB Garamond', Georgia, serif" : 'inherit',
              fontWeight: item.bold ? 'bold' : 'normal',
              fontStyle: item.italic ? 'italic' : 'normal',
              letterSpacing: item.spacing,
              textTransform: item.uppercase ? 'uppercase' : 'none',
              animation: `fadeUp 0.6s ${item.delay}ms ease forwards`,
              opacity: 0,
            }}
          >
            {item.text}
          </span>
        );
      })}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function RepPersonaCard({ persona }: { persona: Persona }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex flex-col overflow-hidden shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 160,
        background: '#152035',
        borderRadius: 10,
        border: `1px solid ${hovered ? 'rgba(201,168,76,0.45)' : 'rgba(201,168,76,0.18)'}`,
        boxShadow: hovered
          ? '0 16px 44px rgba(0,0,0,0.55), 0 0 28px rgba(201,168,76,0.1)'
          : '0 4px 20px rgba(0,0,0,0.45)',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        cursor: 'default',
      }}
    >
      {persona.image ? (
        <div className="relative h-32 bg-[#1a2030] overflow-hidden">
          <img
            src={persona.image}
            alt={persona.name}
            className="w-full h-full object-contain object-bottom"
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-10"
            style={{ background: 'linear-gradient(0deg, #152035, transparent)' }}
          />
        </div>
      ) : (
        <div className="h-8 bg-[#1a2030]" />
      )}

      <div className="p-3 flex flex-col">
        <p className="font-bold text-[13px] text-[#F5F0E6]" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
          {persona.name}
        </p>
        <p className="uppercase text-[9.5px] tracking-[0.07em] text-[#C9A84C] mb-1.5">
          {persona.role}
        </p>
        <div
          className="mb-1.5"
          style={{ height: 1, background: 'linear-gradient(90deg, rgba(201,168,76,0.28), transparent)' }}
        />
        <p className="text-[11px] italic text-[#8899AA] leading-relaxed line-clamp-3">
          {persona.background}
        </p>
      </div>
    </div>
  );
}
