from pathlib import Path

# 專案路徑
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'data'
DB_PATH = DATA_DIR / 'toeic.db'
DATABASE_URL = f'sqlite:///{DB_PATH}'
