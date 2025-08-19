from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import json
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key'
HISTORY_FILE = 'history.json'
USER_FILE = 'users.json'

@app.route('/')
def index():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/admin')
def admin():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    history = []
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            history = json.load(f)
    return render_template('admin.html', history=history)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        users = {}
        if os.path.exists(USER_FILE):
            with open(USER_FILE, 'r', encoding='utf-8') as f:
                users = json.load(f)
        user = users.get(username)
        if user and user['password'] == password:
            session['logged_in'] = True
            session['username'] = username
            return redirect(url_for('index'))
        else:
            return render_template('login.html', error='Sai tài khoản hoặc mật khẩu!')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        users = {}
        if os.path.exists(USER_FILE):
            with open(USER_FILE, 'r', encoding='utf-8') as f:
                users = json.load(f)
        if username in users:
            return render_template('register.html', error='Tài khoản đã tồn tại!')
        users[username] = {'password': password}
        with open(USER_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/save_history', methods=['POST'])
def save_history():
    if not session.get('logged_in'):
        return jsonify({'status': 'unauthorized'}), 401
    data = request.json
    history = []
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            history = json.load(f)
    data['username'] = session.get('username')
    history.append(data)
    with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(history, f, ensure_ascii=False, indent=2)
    return jsonify({'status': 'ok'})

@app.route('/export_history')
def export_history():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    import csv
    from flask import Response
    history = []
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            history = json.load(f)
    def generate():
        yield 'Tài khoản,Thời gian,Loại,Kết quả\n'
        for item in history:
            yield f"{item.get('username','')},{item.get('time','')},{item.get('type','')},{item.get('result','')}\n"
    return Response(generate(), mimetype='text/csv', headers={'Content-Disposition': 'attachment;filename=history.csv'})

@app.route('/delete_history', methods=['POST'])
def delete_history():
    if os.path.exists(HISTORY_FILE):
        os.remove(HISTORY_FILE)
    return redirect(url_for('admin'))

if __name__ == '__main__':
    app.run(debug=True)
