# 04 단원 · SQLite — 내 PC 안의 DB 파일 하나

| | |
|---|---|
| 무엇 | `data/tasks.json` 을 읽어 `tasks.db`(SQLite DB 파일)를 만들고 SQL로 세 가지를 물어봄 |
| 실행 | Claude Code에게 "make_db.py 실행해 줘" 또는 `python make_db.py` |
| 필요 | 파이썬 (SQLite는 파이썬에 들어 있음). 파이썬이 없으면 강사 화면으로 보기 |

## 보는 점
1. **DB = 파일 하나** : `tasks.db` 가 생김. 복사하면 DB째 복사됨
2. **SQL로 묻기** : 지역별 개수 · 고소 일정만 — 엑셀 필터와 같은 일을 문장으로
3. **DB가 규칙을 지킴** : 구분에 '지하'를 넣으면 CHECK 규칙이 막음

## 그런데 왜 배포 주소에서는 안 쓰나
- Vercel은 화면 파일을 나눠 주는 곳이라, 방문자가 추가한 일정을 `tasks.db` 에 **써 넣을 수 없음**
- 여러 사람이 같이 쓰려면 인터넷에 있는 DB가 필요 → 다음 예제 **Supabase**

> `*.db` 는 `.gitignore` 에 들어 있어 GitHub에 올라가지 않음
