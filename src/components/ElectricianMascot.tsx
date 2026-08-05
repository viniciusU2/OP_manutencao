import styled, { keyframes } from "styled-components";

/* =========================================================
   ANIMAÇÕES PRINCIPAIS
========================================================= */

const travel = keyframes`
  0% {
    left: -140px;
    transform: scaleX(1);
  }

  38% {
    left: calc(100% - 140px);
    transform: scaleX(1);
  }

  45% {
    left: calc(100% - 140px);
    transform: scaleX(1);
  }

  46% {
    left: calc(100% - 140px);
    transform: scaleX(-1);
  }

  84% {
    left: 20px;
    transform: scaleX(-1);
  }

  91% {
    left: 20px;
    transform: scaleX(-1);
  }

  92% {
    left: 20px;
    transform: scaleX(1);
  }

  100% {
    left: -140px;
    transform: scaleX(1);
  }
`;



const leftLegWalk = keyframes`
  0%,
  100% {
    transform: rotate(24deg);
  }

  50% {
    transform: rotate(-25deg);
  }
`;

const rightLegWalk = keyframes`
  0%,
  100% {
    transform: rotate(-25deg);
  }

  50% {
    transform: rotate(24deg);
  }
`;

const leftArmWalk = keyframes`
  0%,
  100% {
    transform: rotate(-23deg);
  }

  50% {
    transform: rotate(22deg);
  }
`;

const rightArmWalk = keyframes`
  0%,
  100% {
    transform: rotate(25deg);
  }

  50% {
    transform: rotate(-22deg);
  }
`;

const toolboxSwing = keyframes`
  0%,
  100% {
    transform: rotate(8deg);
  }

  50% {
    transform: rotate(-8deg);
  }
`;

const shadowAnimation = keyframes`
  0%,
  100% {
    transform: scaleX(1);
    opacity: 0.45;
  }

  50% {
    transform: scaleX(0.62);
    opacity: 0.18;
  }
`;

const helmetLight = keyframes`
  0%,
  78%,
  100% {
    opacity: 0;
  }

  84%,
  94% {
    opacity: 1;
  }
`;

const blink = keyframes`
  0%,
  45%,
  47%,
  100% {
    transform: scaleY(1);
  }

  46% {
    transform: scaleY(0.08);
  }
`;

/* =========================================================
   ESTILOS
========================================================= */

const Track = styled.div`
  position: absolute;
  inset: 0;
  z-index: 6;

  overflow: hidden;
  pointer-events: none;
  user-select: none;
`;

const Mover = styled.div`
  position: absolute;
  left: -140px;
  bottom: 14px;

  width: 125px;
  height: 175px;

  animation: ${travel} 22s linear infinite;
  will-change: left, transform;

  @media (max-width: 900px) {
    width: 92px;
    height: 130px;
    bottom: 8px;
  }

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;



const CharacterSvg = styled.svg`
  position: relative;
  z-index: 2;

  width: 100%;
  height: 100%;
  overflow: visible;

  .left-leg {
    transform-box: fill-box;
    transform-origin: top center;
    animation: ${leftLegWalk} 0.48s ease-in-out infinite;
  }

  .right-leg {
    transform-box: fill-box;
    transform-origin: top center;
    animation: ${rightLegWalk} 0.48s ease-in-out infinite;
  }

  .left-arm {
    transform-box: fill-box;
    transform-origin: top center;
    animation: ${leftArmWalk} 0.48s ease-in-out infinite;
  }

  .right-arm {
    transform-box: fill-box;
    transform-origin: top center;
    animation: ${rightArmWalk} 0.48s ease-in-out infinite;
  }

  .toolbox {
    transform-box: fill-box;
    transform-origin: top center;
    animation: ${toolboxSwing} 0.48s ease-in-out infinite;
  }

  .helmet-light {
    animation: ${helmetLight} 3s ease-in-out infinite;
  }

  .eyes {
    transform-box: fill-box;
    transform-origin: center;
    animation: ${blink} 4.5s ease-in-out infinite;
  }
`;

const Shadow = styled.div`
  position: absolute;
  left: 18%;
  bottom: 1px;
  z-index: 1;

  width: 64%;
  height: 10px;

  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  filter: blur(3px);

  animation: ${shadowAnimation} 2.2s ease-in-out infinite;
`;

/* =========================================================
   COMPONENTE
========================================================= */

export default function ElectricianMascot() {
  const skinMain = "#6b3f2a";
  const skinShadow = "#57301f";
  const skinDetail = "#422417";
  const hair = "#17100d";

  return (
    <Track aria-hidden="true">
      <Mover>
        <div>
          <CharacterSvg
            viewBox="0 0 120 165"
            xmlns="http://www.w3.org/2000/svg"
            role="presentation"
          >
            <defs>
              <linearGradient
                id="vestGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="#071825" />
                <stop offset="100%" stopColor="#0d0e1f" />
              </linearGradient>

              <linearGradient
                id="helmetGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="#1b1b1b" />
                <stop offset="100%" stopColor="#dbeafe" />
              </linearGradient>

              <linearGradient
                id="uniformGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="#0a131b" />
                <stop offset="100%" stopColor="#020911" />
              </linearGradient>

              <filter id="characterShadow">
                <feDropShadow
                  dx="0"
                  dy="3"
                  stdDeviation="2"
                  floodColor="#020617"
                  floodOpacity="0.45"
                />
              </filter>
            </defs>

            <g filter="url(#characterShadow)">
              {/* Perna traseira */}
              <g className="right-leg">
                <rect
                  x="59"
                  y="108"
                  width="18"
                  height="39"
                  rx="8"
                  fill="#050e18"
                />

                <rect
                  x="61"
                  y="124"
                  width="15"
                  height="5"
                  rx="2"
                  fill="#f8fafc"
                  opacity="0.9"
                />

                <path
                  d="M65 141 C75 142 83 148 82 154 C73 159 61 157 56 152 Z"
                  fill="#291b15"
                />

                <path
                  d="M58 148 C66 149 75 152 80 155"
                  stroke="#9a6845"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>

              {/* Perna dianteira */}
              <g className="left-leg">
                <rect
                  x="42"
                  y="107"
                  width="18"
                  height="40"
                  rx="8"
                  fill="#050e18"
                />

                <rect
                  x="44"
                  y="124"
                  width="15"
                  height="5"
                  rx="2"
                  fill="#f8fafc"
                  opacity="0.9"
                />

                <path
                  d="M46 141 C54 143 62 150 60 155 C50 159 38 157 34 152 Z"
                  fill="#291b15"
                />

                <path
                  d="M38 149 C46 151 53 153 58 155"
                  stroke="#9a6845"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>

              {/* Caixa de ferramentas */}
              <g className="toolbox">
                <path
                  d="M21 102 C18 91 24 84 33 83"
                  fill="none"
                  stroke="#451a03"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                <rect
                  x="6"
                  y="96"
                  width="36"
                  height="26"
                  rx="4"
                  fill="#dc2626"
                  stroke="#7f1d1d"
                  strokeWidth="3"
                />

                <path
                  d="M18 96 V89 H31 V96"
                  fill="none"
                  stroke="#7f1d1d"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M7 108 H41"
                  stroke="#7f1d1d"
                  strokeWidth="2"
                />

                <rect
                  x="21"
                  y="103"
                  width="7"
                  height="5"
                  rx="1"
                  fill="#fbbf24"
                />
              </g>

              {/* Braço traseiro */}
              <g className="right-arm">
                <rect
                  x="72"
                  y="72"
                  width="14"
                  height="36"
                  rx="7"
                  fill="#050e18"

                />

                <rect
                  x="74"
                  y="89"
                  width="11"
                  height="4"
                  rx="2"
                  fill="#f8fafc"
                  opacity="0.9"
                />

                <circle
                  cx="81"
                  cy="108"
                  r="7"
                  fill={skinShadow}
                />
              </g>

              {/* Tronco */}
              <path
                d="M37 66 C43 57 70 57 79 66 L83 111 C70 119 43 118 34 110 Z"
                fill="url(#uniformGradient)"
              />

              {/* Colete refletivo */}
              <path
                d="M44 63 L54 61 L57 112 L41 109 Z"
                fill="url(#vestGradient)"
              />

              <path
                d="M71 62 L61 61 L60 113 L77 109 Z"
                fill="url(#vestGradient)"
              />

              <path
                d="M41 85 H80"
                stroke="#050e18"
                strokeWidth="5"
                opacity="0.95"
              />

              <path
                d="M43 98 H80"
                stroke="#fde68a"
                strokeWidth="4"
              />

              <path
                d="M52 62 L58 79 L65 62"
                fill="#f8fafc"
                opacity="0.95"
              />

              {/* Bolso do colete */}
              <rect
                x="64"
                y="73"
                width="10"
                height="11"
                rx="2"
                fill="#d97706"
                stroke="#92400e"
                strokeWidth="1"
              />

              {/* Braço dianteiro */}
              <g className="left-arm">
                <rect
                  x="30"
                  y="70"
                  width="14"
                  height="37"
                  rx="7"
                  fill="#050e18"
                />

                <rect
                  x="31"
                  y="89"
                  width="11"
                  height="4"
                  rx="2"
                  fill="#f8fafc"
                  opacity="0.9"
                />

                <circle
                  cx="35"
                  cy="107"
                  r="7"
                  fill={skinShadow}
                />
              </g>

              {/* Pescoço */}
              <rect
                x="51"
                y="50"
                width="17"
                height="18"
                rx="7"
                fill={skinShadow}
              />

              {/* Cabeça */}
              <ellipse
                cx="59"
                cy="39"
                rx="24"
                ry="25"
                fill={skinMain}
              />

              {/* Orelhas */}
              <ellipse
                cx="35"
                cy="42"
                rx="5"
                ry="8"
                fill={skinShadow}
              />

              <ellipse
                cx="83"
                cy="42"
                rx="5"
                ry="8"
                fill={skinShadow}
              />

              {/* Cabelo */}
              <path
                d="M36 31 C39 13 70 7 83 28 C73 21 68 24 62 18 C57 25 47 28 36 31 Z"
                fill={hair}
              />

              <path
                d="M37 28 C40 16 48 12 58 11"
                fill="none"
                stroke="#2b1a14"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Olhos */}
              <g className="eyes">
                <ellipse
                  cx="51"
                  cy="40"
                  rx="2.8"
                  ry="4"
                  fill="#111827"
                />

                <ellipse
                  cx="68"
                  cy="40"
                  rx="2.8"
                  ry="4"
                  fill="#111827"
                />

                <circle
                  cx="52"
                  cy="39"
                  r="0.8"
                  fill="#ffffff"
                />

                <circle
                  cx="69"
                  cy="39"
                  r="0.8"
                  fill="#ffffff"
                />
              </g>

              {/* Sobrancelhas */}
              <path
                d="M46 34 Q51 31 56 34"
                fill="none"
                stroke={hair}
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              <path
                d="M64 34 Q69 31 74 34"
                fill="none"
                stroke={hair}
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Nariz */}
              <path
                d="M60 40 L58 47 L62 47"
                fill="none"
                stroke={skinDetail}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Sorriso */}
              <path
                d="M51 52 Q60 59 69 51"
                fill="none"
                stroke="#2c1510"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <path
                d="M54 53 Q60 57 66 53"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              {/* Capacete */}
              <path
                d="M34 29 C35 8 49 2 60 2 C75 2 84 13 85 29 Z"
                fill="url(#helmetGradient)"
                stroke="#94a3b8"
                strokeWidth="2"
              />

              <rect
                x="30"
                y="27"
                width="60"
                height="8"
                rx="4"
                fill="#f8fafc"
                stroke="#94a3b8"
                strokeWidth="2"
              />

              <path
                d="M58 4 V28"
                stroke="#fbbf24"
                strokeWidth="4"
              />

              {/* Símbolo ENGVI */}
              <path
                d="M54 12 L60 24 L67 12 L63 14 L60 20 L58 14 Z"
                fill="#2563eb"
              />

              {/* Luz do capacete */}
              <circle
                className="helmet-light"
                cx="60"
                cy="3"
                r="7"
                fill="#facc15"
                opacity="0"
              />

              <path
                className="helmet-light"
                d="M60 -9 V-3 M48 -5 L52 0 M72 -5 L68 0"
                stroke="#fde047"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0"
              />
            </g>
          </CharacterSvg>

          <Shadow />
        </div>
      </Mover>
    </Track>
  );
}