'use client';

import { useEffect, useRef, useMemo } from 'react';

// Detect Firefox browser for static fallback
function useIsFirefox(): boolean {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return navigator.userAgent.toLowerCase().includes('firefox');
  }, []);
}

export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isFirefox = useIsFirefox();

  useEffect(() => {
    // Skip canvas animation entirely on Firefox - use CSS fallback
    if (isFirefox) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Simplex-like noise function
    const noise = (x: number, y: number, t: number): number => {
      const n1 = Math.sin(x * 0.01 + t) * Math.cos(y * 0.01 + t * 0.7);
      const n2 = Math.sin(x * 0.02 - t * 0.5) * Math.cos(y * 0.015 + t * 0.3);
      const n3 = Math.sin((x + y) * 0.008 + t * 0.4) * 0.5;
      return (n1 + n2 + n3) / 3;
    };

    const animate = () => {
      time += 0.008;

      const width = canvas.width;
      const height = canvas.height;

      // Create flowing gradient background
      const gradient = ctx.createRadialGradient(
        width / 2 + Math.sin(time * 0.5) * 100,
        height / 2 + Math.cos(time * 0.3) * 100,
        0,
        width / 2,
        height / 2,
        Math.max(width, height)
      );

      // Día de los Muertos deep teal palette with movement
      const hueShift = Math.sin(time * 0.2) * 10;
      gradient.addColorStop(0, `hsl(${175 + hueShift}, 50%, 12%)`);
      gradient.addColorStop(0.3, `hsl(${175 + hueShift}, 45%, 8%)`);
      gradient.addColorStop(0.6, `hsl(${175 + hueShift}, 40%, 5%)`);
      gradient.addColorStop(1, `hsl(${175 + hueShift}, 35%, 2%)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw flowing blob shapes - Día de los Muertos colors
      const blobCount = 6;
      const blobColors = [
        { r: 45, g: 212, b: 191 },   // Turquoise
        { r: 236, g: 72, b: 153 },   // Hot pink
        { r: 245, g: 158, b: 11 },   // Marigold
        { r: 20, g: 184, b: 166 },   // Teal
        { r: 244, g: 114, b: 182 },  // Light pink
        { r: 251, g: 191, b: 36 },   // Gold
      ];

      for (let i = 0; i < blobCount; i++) {
        const phase = (i / blobCount) * Math.PI * 2;
        const cx = width / 2 + Math.sin(time * 0.3 + phase) * width * 0.3;
        const cy = height / 2 + Math.cos(time * 0.2 + phase) * height * 0.3;
        const radius = 180 + Math.sin(time * 0.5 + i) * 60;

        const blobGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const alpha = 0.025 + Math.sin(time + i) * 0.012;
        const color = blobColors[i % blobColors.length];
        blobGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
        blobGradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.4})`);
        blobGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        ctx.fillStyle = blobGradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw flowing lines/waves - turquoise accent
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.025)';
      ctx.lineWidth = 2;

      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        const yOffset = (height / 8) * i;

        for (let x = 0; x < width; x += 10) {
          const y = yOffset + noise(x, yOffset, time) * 80 + Math.sin(x * 0.005 + time + i) * 40;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Add some floating particles/stars - marigold color
      ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
      for (let i = 0; i < 20; i++) {
        const px = (Math.sin(time * 0.1 + i * 0.5) * 0.5 + 0.5) * width;
        const py = (Math.cos(time * 0.15 + i * 0.7) * 0.5 + 0.5) * height;
        const size = 1 + Math.sin(time * 2 + i) * 0.5;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle vignette overlay
      const vignetteGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) * 0.7
      );
      vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignetteGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, width, height);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [isFirefox]);

  // Firefox gets a static CSS gradient background instead of canvas animation
  if (isFirefox) {
    return (
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -1,
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(45, 212, 191, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(236, 72, 153, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at center, hsl(175, 50%, 10%) 0%, hsl(175, 40%, 4%) 70%, hsl(175, 35%, 2%) 100%)
          `,
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}

export default ShaderBackground;
