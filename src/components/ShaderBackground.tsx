'use client';

import { useEffect, useRef } from 'react';

export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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

      // Balatro-style deep purple palette with movement
      const hueShift = Math.sin(time * 0.2) * 10;
      gradient.addColorStop(0, `hsl(${280 + hueShift}, 60%, 15%)`);
      gradient.addColorStop(0.3, `hsl(${270 + hueShift}, 50%, 10%)`);
      gradient.addColorStop(0.6, `hsl(${260 + hueShift}, 40%, 6%)`);
      gradient.addColorStop(1, `hsl(${250 + hueShift}, 30%, 3%)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw flowing blob shapes
      const blobCount = 5;
      for (let i = 0; i < blobCount; i++) {
        const phase = (i / blobCount) * Math.PI * 2;
        const cx = width / 2 + Math.sin(time * 0.3 + phase) * width * 0.3;
        const cy = height / 2 + Math.cos(time * 0.2 + phase) * height * 0.3;
        const radius = 150 + Math.sin(time * 0.5 + i) * 50;

        const blobGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const alpha = 0.03 + Math.sin(time + i) * 0.015;
        blobGradient.addColorStop(0, `rgba(123, 75, 185, ${alpha})`);
        blobGradient.addColorStop(0.5, `rgba(75, 0, 130, ${alpha * 0.5})`);
        blobGradient.addColorStop(1, 'rgba(75, 0, 130, 0)');

        ctx.fillStyle = blobGradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw flowing lines/waves
      ctx.strokeStyle = 'rgba(123, 75, 185, 0.03)';
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

      // Add some floating particles/stars
      ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}

export default ShaderBackground;
