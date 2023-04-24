from logger import logger
import pg8000
import os

from dotenv import load_dotenv
load_dotenv()

logger.info(f"Connecting to db (db={os.getenv('PG_DB')} host={os.getenv('PG_HOST')} user={os.getenv('PG_USERNAME')} port={os.getenv('PG_PORT')})")
conn = pg8000.connect(database=os.getenv('PG_DB'),
                      host=os.getenv('PG_HOST'),
                      user=os.getenv('PG_USERNAME'),
                      password=os.getenv('PG_PASSWORD'),
                      port=int(os.getenv('PG_PORT')))

__all__ = [ conn ]