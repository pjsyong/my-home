"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import PatternLock from "@/components/PatternLock";
import { AUTH_CONFIG } from "@/constants/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 검색 및 필터링 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");

  // 편집 관련 상태
  const [editingItem, setEditingItem] = useState(null); // 현재 수정 중인 레시피 객체

  const handleLogin = (inputPattern) => {
    if (inputPattern.join(",") === AUTH_CONFIG.MASTER_PATTERN) {
      setTimeout(() => setIsLoggedIn(true), 500);
    }
  };

  // 데이터 불러오기 함수 (수정 후 재로딩을 위해 분리)
  const fetchRecipes = async () => {
    const { data, error } = await supabase.from("food").select("*").order("title", { ascending: true });
    if (!error) setRecipes(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn) fetchRecipes();
  }, [isLoggedIn]);

  // 수정 완료(저장) 함수
  const handleUpdate = async (e) => {
    e.preventDefault();
    const { id, category, title, component, feedback } = editingItem;

    const { error } = await supabase
      .from("food")
      .update({ category, title, component, feedback })
      .eq("id", id);

    if (error) {
      alert("저장에 실패했습니다: " + error.message);
    } else {
      setEditingItem(null); // 모달 닫기
      fetchRecipes(); // 목록 새로고침
    }
  };

  const categories = useMemo(() => {
    const list = ["전체", ...new Set(recipes.map((r) => r.category || "미분류"))];
    return list;
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((item) => {
      const matchCategory = selectedCategory === "전체" || item.category === selectedCategory;
      const cleanQuery = (searchQuery || "").replace(/\s+/g, "").toLowerCase();
      const cleanTitle = (item.title || "").replace(/\s+/g, "").toLowerCase();
      return matchCategory && cleanTitle.includes(cleanQuery);
    });
  }, [recipes, searchQuery, selectedCategory]);

  if (isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-50 pb-10">
        {/* 상단 검색바 영역 */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4">
          <div className="max-w-xl mx-auto space-y-4">
            <h1 className="text-xl font-black text-slate-800 text-center">우리집 레시피 🏠</h1>
            <div className="relative">
              <input
                type="text"
                placeholder="메뉴 이름 검색 (띄어쓰기 무관)"
                className="w-full p-4 bg-slate-100 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 text-slate-900 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${
                    selectedCategory === cat ? "bg-orange-500 text-white shadow-md" : "bg-white text-slate-500 border border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 레시피 목록 */}
        <div className="max-w-xl mx-auto p-4 space-y-4 mt-2">
          {loading ? (
            <div className="text-center py-20 text-slate-400 font-bold">불러오는 중...</div>
          ) : filteredRecipes.map((item) => (
            <div key={item.id} className="relative bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              {/* 편집 버튼 */}
              <button 
                onClick={() => setEditingItem(item)}
                className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-orange-500 rounded-xl transition-colors"
              >
                <span className="text-sm font-bold">편집</span>
              </button>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-black px-2 py-1 bg-orange-50 text-orange-600 rounded-lg uppercase">
                  {(item.category || "미분류")}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-4 pr-12">{(item.title || "제목 없음")}</h2>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl text-slate-600 text-[15px] leading-relaxed whitespace-pre-wrap">
                  {item.component}
                </div>
                {item.feedback && (
                  <div className="flex gap-2 items-start bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <span className="text-blue-500">💡</span>
                    <p className="text-blue-600 text-sm font-medium leading-snug">{item.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 🛠️ 편집 모달 (팝업창) */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800">레시피 수정</h3>
                <button onClick={() => setEditingItem(null)} className="text-slate-300 hover:text-slate-500 text-2xl">✕</button>
              </div>
              
              <form onSubmit={handleUpdate} className="space-y-4 overflow-y-auto max-h-[70vh] pr-2 no-scrollbar">
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1">카테고리</label>
                  <input 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold"
                    value={editingItem.category || ""}
                    onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1">음식 이름</label>
                  <input 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold text-lg"
                    value={editingItem.title || ""}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1">재료 및 설명</label>
                  <textarea 
                    rows={6}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-medium"
                    value={editingItem.component || ""}
                    onChange={(e) => setEditingItem({...editingItem, component: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1">조리 팁 (선택)</label>
                  <textarea 
                    rows={2}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-medium text-blue-600"
                    value={editingItem.feedback || ""}
                    onChange={(e) => setEditingItem({...editingItem, feedback: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full p-5 bg-orange-500 text-white rounded-3xl font-black text-lg shadow-lg shadow-orange-200 active:scale-95 transition-transform"
                >
                  수정 완료
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-black text-slate-800 mb-2 italic">RECIPE ARCHIVE</h1>
      <p className="text-slate-400 mb-10 font-bold text-sm uppercase tracking-widest">Master Pattern Required</p>
      <PatternLock onComplete={handleLogin} />
    </main>
  );
}