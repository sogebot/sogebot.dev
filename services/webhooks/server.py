from http.server import HTTPServer, BaseHTTPRequestHandler, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn

import threading
import json
import requests
import os
import datetime

from logger import logger
from database import conn

from dotenv import load_dotenv
load_dotenv()

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super(CORSRequestHandler, self).end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.end_headers()

    def do_GET(self):
        if self.path == '/user':
          # first implementation assumes my user 96965261
          # TODO:
          #  - added user will get password, which will be generated on POST /user
          #  - this will be saved and user will then be authorized by this key

          # Get the headers of the incoming request
          timestamp = float(self.headers.get('sogebot-event-timestamp', 0)) / 1000
          timestamptz = datetime.datetime.fromtimestamp(timestamp, datetime.timezone.utc)
          user_id = '96965261'
          with conn.cursor() as cur:
            cur.execute('SELECT "data" FROM "eventsub_events" WHERE "userid"=%s AND timestamp >= %s',
                        (user_id, timestamptz))
            events = cur.fetchall()

          self.send_response(200)
          self.send_header('Content-Type', 'application/json')
          self.end_headers()
          self.wfile.write(json.dumps(events).encode('utf-8'))

    def do_POST(self):
        if self.path == '/user':
            content_length = int(self.headers.get('Content-Length', 0))
            code = self.headers.get('Authorization', None)

            if not code:
              self.send_response(401)
              self.send_header('Content-Type', 'text/plain')
              self.end_headers()
              self.wfile.write(b'Missing authorization header')
            else:
              # Do something with the data, for example:
              headers = {
                'Authorization': code,
              }
              response = requests.get('https://id.twitch.tv/oauth2/validate', headers=headers)
              data = response.json()

              scopes = ' '.join(data["scopes"])
              user_id = data["user_id"]

              with conn.cursor() as cur:
                cur.execute('SELECT "scopes" FROM "eventsub_users" WHERE "userId"=%s', (user_id,))
                user = cur.fetchone()
                if user:
                  if scopes == user[0]:
                    if os.getenv('ENV') == 'development':
                      logger.info(f'User {user_id} have no new scopes. Skipping.')
                  else:
                    if os.getenv('ENV') == 'development':
                      logger.info(f'User {user_id} have new scopes {scopes}. Updating.')
                    cur.execute('UPDATE "eventsub_users" SET "scopes"=%s, "updatedat"=NOW()  WHERE "userId"=%s', (scopes, user_id))
                else:
                  if os.getenv('ENV') == 'development':
                    logger.info(f'User {user_id} not found. Creating.')
                  cur.execute('INSERT INTO "eventsub_users" ("userId", "scopes") VALUES(%s, %s)', (user_id, scopes))

              self.send_response(200)
              self.send_header('Content-Type', 'text/plain')
              self.end_headers()
              self.wfile.write(b'Success')
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'Not found')

def run_server(port):
    server_address = ('', port)
    server  = HTTPServer(server_address, CORSRequestHandler)
    logger.info(f'Starting /user listener on {port}')
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.start()