"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import PatternLock from "@/components/PatternLock";
import { AUTH_CONFIG } from "@/constants/auth";

// 1. 수파베이스 연결 설정
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function HomePage() {
  // --- 상태 관리 ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");

  // --- 편집 및 팝업 관련 상태 ---
  const [editingItem, setEditingItem] = useState(null);    // 편집 모달 제어
  const [isConfirmOpen, setIsConfirmOpen] = useState(false); // 커스텀 확인창 제어

  // --- 로그인 로직 ---
  const handleLogin = (inputPattern) => {
    if (inputPattern.join(",") === AUTH_CONFIG.MASTER_PATTERN) {
      setTimeout(() => setIsLoggedIn(true), 500);
    }
  };

  // --- 데이터 불러오기 함수 ---
  const fetchRecipes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("food")
      .select("*")
      .order("title", { ascending: true });
    if (!error) setRecipes(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn) fetchRecipes();
  }, [isLoggedIn]);

  // --- 수정 로직 (1단계: 확인창 띄우기) ---
  const requestUpdate = (e) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  // --- 수정 로직 (2단계: 실제 DB 반영) ---
  const handleUpdateFinal = async () => {
    const { id, category, title, component, feedback } = editingItem;

    const { error } = await supabase
      .from("food")
      .update({ category, title, component, feedback })
      .eq("id", id);

    if (error) {
      alert("저장에 실패했습니다: " + error.message);
    } else {
      setIsConfirmOpen(false); // 확인창 닫기
      setEditingItem(null);    // 편집창 닫기
      fetchRecipes();          // 목록 새로고침
    }
  };

  // --- 카테고리 추출 및 검색 필터링 ---
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

  // --- 메인 화면 (로그인 성공 시) ---
  if (isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-50 pb-10">
        {/* 상단 검색 및 카테고리바 (고정) */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4">
          <div className="max-w-xl mx-auto space-y-4">
            <h1 className="text-xl font-black text-slate-800 text-center">우리집 레시피 🏠</h1>
            <input
              type="text"
              placeholder="메뉴 이름 검색 (띄어쓰기 무관)"
              className="w-full p-4 bg-slate-100 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 text-slate-900 font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-black transition-all ${
                    selectedCategory === cat ? "bg-orange-500 text-white shadow-md" : "bg-white text-slate-500 border border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 레시피 리스트 */}
        <div className="max-w-xl mx-auto p-4 space-y-4 mt-2">
          {loading ? (
            <div className="text-center py-20 text-slate-400 font-bold">로딩 중...</div>
          ) : filteredRecipes.map((item) => (
            <div key={item.id} className="relative bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <button 
                onClick={() => setEditingItem(item)}
                className="absolute top-6 right-6 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl font-black text-xs hover:bg-orange-100 hover:text-orange-600 transition-colors"
              >
                편집
              </button>
              <div className="mb-2">
                <span className="text-[10px] font-black px-2 py-1 bg-orange-50 text-orange-600 rounded-lg uppercase">
                  {item.category || "미분류"}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-4 pr-10">{item.title}</h2>
              <div className="bg-slate-50 p-4 rounded-2xl text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                {item.component}
              </div>
              {item.feedback && (
                <div className="mt-4 flex gap-2 items-start bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <span className="text-blue-500">💡</span>
                  <p className="text-blue-700 text-sm font-bold leading-snug">{item.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 1. 편집 모달 (데이터 수정 입력창) */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl border-t-4 border-orange-500 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-900">레시피 수정</h3>
                <button onClick={() => setEditingItem(null)} className="text-slate-400 text-3xl">✕</button>
              </div>
              <form onSubmit={requestUpdate} className="space-y-4 overflow-y-auto max-h-[65vh] pr-2 no-scrollbar">
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1">카테고리</label>
                  <input 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 text-base text-slate-900 font-normal"
                    value={editingItem.category || ""}
                    onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1">음식 이름</label>
                  <input 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 text-base text-slate-900 font-normal"
                    value={editingItem.title || ""}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1">재료 및 설명</label>
                  <textarea 
                    rows={6}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 text-base text-slate-900 font-normal"
                    value={editingItem.component || ""}
                    onChange={(e) => setEditingItem({...editingItem, component: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1">조리 팁 (선택)</label>
                  <textarea 
                    rows={2}
                    className="w-full p-4 bg-blue-50/50 rounded-2xl border border-blue-100 focus:ring-2 focus:ring-blue-500 text-base text-blue-800 font-normal"
                    value={editingItem.feedback || ""}
                    onChange={(e) => setEditingItem({...editingItem, feedback: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full p-5 bg-orange-600 text-white rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-transform mt-4">
                  수정 완료 저장
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 2. 확인 모달 (진짜 저장할지 묻기) */}
        {isConfirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in duration-200">
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">❓</div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">수정하시겠습니까?</h3>
              <p className="text-slate-500 font-bold mb-8">입력하신 내용이<br/>즉시 반영됩니다.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setIsConfirmOpen(false)} className="p-4 bg-slate-100 text-slate-500 rounded-2xl font-black">취소</button>
                <button onClick={handleUpdateFinal} className="p-4 bg-orange-600 text-white rounded-2xl font-black shadow-lg">확인</button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // --- 로그인 화면 (패턴 잠금) ---
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-black text-slate-800 mb-2 italic">RECIPE ARCHIVE</h1>
      <p className="text-slate-400 mb-10 font-bold text-sm uppercase tracking-widest">Master Pattern Required</p>
      <PatternLock onComplete={handleLogin} />
    </main>
  );
}