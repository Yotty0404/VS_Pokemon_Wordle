var socket = io();

var p1_id = "";
var p2_id = "";
var is_in_game = false;

//接続者数の更新
socket.on('count_update', function (msg) {
    $('#user_count').html(msg.user_count);
});

//id更新
socket.on('info_update', function (msg) {
    $('#id1').html(msg.p1_id);
    $('#id2').html(msg.p2_id);

    p1_id = msg.p1_id;
    p2_id = msg.p2_id;


    //プレイヤー判断
    if (p1_id == socket.id) {
        $('#player').html("あなたはPlayer1です。");
    }
    else if (p2_id == socket.id) {
        $('#player').html("あなたはPlayer2です。");
    }
});

//正解を更新
socket.on('update_answer', function (msg) {
    $("#txtPokeName").prop("disabled", false);
    $("#btn").prop("disabled", false);

    if (msg.is_p1) {
        updateRow('?????', $("#answer_l"));
    }
    else {
        updateRow('?????', $("#answer_r"));
    }
});



//バトルスタート
socket.on('battle_start', async function () {
    //プレイヤー判断
    if (p1_id == socket.id) {
        $("#txtPokeName").prop("disabled", false);
        $("#btn").prop("disabled", false);
    }
    else if (p2_id == socket.id) {
        $("#txtPokeName").prop("disabled", true);
        $("#btn").prop("disabled", true);
    }

    $(battle_start).removeClass("transparent");
    await sleep(2000);
    $(battle_start).addClass("transparent");
});

//ターン変更
socket.on('change_turn', function (msg) {
    if (msg.is_p1) {
        $('#turn').html('Player1のターン');
    }
    else {
        $('#turn').html('Player2のターン');
    }
});




//ボタンクリック
$(document).on('click', '#btn', function () {
    $("#txtPokeName").prop("disabled", true);
    $("#btn").prop("disabled", true);

    var pokeName = $("#txtPokeName").val();
    $("#txtPokeName").val("");

    if (!is_in_game) {
        //プレイヤー判断
        if (p1_id == socket.id) {
            updateRow(pokeName, $("#answer_l"));
            socket.emit('btn_click', { is_p1: true });
        }
        else if (p2_id == socket.id) {
            updateRow(pokeName, $("#answer_r"));
            socket.emit('btn_click', { is_p1: false });
        }
    }
    else {

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