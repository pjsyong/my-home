"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import PatternLock from "@/components/PatternLock";
import { AUTH_CONFIG } from "@/constants/auth";

// 수파베이스 연결 설정
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function HomePage() {
  const [status, setStatus] = useState({ msg: "부모님 전용 패턴을 그려주세요", isError: false });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [recipes, setRecipes] = useState([]); // 레시피 데이터 저장
  const [loading, setLoading] = useState(true);

  // 1. 로그인 로직
  const handleLogin = (inputPattern) => {
    if (inputPattern.join(",") === AUTH_CONFIG.MASTER_PATTERN) {
      setStatus({ msg: AUTH_CONFIG.SUCCESS_MESSAGE, isError: false });
      setTimeout(() => setIsLoggedIn(true), 800);
    } else {
      setStatus({ msg: AUTH_CONFIG.ERROR_MESSAGE, isError: true });
    }
  };

  // 2. 수파베이스 데이터 불러오기
  useEffect(() => {
    if (isLoggedIn) {
      async function fetchRecipes() {
        const { data, error } = await supabase
          .from("food")
          .select("*")
          .order("title", { ascending: true }); // 이름순 정렬

        if (error) console.error("데이터 로드 실패:", error);
        else setRecipes(data);
        setLoading(false);
      }
      fetchRecipes();
    }
  }, [isLoggedIn]);

  // 로그인 성공 시 보여줄 레시피 목록 화면
  if (isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 md:p-8">
        <header className="max-w-4xl mx-auto mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900">🏠 우리집 보물창고</h1>
            <p className="text-slate-500 mt-2">오늘도 맛있는 요리 부탁드려요!</p>
          </div>
          <div className="text-sm font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
            총 {recipes.length}개의 레시피
          </div>
        </header>

        <div className="max-w-4xl mx-auto grid gap-6">
          {loading ? (
            <p className="text-center py-20 text-slate-400">레시피를 불러오는 중...</p>
          ) : (
            recipes.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    {item.category}
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-800">{item.title}</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-orange-500 mb-1">📋 재료 및 설명</h3>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{item.component}</p>
                  </div>
                  
                  {item.feedback && (
                    <div className="bg-blue-50 p-4 rounded-2xl">
                      <h3 className="text-sm font-bold text-blue-600 mb-1">💡 조리 팁 (피드백)</h3>
                      <p className="text-blue-800 text-sm whitespace-pre-wrap">{item.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    );
  }

  // 로그인 전 화면 (패턴 입력)
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-slate-800 mb-2">🍽️ 학교 조리장 전용</h1>
        <p className={`font-bold ${status.isError ? "text-red-500 animate-pulse" : "text-slate-500"}`}>
          {status.msg}
        </p>
      </div>
      <PatternLock onComplete={handleLogin} />
    </main>
  );
}