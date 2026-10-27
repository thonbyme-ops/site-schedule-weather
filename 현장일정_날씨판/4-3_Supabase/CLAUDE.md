# CLAUDE.md – 현장 일정 날씨판 작업 규칙

> **03 단원 변경** · **04 단원 변경** 표시가 붙은 곳만 01 단원과 다릅니다.

## 프로젝트 개요
- 교육용 프로토타입이다. 무엇을 만들지는 PRD.md를 따른다.
- PRD.md에 없는 기능은 먼저 제안하고, 내가 승인한 뒤에만 구현한다.

## 기술 스택 (변경 금지)
- HTML + CSS + 순수 JavaScript만 사용한다. (React 등 프레임워크, 빌드 도구 사용 금지)
- **03 단원 변경** 외부 API는 키가 필요 없는 Open-Meteo 만 화면 코드에서 직접 부른다.
  키가 필요한 API는 화면 코드에서 부르지 않는다. (api/ 폴더의 서버 함수 + Vercel 환경변수로만)
- **04 단원 변경** 일정 목록은 Supabase 표 wx_tasks 에 저장한다. (localStorage · data/tasks.json 은 쓰지 않음)
- **04 단원 변경** 외부 CDN은 supabase-js 하나만 허용한다.
  `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`
- index.html 은 supabase-js → config.js → logic.js → app.js 순서로 불러온다.

## 폴더 구조
- index.html : 화면 구조
- style.css  : 디자인
- **04 단원 변경** config.js : Supabase 주소와 공개용 키 두 줄만 둔다
- logic.js   : 판단 규칙 · API 주소(weatherUrl) · 응답 해석(toWeather) · md 만들기(toMarkdown)
- app.js     : 화면 동작. **04 단원 변경** DB 호출은 '저장 위치' 구역의 checkConfig · loadData · insertTask 안에서만
- **04 단원 변경** setup.sql : 표 · 규칙 · 권한(RLS). DB 규칙을 바꾸면 이 파일도 고친다

## 작업 방식
1. 코드를 고치기 전에 계획(수정할 파일과 이유)을 먼저 보여 주고 승인을 받는다.
2. 한 번에 한 가지만 고친다.
3. 끝나면 바꾼 파일, 내가 확인할 방법(T-번호), 남은 문제를 보고한다.
4. API가 실패해도 일정 목록은 보여야 한다. 실패한 지역과 이유를 화면에 적는다.
5. **04 단원 변경** SQL을 바꾸면 내가 Supabase SQL Editor 에서 직접 실행해야 한다. 실행할 부분만 따로 보여 준다.

## 보안 · 데이터 규칙
- 가상 데이터만 사용한다. 실제 이름 · 연락처 · 기관 내부 자료를 넣지 않는다.
- 사용자가 입력한 글자는 textContent 로 표시한다.
- **04 단원 변경** 화면 코드에는 공개용 키(Publishable 또는 anon)만 쓴다. 비밀 키(Secret 또는 service_role)는 절대 코드 · 채팅 · GitHub 에 넣지 않는다.
- **04 단원 변경** 표 이름은 wx_ 로 시작한다. 규칙(구분 · 지역 값)은 화면에서만 막지 않고 setup.sql 에서도 막는다.
- 날짜는 YYYY-MM-DD 로 만들고 toISOString() 을 쓰지 않는다. (한국 시간에서 하루가 밀림)
