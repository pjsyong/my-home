"use client";
import { useState } from "react";
import PatternLock from "@/components/PatternLock";
import { AUTH_CONFIG } from "@/constants/auth";

export default function HomePage() {
  const [status, setStatus] = useState({ msg: "부모님 전용 패턴을 그려주세요", isError: false });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (inputPattern) => {
    if (inputPattern.join(",") === AUTH_CONFIG.MASTER_PATTERN) {
      setStatus({ msg: AUTH_CONFIG.SUCCESS_MESSAGE, isError: false });
      setTimeout(() => setIsLoggedIn(true), 800);
    } else {
      setStatus({ msg: AUTH_CONFIG.ERROR_MESSAGE, isError: true });
    }
  };

  // 로그인 성공 시 보여줄 화면
  if (isLoggedIn) {
    return (
      <main className="p-10 text-center">
        <h1 className="text-4xl font-black text-slate-900">🏠 환영합니다!</h1>
        <p className="mt-4 text-slate-500 text-lg">성공적으로 로그인하셨습니다. 레시피를 확인해보세요.</p>
      </main>
    );
  }

  // 로그인 전 화면 (패턴 입력)
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-slate-800 mb-2">🍽️ 우리집 주방</h1>
        <p className={`font-bold ${status.isError ? "text-red-500 animate-pulse" : "text-slate-500"}`}>
          {status.msg}
        </p>
      </div>
      <PatternLock onComplete={handleLogin} />
    </main>
  );
}