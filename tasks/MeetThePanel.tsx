import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Persona } from '@/lib/personas';

interface MeetThePanelProps {
  panelLabel: string;
  personas: Persona[];
  onComplete: () => void;
}

const BORDER_COLOURS = ['#C9A84C', '#0D9488', '#8B5CF6', '#EF4444', '#3B82F6'];

export default function MeetThePanel({ panelLabel, personas, onComplete }: MeetThePanelProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'intro' | 'cards' | 'button'>('intro');
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('cards'), 2800);
    const t2 = setTimeout(() => setPhase('button'), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
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
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: '#0C1525',
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      {/* Radial gold glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(201,168,76,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Corner brackets */}
      <CornerBrackets />

      {/* Phase 1: Intro text */}
      {phase === 'intro' && (
        <div className="relative z-10 flex flex-col items-center text-center">
          <IntroText />
        </div>
      )}

      {/* Phase 2: Cards + Panel label */}
      {phase !== 'intro' && (
        <div className="relative z-10 flex flex-col items-center w-full px-4">
          {/* Panel label */}
          <div
            className="mb-6"
            style={{
              opacity: phase === 'cards' || phase === 'button' ? 1 : 0,
              transition: 'opacity 0.6s ease',
            }}
          >
            <span
              className="text-xs uppercase tracking-[0.5em]"
              style={{ color: '#C9A84C' }}
            >
              {panelLabel}
            </span>
          </div>

          {/* Persona cards */}
          <div
            className="flex flex-wrap justify-center gap-3.5"
            style={{ maxWidth: personas.length === 4 ? 720 : 900 }}
          >
            {personas.map((p, i) => (
              <PersonaCard key={p.key} persona={p} index={i} visible={phase === 'cards' || phase === 'button'} />
            ))}
          </div>

          {/* See the verdict button */}
          <div
            className="mt-10"
            style={{
              opacity: phase === 'button' ? 1 : 0,
              transform: phase === 'button' ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
          >
            <button
              onClick={handleVerdictClick}
              className="px-10 py-2.5 rounded text-xs uppercase tracking-[0.22em] border bg-transparent hover:bg-white/5"
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
        </div>
      )}

      <style>{`
        @keyframes pulse-shadow {
          0%, 100% { box-shadow: 0 0 0 rgba(201,168,76,0); }
          50% { box-shadow: 0 0 20px rgba(201,168,76,0.15); }
        }
      `}</style>
    </div>
  );
}

function CornerBrackets() {
  const size = 40;
  const colour = '#C9A84C';
  const bracketStyle: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    borderColor: colour,
    borderStyle: 'solid',
    borderWidth: 0,
  };

  return (
    <>
      {/* Top-left */}
      <div style={{ ...bracketStyle, top: 24, left: 24, borderTopWidth: 1, borderLeftWidth: 1 }} />
      {/* Top-right */}
      <div style={{ ...bracketStyle, top: 24, right: 24, borderTopWidth: 1, borderRightWidth: 1 }} />
      {/* Bottom-left */}
      <div style={{ ...bracketStyle, bottom: 24, left: 24, borderBottomWidth: 1, borderLeftWidth: 1 }} />
      {/* Bottom-right */}
      <div style={{ ...bracketStyle, bottom: 24, right: 24, borderBottomWidth: 1, borderRightWidth: 1 }} />
    </>
  );
}

function IntroText() {
  const items = [
    { text: 'Your document has been reviewed', delay: 100, size: 10, spacing: '0.55em', colour: '#C9A84C', uppercase: true, bold: false, italic: false },
    { text: 'Meet The ', delay: 300, size: 60, spacing: 'normal', colour: '#F5F0E6', uppercase: false, bold: true, italic: false, special: false },
    { text: 'Panel', delay: 300, size: 60, spacing: 'normal', colour: '#E8C97A', uppercase: false, bold: true, italic: true, special: true },
    { text: '', delay: 550, size: 1, spacing: 'normal', colour: '#C9A84C', uppercase: false, bold: false, italic: false, isRule: true },
    { text: '5 professionals. One verdict.', delay: 700, size: 15, spacing: 'normal', colour: '#8899AA', uppercase: false, bold: false, italic: true },
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

        if (item.special) {
          return (
            <span
              key={i}
              className="inline"
              style={{
                fontSize: item.size,
                color: item.colour,
                fontFamily: "'EB Garamond', Georgia, serif",
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
        }

        return (
          <span
            key={i}
            style={{
              fontSize: item.size,
              color: item.colour,
              fontFamily: i === 1 || i === 2 ? "'EB Garamond', Georgia, serif" : 'inherit',
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

function PersonaCard({ persona, index, visible }: { persona: Persona; index: number; visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const delays = [3100, 3280, 3460, 3640, 3820];
  const delay = delays[index] || 3100;

  return (
    <div
      className="flex flex-col overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 165,
        background: '#152035',
        borderRadius: 10,
        border: `1px solid ${hovered ? 'rgba(201,168,76,0.45)' : 'rgba(201,168,76,0.18)'}`,
        boxShadow: hovered
          ? '0 16px 44px rgba(0,0,0,0.55), 0 0 28px rgba(201,168,76,0.1)'
          : '0 4px 20px rgba(0,0,0,0.45)',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(36px) scale(0.96)',
        opacity: visible ? 1 : 0,
        transition: `transform 0.7s ${delay}ms cubic-bezier(0.2, 0.8, 0.3, 1), opacity 0.7s ${delay}ms cubic-bezier(0.2, 0.8, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease`,
        cursor: 'default',
      }}
    >
      {/* Image section */}
      <div className="relative h-36 bg-[#1a2030] overflow-hidden">
        <img
          src={persona.image}
          alt={persona.name}
          className="w-full h-full object-contain object-bottom"
        />
        {/* Bottom gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-14"
          style={{
            background: 'linear-gradient(0deg, #152035, transparent)',
          }}
        />
      </div>

      {/* Body section */}
      <div className="p-3.5 flex flex-col">
        <p
          className="font-bold"
          style={{
            fontSize: 13,
            color: '#F5F0E6',
            fontFamily: "'EB Garamond', Georgia, serif",
          }}
        >
          {persona.name}
        </p>
        <p
          className="uppercase mb-2"
          style={{
            fontSize: 9.5,
            letterSpacing: '0.07em',
            color: '#C9A84C',
          }}
        >
          {persona.role}
        </p>
        {/* Divider */}
        <div
          className="mb-2"
          style={{
            height: 1,
            background: 'linear-gradient(90deg, rgba(201,168,76,0.28), transparent)',
          }}
        />
        <p
          style={{
            fontSize: 11,
            fontStyle: 'italic',
            color: '#8899AA',
            lineHeight: 1.5,
          }}
        >
          {persona.desc}
        </p>
      </div>
    </div>
  );
}
