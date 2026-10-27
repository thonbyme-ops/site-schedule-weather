# 현장 일정 날씨판 · 03-2 기상청 단기예보

오늘 현장 일정과 지역별 날씨를 한 화면에서 보고, 날씨 때문에 주의 · 중지를 검토할 일정을 표시합니다. (교육용 가상 데이터)

## 여는 법
- 내 PC : `index.html` 더블클릭
- 인터넷 (기상청 예보) : Vercel 주소 — 배포 후 여기에 적기
- 내 PC 더블클릭 · GitHub Pages 에서는 서버 함수가 없어 Open-Meteo 로 대신 보여 줌

## 파일
| 파일 | 역할 |
|---|---|
| index.html | 화면 구조 |
| style.css | 디자인 |
| logic.js | 판단 규칙 · 기상청 주소 · 응답 해석 |
| app.js | 화면 동작 (기상청 먼저, 실패하면 Open-Meteo) |
| api/kma.js | Vercel 서버 함수 — 키를 붙여 기상청을 부름 |
| .env.example | 필요한 키 이름 견본 (진짜 키는 .env · Vercel 에만) |
| PRD.md | 무엇을 · 왜 만드는지 |
| CLAUDE.md | AI가 지킬 작업 규칙 |
| .gitignore | GitHub에 올리지 않을 파일 목록 |

## 기상청 키 넣기
1. 공공데이터포털에서 「기상청_단기예보 조회서비스」 일반 인증키 받기 (`../선택_공공데이터/공공데이터포털_키발급_안내.md`)
2. Vercel → 프로젝트 → Settings → Environment Variables → `KMA_KEY` 추가 → **Redeploy**
3. `주소/api/kma?region=세종` → `{"tempMax": …, "windMax": …, "rainProb": …}` 가 나오면 성공

> 단기예보는 초단기실황과 같은 서비스 안에 있어 같은 키로 됩니다. 시간별 예보 중 가장 가까운 하루의 최고 기온(TMP) · 최대 풍속(WSD) · 최대 강수확률(POP)을 씁니다.
