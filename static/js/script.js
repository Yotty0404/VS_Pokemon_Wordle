﻿var poke_data = [];

//json取得
$.getJSON("./static/json/pokedex.json", function (data) {
    poke_data = data;
});


var socket = io();

var p1_id = "";
var p2_id = "";
var is_in_game = false;
var is_end = false;

//接続者数の更新
socket.on('count_update', function (data) {
    $('#user_count').html(data.user_count);
});

//id更新
socket.on('info_update', function (data) {
    /*    $('#id1').html(data.p1_id);*/
    /*    $('#id2').html(data.p2_id);*/

    p1_id = data.p1_id;
    p2_id = data.p2_id;


    //プレイヤー判断
    if (p1_id == socket.id) {
        $('#player').html("あなたはPlayer1です。");
    }
    else if (p2_id == socket.id) {
        $('#player').html("あなたはPlayer2です。");
    }
});

//正解を更新
socket.on('update_answer', function (data) {
    $("#txt_poke_name").prop("disabled", false);
    $("#btn").prop("disabled", false);

    if (data.is_p1) {
        update_row('?????', $("#answer_l"));
    }
    else {
        update_row('?????', $("#answer_r"));
    }
});



//バトルスタート
socket.on('battle_start', async function () {
    is_in_game = true;
    is_end = false;
    $('#turn').html('Player1のターン');

    //プレイヤー判断
    if (p1_id == socket.id) {
        $("#txt_poke_name").prop("disabled", false);
        $("#btn").prop("disabled", false);
    }
    else if (p2_id == socket.id) {
        $("#txt_poke_name").prop("disabled", true);
        $("#btn").prop("disabled", true);
    }

    $("#battle_start").html("BATTLE START");
    $("#battle_start_container").removeClass("collapse");
    $("#battle_start").removeClass("transparent");
    await sleep(2000);
    $("#battle_start_container").addClass("collapse");
    $("#battle_start").addClass("transparent");
});

//判定を反映
socket.on('judge', function (data) {
    if (data.is_p1) {
        var row = $('<div class="row">');
        $('#predict_r_container').append(row);
        for (var i = 0; i < 5; i++) {
            row.append('<div class="tile"></div>');
        }

        update_row_by_judge(data.poke_name, row, data.judges);
        $('#predict_r_container').scrollTop($('#predict_r_container').get(0).scrollHeight);
        $('#turn').html('Player2のターン');

        //プレイヤー判断
        if (p2_id == socket.id) {
            $("#txt_poke_name").prop("disabled", false);
            $("#btn").prop("disabled", false);
        }
    }
    else {
        var row = $('<div class="row">');
        $('#predict_l_container').append(row);
        for (var i = 0; i < 5; i++) {
            row.append('<div class="tile"></div>');
        }

        update_row_by_judge(data.poke_name, row, data.judges);
        $('#predict_l_container').scrollTop($('#predict_l_container').get(0).scrollHeight);
        $('#turn').html('Player1のターン');

        //プレイヤー判断
        if (p1_id == socket.id) {
            $("#txt_poke_name").prop("disabled", false);
            $("#btn").prop("disabled", false);
        }
    }
});

//勝敗表示
socket.on('end', async function (data) {
    if (is_end) {
        return;
    }

    await sleep(2000);
    is_end = true;

    var msg = "";
    if (data.correct[0] == 1 && data.correct[1] == 1) {
        msg = "DRAW";
    }
    else if (data.correct[0] == 1) {
        //プレイヤー判断
        if (p1_id == socket.id) {
            msg = "WIN!";
            $("#battle_start").addClass("win");
        }
        else if (p2_id == socket.id) {
            msg = "LOSE";
            $("#battle_start").addClass("lose");
        }
    }
    else if (data.correct[1] == 1) {
        //プレイヤー判断
        if (p1_id == socket.id) {
            msg = "LOSE";
            $("#battle_start").addClass("lose");
        }
        else if (p2_id == socket.id) {
            msg = "WIN!";
            $("#battle_start").addClass("win");
        }
    }

    $("#txt_poke_name").prop("disabled", false);
    $("#btn").prop("disabled", false);

    $("#battle_start").html(msg);
    $("#battle_start_container").removeClass("collapse");
    $("#battle_start").removeClass("transparent");
    await sleep(2000);
    $("#battle_start_container").addClass("collapse");
    $("#battle_start").addClass("transparent");
    await sleep(1000);
    $("#battle_start").removeClass("win");
    $("#battle_start").removeClass("lose");
    $("#btn_end").prop("disabled", false);
});

//リセット処理
socket.on('reset', async function (data) {
    reset_row();
    $("#predict_l_container").empty();
    $("#predict_r_container").empty();
    $('#turn').html('');
    $("#btn_end").prop("disabled", true);
    is_end = false;
    is_in_game = false;
});





//ENTERボタンクリック
$(document).on('click', '#btn', function () {
    var poke_name = $("#txt_poke_name").val();

    check_poke_name(poke_name).then(result => {
        if (!result) {
            return;
        }

        if (!is_end) {
            $("#txt_poke_name").prop("disabled", true);
            $("#btn").prop("disabled", true);
        }

        $("#txt_poke_name").val("");

        if (!is_in_game) {
            //プレイヤー判断
            if (p1_id == socket.id) {
                update_row(poke_name, $("#answer_l"));
                socket.emit('btn_click', { is_p1: true, poke_name: poke_name });
            }
            else if (p2_id == socket.id) {
                update_row(poke_name, $("#answer_r"));
                socket.emit('btn_click', { is_p1: false, poke_name: poke_name });
            }
        }
        else {
            //プレイヤー判断
            if (p1_id == socket.id) {
                socket.emit('btn_click', { is_p1: true, poke_name: poke_name });
            }
            else if (p2_id == socket.id) {
                socket.emit('btn_click', { is_p1: false, poke_name: poke_name });
            }
        }
    });
});

async function check_poke_name(poke_name) {
    var data = "";
    var rtn = true;

    if (poke_name.length != 5) {
        data = "5文字で入力してください";
        rtn = false;
    }

    var index = poke_data.findIndex(x => x.name.japanese === poke_name);

    if (rtn && index == -1) {
        data = "そのポケモンはいません";
        rtn = false;
    }

    if (!rtn) {
        $("#msg").html(data);
        $("#msg_container").removeClass("collapse");
        $("#msg").removeClass("transparent");
        await sleep(1500);
        $("#msg_container").addClass("collapse");
        $("#msg").addClass("transparent");
    }

    return rtn;
}

//テキストボックスでEnterキー押下時、ボタンクリックを発火
$(document).on('keydown', '#txt_poke_name', function (event) {
    if (event.key === 'Enter') {
        $("#btn").click();
    }
});


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function update_row(poke_name, parent) {
    for (var i = 0; i < poke_name.length; ++i) {
        update_tile($(parent.children()[i]), poke_name.charAt(i))
        await sleep(250);
    }
}

async function update_tile(tile, s) {
    tile.addClass("tile_disappear");
    await sleep(250);
    tile.html(s);
    tile.removeClass("tile_disappear");
}

async function update_row_by_judge(poke_name, parent, judges) {
    await sleep(100);
    for (var i = 0; i < poke_name.length; ++i) {
        update_tile_by_judge($(parent.children()[i]), poke_name.charAt(i), judges[i])
        await sleep(250);
    }
}

async function update_tile_by_judge(tile, s, judge) {
    tile.addClass("tile_disappear");
    await sleep(250);
    tile.html(s);
    var class_name = `judge${judge}`;
    tile.addClass(`judge${judge}`);
    tile.removeClass("tile_disappear");
}

//ENDボタンクリック
$(document).on('click', '#btn_end', function () {
    /*    socket.emit('btn_end_click');*/
    socket.emit('btn_end_click', { });
});

async function reset_row() {
    for (var i = 0; i < 5; ++i) {
        reset_tile($($("#answer_l").children()[i]))
        reset_tile($($("#answer_r").children()[i]))
        await sleep(250);
    }
}

async function reset_tile(tile) {
    tile.addClass("tile_disappear");
    await sleep(250);
    tile.html("");
    tile.removeClass("tile_disappear");
}