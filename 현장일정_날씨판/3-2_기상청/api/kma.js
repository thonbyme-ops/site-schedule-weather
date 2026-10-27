// api/kma.js – Vercel 서버 함수 : 기상청 단기예보(공공데이터포털)를 대신 불러 줌
// 키는 코드에 없음. Vercel → Settings → Environment Variables 에 KMA_KEY 로 넣음
// 화면에서는 fetch('/api/kma?region=세종') 로 부름 → 방문자는 키를 볼 수 없음
// 주소 만들기 · 응답 해석은 화면과 같은 logic.js 를 씀
// F-07 : 그 지역의 Supabase wx_tasks 일정과 일정마다 판단도 같이 돌려줌 (공개용 키로 읽기만)

const { KMA_GRID, kmaBaseTime, kmaUrl, kmaToWeather, wxTasksUrl, judgeTasks } = require('../logic.js');
const { SUPABASE_URL, SUPABASE_KEY } = require('../config.js');

// 기상청 : { weather } 또는 { error }
async function loadKma(region, key) {
  if (!key) return { error: 'Vercel 환경변수 KMA_KEY 가 없음' };
  const base = kmaBaseTime(new Date());
  // 포털 '일반 인증키'는 이미 인코딩된 키(끝이 %3D 등) → % 가 있으면 그대로, 없으면(Decoding 키) 인코딩
  const serviceKey = key.includes('%') ? key : encodeURIComponent(key);
  try {
    const r = await fetch(kmaUrl(region, serviceKey, base));
    const text = await r.text();
    // 키 오류는 JSON이 아니라 XML로 옴 (SERVICE_KEY_IS_NOT_REGISTERED_ERROR 등) → 그 이름을 그대로 보여 줌
    if (!text.trim().startsWith('{')) {
      const m = text.match(/<returnAuthMsg>([^<]+)</) || text.match(/<errMsg>([^<]+)</);
      return { base, error: '기상청 키 오류 : ' + (m ? m[1] : text.slice(0, 120)) };
    }
    const json = JSON.parse(text);
    const head = json.response.header;
    if (head.resultCode !== '00') return { base, error: '기상청 응답 ' + head.resultCode + ' : ' + head.resultMsg };
    return { base, weather: kmaToWeather(json) };
  } catch (err) {
    return { base, error: '기상청 응답을 읽지 못함 : ' + err.message };
  }
}

// Supabase : { tasks } 또는 { tasksError }
async function loadTasks(region) {
  try {
    const r = await fetch(wxTasksUrl(SUPABASE_URL, region), { headers: { apikey: SUPABASE_KEY } });
    const json = await r.json();
    if (!r.ok) return { tasksError: 'wx_tasks 를 읽지 못함 : ' + (json.message || r.status) };
    return { tasks: json };
  } catch (err) {
    return { tasksError: 'wx_tasks 를 읽지 못함 : ' + err.message };
  }
}

module.exports = async function handler(req, res) {
  const region = req.query.region || '세종';
  if (!KMA_GRID[region]) return res.status(400).json({ error: '지원하지 않는 지역 : ' + region });

  const [kma, db] = await Promise.all([loadKma(region, process.env.KMA_KEY), loadTasks(region)]);
  const out = Object.assign({ region, base: kma.base }, kma.weather);
  if (kma.error) out.error = kma.error;
  out.tasks = judgeTasks(db.tasks || [], kma.weather);
  if (db.tasksError) out.tasksError = db.tasksError;

  // 기상청이 실패하면 502 (화면은 이걸 보고 Open-Meteo 로 대신 받음), 일정은 그래도 같이 줌
  if (kma.error) return res.status(502).json(out);
  // 5분 동안 같은 답을 재사용 (발표는 3시간마다라 충분) → 기상청 호출 횟수 절약
  res.setHeader('Cache-Control', 's-maxage=300');
  res.status(200).json(out);
};
