import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("[INFO] DATABASE_URL environment variable not set. Defaulting to local SQLite database (sqlite:///./swms.db)")
    DATABASE_URL = "sqlite:///./swms.db"

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

SQLALCHEMY_DATABASE_URL = DATABASE_URL

if DATABASE_URL.startswith("sqlite://"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    try:
        temp_engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            pool_pre_ping=True
        )
        with temp_engine.connect() as conn:
            pass
        engine = temp_engine
    except Exception as exc:
        print(f"[WARNING] Remote database connection failed ({exc}). Falling back to local SQLite database (sqlite:///./swms_local.db)")
        SQLALCHEMY_DATABASE_URL = "sqlite:///./swms_local.db"
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            connect_args={"check_same_thread": False}
        )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()