"""Tests for the RSVP server: python3 -m unittest server/test_server.py"""
import base64
import json
import sqlite3
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import server  # noqa: E402


class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.db = Path(cls.tmp.name) / "rsvp.sqlite3"
        cls.srv = server.make_server("127.0.0.1", 0, cls.db, "s3cret", "https://pages.example")
        cls.base = f"http://127.0.0.1:{cls.srv.server_address[1]}"
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        cls.srv.server_close()
        cls.tmp.cleanup()

    def req(self, path, data=None, headers=None, method=None):
        body = json.dumps(data).encode() if isinstance(data, dict) else data
        h = {"Content-Type": "application/json", **(headers or {})}
        r = urllib.request.Request(self.base + path, data=body, headers=h, method=method)
        try:
            with urllib.request.urlopen(r) as resp:
                return resp.status, resp.headers, resp.read()
        except urllib.error.HTTPError as e:
            return e.code, e.headers, e.read()

    def rows(self):
        with sqlite3.connect(self.db) as db:
            return db.execute("SELECT name, email, attending, party_size, guest_names, lang FROM rsvp ORDER BY id").fetchall()

    def auth(self, pw):
        return {"Authorization": "Basic " + base64.b64encode(f"x:{pw}".encode()).decode()}

    def test_pages_and_assets_served(self):
        for p in ("/", "/wedding.html", "/larsson/", "/larsson/wedding.html", "/assets/css/klimt.css", "/assets/css/site.css", "/assets/sanjin-alma-2027-08-27.ics"):
            self.assertEqual(self.req(p)[0], 200, p)
        self.assertIn("text/calendar", self.req("/assets/sanjin-alma-2027-08-27.ics")[1]["Content-Type"])

    def test_code_is_revalidated_and_version_reported(self):
        st, h, _ = self.req("/assets/js/journey.js")
        self.assertEqual(h.get("Cache-Control"), "no-cache")
        st, h, body = self.req("/version")
        self.assertEqual(st, 200)
        self.assertIn(b"commit", body)

    def test_private_files_not_served(self):
        for p in ("/server/server.py", "/PRODUCT.md", "/data/rsvp.sqlite3", "/.git/config", "/assets/../server/server.py"):
            self.assertEqual(self.req(p)[0], 404, p)

    def test_valid_rsvp_is_stored(self):
        st, _, body = self.req("/api/rsvp", {"name": "Ana Č", "email": "ana@example.se", "attending": "yes",
                                             "party_size": 2, "guest_names": "Đorđe", "lang": "bs"})
        self.assertEqual(st, 201, body)
        self.assertIn(("Ana Č", "ana@example.se", "yes", 2, "Đorđe", "bs"), self.rows())

    def test_declining_clears_party_details(self):
        self.req("/api/rsvp", {"name": "Per", "attending": "no", "party_size": 4, "guest_names": "x", "lang": "sv"})
        self.assertIn(("Per", "", "no", 0, "", "sv"), self.rows())

    def test_invalid_rsvps_rejected(self):
        bad = [{"attending": "yes"}, {"name": "A", "attending": "maybe"}, {"name": "A", "attending": "yes", "party_size": 99},
               {"name": "A", "attending": "yes", "email": "nope"}, {"name": "x" * 500, "attending": "no"}, {"name": 5, "attending": "no"}]
        n = len(self.rows())
        for b in bad:
            self.assertEqual(self.req("/api/rsvp", b)[0], 422, b)
        self.assertEqual(self.req("/api/rsvp", b"not json")[0], 400)
        self.assertEqual(len(self.rows()), n)

    def test_honeypot_looks_fine_but_stores_nothing(self):
        n = len(self.rows())
        st, _, _ = self.req("/api/rsvp", {"name": "Bot", "attending": "yes", "website": "http://spam"})
        self.assertEqual(st, 200)
        self.assertEqual(len(self.rows()), n)

    def test_admin_requires_password(self):
        self.assertEqual(self.req("/admin")[0], 401)
        self.assertEqual(self.req("/admin", headers=self.auth("wrong"))[0], 401)
        st, _, body = self.req("/admin", headers=self.auth("s3cret"))
        self.assertEqual(st, 200)
        self.assertIn(b"RSVPs", body)
        st, h, csv = self.req("/admin/rsvps.csv", headers=self.auth("s3cret"))
        self.assertEqual(st, 200)
        self.assertTrue(csv.decode("utf-8-sig").startswith("id,created_at,name"))

    def test_latest_answer_counts(self):
        self.req("/api/rsvp", {"name": "Lisa", "attending": "no"})
        self.req("/api/rsvp", {"name": "lisa ", "attending": "yes", "party_size": 3})
        rows = server.Store(self.db).all()
        latest = [r for r in server.latest_per_guest(rows) if r["name"].strip().lower() == "lisa"]
        self.assertEqual(len(latest), 1)
        self.assertEqual(latest[0]["attending"], "yes")

    def test_cors_only_for_allowed_origin(self):
        _, h, _ = self.req("/api/rsvp", {"name": "C", "attending": "no"}, headers={"Origin": "https://pages.example"})
        self.assertEqual(h.get("Access-Control-Allow-Origin"), "https://pages.example")
        _, h, _ = self.req("/api/rsvp", {"name": "D", "attending": "no"}, headers={"Origin": "https://evil.example"})
        self.assertIsNone(h.get("Access-Control-Allow-Origin"))


if __name__ == "__main__":
    unittest.main()
