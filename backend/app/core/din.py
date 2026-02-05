import datetime as dt

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.isbt128.generator import calculate_checksum


def generate_din(db: Session, *, date_don: dt.date) -> str:
    dialect = db.get_bind().dialect.name
    if dialect == "postgresql":
        seq = db.execute(text("SELECT nextval('din_seq')")).scalar_one()
    else:
        db.execute(text("CREATE TABLE IF NOT EXISTS din_seq (id INTEGER PRIMARY KEY AUTOINCREMENT)"))
        res = db.execute(text("INSERT INTO din_seq DEFAULT VALUES"))
        seq = res.lastrowid or db.execute(text("SELECT last_insert_rowid()")).scalar_one()
    
    # ISBT 128 Format: =<Facility><Year><Seq><Flag><Check>
    # Facility: 5 chars (settings.din_site_code)
    # Year: 2 digits
    # Seq: 6 digits
    # Flag: 2 digits (00 default)
    # Check: 1 char (calculated)
    
    year = date_don.strftime("%y")
    serial = int(seq)
    
    # Base part for checksum calculation: Facility + Year + Seq + Flag
    base_din = f"{settings.din_site_code}{year}{serial:06d}00"
    
    # Calculate checksum char
    check_char = calculate_checksum(base_din)
    
    # Return full DIN without '=' prefix (normalized for DB storage)
    return f"{base_din}{check_char}"
