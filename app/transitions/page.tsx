"use client";

import { useEffect, useState } from "react";

const colors = [
  { name: "Rubí", hex: "#9B2335", hex2: "#C0392B", isNew: true, soon: false },
  { name: "Zafiro", hex: "#1A6B7C", hex2: "#217A8E", isNew: false, soon: false },
  { name: "Amatista", hex: "#7B5EA7", hex2: "#9370BB", isNew: false, soon: false },
  { name: "Ámbar", hex: "#C68B2F", hex2: "#D4A040", isNew: false, soon: true },
  { name: "Gris", hex: "#4A4A4A", hex2: "#696969", isNew: false, soon: false },
  { name: "Café", hex: "#6B3A2A", hex2: "#8B4513", isNew: false, soon: false },
  { name: "Verde", hex: "#4A7C59", hex2: "#5A9467", isNew: false, soon: false },
  { name: "Esmeralda", hex: "#1A6B4A", hex2: "#217A56", isNew: false, soon: true },
];

const features = [
  { icon: "👁", label: "Visión sin esfuerzo" },
  { icon: "🏅", label: "Desempeño fotocromático duradero" },
  { icon: "💎", label: "Totalmente claros en interiores" },
  { icon: "⚡", label: "Sorprendentemente rápidos" },
  { icon: "☀️", label: "Se activan en segundos¹" },
  { icon: "🛡", label: "Bloquean el 100% de los rayos UVA & UVB. Filtran la luz azul-violeta en interiores y en exteriores²" },
];

export default function TransitionsGenS() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        minHeight: "100vh",
        background: "#fff",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;900&display=swap');

        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .delay-1 { transition-delay: 0.1s; }
        .delay-2 { transition-delay: 0.2s; }
        .delay-3 { transition-delay: 0.3s; }
        .delay-4 { transition-delay: 0.4s; }
        .delay-5 { transition-delay: 0.5s; }

        .tg-hero-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .tg-hero-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #F4A98A 0%, #E87D6A 25%, #D4567A 50%, #9B4E8E 75%, #6B3FA0 100%);
          z-index: 0;
        }

        .tg-hero-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.15) 0%, transparent 60%);
        }

        .tg-nuevo-watermark {
          position: absolute;
          top: -20px;
          left: -20px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: clamp(80px, 15vw, 180px);
          color: rgba(255,255,255,0.12);
          letter-spacing: -5px;
          user-select: none;
          line-height: 1;
          z-index: 1;
        }

        .tg-hero-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 60px 40px 60px 60px;
          max-width: 600px;
          width: 100%;
        }

        .tg-transitions-logo {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: clamp(32px, 5vw, 52px);
          color: white;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }

        .tg-transitions-logo span {
          display: inline-block;
          width: 28px;
          height: 28px;
          border: 2.5px solid white;
          border-radius: 50%;
          font-size: 14px;
          text-align: center;
          line-height: 23px;
          vertical-align: super;
          margin-left: 2px;
        }

        .tg-gens-badge {
          display: flex;
          flex-direction: column;
          margin-bottom: 20px;
        }

        .tg-nueva-genialidad {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 3px;
          color: rgba(255,255,255,0.85);
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .tg-gens-logo {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: clamp(48px, 8vw, 80px);
          color: white;
          letter-spacing: -3px;
          line-height: 0.9;
          text-transform: lowercase;
        }

        .tg-gens-logo .tg-asterisk {
          color: rgba(255,255,255,0.7);
          font-size: 0.6em;
        }

        .tg-hero-tagline {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: clamp(28px, 5vw, 52px);
          color: white;
          line-height: 1.05;
          letter-spacing: -1px;
          margin-bottom: 24px;
        }

        .tg-hero-tagline .tg-ultra { display: block; }

        .tg-color-dots {
          display: flex;
          gap: 10px;
          margin-bottom: 32px;
        }

        .tg-color-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.5);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: transform 0.3s ease;
          cursor: pointer;
        }

        .tg-color-dot:hover {
          transform: scale(1.2);
        }

        .tg-hero-footer {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: clamp(10px, 1.5vw, 14px);
          letter-spacing: 2px;
          color: white;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tg-hero-footer .tg-dot-sep {
          color: rgba(255,255,255,0.6);
          font-size: 18px;
        }

        .tg-info-section {
          background: white;
          padding: 70px 60px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .tg-info-header {
          border-bottom: 3px solid #1A1A1A;
          padding-bottom: 20px;
          margin-bottom: 32px;
        }

        .tg-gens-header-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .tg-brand-name-sm {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 18px;
          color: #1A1A1A;
          letter-spacing: -0.5px;
        }

        .tg-gens-sm {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 36px;
          color: #1A1A1A;
          letter-spacing: -2px;
        }

        .tg-lentes-title {
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(28px, 4vw, 46px);
          font-weight: 900;
          color: #1A1A1A;
          letter-spacing: -1px;
          margin-bottom: 8px;
          line-height: 1;
        }

        .tg-lentes-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 3px;
          color: #555;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tg-lentes-subtitle .tg-sep {
          color: #E87D6A;
          font-size: 16px;
        }

        .tg-description {
          font-family: 'Montserrat', sans-serif;
          font-size: 15px;
          line-height: 1.7;
          color: #444;
          max-width: 680px;
          margin-bottom: 48px;
        }

        .tg-description em {
          font-style: italic;
          font-weight: 600;
        }

        .tg-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-bottom: 60px;
          border: 1px solid #E8E8E8;
        }

        .tg-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 24px 28px;
          border: 1px solid #E8E8E8;
          transition: background 0.2s ease;
        }

        .tg-feature-item:hover {
          background: #F9F9F9;
        }

        .tg-feature-icon {
          width: 52px;
          height: 52px;
          min-width: 52px;
          background: linear-gradient(135deg, #F4A98A, #D4567A);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .tg-feature-label {
          font-family: 'Montserrat', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          color: #1A1A1A;
          line-height: 1.4;
          padding-top: 4px;
        }

        .tg-colors-section {
          margin-top: 10px;
        }

        .tg-colors-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 18px;
          color: #1A1A1A;
          margin-bottom: 30px;
          letter-spacing: -0.3px;
        }

        .tg-colors-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .tg-color-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .tg-color-lens {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          position: relative;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          overflow: hidden;
        }

        .tg-color-card:hover .tg-color-lens {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 14px 30px rgba(0,0,0,0.25);
        }

        .tg-color-lens::after {
          content: '';
          position: absolute;
          top: 15%;
          left: 20%;
          width: 35%;
          height: 30%;
          background: rgba(255,255,255,0.25);
          border-radius: 50%;
          transform: rotate(-30deg);
        }

        .tg-color-name {
          font-family: 'Montserrat', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #1A1A1A;
          text-align: center;
          letter-spacing: 0.5px;
        }

        .tg-new-badge {
          background: linear-gradient(135deg, #E87D6A, #D4567A);
          color: white;
          font-family: 'Montserrat', sans-serif;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 3px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .tg-color-card-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .tg-soon-group {
          border: 2px dashed #DDD;
          border-radius: 12px;
          padding: 14px;
          position: relative;
        }

        .tg-soon-group-label {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          font-family: 'Montserrat', sans-serif;
          font-size: 9px;
          font-weight: 700;
          color: #999;
          padding: 0 6px;
          letter-spacing: 1px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .tg-footnotes {
          margin-top: 48px;
          padding-top: 20px;
          border-top: 1px solid #E8E8E8;
        }

        .tg-footnote {
          font-family: 'Montserrat', sans-serif;
          font-size: 10px;
          color: #999;
          line-height: 1.6;
          margin-bottom: 4px;
        }

        .tg-page-wrapper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
        }

        @media (max-width: 900px) {
          .tg-page-wrapper {
            grid-template-columns: 1fr;
          }
          .tg-hero-section {
            min-height: 60vh;
          }
          .tg-colors-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .tg-features-grid {
            grid-template-columns: 1fr;
          }
          .tg-info-section {
            padding: 40px 24px;
          }
          .tg-hero-content {
            padding: 40px 24px;
          }
        }
      `}</style>

      <div className="tg-page-wrapper">
        {/* LEFT: Hero */}
        <div className="tg-hero-section">
          <div className="tg-hero-bg" />
          <div className="tg-nuevo-watermark">NUEVO</div>

          <div className={`tg-hero-content fade-in ${visible ? "visible" : ""}`}>
            <div className={`tg-transitions-logo fade-in delay-1 ${visible ? "visible" : ""}`}>
              Transitions<span>®</span>
            </div>

            <div className={`tg-gens-badge fade-in delay-2 ${visible ? "visible" : ""}`}>
              <div className="tg-nueva-genialidad">Nueva Genialidad™</div>
              <div className="tg-gens-logo">
                gen<span className="tg-asterisk">✳</span>s
              </div>
            </div>

            <div className={`tg-hero-tagline fade-in delay-3 ${visible ? "visible" : ""}`}>
              LENTES
              <span className="tg-ultra">ULTRA</span>
              DINÁMICOS
            </div>

            <div className={`tg-color-dots fade-in delay-4 ${visible ? "visible" : ""}`}>
              {colors.slice(0, 4).map((c) => (
                <div
                  key={c.name}
                  className="tg-color-dot"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${c.hex2}, ${c.hex})`,
                  }}
                  title={c.name}
                />
              ))}
            </div>

            <div className={`tg-hero-footer fade-in delay-5 ${visible ? "visible" : ""}`}>
              <span>SUPERPODER EN TUS GAFAS</span>
              <span className="tg-dot-sep">✳</span>
              <span>SUPERFLUIDEZ EN TU VIDA</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Info */}
        <div className="tg-info-section">
          {/* Header */}
          <div className={`tg-info-header fade-in delay-1 ${visible ? "visible" : ""}`}>
            <div className="tg-gens-header-logo">
              <div className="tg-brand-name-sm">Transitions<sup>®</sup></div>
              <div className="tg-gens-sm">gen✳s</div>
            </div>
            <div className="tg-lentes-title">LENTES ULTRA DINÁMICOS</div>
            <div className="tg-lentes-subtitle">
              <span>SUPERPODER EN TUS GAFAS</span>
              <span className="tg-sep">✳</span>
              <span>SUPERFLUIDEZ EN TU VIDA</span>
            </div>
          </div>

          {/* Description */}
          <p className={`tg-description fade-in delay-2 ${visible ? "visible" : ""}`}>
            <em>Transitions® GEN S™</em> son nuestros lentes perfectos para todos los días.
            Responden ultra-rápido a la luz, ofrecen una espectacular paleta de colores y te
            dan visión HD al ritmo de tu vida.
          </p>

          {/* Features */}
          <div className={`tg-features-grid fade-in delay-3 ${visible ? "visible" : ""}`}>
            {features.map((f, i) => (
              <div className="tg-feature-item" key={i}>
                <div className="tg-feature-icon">{f.icon}</div>
                <div className="tg-feature-label">{f.label}</div>
              </div>
            ))}
          </div>

          {/* Colors */}
          <div className={`tg-colors-section fade-in delay-4 ${visible ? "visible" : ""}`}>
            <div className="tg-colors-title">Disponible en 8 atractivos colores</div>
            <div className="tg-colors-grid">
              {colors.map((c) => (
                <div key={c.name} className={`tg-color-card-wrapper ${c.soon ? "tg-soon-group" : ""}`}>
                  {c.soon && <span className="tg-soon-group-label">Próximamente</span>}
                  <div className="tg-color-card">
                    <div
                      className="tg-color-lens"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, ${c.hex2}, ${c.hex})`,
                      }}
                    />
                    <div className="tg-color-name">{c.name}</div>
                    {c.isNew && <span className="tg-new-badge">NUEVO</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footnotes */}
          <div className={`tg-footnotes fade-in delay-5 ${visible ? "visible" : ""}`}>
            <p className="tg-footnote">
              ¹ Para lentes de policarbonato y CR39 en todos los colores que logran una transmisión del 18% a 23°C.
            </p>
            <p className="tg-footnote">
              ² Para lentes de policarbonato y CR39 en todos los colores. La luz azul-violeta se encuentra entre 400 y 455 nm (ISO TR 20772:2018).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
