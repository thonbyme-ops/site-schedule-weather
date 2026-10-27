// app.js – 화면 동작 (목록 그리기, 일정 추가, 날씨 받기, md 내려받기)

let tasks = [];
let weatherByRegion = {};
let db = null;              // Supabase 연결 (config.js 가 맞을 때만 만듦)
let dbProblem = '';         // 연결하지 못한 이유

function showDataMsg(text) {
  document.getElementById('dataMsg').textContent = text;
}

// 04 단원 : 일정 목록을 Supabase 표 wx_tasks 에서 읽음 (만든 순서대로)
async function loadTasks() {
  if (!db) return;
  const { data, error } = await db.from('wx_tasks').select('title, region, kind, owner').order('id');
  if (error) {
    showDataMsg('wx_tasks 를 읽지 못함 : ' + error.message);
    return;
  }
  tasks = data;
  showDataMsg('');
}

// 03 단원 : 지역마다 API 요청 → 응답 JSON → 숫자 3개 (실패해도 목록은 그대로)
async function loadWeather() {
  const box = document.getElementById('weatherBox');
  const test = new URLSearchParams(location.search).get('test');
  const failed = [];
  for (const region of Object.keys(REGIONS)) {
    try {
      const res = await fetch(weatherUrl(region));
      if (!res.ok) throw new Error('응답 코드 ' + res.status);
      weatherByRegion[region] = applyTest(toWeather(await res.json()), test);
    } catch (err) {
      failed.push(region + '(' + err.message + ')');
    }
  }
  box.textContent = failed.length
    ? '날씨를 받지 못한 지역 : ' + failed.join(', ') + ' — 목록은 그대로 볼 수 있음'
    : '오늘 날씨 : Open-Meteo 예보 (최고 기온 · 최대 풍속 · 강수확률)' + (test === 'wind' ? '  [시험: 풍속 12 m/s]' : '');
  renderTasks();
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

// 04 단원 : 추가한 일정을 wx_tasks 에 저장 → 목록 다시 읽기
async function addTask(e) {
  e.preventDefault();
  const t = {
    title: document.getElementById('titleInput').value.trim(),
    region: document.getElementById('regionInput').value,
    kind: document.getElementById('kindInput').value,
    owner: document.getElementById('ownerInput').value.trim(),
  };
  if (!t.title || !t.owner) return;
  if (!db) {
    showDataMsg('저장하지 못함 : ' + dbProblem);
    return;
  }
  const { error } = await db.from('wx_tasks').insert(t);
  if (error) {
    showDataMsg('저장하지 못함 : ' + error.message);
    return;
  }
  e.target.reset();
  await loadTasks();
  renderTasks();
}

// 04 단원 : 지금 표를 md 파일로 내려받기
function downloadMarkdown() {
  const date = todayStr();
  const blob = new Blob([toMarkdown(tasks, weatherByRegion, date)], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '현장일정_판단_' + date + '.md';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function start() {
  document.getElementById('taskForm').addEventListener('submit', addTask);
  document.getElementById('mdBtn').addEventListener('click', downloadMarkdown);
  dbProblem = window.supabase
    ? checkConfig(SUPABASE_URL, SUPABASE_KEY)
    : 'supabase-js 를 불러오지 못함 (인터넷 확인)';
  if (dbProblem) showDataMsg(dbProblem);
  else db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  await loadTasks();
  renderTasks();
  loadWeather();
}

start();
