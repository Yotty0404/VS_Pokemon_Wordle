from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit, join_room, leave_room, rooms, close_room
import os
from collections import defaultdict

#部屋ごとの人数を保持
d_user_count = defaultdict(int)

class GameInfo:
    def __init__(self):
        self.p1_id = ""
        self.p1_user_name = ""
        self.p1_poke_name = ""
        self.p2_id = ""
        self.p2_user_name = ""
        self.p2_poke_name = ""
        self.is_in_game = False
        #正解しているかどうか
        self.correct = [0, 0]

d_info = defaultdict(GameInfo)

app = Flask(__name__)
socketio = SocketIO(app)

@app.route("/", methods=["GET"])
def get_user():
    room_code = ''

    try:
        req = request.args
        room_code = req.get("room_code")
    except:
        return render_template('home.html')

    if room_code != '':
        return render_template('home.html', room_code = room_code)

    else:
        return render_template('home.html')

#ユーザーが新しく接続すると実行
@socketio.on('connect')
def connect():
    pass

#ユーザーの接続が切断すると実行
@socketio.on('disconnect')
def disconnect():
    global d_user_count, d_info

    room_code = ''
    #強引にroom_codeを取得
    for s in rooms():
        if len(s) < 5:
            room_code = s

    #入室前の場合はなにもしない
    if room_code == '':
        return()

    emit('opponent_exit', broadcast=True, to=room_code)

    close_room(room_code)
    d_user_count[room_code] = 0
    d_info[room_code] = GameInfo()

@socketio.on('join')
def join(json):
    global d_user_count, d_info
    room_code = json["room_code"]
    user_name = json["user_name"]

    #満室だった場合
    if d_user_count[room_code] >= 2:
        emit('full_error')
        return

    join_room(room_code)
    d_user_count[room_code] += 1

    temp_info = d_info[room_code]

    if d_user_count[room_code] == 1:
        temp_info.p1_id = request.sid
        temp_info.p1_user_name = user_name

    elif d_user_count[room_code] == 2:
        temp_info.p2_id = request.sid
        temp_info.p2_user_name = user_name

    emit('update_info_join', {'room_code': room_code
                             ,'p1_user_name': temp_info.p1_user_name
                             ,'p2_user_name': temp_info.p2_user_name
                             ,'p1_id': temp_info.p1_id
                             ,'p2_id': temp_info.p2_id}, broadcast=True, to=room_code)

    d_info[room_code] = temp_info

#ENTERボタンクリックで実行
@socketio.on('btn_click')
def btn_click(json):
    global d_info
    room_code = json["room_code"]
    is_p1 = json["is_p1"]
    poke_name = json["poke_name"]

    temp_info = d_info[room_code]
    
    if not temp_info.is_in_game:
        if is_p1:
            temp_info.p1_poke_name = poke_name
            emit('update_answer', {'is_p1': is_p1 }, broadcast=True, include_self=False, to=room_code)
        else:
            temp_info.p2_poke_name = poke_name
            emit('update_answer', {'is_p1': is_p1 }, broadcast=True, include_self=False, to=room_code)

        if temp_info.p1_poke_name != "" and temp_info.p2_poke_name != "":
            temp_info.is_in_game = True
            temp_info.correct = [0, 0]
            emit('battle_start', broadcast=True, to=room_code)

    else:
        judges = [0,0,0,0,0]
        target_poke_name = ''
        correct_index = 0
        if is_p1:
            target_poke_name = temp_info.p2_poke_name
            correct_index = 0
        else:
            target_poke_name = temp_info.p1_poke_name
            correct_index = 1

        l_poke_name = list(poke_name)
        l_target_poke_name = list(target_poke_name)

        for i in range(5):
            if l_poke_name[i] == l_target_poke_name[i]:
                judges[i] = 1
        
                #チェック済みとして更新
                l_poke_name[i] = '!'
                l_target_poke_name[i] = '!'
        
        for i in range(5):
            if l_poke_name[i] == '!':
                continue
    
            if l_poke_name[i] in l_target_poke_name:
                judges[i] = 2
        
                #チェック済みとして更新
                index = l_target_poke_name.index(l_poke_name[i])
                l_poke_name[i] = '!'
                l_target_poke_name[index] = '!'


        if max(judges) == min(judges) == 1:
            temp_info.correct[correct_index] = 1

        emit('judge', {'is_p1': is_p1,'poke_name':poke_name, 'judges':judges }, broadcast=True, to=room_code)
        emit('update_input_word', {'poke_name':poke_name, 'judges':judges })
        
        #Player2のターン かつ どちらかが正解で試合終了
        if not is_p1 and max(temp_info.correct) == 1:
            emit('end', {'correct' : temp_info.correct}, broadcast=True, to=room_code)

    d_info[room_code] = temp_info


#RESETボタンクリックで実行
@socketio.on('btn_reset_click')
def btn_reset_click(json):
    global d_info
    room_code = json["room_code"]
    temp_info = d_info[room_code]

    temp_info.correct = [0, 0]
    temp_info.p1_poke_name = ""
    temp_info.p2_poke_name = ""
    temp_info.is_in_game = False

    emit('reset', broadcast=True, to=room_code)
    d_info[room_code] = temp_info

#「答えを見る」クリックで実行
@socketio.on('see_answer')
def see_answer(json):
    global d_info
    room_code = json["room_code"]
    temp_info = d_info[room_code]

    emit('see_answer', {'p1_poke_name' : temp_info.p1_poke_name, 'p2_poke_name' : temp_info.p2_poke_name})


if __name__ == '__main__':
    socketio.run(app, debug=True)
