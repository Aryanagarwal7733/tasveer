import http.server
from server_api import EnterpriseRESTHandler, PORT

if __name__ == '__main__':
    print(f"[Tasveer Enterprise REST Backend] Running on http://127.0.0.1:{PORT} and http://localhost:{PORT}")
    httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), EnterpriseRESTHandler)
    httpd.serve_forever()
