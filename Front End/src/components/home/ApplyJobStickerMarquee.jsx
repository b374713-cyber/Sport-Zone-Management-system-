// Front_end/snp/src/components/home/ApplyJobStickerMarquee.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Floating sticker that moves left -> right on a loop.
 * Click opens /apply-job (or a provided path).
 *
 * Props:
 *  - imageSrc : required (imported image)
 *  - height   : band height in px (default 140)
 *  - speedMs  : animation duration (default 12000)
 *  - shadow   : boolean for glow/shadow (default true)
 *  - to       : route to navigate to on click (default '/apply-job')
 */
export default function ApplyJobStickerMarquee({
  imageSrc,
  height = 140,
  speedMs = 12000,
  shadow = true,
  to = '/apply-job',
}) {
  const navigate = useNavigate();

  return (
    <div
      className="apply-marquee-band position-relative w-100 rounded-4"
      style={{
        height,
        background:
          'linear-gradient(180deg, rgba(8,15,40,0.70) 0%, rgba(8,15,40,0.88) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35) inset',
        overflow: 'hidden',
      }}
    >
      {/* moving sticker */}
      <div
        className="apply-marquee-sled position-absolute"
        style={{
          top: '50%',
          transform: 'translate(-50%, -50%)',
          animation: `apply-marquee-slide ${speedMs}ms linear infinite`,
          cursor: 'pointer',
        }}
        onClick={() => navigate(to)}
        title="Apply for Job"
        aria-label="Apply for Job"
      >
        <img
          src={imageSrc}
          alt="Apply for Job"
          style={{
            height: height * 0.7,
            width: 'auto',
            filter: shadow ? 'drop-shadow(0 12px 20px rgba(0,0,0,0.45))' : 'none',
            userSelect: 'none',
            pointerEvents: 'auto',
          }}
          draggable={false}
        />
      </div>

      {/* local CSS for animation */}
      <style>{`
        @keyframes apply-marquee-slide {
          0%   { left: -10%; }
          100% { left: 110%; }
        }
      `}</style>
    </div>
  );
}
