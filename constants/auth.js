export const AUTH_CONFIG = {
  // 환경 변수에서 가져오고, 혹시 없으면 기본값(1,2,3,4)을 사용함
  MASTER_PATTERN: process.env.NEXT_PUBLIC_MASTER_PATTERN || "1,2,3,4", 
  SUCCESS_MESSAGE: "✅ 확인되었습니다! 잠시만 기다려주세요...",
  ERROR_MESSAGE: "❌ 패턴이 틀렸습니다. 다시 그려보세요."
};