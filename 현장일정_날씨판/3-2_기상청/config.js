// config.js – Supabase 연결 정보 두 줄 (api/kma.js 가 wx_tasks 를 읽을 때 씀)
// Supabase → Project Settings → API Keys 에서 복사합니다.
// 공개용 키(Publishable 또는 anon public)만 넣습니다.
// 비밀 키(Secret 또는 service_role)는 절대 넣지 않습니다.
const SUPABASE_URL = 'https://vcbdcixmqlfkpmsnlxyq.supabase.co';
const SUPABASE_KEY = 'sb_publishable__FcKnrUu6qWjGwvz-5sllw_ijr7v2rp';

if (typeof module !== 'undefined') module.exports = { SUPABASE_URL, SUPABASE_KEY };
