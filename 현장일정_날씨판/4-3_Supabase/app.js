// app.js – 화면 동작 (목록 그리기, 일정 추가, 날씨 받기, md 저장)

let tasks = [];
let weatherByRegion = {};
let db = null;

// ── 저장 위치 : Supabase 표 wx_tasks (이 구역의 함수만 DB를 부름) ──────────────
function checkConfig() {
  if (!window.supabase) return 'supabase-js 를 불러오지 못함 (인터넷 확인)';
  if (SUPABASE_URL.indexOf('여기에') >= 0 || SUPABASE_KEY.indexOf('여기에') >= 0) return 'config.js 에 주소와 공개용 키를 넣어 주세요';
  if (/^sb_secret_/.test(SUPABASE_KEY) || SUPABASE_KEY.indexOf('service_role') >= 0) return 'config.js 에 비밀 키가 들어 있음 — 공개용 키로 바꾸세요';
  return '';
}

async function loadData() {
  const { data, error } = await db.from('wx_tasks').select('title, region, kind, owner').order('id');
  if (error) throw new Error(error.message);
  return data;
}

async function insertTask(t) {
  const { error } = await db.from('wx_tasks').insert(t);
  if (error) throw new Error(error.message);
}

// ── 화면 ───────────────────────────────────────────────────────────────
function showMessage(text) {
  document.getElementById('msgBox').textContent = text;
}

async function reloadData() {
  try {
    tasks = await loadData();
    showMessage('');
  } catch (err) {
    showMessage('목록을 읽지 못함 : ' + err.message);
  }
  renderTasks();
}

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
    : '오늘 날씨 : Open-Meteo 예보 (최고 기온 · 최대 풍속 · 강수확률)' + (test ? '  [시험: ' + test + ']' : '');
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

async function addTask(e) {
  e.preventDefault();
  const t = {
    title: document.getElementById('titleInput').value.trim(),
    region: document.getElementById('regionInput').value,
    kind: document.getElementById('kindInput').value,
    owner: document.getElementById('ownerInput').value.trim(),
  };
  if (!t.title || !t.owner) return;
  try {
    await insertTask(t);
    e.target.reset();
    await reloadData();
  } catch (err) {
    showMessage('저장하지 못함 : ' + err.message);
  }
}

function downloadMarkdown() {
  const date = todayStr();
  const blob = new Blob([toMarkdown(tasks, weatherByRegion, date)], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '현장일정_판단_' + date + '.md';
  a.click();
}

document.getElementById('taskForm').addEventListener('submit', addTask);
document.getElementById('mdBtn').addEventListener('click', downloadMarkdown);
document.getElementById('reloadBtn').addEventListener('click', reloadData);

const problem = checkConfig();
if (problem) {
  document.getElementById('saveMode').textContent = '저장 안 됨';
  showMessage(problem);
  loadWeather();
} else {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  document.getElementById('saveMode').textContent = '저장 위치 : Supabase (wx_tasks)';
  reloadData().then(loadWeather);
}
