
import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function SpinWheel({ segments = [], trigger }) {
  const [angle, setAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  // how many slices to draw (at least 6 so it looks nice)
  const count = useMemo(() => {
    const n = segments.length;
    return n > 0 ? n : 6;
  }, [segments.length]);

  const sliceAngle = 360 / count;

  // ---------- SOUND (optional) ----------
  const audioRef = useRef(null);

  useEffect(() => {
    // put your file in: public/sounds/spin.mp3
    const audio = new Audio('/sounds/spin.mp3');
    audio.volume = 0.7;
    audioRef.current = audio;
  }, []);

  function playSound() {
    if (!audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {
      /* ignore */
    }
  }

  function stopSound() {
    if (!audioRef.current) return;
    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } catch {
      /* ignore */
    }
  }

  // ---------- SPIN LOGIC (purely visual) ----------
  useEffect(() => {
    if (!trigger) return; // do nothing on first render
    if (!count) return;

    // visual spin: 4 full turns + random angle
    const extraSpins = 4;
    const randomAngle = Math.random() * 360;
    const targetAngle = extraSpins * 360 + randomAngle;

    setIsSpinning(true);
    setAngle(targetAngle);
    playSound();

    const timer = setTimeout(() => {
      setIsSpinning(false);
      stopSound();
    }, 5000); // MUST match CSS transition 5s

    return () => {
      clearTimeout(timer);
      stopSound();
    };
  }, [trigger, count]);

  const wheelStyle = isSpinning
    ? {
        transform: `rotate(${angle}deg)`,
        transition: 'transform 5s cubic-bezier(0.33, 1, 0.68, 1)',
      }
    : {
        transform: `rotate(${angle % 360}deg)`,
        transition: 'none',
      };

  // bright RGB slice colors
  const colors = [
    '#ff4b5c', // red
    '#ffcc00', // yellow
    '#00e5ff', // cyan
    '#00c853', // green
    '#d500f9', // purple/pink
    '#ff6d00', // orange
    '#40c4ff', // light blue
    '#ff4081', // hot pink
  ];

  // If really no segments, still show an empty wheel
  if (!segments.length) {
    return (
      <div className="spin-wheel-wrapper">
        <div className="spin-wheel-pointer" />
        <div className="spin-wheel-empty">Waiting for players…</div>
      </div>
    );
  }

  return (
    <div className="spin-wheel-wrapper">
      <div className="spin-wheel-pointer" />
      <div className="spin-wheel" style={wheelStyle}>
        {Array.from({ length: count }).map((_, index) => {
          const startAngle = index * sliceAngle;
          const skew = 90 - sliceAngle;
          const color = colors[index % colors.length];

          return (
            <div
              key={index}
              className="spin-wheel-segment"
              style={{
                transform: `rotate(${startAngle}deg) skewY(${skew}deg)`,
                background: color,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
