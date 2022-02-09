var socket = io();

var p1_id = "";
var p2_id = "";
var is_in_game = false;

//接続者数の更新
socket.on('count_update', function (msg) {
    $('#user_count').html(msg.user_count);
});

//テキストエリアの更新
socket.on('text_update', function (msg) {
    $('#text').val(msg.text);
});

//id更新
socket.on('info_update', function (msg) {
    $('#id1').html(msg.p1_id);
    $('#id2').html(msg.p2_id);

    p1_id = msg.p1_id;
    p2_id = msg.p2_id;
});

//ターン変更
socket.on('change_turn', function (msg) {
    $("#btn").prop("disabled", false);

    if (msg.is_p1_turn) {
        $('#turn').html('Player1のターン');
    }
    else {
        $('#turn').html('Player2のターン');
    }
});


$(document).on('change keyup input', '#text', function () {
    socket.emit('text_update_request', { text: $(this).val() });
});

//ボタンクリック
$(document).on('click', '#btn', function () {
    $("#btn").prop("disabled", true);
    socket.emit('btn_click');

    var pokeName = $("#txtPokeName").val();
    $("#txtPokeName").val("");

    if (!is_in_game) {
        if (p1_id == socket.id) {
            updateRow(pokeName, $("#answer_l"));
        }
        else if (p2_id == socket.id) {
            updateRow(pokeName, $("#answer_r"));
        }
    }
});

//テキストボックスでEnterキー押下時、ボタンクリックを発火
$(document).on('keydown', '#txtPokeName', function (event) {
    if (event.key === 'Enter') {
        $("#btn").click();
    }
});


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateRow(pokeName, parent) {
    for (var i = 0; i < pokeName.length; ++i) {
        updateTile($(parent.children()[i]), pokeName.charAt(i))
        await sleep(250);
    }
}

async function updateTile(tile, s) {
    tile.addClass("tile_disappear");
    await sleep(250);
    tile.html(s);
    tile.removeClass("tile_disappear");
}