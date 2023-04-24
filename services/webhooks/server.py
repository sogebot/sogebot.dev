from http.server import HTTPServer, BaseHTTPRequestHandler, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn

import threading
import json
import requests
import os
import datetime
import pytz
import time
import socket

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
          user_id = self.headers.get('sogebot-event-userid', None)

          # Wait for up to 60 seconds for new data to be available
          self.connection.settimeout(120)

          # Wait for up to 60 seconds for new data to be available
          try:
            if user_id:
              for i in range(60 * 3):
                with conn.cursor() as cur:
                  cur.execute('SELECT "userid", "timestamp", "data" FROM "eventsub_events" WHERE "userid"=%s ORDER BY "timestamp" ASC LIMIT 1',
                              (user_id,))
                  event = cur.fetchone()

                  if event:
                    #  we have data
                    user_id = event[0]
                    timestamp = event[1]
                    data = event[2]

                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(data.encode('utf-8'))
                    # we delete used data
                    cur.execute('DELETE FROM "eventsub_events" WHERE "userid"=%s AND timestamp=%s', (user_id, timestamp))
                    conn.commit()
                    return
                  else:
                    time.sleep(1/3)
            else:
              self.send_response(400)
              self.send_header('Content-Type', 'application/json')
              self.end_headers()
          except socket.timeout:
            pass

          self.send_response(204)
          self.send_header('Content-Type', 'application/json')
          self.end_headers()

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
                conn.commit()

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