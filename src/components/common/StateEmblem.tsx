import React, { useState } from 'react';

interface StateEmblemProps {
  className?: string;
  size?: number | string;
  variant?: 'karnataka' | 'ashoka' | 'seal';
  theme?: 'gold' | 'full-color' | 'monochrome' | 'dark';
  useVector?: boolean;
}

/**
 * Official State Emblem Component
 * Displays the user-uploaded authentic Karnataka State Emblem (/assets/aistudio/OIP_99dd58dc.jpg)
 * featuring the mythical Gandaberunda, Sharabhas, and Lion Capital of Ashoka,
 * with resilient SVG fallback for offline / vector rendering.
 */
export const StateEmblem: React.FC<StateEmblemProps> = ({
  className = '',
  size = 64,
  variant = 'karnataka',
  theme = 'full-color',
  useVector = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  // Use the uploaded authentic Karnataka emblem asset
  const emblemAssetUrl = '/assets/aistudio/OIP_99dd58dc.jpg';

  // Render authentic uploaded image if not in explicit vector mode and no image error
  if (!useVector && !imgError && variant !== 'ashoka') {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${
          variant === 'seal' 
            ? 'rounded-full border-2 border-[#D4AF37] shadow-md bg-white ring-2 ring-amber-100/60 p-1' 
            : 'rounded-xl'
        } ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
        role="img"
        aria-label="Government of Karnataka Official State Emblem"
      >
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center rounded-inherit">
          <img
            src={emblemAssetUrl}
            alt="State Emblem of Karnataka"
            className="w-full h-full object-cover transition-transform duration-300 pointer-events-none"
            style={{
              // Center the Gandaberunda & Lion Capital, cropping out any bottom stock watermark
              objectPosition: 'center 26%',
              transform: 'scale(1.16)',
            }}
            onError={() => setImgError(true)}
            loading="eager"
          />
        </div>
      </div>
    );
  }

  // Vector SVG Fallback (rich inline SVG with Ashoka Lion Capital & Gandaberunda)
  return (
    <div 
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      role="img"
      aria-label="Government Emblem"
    >
      <svg
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="emblemGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9E79F" />
            <stop offset="30%" stopColor="#D4AF37" />
            <stop offset="70%" stopColor="#AA7A1E" />
            <stop offset="100%" stopColor="#E5C158" />
          </linearGradient>

          <linearGradient id="emblemRed" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C0392B" />
            <stop offset="100%" stopColor="#7B1113" />
          </linearGradient>

          <linearGradient id="emblemNavy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1B2A4A" />
            <stop offset="100%" stopColor="#0B132B" />
          </linearGradient>

          <linearGradient id="emblemChakra" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#003399" />
            <stop offset="100%" stopColor="#001F5C" />
          </linearGradient>

          <filter id="goldShine" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.3" />
          </filter>
        </defs>

        {variant === 'seal' ? (
          <g>
            <circle cx="120" cy="120" r="112" fill="url(#emblemNavy)" stroke="url(#emblemGold)" strokeWidth="5" />
            <circle cx="120" cy="120" r="102" fill="none" stroke="url(#emblemGold)" strokeWidth="1.5" strokeDasharray="4 3" />
            <circle cx="120" cy="120" r="88" fill="url(#emblemRed)" stroke="url(#emblemGold)" strokeWidth="2.5" />
            
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24;
              const rad = (angle * Math.PI) / 180;
              const cx = 120 + 95 * Math.cos(rad);
              const cy = 120 + 95 * Math.sin(rad);
              return <circle key={i} cx={cx} cy={cy} r="2" fill="url(#emblemGold)" />;
            })}
          </g>
        ) : null}

        {/* Ashoka Lion Capital */}
        <g id="ashoka-lion-capital" transform="translate(0, 0)">
          <path
            d="M85 82 C85 78 155 78 155 82 L152 86 C152 88 88 88 88 86 Z"
            fill="url(#emblemGold)"
            stroke="#633909"
            strokeWidth="0.8"
          />

          <circle cx="120" cy="74" r="7" fill="#FFFFFF" stroke="url(#emblemChakra)" strokeWidth="1.2" />
          <circle cx="120" cy="74" r="2.2" fill="#003399" />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 360) / 12;
            const rad = (angle * Math.PI) / 180;
            const x1 = 120 + 2.2 * Math.cos(rad);
            const y1 = 74 + 2.2 * Math.sin(rad);
            const x2 = 120 + 6.8 * Math.cos(rad);
            const y2 = 74 + 6.8 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#003399" strokeWidth="0.7" />;
          })}

          <path
            d="M93 75 Q96 72 101 73 Q99 76 96 76 Q93 78 91 75 Z"
            fill="url(#emblemGold)"
            stroke="#633909"
            strokeWidth="0.5"
          />
          <path
            d="M147 75 Q144 72 139 73 Q141 76 144 76 Q147 78 149 75 Z"
            fill="url(#emblemGold)"
            stroke="#633909"
            strokeWidth="0.5"
          />

          <path
            d="M110 38 C106 43 105 52 109 60 C113 65 116 67 120 67 C124 67 127 65 131 60 C135 52 134 43 130 38 C126 34 114 34 110 38 Z"
            fill="url(#emblemGold)"
            stroke="#7A4E08"
            strokeWidth="1"
          />
          <path
            d="M113 32 C113 28 127 28 127 32 C130 36 128 42 120 42 C112 42 110 36 113 32 Z"
            fill="url(#emblemGold)"
            stroke="#7A4E08"
            strokeWidth="0.8"
          />
          <path d="M117 37 Q120 39 123 37 Q120 41 117 37 Z" fill="#633909" />
          <circle cx="116.5" cy="34" r="1.2" fill="#3D1E03" />
          <circle cx="123.5" cy="34" r="1.2" fill="#3D1E03" />
          <polygon points="120,35.5 118.8,37.2 121.2,37.2" fill="#3D1E03" />

          <g>
            <path
              d="M97 42 C92 46 91 55 94 62 C96 66 102 68 107 66 C105 58 104 50 102 44 Z"
              fill="url(#emblemGold)"
              stroke="#7A4E08"
              strokeWidth="0.9"
            />
            <path
              d="M93 36 C89 36 86 40 89 44 C92 47 98 46 98 41 C98 37 96 36 93 36 Z"
              fill="url(#emblemGold)"
              stroke="#7A4E08"
              strokeWidth="0.8"
            />
            <path d="M87 42 L91 43 L88 45 Z" fill="#633909" />
            <circle cx="91" cy="39" r="1.1" fill="#3D1E03" />
          </g>

          <g>
            <path
              d="M143 42 C148 46 149 55 146 62 C144 66 138 68 133 66 C135 58 136 50 138 44 Z"
              fill="url(#emblemGold)"
              stroke="#7A4E08"
              strokeWidth="0.9"
            />
            <path
              d="M147 36 C151 36 154 40 151 44 C148 47 142 46 142 41 C142 37 144 36 147 36 Z"
              fill="url(#emblemGold)"
              stroke="#7A4E08"
              strokeWidth="0.8"
            />
            <path d="M153 42 L149 43 L152 45 Z" fill="#633909" />
            <circle cx="149" cy="39" r="1.1" fill="#3D1E03" />
          </g>
        </g>

        {/* Shield Body */}
        <g id="shield-body" transform="translate(0, 5)">
          <path
            d="M80 92 C80 92 160 92 160 92 C160 135 145 160 120 172 C95 160 80 135 80 92 Z"
            fill="url(#emblemGold)"
            stroke="#8A5A12"
            strokeWidth="3.5"
            filter="url(#goldShine)"
          />
          <path
            d="M84 95 C84 95 156 95 156 95 C156 132 142 154 120 165 C98 154 84 132 84 95 Z"
            fill="url(#emblemRed)"
            stroke="#F9E79F"
            strokeWidth="1.2"
          />

          {/* Gandaberunda */}
          <g id="gandaberunda" transform="translate(0, 0)">
            <path
              d="M115 102 L117 98 L120 101 L123 98 L125 102 Z"
              fill="url(#emblemGold)"
              stroke="#633909"
              strokeWidth="0.6"
            />
            <path
              d="M114 105 C111 103 106 104 105 108 C104 111 108 114 112 113 C114 113 116 110 115 106 Z"
              fill="url(#emblemGold)"
              stroke="#633909"
              strokeWidth="0.7"
            />
            <path
              d="M105 107 C100 108 98 111 101 113 C103 112 105 110 106 109 Z"
              fill="#F9E79F"
              stroke="#633909"
              strokeWidth="0.5"
            />
            <circle cx="108" cy="107" r="1.1" fill="#3D1E03" />

            <path
              d="M126 105 C129 103 134 104 135 108 C136 111 132 114 128 113 C126 113 124 110 125 106 Z"
              fill="url(#emblemGold)"
              stroke="#633909"
              strokeWidth="0.7"
            />
            <path
              d="M135 107 C140 108 142 111 139 113 C137 112 135 110 134 109 Z"
              fill="#F9E79F"
              stroke="#633909"
              strokeWidth="0.5"
            />
            <circle cx="132" cy="107" r="1.1" fill="#3D1E03" />

            <path
              d="M112 112 C108 116 108 126 112 133 C116 138 124 138 128 133 C132 126 132 116 128 112 Z"
              fill="url(#emblemGold)"
              stroke="#7A4E08"
              strokeWidth="0.8"
            />

            <path
              d="M109 116 C102 112 94 111 90 114 C87 117 88 122 93 128 C96 131 101 134 107 131 C108 125 109 120 109 116 Z"
              fill="url(#emblemGold)"
              stroke="#7A4E08"
              strokeWidth="0.8"
            />
            <path d="M91 115 C95 120 101 123 107 125" stroke="#7A4E08" strokeWidth="0.7" fill="none" />
            <path d="M94 123 C98 126 104 128 107 128" stroke="#7A4E08" strokeWidth="0.7" fill="none" />

            <path
              d="M131 116 C138 112 146 111 150 114 C153 117 152 122 147 128 C144 131 139 134 133 131 C132 125 131 120 131 116 Z"
              fill="url(#emblemGold)"
              stroke="#7A4E08"
              strokeWidth="0.8"
            />
            <path d="M149 115 C145 120 139 123 133 125" stroke="#7A4E08" strokeWidth="0.7" fill="none" />
            <path d="M146 123 C142 126 136 128 133 128" stroke="#7A4E08" strokeWidth="0.7" fill="none" />

            <path
              d="M114 134 C112 144 114 153 117 157 C120 159 120 159 123 157 C126 153 128 144 126 134 Z"
              fill="url(#emblemGold)"
              stroke="#7A4E08"
              strokeWidth="0.8"
            />
            <line x1="120" y1="135" x2="120" y2="156" stroke="#7A4E08" strokeWidth="0.7" />

            <path
              d="M110 132 L103 140 L107 142 L112 135 Z"
              fill="url(#emblemGold)"
              stroke="#7A4E08"
              strokeWidth="0.6"
            />
            <path
              d="M130 132 L137 140 L133 142 L128 135 Z"
              fill="url(#emblemGold)"
              stroke="#7A4E08"
              strokeWidth="0.6"
            />
          </g>
        </g>

        {/* Sharabhas */}
        <g id="supporter-left">
          <path
            d="M62 165 C58 155 58 135 64 120 C68 112 73 108 78 115 C75 125 76 142 74 158 C72 164 68 168 62 165 Z"
            fill="url(#emblemGold)"
            stroke="#7A4E08"
            strokeWidth="0.9"
          />
          <path
            d="M72 118 C74 110 78 104 82 108 C80 113 77 118 73 124 Z"
            fill="url(#emblemGold)"
            stroke="#7A4E08"
            strokeWidth="0.8"
          />
          <path
            d="M66 106 C62 102 62 94 67 92 C72 90 76 96 75 102 C74 106 70 108 66 106 Z"
            fill="url(#emblemGold)"
            stroke="#7A4E08"
            strokeWidth="0.8"
          />
          <circle cx="68" cy="98" r="1.1" fill="#3D1E03" />
          <path
            d="M60 162 C52 155 49 140 54 132 C56 129 59 132 57 136 C54 142 56 152 61 158 Z"
            fill="url(#emblemGold)"
            stroke="#7A4E08"
            strokeWidth="0.7"
          />
        </g>

        <g id="supporter-right">
          <path
            d="M178 165 C182 155 182 135 176 120 C172 112 167 108 162 115 C165 125 164 142 166 158 C168 164 172 168 178 165 Z"
            fill="url(#emblemGold)"
            stroke="#7A4E08"
            strokeWidth="0.9"
          />
          <path
            d="M168 118 C166 110 162 104 158 108 C160 113 163 118 167 124 Z"
            fill="url(#emblemGold)"
            stroke="#7A4E08"
            strokeWidth="0.8"
          />
          <path
            d="M174 106 C178 102 178 94 173 92 C168 90 164 96 165 102 C166 106 170 108 174 106 Z"
            fill="url(#emblemGold)"
            stroke="#7A4E08"
            strokeWidth="0.8"
          />
          <circle cx="172" cy="98" r="1.1" fill="#3D1E03" />
          <path
            d="M180 162 C188 155 191 140 186 132 C184 129 181 132 183 136 C186 142 184 152 179 158 Z"
            fill="url(#emblemGold)"
            stroke="#7A4E08"
            strokeWidth="0.7"
          />
        </g>

        {/* Motto Banner */}
        <g id="motto-banner" transform="translate(0, 5)">
          <path
            d="M48 184 L65 178 L175 178 L192 184 L186 195 L172 191 L120 193 L68 191 L54 195 Z"
            fill="url(#emblemGold)"
            stroke="#7A4E08"
            strokeWidth="1.2"
            filter="url(#goldShine)"
          />

          <polygon points="48,184 54,195 44,190" fill="#AA7A1E" stroke="#633909" strokeWidth="0.6" />
          <polygon points="192,184 186,195 196,190" fill="#AA7A1E" stroke="#633909" strokeWidth="0.6" />

          <text
            x="120"
            y="189"
            textAnchor="middle"
            fill="#3D1E03"
            fontSize="7.8"
            fontWeight="bold"
            letterSpacing="0.8"
            fontFamily="'Noto Sans Devanagari', 'Mukta', 'serif'"
          >
            सत्यमेವ जयते
          </text>

          <text
            x="120"
            y="204"
            textAnchor="middle"
            fill="url(#emblemNavy)"
            fontSize="6.5"
            fontWeight="900"
            letterSpacing="1.2"
            fontFamily="'Tiro Kannada', 'Noto Serif Kannada', 'serif'"
          >
            ಕರ್ನಾಟಕ ಸರ್ಕಾರ
          </text>
        </g>
      </svg>
    </div>
  );
};

export default StateEmblem;
