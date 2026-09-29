import http.server
import socketserver
import json
import os
import urllib.parse
import hashlib
import time
from database import load_db, save_db

PORT = int(os.environ.get('PORT', 8085))
SECRET_KEY = "TasveerPrinceStudioSuperSecretJWTKey2026"
ADMIN_USER = "admin"
ADMIN_PASS_HASH = hashlib.sha256("prince123".encode('utf-8')).hexdigest()

def generate_jwt_token(username):
    header = json.dumps({"alg": "HS256", "typ": "JWT"}).encode('utf-8')
    payload = json.dumps({
        "sub": username,
        "role": "admin",
        "exp": int(time.time()) + (24 * 3600)
    }).encode('utf-8')
    import base64
    b64_header = base64.urlsafe_b64encode(header).decode('utf-8').rstrip('=')
    b64_payload = base64.urlsafe_b64encode(payload).decode('utf-8').rstrip('=')
    signature_base = f"{b64_header}.{b64_payload}".encode('utf-8')
    sig = hashlib.sha256(signature_base + SECRET_KEY.encode('utf-8')).hexdigest()
    return f"{b64_header}.{b64_payload}.{sig}"

def verify_jwt_token(token):
    if not token or not isinstance(token, str):
        return False
    parts = token.replace('Bearer ', '').strip().split('.')
    if len(parts) != 3:
        return False
    b64_header, b64_payload, sig = parts
    signature_base = f"{b64_header}.{b64_payload}".encode('utf-8')
    expected_sig = hashlib.sha256(signature_base + SECRET_KEY.encode('utf-8')).hexdigest()
    if sig != expected_sig:
        return False
    try:
        import base64
        padded = b64_payload + '=' * (-len(b64_payload) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded.encode('utf-8')).decode('utf-8'))
        if payload.get('exp', 0) < time.time():
            return False
        return payload
    except Exception:
        return False

class EnterpriseRESTHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header(
            'Content-Security-Policy',
            "default-src 'self' https: data: blob:; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; "
            "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; "
            "font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com; "
            "img-src 'self' data: blob: https:; "
            "connect-src 'self' http://127.0.0.1:8085 http://localhost:8085 https:; "
            "frame-src 'self' https:;"
        )
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ['/favicon.ico', '/favicon.png']:
            self.send_response(200)
            self.send_header('Content-Type', 'image/svg+xml')
            self.end_headers()
            self.wfile.write(b"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\xf0\x9f\x97\xbc\xef\xb8\x8f</text></svg>")
            return

        if path in ['/api/cms', '/api/v1/cms']:
            db = load_db()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(db, ensure_ascii=False).encode('utf-8'))
            return

        if path in ['/api/orders', '/api/v1/orders']:
            db = load_db()
            orders = db.get('orders', [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(orders, ensure_ascii=False).encode('utf-8'))
            return

        if path in ['/api/faqs', '/api/v1/faqs']:
            db = load_db()
            faqs = db.get('faqs', [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
        if path in ['/api/products', '/api/v1/products']:
            db = load_db()
            products = db.get('products', [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(products, ensure_ascii=False).encode('utf-8'))
            return

        if path in ['/api/categories', '/api/v1/categories']:
            db = load_db()
            categories = db.get('categories', [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(categories, ensure_ascii=False).encode('utf-8'))
            return

        if path in ['/api/coupons', '/api/v1/coupons']:
            db = load_db()
            coupons = db.get('coupons', [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(coupons, ensure_ascii=False).encode('utf-8'))
            return

        if path == '/favicon.ico':
            self.send_response(200)
            self.send_header('Content-Type', 'image/svg+xml')
            self.end_headers()
            self.wfile.write(b"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\xf0\x9f\x97\xbc\xef\xb8\x8f</text></svg>")
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8', errors='ignore')

        # 1. AUTH LOGIN ENDPOINT
        if path in ['/api/auth/login', '/api/v1/auth/login']:
            try:
                creds = json.loads(body)
                username = creds.get('username', '').strip()
                password = creds.get('password', '').strip()
                pass_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()

                if username == ADMIN_USER and pass_hash == ADMIN_PASS_HASH:
                    token = generate_jwt_token(username)
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "status": "success",
                        "token": token,
                        "user": { "username": username, "role": "admin" },
                        "message": "Admin Login Successful!"
                    }).encode('utf-8'))
                    return
                else:
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "error", "message": "Invalid Admin Credentials!"}).encode('utf-8'))
                    return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
                return

        # 2. DRAFT & PUBLISH CMS WORKFLOW
        if path in ['/api/v1/cms/draft', '/api/v1/cms/publish']:
            try:
                db = load_db()
                payload = json.loads(body) if body else {}

                if path == '/api/v1/cms/draft':
                    db['draft_cms'] = payload.get('cms', payload)
                    db['published_status'] = 'draft_saved'
                    save_db(db)
                    message = "CMS Changes Saved as Draft! 📝"
                else:
                    if db.get('draft_cms'):
                        db['cms'] = db['draft_cms']
                        db['draft_cms'] = None
                    db['published_status'] = 'published'
                    save_db(db)
                    message = "CMS Draft Published Live to Storefront! 🚀"

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": message, "db": db}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
                return

        # 3. ORDERS ENDPOINT
        if path in ['/api/orders', '/api/v1/orders']:
            try:
                order_payload = json.loads(body)
                db = load_db()
                if 'orders' not in db:
                    db['orders'] = []
                
                if isinstance(order_payload, list):
                    db['orders'] = order_payload
                else:
                    db['orders'].insert(0, order_payload)

                save_db(db)
                print(f"[Server API] Saved Order successfully!")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "Order Saved to Server DB!", "orders": db['orders']}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
                return

        # 3.1 COUPONS ENDPOINT
        if path in ['/api/coupons', '/api/v1/coupons']:
            try:
                coupons_payload = json.loads(body)
                db = load_db()
                db['coupons'] = coupons_payload
                save_db(db)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "Coupons saved successfully!", "coupons": db['coupons']}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
        # 3.2 PRODUCTS ENDPOINT
        if path in ['/api/products', '/api/v1/products']:
            try:
                products_payload = json.loads(body)
                db = load_db()
                db['products'] = products_payload
                save_db(db)
                print(f"[Server API] Auto-Saved {len(products_payload) if isinstance(products_payload, list) else 1} Products to local db.json successfully!")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "Products auto-saved to PC db.json!", "products": db['products']}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
                return

        # 4. CMS ENDPOINT
        if path in ['/api/cms', '/api/v1/cms', '/api/bento', '/api/save']:
            try:
                payload = json.loads(body)
                db = load_db()

                if 'cms' in payload:
                    db['cms'] = payload['cms']
                if 'bento_header' in payload:
                    db['bento_header'] = payload['bento_header']
                if 'bento_cards' in payload:
                    db['bento_cards'] = payload['bento_cards']
                if 'advantages' in payload:
                    db['advantages'] = payload['advantages']
                if 'footer' in payload:
                    db['footer'] = payload['footer']
                if 'faqs' in payload:
                    db['faqs'] = payload['faqs']
                if 'social_links' in payload:
                    db['social_links'] = payload['social_links']
                
                if 'key' in payload and 'data' in payload:
                    db[payload['key']] = payload['data']

                save_db(db)
                print(f"[Server API] Updated DB for key '{payload.get('key', 'cms')}' successfully!")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "CMS Saved to Live Server Backend!", "db": db}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
                return

        super().do_POST()

if __name__ == '__main__':
    print(f"[Tasveer Enterprise REST Backend] Running on http://127.0.0.1:{PORT} and http://localhost:{PORT}")
    httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), EnterpriseRESTHandler)
    httpd.serve_forever()
