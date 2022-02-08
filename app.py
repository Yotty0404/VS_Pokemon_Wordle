from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit
import os

app = Flask(__name__)
socketio = SocketIO(app)

# ユーザー数
user_count = 0
# 現在のテキスト
text = ""

@app.route('/')
def index():
    return render_template('index.html')

# ユーザーが新しく接続すると実行
@socketio.on('connect')
def connect(auth):
    global user_count, text
    user_count += 1
    # 接続者数の更新（全員向け）
    emit('count_update', {'user_count': user_count}, broadcast=True)
    # テキストエリアの更新
    emit('text_update', {'text': text})


# ユーザーの接続が切断すると実行
@socketio.on('disconnect')
def disconnect():
    global user_count
    user_count -= 1
    # 接続者数の更新（全員向け）
    emit('count_update', {'user_count': user_count}, broadcast=True)


# テキストエリアが変更されたときに実行
@socketio.on('text_update_request')
def text_update_request(json):
    global text
    text = json["text"]
    # 変更をリクエストした人以外に向けて送信する
    # 全員向けに送信すると入力の途中でテキストエリアが変更されて日本語入力がうまくできない
    emit('text_update', {'text': text}, broadcast=True, include_self=False)


if __name__ == '__main__':
    # 本番環境ではeventletやgeventを使うらしいが簡単のためデフォルトの開発用サーバーを使う
    #socketio.run(app, debug=True)
    #socketio.run(app)
    socketio.run(app, debug=True, host='0.0.0.0', port=5004)
