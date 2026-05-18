import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RoastOutput } from '@/contexts/SessionContext';
import type { Persona } from '@/lib/personas';


interface VerdictViewerProps {
  roasts: RoastOutput[];
  personas: Persona[];
}

function scoreColorClass(s: number): string {
  if (s >= 7.5) return 'text-[#4ADE80]';
  if (s >= 5) return 'text-[#FBBF24]';
  return 'text-[#F87171]';
}

function barColorClass(s: number): string {
  if (s >= 7.5) return 'bg-[#16A34A]';
  if (s >= 5) return 'bg-[#D97706]';
  return 'bg-[#DC2626]';
}

export default function VerdictViewer({ roasts, personas }: VerdictViewerProps) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);


  const getPersonaImage = (roastName: string) => {
    for (const p of personas) {
      if (p.name === roastName || roastName.includes(p.name)) {
        return p.image;
      }
    }
    return '';
  };

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= roasts.length) return;
      setCurrent(idx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [roasts.length]
  );

  const handleShowEnterRoom = useCallback(() => {
    navigate('/analysis');
  }, [navigate]);

  const p = roasts[current];
  const isFirst = current === 0;
  const isLast = current === roasts.length - 1;

  const breakdown = p.section_breakdown.map((s, idx) => (
    <div
      key={idx}
      className="bg-[#1A2C47] border border-white/[0.06] rounded-lg p-3.5 md:p-4"
    >
      <div className="text-[10px] uppercase tracking-[0.1em] font-semibold text-[#C9A84C] mb-2">
        {s.section}
      </div>
      <div className="text-xs italic text-[#8899AA] border-l-2 border-[rgba(201,168,76,0.18)] pl-2.5 mb-2 leading-relaxed">
        &ldquo;{s.quote}&rdquo;
      </div>
      <div className="text-[13.5px] text-[#F5F0E6] leading-relaxed">
        {s.critique}
      </div>
    </div>
  ));

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
        {roasts.map((roast, i) => (
          <button
            key={roast.persona_name}
            onClick={() => goTo(i)}
            className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-[10px] cursor-pointer border min-w-[110px] transition-all duration-200 ${
              i === current
                ? 'border-[#C9A84C] bg-[#1E3050] shadow-[0_0_0_1px_rgba(201,168,76,0.2),0_4px_20px_rgba(0,0,0,0.3)]'
                : 'border-[rgba(201,168,76,0.12)] bg-[#152035] hover:border-[rgba(201,168,76,0.35)] hover:bg-[#1E3050]'
            }`}
          >
            <div className="w-12 h-14 relative bg-black rounded-md overflow-hidden">
              <img
                src={getPersonaImage(roast.persona_name)}
                alt={roast.persona_name}
                className="w-full h-full object-contain object-bottom"
              />
            </div>
            <div className="text-[10px] font-semibold text-[#F5F0E6] text-center leading-tight tracking-wide">
              {roast.persona_name}
            </div>
            <div
              className={`text-[11px] font-bold w-[22px] h-[22px] rounded-full flex items-center justify-center bg-black/30 ${scoreColorClass(roast.score)}`}
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {roast.score}
            </div>
            <div className="h-0.5 w-full bg-[rgba(201,168,76,0.12)] rounded-sm mt-0.5">
              <div
                className="h-full rounded-sm bg-[#C9A84C] transition-[width] duration-300"
                style={{
                  width:
                    i < current ? '100%' : i === current ? '50%' : '0%',
                }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Verdict Panel */}
      <div
        className="bg-[#152035] border border-[rgba(201,168,76,0.18)] rounded-[14px] overflow-hidden"
        style={{
          animation: 'panelIn 0.35s cubic-bezier(0.2, 0.8, 0.3, 1)',
        }}
      >
        {/* Persona Hero */}
        <div
          className="flex items-end gap-0 border-b border-[rgba(201,168,76,0.18)] min-h-[200px] relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1E3050 0%, #0C1525 100%)',
          }}
        >
          {/* Radial gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 50% 80% at 15% 100%, rgba(201,168,76,0.06) 0%, transparent 70%)',
            }}
          />

          {/* Hero Image */}
          <div className="w-[180px] flex-shrink-0 h-[200px] relative bg-black">
            <img
              src={getPersonaImage(p.persona_name)}
              alt={p.persona_name}
              className="w-full h-full object-contain object-bottom block"
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-[60px]"
              style={{
                background: 'linear-gradient(90deg, transparent, #1E3050)',
              }}
            />
          </div>

          {/* Hero Content */}
          <div className="flex-1 py-6 px-5 md:px-7 relative z-10">
            <div
              className="text-[26px] font-black text-[#F5F0E6] mb-1 leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {p.persona_name}
            </div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-[#C9A84C] mb-4">
              {p.persona_role}
            </div>

            {/* Score Row */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`text-[52px] font-black leading-none ${scoreColorClass(p.score)}`}
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {p.score}
              </div>
              <div className="text-xl text-[#8899AA]">/10</div>
              <div className="flex-1 max-w-[200px]">
                <div className="h-1 bg-white/10 rounded-sm overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-sm transition-[width] duration-[800ms] ${barColorClass(p.score)}`}
                    style={{ width: `${p.score * 10}%` }}
                  />
                </div>
                <div className="text-[13px] text-[#AABBCC] italic leading-relaxed">
                  {p.score_rationale}
                </div>
              </div>
            </div>

            {/* Verdict Text */}
            <div className="text-base leading-relaxed text-[#F5F0E6] italic border-l-2 border-[rgba(201,168,76,0.18)] pl-3.5 mt-3">
              &ldquo;{p.verdict}&rdquo;
            </div>
          </div>
        </div>

        {/* Panel Body */}
        <div className="p-6 md:p-7">
          {/* Sharpest Objection */}
          <div className="mb-7">
            <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3.5 flex items-center gap-2">
              Sharpest objection
              <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
            </div>
            <div className="bg-[rgba(220,38,38,0.06)] border border-[rgba(220,38,38,0.2)] rounded-lg p-4 mb-3.5">
              <div className="text-sm italic text-[#AABBCC] border-l-2 border-[rgba(220,38,38,0.4)] pl-3 mb-3 leading-relaxed">
                &ldquo;{p.sharpest_objection.quote}&rdquo;
              </div>
              <div className="text-sm text-[#F5F0E6] leading-relaxed">
                {p.sharpest_objection.objection}
              </div>
            </div>
          </div>

          {/* Section Breakdown */}
          <div className="mb-7">
            <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3.5 flex items-center gap-2">
              Section breakdown
              <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
            </div>
            <div className="flex flex-col gap-3">{breakdown}</div>
          </div>

          {/* What Would Change My Mind */}
          <div>
            <div className="text-[9px] uppercase tracking-[0.45em] text-[#C9A84C] mb-3.5 flex items-center gap-2">
              What would change my mind
              <span className="flex-1 h-px bg-gradient-to-r from-[rgba(201,168,76,0.2)] to-transparent" />
            </div>
            <div className="bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.2)] rounded-lg p-4">
              <div className="text-sm text-[#F5F0E6] leading-relaxed italic">
                {p.what_would_change_my_mind}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => goTo(current - 1)}
          disabled={isFirst}
          className="flex items-center gap-2 bg-transparent border border-[rgba(201,168,76,0.25)] rounded-md px-5 py-2.5 text-sm text-[#C9A84C] tracking-wide transition-all duration-200 hover:bg-[rgba(201,168,76,0.08)] hover:border-[#C9A84C] disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
        >
          &larr; Previous
        </button>
        <div className="text-xs text-[#8899AA] tracking-wide">
          {current + 1} of {roasts.length}
        </div>
        {!isLast ? (
          <button
            onClick={() => goTo(current + 1)}
            className="flex items-center gap-2 bg-[#C9A84C] text-[#0C1525] border border-[#C9A84C] rounded-md px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:bg-[#E8C97A] hover:border-[#E8C97A]"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            Next reviewer &rarr;
          </button>
        ) : (
          <button
            onClick={handleShowEnterRoom}
            className="flex items-center gap-2 bg-[#C9A84C] text-[#0C1525] border border-[#C9A84C] rounded-md px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:bg-[#E8C97A] hover:border-[#E8C97A]"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            All verdicts read &rarr;
          </button>
        )}
      </div>

      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(201,168,76,0); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
