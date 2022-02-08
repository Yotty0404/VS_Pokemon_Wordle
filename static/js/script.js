var socket = io();

// 接続者数の更新
socket.on('count_update', function (msg) {
    $('#user_count').html(msg.user_count);
});

// テキストエリアの更新
socket.on('text_update', function (msg) {
    $('#text').val(msg.text);
});

// テキストエリアが変更されると呼び出される
$('#text').on('change keyup input', function () {
    socket.emit('text_update_request', { text: $(this).val() });
});