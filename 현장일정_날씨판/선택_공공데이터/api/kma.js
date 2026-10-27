// api/kma.js – Vercel 서버 함수 : 기상청 초단기실황(공공데이터포털)을 대신 불러 줌
// 키는 코드에 없음. Vercel → Settings → Environment Variables 에 KMA_KEY 로 넣음
// 화면에서는 fetch('/api/kma?region=세종') 로 부름 → 방문자는 키를 볼 수 없음

// 기상청 격자 좌표 (대략 — 정확한 값은 공공데이터포털 '격자_위경도' 엑셀에서 확인)
const GRID = { '세종': [66, 103], '대전': [67, 100], '태안': [48, 109], '보령': [54, 100] };

// 발표 시각 : 매시 정각 자료가 40분쯤 나오므로, 40분 전이면 한 시간 전 자료
function baseTime(now) {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  if (kst.getUTCMinutes() < 40) kst.setUTCHours(kst.getUTCHours() - 1);
  const p = (n) => String(n).padStart(2, '0');
  return {
    date: kst.getUTCFullYear() + p(kst.getUTCMonth() + 1) + p(kst.getUTCDate()),
    time: p(kst.getUTCHours()) + '00',
  };
}

module.exports = async function handler(req, res) {
  const key = process.env.KMA_KEY;
  if (!key) return res.status(500).json({ error: 'Vercel 환경변수 KMA_KEY 가 없음' });
  const region = req.query.region || '세종';
  const grid = GRID[region];
  if (!grid) return res.status(400).json({ error: '지원하지 않는 지역 : ' + region });

  const b = baseTime(new Date());
  // 포털 '일반 인증키'는 이미 인코딩된 키(끝이 %3D 등)로 나옴 → % 가 있으면 그대로, 없으면(Decoding 키) 인코딩
  const serviceKey = key.includes('%') ? key : encodeURIComponent(key);
  const url = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst'
    + '?serviceKey=' + serviceKey
    + '&pageNo=1&numOfRows=10&dataType=JSON'
    + '&base_date=' + b.date + '&base_time=' + b.time
    + '&nx=' + grid[0] + '&ny=' + grid[1];
  try {
    const r = await fetch(url);
    const text = await r.text();
    // 키 오류는 JSON이 아니라 XML로 옴 (SERVICE_KEY_IS_NOT_REGISTERED_ERROR 등) → 그 이름을 그대로 보여 줌
    if (!text.trim().startsWith('{')) {
      const m = text.match(/<returnAuthMsg>([^<]+)</) || text.match(/<errMsg>([^<]+)</);
      return res.status(502).json({ error: '기상청 키 오류 : ' + (m ? m[1] : text.slice(0, 120)) });
    }
    const json = JSON.parse(text);
    const items = json.response.body.items.item;   // T1H 기온 · WSD 풍속 · RN1 1시간 강수량 …
    const pick = (cat) => (items.find((i) => i.category === cat) || {}).obsrValue;
    res.status(200).json({ region, base: b, temp: Number(pick('T1H')), wind: Number(pick('WSD')), rain1h: pick('RN1') });
  } catch (err) {
    res.status(502).json({ error: '기상청 응답을 읽지 못함 : ' + err.message });
  }
};

module.exports.baseTime = baseTime;
