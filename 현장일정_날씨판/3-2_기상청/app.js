// app.js – 화면 동작 (목록 그리기, 일정 추가, 날씨 받기)

const SAMPLE_TASKS = [
  { title: '다중이용시설 안전점검', region: '세종', kind: '야외', owner: '김안전' },
  { title: '시민 안전체험 행사 운영', region: '보령', kind: '야외', owner: '이행사' },
  { title: '옥상 태양광 설비 점검', region: '태안', kind: '고소', owner: '박설비' },
  { title: '하천 수위계 확인', region: '대전', kind: '야외', owner: '최현장' },
  { title: '청사 외벽 간판 보수', region: '세종', kind: '고소', owner: '정시설' },
  { title: '비상연락 훈련', region: '대전', kind: '실내', owner: '한상황' },
];

let tasks = [];
let weatherByRegion = {};

function loadTasks() {
  const saved = JSON.parse(localStorage.getItem('wx_added') || '[]');
  tasks = SAMPLE_TASKS.concat(saved);
}

// 03-2 단원 : 내 주소의 서버 함수(/api/kma)로 기상청 예보를 받음 (키는 서버에만 있음)
async function fetchKma(region) {
  const res = await fetch('/api/kma?region=' + encodeURIComponent(region));
  const json = await res.json().catch(() => ({ error: '응답 코드 ' + res.status }));
  if (!res.ok || json.error) throw new Error(json.error || '응답 코드 ' + res.status);
  return { tempMax: json.tempMax, windMax: json.windMax, rainProb: json.rainProb };
}

async function fetchOpenMeteo(region) {
  const res = await fetch(weatherUrl(region));
  if (!res.ok) throw new Error('응답 코드 ' + res.status);
  return toWeather(await res.json());
}

// 지역마다 기상청 먼저 → 실패하면 Open-Meteo 로 대신 (더블클릭 · GitHub Pages 에는 서버 함수가 없음)
async function loadWeather() {
  const box = document.getElementById('weatherBox');
  const test = new URLSearchParams(location.search).get('test');
  const kma = [], backup = [], failed = [];
  let kmaError = '';
  for (const region of Object.keys(REGIONS)) {
    try {
      weatherByRegion[region] = applyTest(await fetchKma(region), test);
      kma.push(region);
      continue;
    } catch (err) {
      kmaError = err.message;
    }
    try {
      weatherByRegion[region] = applyTest(await fetchOpenMeteo(region), test);
      backup.push(region);
    } catch (err) {
      failed.push(region + '(' + err.message + ')');
    }
  }
  const lines = [];
  if (kma.length) lines.push('기상청 단기예보 : ' + kma.join(', '));
  if (backup.length) lines.push('Open-Meteo 대신 사용 : ' + backup.join(', ') + ' — 기상청 실패 이유 : ' + kmaError);
  if (failed.length) lines.push('날씨를 받지 못한 지역 : ' + failed.join(', ') + ' — 목록은 그대로 볼 수 있음');
  box.textContent = '오늘 날씨 (최고 기온 · 최대 풍속 · 강수확률) — ' + lines.join(' / ')
    + (test ? '  [시험: ' + test + ']' : '');
  renderTasks();
}

function weatherText(w) {
  return w ? w.tempMax + '℃ · ' + w.windMax + 'm/s · ' + w.rainProb + '%' : '-';
}

function renderTasks() {
  const body = document.getElementById('taskList');
  body.innerHTML = '';
  for (const t of tasks) {
    const w = weatherByRegion[t.region];
    const r = judge(t.kind, w);
    const tr = document.createElement('tr');
    for (const v of [t.title, t.region, t.kind, t.owner, weatherText(w)]) {
      const td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    }
    const td = document.createElement('td');
    td.textContent = r.text;
    td.className = r.level;
    tr.appendChild(td);
    body.appendChild(tr);
  }
}

function addTask(e) {
  e.preventDefault();
  const t = {
    title: document.getElementById('titleInput').value.trim(),
    region: document.getElementById('regionInput').value,
    kind: document.getElementById('kindInput').value,
    owner: document.getElementById('ownerInput').value.trim(),
  };
  if (!t.title || !t.owner) return;
  const saved = JSON.parse(localStorage.getItem('wx_added') || '[]');
  saved.push(t);
  localStorage.setItem('wx_added', JSON.stringify(saved));
  e.target.reset();
  loadTasks();
  renderTasks();
}

document.getElementById('todayBox').textContent = formatDate(new Date());
document.getElementById('taskForm').addEventListener('submit', addTask);
loadTasks();
renderTasks();
loadWeather();
