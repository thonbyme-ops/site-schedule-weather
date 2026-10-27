// app.js – 화면 동작 (목록 그리기, 일정 추가)

let baseTasks = [];         // data/tasks.json 에서 읽은 일정
let tasks = [];
let weatherByRegion = {};

// 04 단원 : 일정 목록을 data/tasks.json 파일에서 읽음 (코드와 데이터 분리)
async function loadBaseTasks() {
  const msg = document.getElementById('dataMsg');
  try {
    const res = await fetch('data/tasks.json');
    if (!res.ok) throw new Error('응답 코드 ' + res.status);
    baseTasks = await res.json();
    msg.textContent = '';
  } catch (err) {
    // index.html 을 더블클릭(file://)으로 열면 브라우저가 파일 읽기를 막음 → 배포 주소로 열어야 함
    msg.textContent = 'data/tasks.json 을 읽지 못함 — 배포 주소로 열어 주세요';
  }
}

// JSON 일정 먼저, 그 뒤에 화면에서 추가한 일정(브라우저 저장)
function loadTasks() {
  const saved = JSON.parse(localStorage.getItem('wx_added') || '[]');
  tasks = baseTasks.concat(saved);
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

async function start() {
  document.getElementById('taskForm').addEventListener('submit', addTask);
  await loadBaseTasks();
  loadTasks();
  renderTasks();
  loadWeather();
}

start();
