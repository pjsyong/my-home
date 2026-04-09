// app/page.js
import LoginForm from '@/components/LoginForm'; // 부품 가져오기 (@는 루트 폴더를 의미해요)

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center text-6xl">🎳</div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          볼링 점수 관리 시스템
        </h2>
      </div>

      {/* 분리한 로그인 폼 부품을 여기에 배치! */}
      <LoginForm />
    </div>
  );
}