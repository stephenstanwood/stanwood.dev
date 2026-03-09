import { useState, useEffect } from 'react';

const elements = [
  { symbol: 'Cl', number: '17', name: 'Chlorine', formula: 'Cl₂', color: '#1db842' },
  { symbol: 'Cf', number: '☕', name: 'Coffee', formula: 'C₈H₁₀N₄O₂', color: '#8B4513' },
  { symbol: 'Cc', number: '✦', name: 'Claude Code', formula: 'CC', color: '#da7756' },
];

type Phase = 'idle' | 'slide-in' | 'react' | 'product' | 'hold';

export default function ChemFormula() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [visibleCount, setVisibleCount] = useState(0);

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
            // hold on all 3 cards for a beat
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '24px 16px',
      fontFamily: "'Space Mono', monospace",
      userSelect: 'none',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minHeight: '120px',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {showElements && elements.map((el, i) => (
          <div key={el.symbol} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {i > 0 && visibleCount > i && (
              <span style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#666',
                animation: 'cfFadeIn 0.3s ease',
              }}>+</span>
            )}
            {visibleCount > i && (
              <div style={{
                width: '80px',
                height: '100px',
                border: '3px solid #111',
                boxShadow: phase === 'react'
                  ? `0 0 20px ${el.color}, 3px 3px 0 #111`
                  : '3px 3px 0 #111',
                background: '#fffef5',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                animation: 'cfSlideUp 0.4s ease',
                transition: 'box-shadow 0.3s',
              }}>
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '6px',
                  fontSize: '10px',
                  color: '#888',
                }}>{el.number}</span>
                <span style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  color: el.color,
                  lineHeight: 1,
                }}>{el.symbol}</span>
                <span style={{
                  fontSize: '9px',
                  color: '#444',
                  marginTop: '4px',
                  fontWeight: 700,
                }}>{el.formula}</span>
                <span style={{
                  fontSize: '7px',
                  color: '#888',
                  letterSpacing: '0.05em',
                  marginTop: '2px',
                  textTransform: 'uppercase',
                }}>{el.name}</span>
              </div>
            )}
          </div>
        ))}

        {showElements && visibleCount === 3 && (
          <span style={{
            fontSize: '22px',
            color: '#666',
            marginLeft: '6px',
            animation: 'cfFadeIn 0.3s ease',
          }}>→</span>
        )}

        {showProduct && (
          <div style={{
            animation: 'cfScaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{
              fontFamily: "'Permanent Marker', cursive",
              fontSize: '32px',
              color: '#111',
              letterSpacing: '-0.5px',
            }}>stanwood.dev</span>
            <span style={{
              fontSize: '9px',
              color: '#888',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>powered by chlorine, coffee, and claude code</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cfSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
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
