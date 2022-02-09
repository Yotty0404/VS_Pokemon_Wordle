from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit
import os

app = Flask(__name__)
socketio = SocketIO(app)

#ユーザー数
user_count = 0
#現在のテキスト
text = ""

p1_id = ""
p2_id = ""

is_p1_turn = True
is_p1_ready = False
is_p2_ready = False

@app.route('/')
def index():
    return render_template('index.html')

#ユーザーが新しく接続すると実行
@socketio.on('connect')
def connect(auth):
    global user_count, text, p1_id, p2_id, is_p1_ready, is_p2_ready
    user_count += 1

    if user_count == 1:
        is_p1_ready = False
        is_p2_ready = False
        p1_id = request.sid

    elif user_count == 2:
        is_p2_ready = False
        p2_id = request.sid

    #接続者数の更新（全員向け）
    emit('count_update', {'user_count': user_count}, broadcast=True)
    emit('info_update', {'p1_id': p1_id, 'p2_id': p2_id}, broadcast=True)


#ユーザーの接続が切断すると実行
@socketio.on('disconnect')
def disconnect():
    global user_count, is_p1_ready, is_p2_ready
    user_count -= 1

    if user_count < 2:
        is_p2_ready = False

    if user_count < 1:
        is_p1_ready = False
        is_p2_ready = False

    #接続者数の更新（全員向け）
    emit('count_update', {'user_count': user_count}, broadcast=True)

#ENTERボタンクリックで実行
@socketio.on('btn_click')
def text_update_request(json):
    global is_p1_turn, is_p1_ready, is_p2_ready
    is_p1 = json["is_p1"]
    
    if is_p1:
        is_p1_ready = True
        emit('update_answer', {'is_p1': is_p1 }, broadcast=True, include_self=False)
    else:
        is_p2_ready = True
        emit('update_answer', {'is_p1': is_p1 }, broadcast=True, include_self=False)

    if is_p1_ready and is_p2_ready:
        emit('battle_start', broadcast=True)



    #is_p1_turn = not bool(is_p1_turn)
    #emit('change_turn', {'is_p1_turn': is_p1_turn }, broadcast=True,
    #include_self=False)
if __name__ == '__main__':
    socketio.run(app, debug=True)
