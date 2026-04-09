"use client";
import { useState, useRef, useEffect } from "react";

export default function PatternLock({ onComplete }) {
  const [path, setPath] = useState([]); // 선택된 점들의 ID
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // 4x4 그리드 상에서의 좌표 (x, y)를 반환하는 객체
  const DOT_COORDS = useRef(
    [...Array(16)].reduce((acc, _, i) => {
      const id = i + 1;
      acc[id] = { x: (i % 4) + 1, y: Math.floor(i / 4) + 1 };
      return acc;
    }, {})
  ).current;

  // 1. 두 점 사이에 있는 점들을 찾아내는 함수 (핵심 개선 로직)
  const getIntermediateDots = (startId, endId) => {
    const start = DOT_COORDS[startId];
    const end = DOT_COORDS[endId];
    const intermediates = [];

    // 같은 행(가로)에 있을 때
    if (start.y === end.y) {
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      for (let x = minX + 1; x < maxX; x++) {
        intermediates.push(start.y * 4 - (4 - x));
      }
    }
    // 같은 열(세로)에 있을 때
    else if (start.x === end.x) {
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);
      for (let y = minY + 1; y < maxY; y++) {
        intermediates.push(y * 4 - (4 - start.x));
      }
    }
    // 대각선에 있을 때 (기울기가 1인 경우만 처리)
    else if (Math.abs(start.x - end.x) === Math.abs(start.y - end.y)) {
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const stepX = start.x < end.x ? 1 : -1;
      const stepY = start.y < end.y ? 1 : -1;

      for (let i = 1; i < Math.abs(start.x - end.x); i++) {
        const nextX = start.x + i * stepX;
        const nextY = start.y + i * stepY;
        intermediates.push(nextY * 4 - (4 - nextX));
      }
    }

    // 경로 순서대로 정렬 (시작점에서 가까운 순)
    if (startId > endId) intermediates.reverse();

    return intermediates;
  };

  // 2. 점의 중심 좌표를 계산 (선을 그리기 위함)
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
      setPath((prev) => {
        const lastId = prev[prev.length - 1];
        // 건너뛴 점들이 있다면 가져와서 합치기
        const intermediates = getIntermediateDots(lastId, id);
        // 이미 선택된 점은 제외하고 추가
        const newDots = intermediates.filter(dotId => !prev.includes(dotId));
        return [...prev, ...newDots, id];
      });
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (path.length > 0) {
      onComplete(path);
    }
  };

  
  // 전역 마우스업 이벤트 감지
  useEffect(() => {
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [path, isDragging]);

  return (
    <div className="flex flex-col items-center">
      <div 
        ref={containerRef}
        className="relative grid grid-cols-4 gap-6 p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 touch-none select-none"
      >
        {/* 선(Line)을 실시간으로 그리는 SVG 레이어 */}
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
                strokeWidth="8"
                strokeLinecap="round"
                className="opacity-80 transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* 4x4 점(Dot) 배열 생성 */}
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
              // 모바일 터치 이동 대응
              onTouchMove={(e) => {
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                const dotId = element?.getAttribute("data-id");
                if (dotId) handleEnter(parseInt(dotId));
              }}
              className={`w-12 h-12 rounded-full z-10 transition-all duration-200 cursor-pointer
                ${isActive 
                  ? "bg-orange-500 scale-110 shadow-[0_0_20px_rgba(249,115,22,0.5)]" 
                  : "bg-slate-200 hover:bg-slate-300"
                }`}
            />
          );
        })}
      </div>

      <button 
        onClick={() => setPath([])}
        className="mt-8 text-slate-400 hover:text-orange-500 transition-colors font-medium text-sm"
      >
        패턴 다시 그리기
      </button>
    </div>
  );
}