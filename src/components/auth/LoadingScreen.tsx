import { useEffect, useRef } from "react";

export const LoadingScreen = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxR = 80;

    let N = 1;
    let progress = 0;
    let phase: "split" | "pause" | "shrink" | "grow" = "split";
    let lastTime = performance.now();
    let rafId: number;

    function easeInOutQuad(t: number) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function drawDiameter(angle: number, r: number) {
      ctx!.beginPath();
      const dx = Math.cos(angle) * r;
      const dy = Math.sin(angle) * r;
      ctx!.moveTo(cx - dx, cy - dy);
      ctx!.lineTo(cx + dx, cy + dy);
      ctx!.stroke();
    }

    function drawSolidCircle(r: number) {
      ctx!.beginPath();
      ctx!.arc(cx, cy, r, 0, Math.PI * 2);
      ctx!.fill();
    }

    function animate(currentTime: number) {
      const dt = currentTime - lastTime;
      lastTime = currentTime;

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.lineCap = "round";
      ctx!.strokeStyle = "#FFFFFF";
      ctx!.fillStyle = "#FFFFFF";

      if (phase === "split") {
        progress += dt / 600;
        if (progress >= 1) {
          progress = 0;
          N *= 2;
          if (N > 128) phase = "pause";
        }

        const ease = easeInOutQuad(Math.min(progress, 1));
        const targetAngle = Math.PI / (2 * N);
        const currentOffset = ease * targetAngle;

        ctx!.lineWidth = 2;
        for (let i = 0; i < N; i++) {
          const baseAngle = i * (Math.PI / N);
          drawDiameter(baseAngle, maxR);
          drawDiameter(baseAngle + currentOffset, maxR);
        }
      } else if (phase === "pause") {
        progress += dt / 800;
        drawSolidCircle(maxR);
        if (progress >= 1) {
          progress = 0;
          phase = "shrink";
        }
      } else if (phase === "shrink") {
        progress += dt / 400;
        const ease = easeInOutQuad(Math.min(progress, 1));
        const r = maxR * (1 - ease);
        if (r > 0) drawSolidCircle(r);
        if (progress >= 1) {
          progress = 0;
          N = 1;
          phase = "grow";
        }
      } else if (phase === "grow") {
        progress += dt / 400;
        const ease = easeInOutQuad(Math.min(progress, 1));
        const r = maxR * ease;
        ctx!.lineWidth = 2;
        drawDiameter(0, r);
        if (progress >= 1) {
          progress = 0;
          phase = "split";
        }
      }

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-color)]">
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        style={{ filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.4))" }}
      />
    </div>
  );
};
