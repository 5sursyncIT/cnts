import sys
import os

# Add current directory to path so imports work
sys.path.append(".")

# Mock settings just in case, but we try to import app logic
try:
    from app.core.config import settings
    from app.db.models import UserAccount
    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import Session
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

def fix_admin_role():
    print(f"Connecting to database: {settings.database_url}")
    engine = create_engine(str(settings.database_url))
    
    with Session(engine) as session:
        stmt = select(UserAccount).where(UserAccount.email == "admin@cnts.sn")
        user = session.execute(stmt).scalar_one_or_none()
        
        if not user:
            print("Admin user not found.")
            return

        print(f"current role: {user.role}")
        if user.role == "admin":
             print("Role is already correct.")
             return

        print("Updating admin role to 'admin'...")
        user.role = "admin"
        session.add(user)
        session.commit()
        print(f"Admin user role updated successfully.")

if __name__ == "__main__":
    fix_admin_role()
