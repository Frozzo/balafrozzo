###fallback server non lo uso
from flask import Flask, request, send_from_directory, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import json, os

app = Flask(__name__, static_folder='.', static_url_path='')
DB_FILE = os.path.join(os.path.dirname(__file__), 'db.json')


def read_db():
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {'users': {}}


def write_db(db):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(db, f, indent=2)


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    # serve any other file (css/js/partials etc.)
    return send_from_directory('.', path)


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    user = data.get('username', '').strip()
    pwd = data.get('password', '')
    if not user or not pwd:
        return jsonify(error='Missing fields'), 400

    db = read_db()
    if user in db['users']:
        return jsonify(error='User already exists'), 409

    db['users'][user] = {
        'passwordHash': generate_password_hash(pwd),
        'soldi': 0,
        'giocate': 0,
        'vinte': 0,
        # additional stats
        'folds': 0,
        'raises': 0,
        'allins': 0,
        'roundsPlayed': 0,
        'roundsWon': 0,
        'roundsLost': 0,
        'charmsUnlocked': []
    }
    write_db(db)
    return jsonify(success=True)


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    user = data.get('username', '').strip()
    pwd = data.get('password', '')
    if not user or not pwd:
        return jsonify(error='Missing fields'), 400

    db = read_db()
    u = db['users'].get(user)
    if not u or not check_password_hash(u['passwordHash'], pwd):
        return jsonify(error='Invalid credentials'), 401

    return jsonify(success=True)


@app.route('/api/profile/<username>', methods=['GET', 'POST'])
def profile(username):
    db = read_db()
    u = db['users'].get(username)
    if not u:
        return jsonify(error='User not found'), 404

    if request.method == 'GET':
        # return copy without hash
        out = {k: v for k, v in u.items() if k != 'passwordHash'}
        return jsonify(out)
    else:
        data = request.get_json() or {}
        for field in ['soldi', 'giocate', 'vinte', 'folds', 'raises', 'allins', 'roundsPlayed', 'roundsWon', 'roundsLost', 'charmsUnlocked']:
            if field in data:
                u[field] = data[field]
        write_db(db)
        return jsonify(success=True)


if __name__ == '__main__':
    app.run(port=8080)
