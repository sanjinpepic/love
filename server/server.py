#!/usr/bin/env python3
"""Alma & Sanjin — site + RSVP server.

Serves the two pages and their assets, stores RSVPs in SQLite, and gives the
couple a password-protected view of the answers. Standard library only.

    ADMIN_PASSWORD=choose-something python3 server/server.py
    open http://localhost:8000/            (Save the Date)
    open http://localhost:8000/wedding.html
    open http://localhost:8000/admin       (user: anything, password: ADMIN_PASSWORD)

Environment:
    PORT            default 8000
    HOST            default 0.0.0.0
    RSVP_DB         default <repo>/data/rsvp.sqlite3, or <volume>/rsvp.sqlite3
                    when a Railway volume is attached (RAILWAY_VOLUME_MOUNT_PATH)
    ADMIN_PASSWORD  required for /admin; without it /admin is closed
    ALLOWED_ORIGIN  optional; allow the RSVP form to post from another origin
                    (e.g. https://user.github.io when the pages live there)
"""
from __future__ import annotations

import base64
import csv
import hmac
import html
import io
import json
import mimetypes
import os
import re
import sqlite3
import sys
import threading
import time
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_FILES = {"/index.html", "/wedding.html", "/favicon.svg", "/larsson/index.html", "/larsson/wedding.html"}
PUBLIC_DIRS = ("/assets/",)
MAX_BODY = 16 * 1024
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
LIMITS = {"name": 120, "email": 200, "guest_names": 500, "dietary": 500, "message": 2000}

mimetypes.add_type("text/calendar", ".ics")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("image/svg+xml", ".svg")

SCHEMA = """
CREATE TABLE IF NOT EXISTS rsvp (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at  TEXT    NOT NULL,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL DEFAULT '',
    attending   TEXT    NOT NULL CHECK (attending IN ('yes', 'no')),
    party_size  INTEGER NOT NULL DEFAULT 0,
    guest_names TEXT    NOT NULL DEFAULT '',
    dietary     TEXT    NOT NULL DEFAULT '',
    message     TEXT    NOT NULL DEFAULT '',
    lang        TEXT    NOT NULL DEFAULT 'en'
);
"""

COLUMNS = ["id", "created_at", "name", "email", "attending", "party_size",
           "guest_names", "dietary", "message", "lang"]


class Store:
    def __init__(self, path: Path):
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.Lock()
        with self.connect() as db:
            db.executescript(SCHEMA)

    def connect(self) -> sqlite3.Connection:
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        return db

    def add(self, r: dict) -> int:
        with self.lock, self.connect() as db:
            cur = db.execute(
                "INSERT INTO rsvp (created_at, name, email, attending, party_size,"
                " guest_names, dietary, message, lang) VALUES (?,?,?,?,?,?,?,?,?)",
                (datetime.now(timezone.utc).isoformat(timespec="seconds"), r["name"], r["email"],
                 r["attending"], r["party_size"], r["guest_names"], r["dietary"], r["message"], r["lang"]),
            )
            return cur.lastrowid

    def all(self) -> list[sqlite3.Row]:
        with self.connect() as db:
            return db.execute("SELECT * FROM rsvp ORDER BY id DESC").fetchall()


def latest_per_guest(rows) -> list:
    """A guest may answer more than once; the newest answer counts."""
    seen, out = set(), []
    for r in rows:  # newest first
        key = (r["name"].strip().casefold(), r["email"].strip().casefold())
        if key not in seen:
            seen.add(key)
            out.append(r)
    return out


def clean(payload: dict) -> tuple[dict | None, str | None]:
    if not isinstance(payload, dict):
        return None, "invalid"
    if str(payload.get("website", "")).strip():
        return None, "spam"
    r = {}
    for k, limit in LIMITS.items():
        v = payload.get(k, "")
        if not isinstance(v, str):
            return None, f"{k} must be text"
        v = v.strip()
        if len(v) > limit:
            return None, f"{k} is too long"
        r[k] = v
    if not r["name"]:
        return None, "name is required"
    if r["email"] and not EMAIL_RE.match(r["email"]):
        return None, "email is invalid"
    att = payload.get("attending")
    if att not in ("yes", "no"):
        return None, "attending must be yes or no"
    r["attending"] = att
    if att == "yes":
        try:
            size = int(payload.get("party_size", 1))
        except (TypeError, ValueError):
            return None, "party_size must be a number"
        if not 1 <= size <= 10:
            return None, "party_size out of range"
        r["party_size"] = size
    else:
        r["party_size"] = 0
        r["guest_names"] = r["dietary"] = ""
    lang = payload.get("lang", "en")
    r["lang"] = lang if lang in ("en", "sv", "bs") else "en"
    return r, None


class RateLimit:
    def __init__(self, per_hour: int = 30):
        self.per_hour, self.hits, self.lock = per_hour, {}, threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.time()
        with self.lock:
            q = [t for t in self.hits.get(key, []) if now - t < 3600]
            if len(q) >= self.per_hour:
                self.hits[key] = q
                return False
            q.append(now)
            self.hits[key] = q
            return True


class Handler(SimpleHTTPRequestHandler):
    store: Store
    admin_password: str | None
    allowed_origin: str | None
    limiter: RateLimit

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def log_message(self, fmt, *args):  # quieter, no IPs in logs
        sys.stderr.write("%s %s\n" % (self.log_date_time_string(), fmt % args))

    # ---- helpers
    def _json(self, status: int, obj: dict):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        origin = self.headers.get("Origin")
        if self.allowed_origin and origin == self.allowed_origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _authorized(self) -> bool:
        if not self.admin_password:
            return False
        header = self.headers.get("Authorization", "")
        if not header.startswith("Basic "):
            return False
        try:
            _, _, pw = base64.b64decode(header[6:]).decode("utf-8").partition(":")
        except Exception:
            return False
        return hmac.compare_digest(pw.encode(), self.admin_password.encode())

    def _challenge(self):
        if not self.admin_password:
            body = b"Admin is closed: start the server with ADMIN_PASSWORD set."
            self.send_response(HTTPStatus.SERVICE_UNAVAILABLE)
        else:
            body = b"Password required."
            self.send_response(HTTPStatus.UNAUTHORIZED)
            self.send_header("WWW-Authenticate", 'Basic realm="Alma & Sanjin RSVPs", charset="UTF-8"')
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # ---- routes
    def do_OPTIONS(self):
        if urlsplit(self.path).path == "/api/rsvp":
            self.send_response(HTTPStatus.NO_CONTENT)
            self._cors()
            self.end_headers()
        else:
            self.send_error(HTTPStatus.NOT_FOUND)

    def do_POST(self):
        if urlsplit(self.path).path != "/api/rsvp":
            return self.send_error(HTTPStatus.NOT_FOUND)
        ip = self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()
        if not self.limiter.allow(ip):
            return self._json(429, {"ok": False, "error": "too many answers, try again later"})
        try:
            length = int(self.headers.get("Content-Length", 0))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY:
            return self._json(400, {"ok": False, "error": "invalid body"})
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return self._json(400, {"ok": False, "error": "invalid json"})
        record, err = clean(payload)
        if err == "spam":
            return self._json(200, {"ok": True})  # look successful to bots
        if err:
            return self._json(422, {"ok": False, "error": err})
        rid = self.store.add(record)
        return self._json(201, {"ok": True, "id": rid})

    def do_HEAD(self):
        self.do_GET(head=True)

    def do_GET(self, head: bool = False):
        path = urlsplit(self.path).path
        if path == "/version":
            body = json.dumps({"commit": os.environ.get("RAILWAY_GIT_COMMIT_SHA", "local")[:12]}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if not head:
                self.wfile.write(body)
            return
        if path in ("/admin", "/admin/"):
            return self._admin() if self._authorized() else self._challenge()
        if path == "/admin/rsvps.csv":
            return self._csv() if self._authorized() else self._challenge()
        if path == "/":
            path = "/index.html"
        if path == "/wedding":
            path = "/wedding.html"
        if path in ("/larsson", "/larsson/"):
            path = "/larsson/index.html"
        if path not in PUBLIC_FILES and not path.startswith(PUBLIC_DIRS):
            return self.send_error(HTTPStatus.NOT_FOUND)
        if ".." in path:
            return self.send_error(HTTPStatus.NOT_FOUND)
        self.path = path
        return super().do_HEAD() if head else super().do_GET()

    def end_headers(self):
        p = urlsplit(self.path).path
        if p.startswith(("/assets/fonts/", "/assets/img/", "/assets/paint/", "/assets/klimt/")) and not p.endswith(".js"):
            self.send_header("Cache-Control", "public, max-age=604800")
        elif p.endswith((".html", ".js", ".css", ".json", ".ics")) or p in ("/", "/larsson/"):
            # pages and code are re-checked on every visit, so a new deploy shows at once
            self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        super().end_headers()

    def _admin(self):
        rows = self.store.all()
        latest = latest_per_guest(rows)
        yes = [r for r in latest if r["attending"] == "yes"]
        no = [r for r in latest if r["attending"] == "no"]
        guests = sum(r["party_size"] for r in yes)
        e = html.escape

        def row(r, is_latest):
            cells = "".join(f"<td>{e(str(r[c]))}</td>" for c in COLUMNS[1:])
            return f'<tr class="{"" if is_latest else "old"}">{cells}</tr>'

        latest_ids = {r["id"] for r in latest}
        body = "".join(row(r, r["id"] in latest_ids) for r in rows) or \
            f'<tr><td colspan="{len(COLUMNS) - 1}">No answers yet.</td></tr>'
        head = "".join(f"<th>{e(c.replace('_', ' '))}</th>" for c in COLUMNS[1:])
        page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>RSVPs · Alma &amp; Sanjin</title><link rel="icon" href="/favicon.svg">
<style>
body{{margin:0;font:16px/1.45 Alegreya,Georgia,serif;background:#f7f1e6;color:#33231d}}
header{{background:#a3372a;color:#f7f1e6;padding:1.5rem 1.25rem}}
h1{{margin:0;font-weight:500;font-style:italic;font-size:1.9rem}}
.sum{{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:.6rem}}
.sum b{{font-size:1.4rem}}
main{{padding:1.25rem;overflow-x:auto}}
a{{color:#33231d}} table{{border-collapse:collapse;width:100%;min-width:900px;font-variant-numeric:tabular-nums}}
th,td{{text-align:left;vertical-align:top;padding:.55rem .6rem;border-bottom:1px solid #d9cdb8}}
th{{font-weight:500;background:#ece2d0;position:sticky;top:0}} tr.old td{{color:#9a877c;text-decoration:line-through}}
</style></head><body>
<header><h1>RSVPs</h1><div class="sum">
<span><b>{len(yes)}</b> households coming</span><span><b>{guests}</b> guests in total</span>
<span><b>{len(no)}</b> can’t come</span><span><b>{len(rows)}</b> answers received</span></div></header>
<main><p><a href="/admin/rsvps.csv">Download CSV</a> · struck-through rows were replaced by a newer answer from the same guest.</p>
<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></main></body></html>"""
        data = page.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def _csv(self):
        rows = self.store.all()
        latest_ids = {r["id"] for r in latest_per_guest(rows)}
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(COLUMNS + ["is_latest"])
        for r in rows:
            w.writerow([r[c] for c in COLUMNS] + ["yes" if r["id"] in latest_ids else "no"])
        data = ("﻿" + buf.getvalue()).encode("utf-8")  # BOM so Excel reads å ä ö č ć đ š ž
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", 'attachment; filename="rsvps.csv"')
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


def make_server(host: str, port: int, db_path: Path, admin_password: str | None,
                allowed_origin: str | None = None) -> ThreadingHTTPServer:
    handler = type("BoundHandler", (Handler,), {
        "store": Store(db_path),
        "admin_password": admin_password or None,
        "allowed_origin": allowed_origin or None,
        "limiter": RateLimit(),
    })
    return ThreadingHTTPServer((host, port), handler)


def main():
    port = int(os.environ.get("PORT", "8000"))
    host = os.environ.get("HOST", "0.0.0.0")
    volume = os.environ.get("RAILWAY_VOLUME_MOUNT_PATH")
    default_db = Path(volume) / "rsvp.sqlite3" if volume else ROOT / "data" / "rsvp.sqlite3"
    db = Path(os.environ.get("RSVP_DB") or default_db)
    pw = os.environ.get("ADMIN_PASSWORD")
    srv = make_server(host, port, db, pw, os.environ.get("ALLOWED_ORIGIN"))
    print(f"Serving on http://{host}:{port}  ·  RSVPs → {db}")
    if not pw:
        print("Note: ADMIN_PASSWORD is not set, so /admin is closed.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
