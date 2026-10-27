// app.js – 화면 동작 (목록 그리기, 일정 추가, 날씨 받기, md 저장)

let tasks = [];
let weatherByRegion = {};

// 04 단원 : 일정 목록을 data/tasks.json 파일에서 읽음 (코드와 데이터 분리)
async function loadTasks() {
  const msg = document.getElementById('msgBox');
  let base = [];
  try {
    const res = await fetch('data/tasks.json');
    base = await res.json();
    msg.textContent = '';
  } catch (err) {
    // index.html 을 더블클릭(file://)으로 열면 브라우저가 파일 읽기를 막음 → 주소(Vercel)로 열어야 함
    msg.textContent = 'data/tasks.json 을 읽지 못함 — 배포 주소(Vercel)로 열어 주세요';
  }
  const saved = JSON.parse(localStorage.getItem('wx_added') || '[]');
  tasks = base.concat(saved);
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
  tasks.push(t);
  renderTasks();
}

// 04 단원 : 오늘 판단을 .md 파일로 내려받기
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
loadTasks().then(function () { renderTasks(); loadWeather(); });
