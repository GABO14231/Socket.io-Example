from flask import Flask, send_from_directory
app = Flask(__name__, static_folder='.')

@app.route('/')
def index(): return send_from_directory(app.static_folder, 'Socket.io.html')
@app.route('/<path:path>')
def static_files(path): return send_from_directory(app.static_folder, path)
if __name__ == '__main__': app.run(host='0.0.0.0', port=8000, debug=False)