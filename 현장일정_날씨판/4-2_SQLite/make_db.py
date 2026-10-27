# -*- coding: utf-8 -*-
"""04 단원 예제 : data/tasks.json → SQLite 파일(tasks.db) → SQL로 묻기.

실행 : python make_db.py   (파이썬에 SQLite가 들어 있어 따로 설치할 것 없음)
"""
import json
import os
import sqlite3
import sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(HERE, "tasks.db")

with open(os.path.join(HERE, "data", "tasks.json"), encoding="utf-8") as f:
    tasks = json.load(f)

con = sqlite3.connect(DB)          # 파일이 없으면 새로 만듦 = DB 파일 하나
con.execute("DROP TABLE IF EXISTS wx_tasks")
con.execute("""CREATE TABLE wx_tasks (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    title  TEXT NOT NULL,
    region TEXT NOT NULL,
    kind   TEXT NOT NULL CHECK (kind IN ('야외', '고소', '실내')),
    owner  TEXT NOT NULL
)""")
con.executemany("INSERT INTO wx_tasks (title, region, kind, owner) VALUES (:title, :region, :kind, :owner)", tasks)
con.commit()

print("tasks.db 에 %d건 저장\n" % len(tasks))

print("① 지역별 일정 수")
for row in con.execute("SELECT region, COUNT(*) FROM wx_tasks GROUP BY region ORDER BY 2 DESC, 1"):
    print("   %s : %d건" % row)

print("② 고소(높은 곳) 일정만")
for row in con.execute("SELECT title, region, owner FROM wx_tasks WHERE kind = '고소'"):
    print("   %s · %s · %s" % row)

print("③ 규칙 확인 — 구분에 '지하'를 넣으면?")
try:
    con.execute("INSERT INTO wx_tasks (title, region, kind, owner) VALUES ('시험', '세종', '지하', '홍길동')")
except sqlite3.IntegrityError as e:
    print("   DB가 막음 :", e)

con.close()
