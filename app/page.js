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

  const [loginMessage, setLoginMessage] = useState("Master Pattern Required");
  const [messageColor, setMessageColor] = useState("text-slate-400");

  const [resetKey, setResetKey] = useState(0);

  // --- 로그인 로직 ---
  const handleLogin = (inputPattern) => {
    if (inputPattern.join(",") === AUTH_CONFIG.MASTER_PATTERN) {
      setLoginMessage("환영합니다!");
      setMessageColor("text-orange-500");
      setTimeout(() => setIsLoggedIn(true), 500);
    } else {
      // 패턴이 틀렸을 때
      setLoginMessage("패턴이 틀렸습니다. 다시 시도해주세요.");
      setMessageColor("text-red-500");
      
      // 🚀 resetKey를 변경하여 PatternLock을 강제로 새로고침(초기화)
      setTimeout(() => {
        setResetKey(prev => prev + 1);
      }, 300); // 0.3초 정도 패턴을 보여준 뒤 지워지게 설정
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
  // --- 수정 로직 (최종 실행 단계) ---
  const handleUpdateFinal = async () => {
    // 1. 현재 스크롤 위치 저장 (이게 핵심!)
    const currentScrollY = window.scrollY;

    const { id, category, title, component, feedback } = editingItem;

    const { error } = await supabase
      .from("food")
      .update({ category, title, component, feedback })
      .eq("id", id);

    if (error) {
      alert("저장에 실패했습니다: " + error.message);
    } else {
      setIsConfirmOpen(false); 
      setEditingItem(null);    
      
      // 2. 데이터를 새로 불러온 직후에 스크롤 위치 복원
      await fetchRecipes(); 
      
      // 데이터가 렌더링될 시간을 아주 잠깐 주기 위해 setTimeout 사용
      setTimeout(() => {
        window.scrollTo({
          top: currentScrollY,
          behavior: 'instant' // 즉시 이동 (스르륵 이동하면 오히려 어지러울 수 있음)
        });
      }, 0);
    }
  };

  // 검색어 강조 함수
  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    
    // 띄어쓰기 무관하게 검색하기 위해 정규식 생성
    const cleanQuery = query.replace(/\s+/g, "");
    const regex = new RegExp(`(${cleanQuery.split("").join("\\s*")})`, "gi");
    
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="bg-orange-100 text-orange-700 rounded-sm px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
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
            <h1 className="text-xl font-black text-slate-800 text-center">미경이의 백과사전 🏠</h1>
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
              <h2 className="text-2xl font-black text-slate-800 mb-4 pr-12">
                {highlightText(item.title, searchQuery)}
              </h2>
              {/* 재료 및 설명 부분 */}
              <div className="bg-slate-50 p-4 rounded-2xl text-slate-700 font-medium leading-relaxed">
                {item.component?.split("-").map((line, index) => (
                  <div key={index}>
                    {/* 첫 줄이 아니고 내용이 있다면 앞에 '-'를 붙여서 줄바꿈 */}
                    {index > 0 && line.trim() ? `- ${line.trim()}` : line}
                  </div>
                ))}
              </div>

              {/* 조리 팁 부분 */}
              {item.feedback && (
                <div className="mt-4 flex gap-2 items-start bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <span className="text-blue-500">💡</span>
                  <div className="text-blue-700 text-sm font-bold leading-snug">
                    {item.feedback.split("-").map((line, index) => (
                      <div key={index}>
                        {index > 0 && line.trim() ? `- ${line.trim()}` : line}
                      </div>
                    ))}
                  </div>
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
                  <select 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 text-base text-slate-900 font-normal appearance-none cursor-pointer"
                    value={editingItem.category || ""}
                    onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                  >
                    <option value="" disabled>카테고리 선택</option>
                    <option value="반찬">반찬</option>
                    <option value="주찬">주찬</option>
                    <option value="밥국">밥국</option>
                    <option value="소스오븐">소스오븐</option>
                    <option value="미경">미경</option>
                  </select>
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

  
  // --- 로그인 화면 (패턴 잠금 부분) ---
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      
      {/* 🚀 1. 메인 타이틀: 아이콘 + 텍스트 */}
      <h1 className="text-3xl font-black text-slate-800 mb-2 italic flex items-center justify-center gap-3">
        {/* 요리사 모자와 콧수염 아이콘 */}
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
          <path d="M6 18h12a2 2 0 0 1 2 2v1H4v-1a2 2 0 0 1 2-2Z"/>
          <path d="M12 2a4 4 0 0 0-4 4c0 1.25.43 2.4 1.15 3.3.3.36.46.8.46 1.25l-.13 3.9c-.06.7 1.5 1.55 2.52 1.55s2.58-.85 2.52-1.55l-.13-3.9a2 2 0 0 1 .46-1.25A3.99 3.99 0 0 0 16 6a4 4 0 0 0-4-4Z"/>
          <path d="M11 11h2"/>
        </svg>
        미경이의 백과사전
      </h1>
      
      {/* 2. 안내 메시지: 상태에 따라 색상/문구 변경 */}
      <p className={`mb-12 font-bold text-sm uppercase tracking-widest transition-colors duration-300 ${messageColor}`}>
        {loginMessage}
      </p>
      
      {/* 🚀 3. 패턴 입력 구역: 아이콘 + 입력창 */}
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col items-center gap-6">
        {/* 잠금/보안 아이콘 */}
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 border-2 border-orange-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        {/* 패턴 잠금 컴포넌트 */}
        <PatternLock 
          key={resetKey} 
          onComplete={handleLogin} 
          // 라이브러리에 따라 색상 옵션이 있다면 주황색으로 맞추면 더 예쁩니다.
          // pointColor="#f97316" 
        />
        
        <p className="text-xs text-slate-400 mt-2">등록된 패턴을 그려주세요.</p>
      </div>

    </main>
  );
}