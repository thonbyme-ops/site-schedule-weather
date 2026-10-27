// api/kma.js – Vercel 서버 함수 : 기상청 단기예보(공공데이터포털)를 대신 불러 줌
// 키는 코드에 없음. Vercel → Settings → Environment Variables 에 KMA_KEY 로 넣음
// 화면에서는 fetch('/api/kma?region=세종') 로 부름 → 방문자는 키를 볼 수 없음
// 주소 만들기 · 응답 해석은 화면과 같은 logic.js 를 씀

const { KMA_GRID, kmaBaseTime, kmaUrl, kmaToWeather } = require('../logic.js');

module.exports = async function handler(req, res) {
  const key = process.env.KMA_KEY;
  if (!key) return res.status(500).json({ error: 'Vercel 환경변수 KMA_KEY 가 없음' });
  const region = req.query.region || '세종';
  if (!KMA_GRID[region]) return res.status(400).json({ error: '지원하지 않는 지역 : ' + region });

  const base = kmaBaseTime(new Date());
  // 포털 '일반 인증키'는 이미 인코딩된 키(끝이 %3D 등) → % 가 있으면 그대로, 없으면(Decoding 키) 인코딩
  const serviceKey = key.includes('%') ? key : encodeURIComponent(key);
  try {
    const r = await fetch(kmaUrl(region, serviceKey, base));
    const text = await r.text();
    // 키 오류는 JSON이 아니라 XML로 옴 (SERVICE_KEY_IS_NOT_REGISTERED_ERROR 등) → 그 이름을 그대로 보여 줌
    if (!text.trim().startsWith('{')) {
      const m = text.match(/<returnAuthMsg>([^<]+)</) || text.match(/<errMsg>([^<]+)</);
      return res.status(502).json({ error: '기상청 키 오류 : ' + (m ? m[1] : text.slice(0, 120)) });
    }
    const json = JSON.parse(text);
    const head = json.response.header;
    if (head.resultCode !== '00') return res.status(502).json({ error: '기상청 응답 ' + head.resultCode + ' : ' + head.resultMsg });
    // 5분 동안 같은 답을 재사용 (발표는 3시간마다라 충분) → 기상청 호출 횟수 절약
    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(200).json(Object.assign({ region, base }, kmaToWeather(json)));
  } catch (err) {
    res.status(502).json({ error: '기상청 응답을 읽지 못함 : ' + err.message });
  }
};
