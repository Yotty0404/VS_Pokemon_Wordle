from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit
import os

app = Flask(__name__)
socketio = SocketIO(app)

#ユーザー数
user_count = 0

p1_id = ""
p2_id = ""
p1_poke_name = ""
p2_poke_name = ""

is_in_game = False

#正解しているかどうか
correct = [0, 0]

@app.route('/')
def index():
    return render_template('index.html')

#ユーザーが新しく接続すると実行
@socketio.on('connect')
def connect(auth):
    global user_count, p1_id, p2_id, p1_poke_name, p2_poke_name, is_in_game
    user_count += 1

    if user_count == 1:
        p1_poke_name = ""
        p2_poke_name = ""
        p1_id = request.sid
        is_in_game = False

    elif user_count == 2:
        p2_poke_name = ""
        p2_id = request.sid
        is_in_game = False

    #接続者数の更新（全員向け）
    emit('count_update', {'user_count': user_count}, broadcast=True)
    emit('info_update', {'p1_id': p1_id, 'p2_id': p2_id}, broadcast=True)


#ユーザーの接続が切断すると実行
@socketio.on('disconnect')
def disconnect():
    global user_count, p1_poke_name, p2_poke_name, is_in_game, p1_id, p2_id
    user_count -= 1

    if user_count < 2:
        p2_poke_name = ""
        is_in_game = False
        p1_id = p2_id
        p2_id = ""

    if user_count < 1:
        p1_poke_name = ""
        p2_poke_name = ""
        is_in_game = False

    #接続者数の更新（全員向け）
    emit('count_update', {'user_count': user_count}, broadcast=True)

#ENTERボタンクリックで実行
@socketio.on('btn_click')
def btn_click(json):
    global p1_poke_name, p2_poke_name, is_in_game, correct
    is_p1 = json["is_p1"]
    poke_name = json["poke_name"]
    
    if not is_in_game:
        if is_p1:
            p1_poke_name = poke_name
            emit('update_answer', {'is_p1': is_p1 }, broadcast=True, include_self=False)
        else:
            p2_poke_name = poke_name
            emit('update_answer', {'is_p1': is_p1 }, broadcast=True, include_self=False)

        if p1_poke_name != "" and p2_poke_name != "":
            is_in_game = True
            correct = [0, 0]
            emit('battle_start', broadcast=True)

    else:
        judges = []
        if is_p1:
            for i in range(5):
                if p2_poke_name[i] == poke_name[i]:
                    judges.append(1)
                elif poke_name[i] in p2_poke_name:
                    judges.append(2)
                else:
                    judges.append(0)

            emit('judge', {'is_p1': is_p1,'poke_name':poke_name, 'judges':judges }, broadcast=True)

            if max(judges) == min(judges) == 1:
                correct[0] = 1
        else:
            for i in range(5):
                if p1_poke_name[i] == poke_name[i]:
                    judges.append(1)
                elif poke_name[i] in p1_poke_name:
                    judges.append(2)
                else:
                    judges.append(0)

            if max(judges) == min(judges) == 1:
                correct[1] = 1

            emit('judge', {'is_p1': is_p1,'poke_name':poke_name, 'judges':judges }, broadcast=True)

            if max(correct) == 1:
                emit('end', {'correct' : correct}, broadcast=True)


#ENDボタンクリックで実行
@socketio.on('btn_end_click')
def btn_end_click(json):
    print(1)
    global p1_poke_name, p2_poke_name, is_in_game, correct
    correct = [0, 0]
    p1_poke_name = ""
    p2_poke_name = ""
    is_in_game = False
    emit('reset', broadcast=True)



if __name__ == '__main__':
    socketio.run(app, debug=True)
