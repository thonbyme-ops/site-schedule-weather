// logic.js – 판단 규칙 · API 주소 · 응답 해석 (화면을 다루는 코드 금지)

// 교육용 가상 기준 (실제 작업 중지 · 행사 취소 기준은 각 기관 규정을 따름)
const RULES = { wind: 10, rain: 60, heat: 33 };

// 지역 좌표 (대략)
const REGIONS = {
  '세종': { lat: 36.48, lon: 127.29 },
  '대전': { lat: 36.35, lon: 127.38 },
  '태안': { lat: 36.75, lon: 126.30 },
  '보령': { lat: 36.33, lon: 126.61 },
};

// Open-Meteo 날씨 API (키 없음) — 요청 주소 = 기본 주소 + ? 조건들
function weatherUrl(region) {
  const p = REGIONS[region];
  return 'https://api.open-meteo.com/v1/forecast'
    + '?latitude=' + p.lat + '&longitude=' + p.lon
    + '&daily=temperature_2m_max,wind_speed_10m_max,precipitation_probability_max'
    + '&timezone=Asia%2FSeoul&wind_speed_unit=ms&forecast_days=1';
}

// 응답(JSON)에서 필요한 숫자 3개만 꺼냄
function toWeather(json) {
  return {
    tempMax: json.daily.temperature_2m_max[0],
    windMax: json.daily.wind_speed_10m_max[0],
    rainProb: json.daily.precipitation_probability_max[0],
  };
}

// 일정 구분과 날씨로 판단 (w가 없으면 '날씨 확인 전')
function judge(kind, w) {
  if (!w) return { level: 'none', text: '날씨 확인 전' };
  if (kind === '실내') return { level: 'ok', text: '영향 없음' };
  if (kind === '고소' && w.windMax >= RULES.wind) return { level: 'stop', text: '중지 검토 (강풍)' };
  if (w.tempMax >= RULES.heat) return { level: 'warn', text: '폭염 휴식' };
  if (w.rainProb >= RULES.rain) return { level: 'warn', text: '우천 주의' };
  return { level: 'ok', text: '진행' };
}

// 날짜를 YYYY-MM-DD 글자로
function formatDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

// 시험용 날씨 : 주소 끝 ?test=wind · rain · heat (오늘 날씨가 맑아도 규칙을 확인)
function applyTest(w, test) {
  if (!w || !test) return w;
  const t = Object.assign({}, w);
  if (test === 'wind') t.windMax = 12;
  if (test === 'rain') t.rainProb = 80;
  if (test === 'heat') t.tempMax = 35;
  return t;
}

// ── 03-2 단원 : 기상청 단기예보 (공공데이터포털 · 키 필요 → api/kma.js 서버 함수에서만 부름) ──

// 기상청 격자 좌표 nx, ny (정확한 값은 활용가이드 '격자_위경도.xlsx')
const KMA_GRID = { '세종': [66, 103], '대전': [67, 100], '태안': [48, 109], '보령': [54, 100] };

// 발표 시각 : 하루 8번(02 · 05 · 08 · 11 · 14 · 17 · 20 · 23시), 발표 10분 뒤부터 받을 수 있음
// 02:10 전이면 전날 23시 자료
function kmaBaseTime(now) {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000 - 10 * 60 * 1000);
  let h = kst.getUTCHours();
  if (h < 2) { kst.setUTCDate(kst.getUTCDate() - 1); h = 23; }
  else h = h - ((h - 2) % 3);
  const p = (n) => String(n).padStart(2, '0');
  return {
    date: kst.getUTCFullYear() + p(kst.getUTCMonth() + 1) + p(kst.getUTCDate()),
    time: p(h) + '00',
  };
}

// 요청 주소 (serviceKey 는 서버 함수가 붙임 — 화면 코드에서 이 함수를 쓰지 않음)
function kmaUrl(region, serviceKey, base) {
  const g = KMA_GRID[region];
  return 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst'
    + '?serviceKey=' + serviceKey
    + '&pageNo=1&numOfRows=300&dataType=JSON'
    + '&base_date=' + base.date + '&base_time=' + base.time
    + '&nx=' + g[0] + '&ny=' + g[1];
}

// 응답(JSON)에서 가장 가까운 하루치의 최고 기온(TMP) · 최대 풍속(WSD) · 최대 강수확률(POP)
// → toWeather 와 같은 모양이라 judge 를 그대로 씀
function kmaToWeather(json) {
  const items = json.response.body.items.item;
  const day = items[0].fcstDate;
  const max = (cat) => Math.max(...items
    .filter((i) => i.fcstDate === day && i.category === cat)
    .map((i) => Number(i.fcstValue)));
  return { tempMax: max('TMP'), windMax: max('WSD'), rainProb: max('POP') };
}

if (typeof module !== 'undefined') module.exports = {
  RULES, REGIONS, weatherUrl, toWeather, judge, applyTest, formatDate,
  KMA_GRID, kmaBaseTime, kmaUrl, kmaToWeather,
};
