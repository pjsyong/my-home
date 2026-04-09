"use client";
import { useState, useRef, useEffect } from "react";

export default function PatternLock({ onComplete }) {
  const [path, setPath] = useState([]); // 선택된 점들의 ID
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // 점의 중심 좌표를 계산하는 함수
  const getDotCenter = (id) => {
    const dot = containerRef.current?.querySelector(`[data-id='${id}']`);
    if (!dot) return { x: 0, y: 0 };
    return {
      x: dot.offsetLeft + dot.offsetWidth / 2,
      y: dot.offsetTop + dot.offsetHeight / 2,
    };
  };

  const handleStart = (id) => {
    setIsDragging(true);
    setPath([id]);
  };

  const handleEnter = (id) => {
    if (isDragging && !path.includes(id)) {
      setPath((prev) => [...prev, id]);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (path.length > 0) {
      onComplete(path);
    }
  };

  // 마우스를 뗐을 때 리셋하거나 검증하는 로직을 위해 이벤트 리스너 추가
  useEffect(() => {
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [path]);

  return (
    <div className="flex flex-col items-center">
      <div 
        ref={containerRef}
        className="relative grid grid-cols-4 gap-6 p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 touch-none"
      >
        {/* 선(Line)을 그리는 SVG 레이어 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {path.map((dotId, index) => {
            if (index === 0) return null;
            const start = getDotCenter(path[index - 1]);
            const end = getDotCenter(dotId);
            return (
              <line
                key={index}
                x1={start.x} y1={start.y}
                x2={end.x} y2={end.y}
                stroke="#f97316" // 주황색 선
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                className="animate-in fade-in duration-300"
              />
            );
          })}
        </svg>

        {/* 4x4 점(Dot)들 */}
        {[...Array(16)].map((_, i) => {
          const id = i + 1;
          const isActive = path.includes(id);
          return (
            <div
              key={id}
              data-id={id}
              onMouseDown={() => handleStart(id)}
              onMouseEnter={() => handleEnter(id)}
              onTouchStart={() => handleStart(id)}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                const dotId = element?.getAttribute("data-id");
                if (dotId) handleEnter(parseInt(dotId));
              }}
              className={`w-12 h-12 rounded-full z-10 transition-all duration-200 cursor-pointer
                ${isActive 
                  ? "bg-orange-500 scale-110 shadow-[0_0_15px_rgba(249,115,22,0.6)]" 
                  : "bg-slate-200 hover:bg-slate-300"
                }`}
            />
          );
        })}
      </div>

      <button 
        onClick={() => setPath([])}
        className="mt-8 text-slate-400 hover:text-orange-500 transition-colors font-medium"
      >
        패턴 초기화
      </button>
    </div>
  );
}