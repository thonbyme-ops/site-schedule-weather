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

// 시험용 날씨 : 주소 끝 ?test=wind · rain · heat (오늘 날씨가 맑아도 규칙을 확인)
function applyTest(w, test) {
  if (!w || !test) return w;
  const t = Object.assign({}, w);
  if (test === 'wind') t.windMax = 12;
  if (test === 'rain') t.rainProb = 80;
  if (test === 'heat') t.tempMax = 35;
  return t;
}

if (typeof module !== 'undefined') module.exports = { RULES, REGIONS, weatherUrl, toWeather, judge, applyTest };
