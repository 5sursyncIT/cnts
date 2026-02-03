import datetime as dt

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings


def generate_din(db: Session, *, date_don: dt.date) -> str:
    dialect = db.get_bind().dialect.name
    if dialect == "postgresql":
        seq = db.execute(text("SELECT nextval('din_seq')")).scalar_one()
    else:
        db.execute(text("CREATE TABLE IF NOT EXISTS din_seq (id INTEGER PRIMARY KEY AUTOINCREMENT)"))
        res = db.execute(text("INSERT INTO din_seq DEFAULT VALUES"))
        seq = res.lastrowid or db.execute(text("SELECT last_insert_rowid()")).scalar_one()
    year = date_don.strftime("%y")
    day_of_year = date_don.timetuple().tm_yday
    serial = int(seq)
    return f"{settings.din_site_code}{year}{day_of_year:03d}{serial:06d}"
