import sys, os, json, hashlib, time
from http.server import BaseHTTPRequestHandler

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from database import load_db, save_db
except:
    # Fallback if database.py not found
    def load_db():
        return {"products": [], "orders": [], "categories": [], "coupons": [], "cms": {}, "faqs": [], "advantages": []}
    def save_db(data):
        pass

SECRET_KEY = "TasveerPrinceStudioSuperSecretJWTKey2026"
ADMIN_USER = "admin"
ADMIN_PASS_HASH = hashlib.sha256("prince123".encode()).hexdigest()

def _json_response(self, status, data):
    body = json.dumps(data, ensure_ascii=False).encode('utf-8')
    self.send_response(status)
    self.send_header('Content-Type', 'application/json')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    self.send_header('Content-Length', str(len(body)))
    self.end_headers()
    self.wfile.write(body)

def _get_route_data(path, db):
    if 'products' in path:   return db.get('products', [])
    if 'orders' in path:     return db.get('orders', [])
    if 'categories' in path: return db.get('categories', [])
    if 'coupons' in path:    return db.get('coupons', [])
    if 'faqs' in path:       return db.get('faqs', [])
    if 'advantages' in path: return db.get('advantages', [])
    if 'reviews' in path:    return db.get('reviews', [])
    if 'cms' in path:        return db.get('cms', {})
    return None

class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        db = load_db()
        data = _get_route_data(self.path, db)
        if data is not None:
            _json_response(self, 200, data)
        else:
            _json_response(self, 404, {'error': 'Not found'})

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length)) if length else {}
        except:
            body = {}

        db = load_db()

        # Login
        if 'auth/login' in self.path:
            u = body.get('username', '')
            p = body.get('password', '')
            if u == ADMIN_USER and hashlib.sha256(p.encode()).hexdigest() == ADMIN_PASS_HASH:
                import base64
                payload = base64.urlsafe_b64encode(
                    json.dumps({'username': u, 'exp': time.time() + 86400}).encode()
                ).decode().rstrip('=')
                token = f"eyJ0eXBlIjoiSldUIn0.{payload}.sig"
                _json_response(self, 200, {'token': token, 'message': 'Login successful'})
            else:
                _json_response(self, 401, {'error': 'Invalid credentials'})
            return

        # Orders
        if 'orders' in self.path:
            if isinstance(body, list):
                db['orders'] = body
            elif isinstance(body, dict) and body:
                db.setdefault('orders', []).insert(0, body)
            save_db(db)
            _json_response(self, 200, {'success': True})
            return

        # Products
        if 'products' in self.path:
            db['products'] = body
            save_db(db)
            _json_response(self, 200, {'success': True})
            return

        # Coupons
        if 'coupons' in self.path:
            db['coupons'] = body
            save_db(db)
            _json_response(self, 200, {'success': True})
            return

        # CMS
        if 'cms' in self.path:
            db['cms'] = body
            save_db(db)
            _json_response(self, 200, {'success': True})
            return

        _json_response(self, 404, {'error': 'Not found'})

    def log_message(self, format, *args):
        pass  # Suppress logs
