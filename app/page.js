"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PatternLock from "@/components/PatternLock";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("부모님 전용 패턴을 그려주세요");
  const [isError, setIsError] = useState(false);

  // 🔥 부모님과 약속한 '정답 모양' (예: ㄴ자 모양)
  // 1, 5, 9, 13, 14, 15, 16 순서대로 연결했을 때
  const MASTER_PATTERN = "1,5,9,13,14,15,16";

  const handleLoginAttempt = (inputPattern) => {
    const inputString = inputPattern.join(",");

    if (inputString === MASTER_PATTERN) {
      setIsError(false);
      setMessage("✅ 확인되었습니다! 잠시만 기다려주세요...");
      
      // 0.8초 뒤에 메인 페이지('/')로 이동
      setTimeout(() => {
        router.push("/");
      }, 800);
    } else {
      setIsError(true);
      setMessage("❌ 패턴이 틀렸습니다. 다시 그려보세요.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-slate-800 mb-2">🍽️ 울엄마 레시피</h1>
          <p className={`font-medium ${isError ? "text-red-500 animate-bounce" : "text-slate-500"}`}>
            {message}
          </p>
        </header>

        {/* 패턴 컴포넌트 호출 */}
        <PatternLock onComplete={handleLoginAttempt} />

        <p className="mt-8 text-sm text-slate-400">
          번호가 없어도 점의 위치를 기억해서 그려주세요.
        </p>
      </div>
    </main>
  );
}