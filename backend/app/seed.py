"""開發用範例資料。

用法（在 backend/ 目錄）：
    python -m app.seed

只有在資料庫完全沒有專案時才會寫入，絕不覆蓋既有資料。
"""

from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import Base, SessionLocal, engine
from app.models import Project, ProjectStatus, Task, TaskPriority, TaskStatus

P, S = TaskPriority, TaskStatus

# (name, description, status, [(title, status, priority, assignee, due_in_days, description)])
SAMPLE: list[tuple[str, str, ProjectStatus, list[tuple]]] = [
    (
        "電商平台改版",
        "重新設計結帳流程與商品頁，目標提升 15% 轉換率，並導入新版設計系統。",
        ProjectStatus.ACTIVE,
        [
            ("結帳流程 UX 研究訪談", S.DONE, P.HIGH, "Alice Chen", -20, None),
            ("新版商品頁 Figma 設計", S.DONE, P.MEDIUM, "Frank Lee", -12, None),
            ("串接新金流 API", S.IN_PROGRESS, P.URGENT, "George Tsai", -2, "金流商沙箱環境不穩定"),
            ("購物車效能優化", S.IN_PROGRESS, P.HIGH, "Brian Lin", 5, None),
            ("A/B 測試設定", S.TODO, P.MEDIUM, "Alice Chen", 14, None),
            ("設計系統元件庫遷移", S.IN_PROGRESS, P.HIGH, "Frank Lee", -4, "等待品牌團隊確認色票"),
        ],
    ),
    (
        "行動 App v2.0",
        "iOS / Android 新版本，包含推播通知、離線模式與會員中心重構。",
        ProjectStatus.ACTIVE,
        [
            ("推播通知服務整合", S.IN_PROGRESS, P.HIGH, "Helen Kuo", 3, None),
            ("離線模式資料同步", S.TODO, P.URGENT, "George Tsai", 10, None),
            ("會員中心 UI 重構", S.DONE, P.MEDIUM, "Frank Lee", -6, None),
            ("App Store 上架素材", S.TODO, P.LOW, "Emma Huang", 25, None),
            ("Crash 率監控導入", S.IN_PROGRESS, P.MEDIUM, "Helen Kuo", -1, "SDK 授權申請中"),
            ("登入流程回歸測試", S.TODO, P.HIGH, "Ivy Chang", -3, None),
        ],
    ),
    (
        "內部 CRM 系統",
        "整合業務與客服資料，建立客戶 360 度檢視與銷售漏斗報表。",
        ProjectStatus.PLANNING,
        [
            ("需求訪談：業務部門", S.IN_PROGRESS, P.MEDIUM, "Cindy Wang", 6, None),
            ("資料模型初稿", S.TODO, P.MEDIUM, "David Wu", 18, None),
            ("技術選型評估", S.TODO, P.LOW, "George Tsai", 21, None),
        ],
    ),
    (
        "資料平台遷移",
        "將既有資料倉儲遷移至雲端，並重建 ETL pipeline 與監控告警。",
        ProjectStatus.ON_HOLD,
        [
            ("既有 ETL 盤點", S.DONE, P.HIGH, "David Wu", -50, None),
            ("雲端資料倉儲 PoC", S.DONE, P.HIGH, "David Wu", -30, None),
            ("預算核准", S.IN_PROGRESS, P.URGENT, "Cindy Wang", -8, "等待財務部回覆"),
        ],
    ),
    (
        "客服機器人 PoC",
        "驗證以 LLM 回覆常見客服問題的可行性與成本。",
        ProjectStatus.COMPLETED,
        [
            ("FAQ 資料整理", S.DONE, P.MEDIUM, "Emma Huang", -40, None),
            ("Prompt 設計與評估", S.DONE, P.HIGH, "Ivy Chang", -25, None),
            ("PoC 成果報告", S.DONE, P.MEDIUM, "Emma Huang", -10, None),
        ],
    ),
]


def seed(db: Session, today: date | None = None) -> bool:
    """寫入範例資料；資料庫已有專案時不做任何事並回傳 False。"""
    if db.scalar(select(func.count()).select_from(Project)):
        return False

    today = today or date.today()
    for name, description, status, tasks in SAMPLE:
        project = Project(name=name, description=description, status=status)
        project.tasks = [
            Task(
                title=title,
                status=task_status,
                priority=priority,
                assignee=assignee,
                due_date=today + timedelta(days=offset),
                description=task_description,
            )
            for title, task_status, priority, assignee, offset, task_description in tasks
        ]
        db.add(project)
    db.commit()
    return True


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if seed(db):
            projects = db.scalar(select(func.count()).select_from(Project))
            tasks = db.scalar(select(func.count()).select_from(Task))
            print(f"已寫入範例資料：{projects} 個專案、{tasks} 項任務")
        else:
            print("資料庫已有資料，略過（不會覆蓋既有資料）")


if __name__ == "__main__":
    main()
