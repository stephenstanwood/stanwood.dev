import { useState, useEffect } from 'react';

const elements = [
  { symbol: 'Cl', number: '17', name: 'Chlorine', formula: 'Cl₂', bg: '#2196F3', accent: '#0d47a1' },
  { symbol: 'Cf', number: '☕', name: 'Coffee', formula: 'C₈H₁₀N₄O₂', bg: '#C4956A', accent: '#8a6642' },
  { symbol: 'Cc', number: '✦', name: 'Claude Code', formula: 'CC', bg: '#da7756', accent: '#8a3a20' },
];

type Phase = 'idle' | 'slide-in' | 'react' | 'product' | 'hold';

export default function ChemFormula({ compact = false }: { compact?: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [visibleCount, setVisibleCount] = useState(0);

  const s = compact ? 0.6 : 1; // scale factor

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    function run() {
      setPhase('idle');
      setVisibleCount(0);

      timeout = setTimeout(() => {
        setPhase('slide-in');
        setVisibleCount(1);
        timeout = setTimeout(() => {
          setVisibleCount(2);
          timeout = setTimeout(() => {
            setVisibleCount(3);
            timeout = setTimeout(() => {
              setPhase('react');
              timeout = setTimeout(() => {
                setPhase('product');
                timeout = setTimeout(() => {
                  setPhase('hold');
                  timeout = setTimeout(() => run(), 4000);
                }, 600);
              }, 700);
            }, 1500);
          }, 500);
        }, 500);
      }, 400);
    }

    run();
    return () => clearTimeout(timeout);
  }, []);

  const showElements = phase === 'slide-in' || phase === 'react';
  const showProduct = phase === 'product' || phase === 'hold';

  const tileW = Math.round(86 * s);
  const tileH = Math.round(108 * s);
  const symbolSize = Math.round(34 * s);
  const formulaSize = Math.round(9 * s);
  const nameSize = Math.round(7 * s);
  const numberSize = Math.round(11 * s);
  const opSize = Math.round(24 * s);
  const productTitleSize = compact ? 20 : 34;
  const productSubSize = compact ? 8 : 9;
  const gap = compact ? 6 : 10;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: compact ? 'flex-start' : 'center',
      padding: compact ? '8px 0' : '24px 16px',
      fontFamily: "'Space Mono', monospace",
      userSelect: 'none',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${gap}px`,
        minHeight: `${tileH + 20}px`,
        justifyContent: compact ? 'flex-start' : 'center',
        flexWrap: 'wrap',
      }}>
        {showElements && elements.map((el, i) => (
          <div key={el.symbol} style={{ display: 'flex', alignItems: 'center', gap: `${gap}px` }}>
            {i > 0 && visibleCount > i && (
              <span style={{
                fontSize: `${opSize}px`,
                fontWeight: 700,
                color: '#444',
                animation: 'cfFadeIn 0.3s ease',
              }}>+</span>
            )}
            {visibleCount > i && (
              <div style={{
                width: `${tileW}px`,
                height: `${tileH}px`,
                border: `${compact ? 2 : 3}px solid #111`,
                borderRadius: '4px',
                boxShadow: phase === 'react'
                  ? `0 0 ${compact ? 12 : 24}px ${el.bg}, 0 0 ${compact ? 24 : 48}px ${el.bg}44, ${compact ? 2 : 4}px ${compact ? 2 : 4}px 0 #111`
                  : `${compact ? 2 : 4}px ${compact ? 2 : 4}px 0 #111`,
                background: el.bg,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                animation: 'cfSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transition: 'box-shadow 0.3s, transform 0.3s',
                transform: phase === 'react' ? 'scale(1.08)' : 'scale(1)',
              }}>
                <span style={{
                  position: 'absolute',
                  top: `${Math.round(5 * s)}px`,
                  right: `${Math.round(7 * s)}px`,
                  fontSize: `${numberSize}px`,
                  color: 'rgba(255,255,255,0.6)',
                }}>{el.number}</span>
                <span style={{
                  fontSize: `${symbolSize}px`,
                  fontWeight: 700,
                  color: '#fff',
                  lineHeight: 1,
                  textShadow: `1px 1px 0 ${el.accent}`,
                }}>{el.symbol}</span>
                <span style={{
                  fontSize: `${formulaSize}px`,
                  color: 'rgba(255,255,255,0.9)',
                  marginTop: `${Math.round(5 * s)}px`,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}>{el.formula}</span>
                <span style={{
                  fontSize: `${nameSize}px`,
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.08em',
                  marginTop: `${Math.round(2 * s)}px`,
                  textTransform: 'uppercase',
                }}>{el.name}</span>
              </div>
            )}
          </div>
        ))}

        {showElements && visibleCount === 3 && (
          <span style={{
            fontSize: `${opSize}px`,
            color: '#444',
            marginLeft: `${Math.round(6 * s)}px`,
            animation: 'cfFadeIn 0.3s ease',
            fontWeight: 700,
          }}>=</span>
        )}

        {showProduct && (
          <div style={{
            animation: 'cfScaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: compact ? 'flex-start' : 'center',
            gap: '4px',
          }}>
            <span style={{
              fontFamily: "'Permanent Marker', cursive",
              fontSize: `${productTitleSize}px`,
              color: '#333',
              letterSpacing: '-0.5px',
            }}>stanwood.dev</span>
            <span style={{
              fontSize: `${productSubSize}px`,
              color: '#aaa',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>powered by chlorine, coffee, and claude code</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cfSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cfFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cfScaleIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
