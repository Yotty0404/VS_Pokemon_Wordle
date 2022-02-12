var poke_data = [];

//json取得
$.getJSON('./static/json/poke.json', function (data) {
    poke_data = data;
});

var socket = io();

var room_code = '';
var p1_id = '';
var p2_id = '';
var is_in_game = false;
var is_end = false;

//満室エラー
socket.on('full_error', function (data) {
    show_message('満室です');
});

//入室時情報更新
socket.on('update_info_join', function (data) {
    $('#login_container').addClass('transparent');

    room_code = data.room_code;
    p1_id = data.p1_id;
    p2_id = data.p2_id;

    $('#room_info').text('部屋コード：' + room_code);
    $('#player1_name').text(data.p1_user_name);
    $('#player2_name').text(data.p2_user_name);

    if (p1_id != '' && p2_id != '') {
        $('#txt_poke_name').prop('disabled', false);
        $('#btn').prop('disabled', false);
        show_message('自分のポケモンを入力してください');
    }
});

//退出時情報更新
socket.on('opponent_exit', function (data) {
    $('#opponent_exit_container').removeClass('transparent');
});

//正解を更新
socket.on('update_answer', function (data) {
    $('#txt_poke_name').prop('disabled', false);
    $('#btn').prop('disabled', false);

    if (data.is_p1) {
        update_row('?????', $('#answer_l'));
    }
    else {
        update_row('?????', $('#answer_r'));
    }
});

//バトルスタート
socket.on('battle_start', async function () {
    is_in_game = true;
    is_end = false;
    /*    $('#turn').html('Player1のターン');*/

    //プレイヤー判断
    if (p1_id == socket.id) {
        $('#txt_poke_name').prop('disabled', false);
        $('#btn').prop('disabled', false);
    }
    else if (p2_id == socket.id) {
        $('#txt_poke_name').prop('disabled', true);
        $('#btn').prop('disabled', true);
    }

    $('#battle_start').text('BATTLE START');
    $('#battle_start_container').removeClass('collapse');
    $('#battle_start').removeClass('transparent');
    await sleep(2000);
    $('#battle_start_container').addClass('collapse');
    $('#battle_start').addClass('transparent');
});

//判定を反映
socket.on('judge', function (data) {
    if (data.is_p1) {
        var row = $('<div class="row_r">');
        $('#predict_r_container').append(row);
        for (var i = 0; i < 5; i++) {
            row.append('<div class="tile"></div>');
        }

        update_row_by_judge(data.poke_name, row, data.judges);
        $('#predict_r_container').scrollTop($('#predict_r_container').get(0).scrollHeight);

        //プレイヤー判断
        if (p2_id == socket.id) {
            $('#txt_poke_name').prop('disabled', false);
            $('#btn').prop('disabled', false);
        }

        $('#img_yajirushi').addClass('turn180');
    }
    else {
        var row = $('<div class="row_l">');
        $('#predict_l_container').append(row);
        for (var i = 0; i < 5; i++) {
            row.append('<div class="tile"></div>');
        }

        update_row_by_judge(data.poke_name, row, data.judges);
        $('#predict_l_container').scrollTop($('#predict_l_container').get(0).scrollHeight);

        //プレイヤー判断
        if (p1_id == socket.id) {
            $('#txt_poke_name').prop('disabled', false);
            $('#btn').prop('disabled', false);
        }

        $('#img_yajirushi').removeClass('turn180');
    }
});

//勝敗表示
socket.on('end', async function (data) {
    if (is_end) {
        return;
    }

    await sleep(2000);
    is_end = true;

    var msg = '';
    if (data.correct[0] == 1 && data.correct[1] == 1) {
        msg = 'DRAW';
    }
    else if (data.correct[0] == 1) {
        //プレイヤー判断
        if (p1_id == socket.id) {
            msg = 'WIN!';
            $('#battle_start').addClass('win');
        }
        else if (p2_id == socket.id) {
            msg = 'LOSE';
            $('#battle_start').addClass('lose');
            $('#upper_answer_l').removeClass('transparent');
        }
    }
    else if (data.correct[1] == 1) {
        //プレイヤー判断
        if (p1_id == socket.id) {
            msg = 'LOSE';
            $('#battle_start').addClass('lose');
            $('#upper_answer_r').removeClass('transparent');
        }
        else if (p2_id == socket.id) {
            msg = 'WIN!';
            $('#battle_start').addClass('win');
        }
    }

    $('#txt_poke_name').prop('disabled', false);
    $('#btn').prop('disabled', false);

    $('#battle_start').text(msg);
    $('#battle_start_container').removeClass('collapse');
    $('#battle_start').removeClass('transparent');
    await sleep(2000);
    $('#battle_start_container').addClass('collapse');
    $('#battle_start').addClass('transparent');
    await sleep(1000);
    $('#battle_start').removeClass('win');
    $('#battle_start').removeClass('lose');
    $('#btn_exit').prop('disabled', false);
    $('#btn_reset').prop('disabled', false);
});

//リセット処理
socket.on('reset', async function (data) {
    reset_row();
    $('#predict_l_container').empty();
    $('#predict_r_container').empty();
    $('#btn_exit').prop('disabled', true);
    $('#btn_reset').prop('disabled', true);
    $('#img_yajirushi').removeClass('turn180');
    $('#upper_answer_l').addClass('transparent');
    $('#upper_answer_r').addClass('transparent');

    is_end = false;
    is_in_game = false;

    show_message('自分のポケモンを入力してください');
});

//答えを見る
socket.on('see_answer', function (data) {
    $('#upper_answer_l').addClass('transparent');
    $('#upper_answer_r').addClass('transparent');

    //プレイヤー判断
    if (p1_id == socket.id) {
        update_row(data.p2_poke_name, $('#answer_r'));
    }
    else if (p2_id == socket.id) {
        update_row(data.p1_poke_name, $('#answer_l'));
    }
});

//---------------------------------------------------------------
//----クライアントのイベント-------------------------------------
//---------------------------------------------------------------

//JOINボタンクリック
$(document).on('click', '#btn_join', function () {
    var temp_user_name = $('#txt_user_name').val();
    var temp_room_code = $('#txt_room_code').val();

    var hasError = false;
    if (temp_user_name == '') {
        $('#txt_user_name').addClass('txt_error');
        hasError = true;
    }
    else {
        $('#txt_user_name').removeClass('txt_error');
    }

    if (temp_room_code == '') {
        $('#txt_room_code').addClass('txt_error');
        hasError = true;
    }
    else {
        $('#txt_room_code').removeClass('txt_error');
    }

    if (hasError) {
        return;
    }

    $('#twitter').attr('href', $('#twitter').attr('href').replace(/{room_code}/g, temp_room_code));
    $('#line').attr('href', $('#line').attr('href').replace(/{room_code}/g, temp_room_code));
    $('#twitter').removeClass('collapse');
    $('#line').removeClass('collapse');


    socket.emit('join', { user_name: temp_user_name, room_code: temp_room_code });
});

//ENTERボタンクリック
$(document).on('click', '#btn', function () {
    var poke_name = $('#txt_poke_name').val();

    check_poke_name(poke_name).then(result => {
        if (!result) {
            return;
        }

        if (!is_end) {
            $('#txt_poke_name').prop('disabled', true);
            $('#btn').prop('disabled', true);
        }

        $('#txt_poke_name').val('');

        if (!is_in_game) {
            //プレイヤー判断
            if (p1_id == socket.id) {
                update_row(poke_name, $('#answer_l'));
                socket.emit('btn_click', { room_code: room_code, is_p1: true, poke_name: poke_name });
            }
            else if (p2_id == socket.id) {
                update_row(poke_name, $('#answer_r'));
                socket.emit('btn_click', { room_code: room_code, is_p1: false, poke_name: poke_name });
            }
        }
        else {
            //プレイヤー判断
            if (p1_id == socket.id) {
                socket.emit('btn_click', { room_code: room_code, is_p1: true, poke_name: poke_name });
            }
            else if (p2_id == socket.id) {
                socket.emit('btn_click', { room_code: room_code, is_p1: false, poke_name: poke_name });
            }
        }
    });
});

async function check_poke_name(poke_name) {
    var msg = '';
    var rtn = true;

    if (poke_name.length != 5) {
        msg = '5文字で入力してください';
        rtn = false;
    }

    var index = poke_data.findIndex(x => x.name === poke_name);

    if (rtn && index == -1) {
        msg = 'そのポケモンはいません';
        rtn = false;
    }

    if (!rtn) {
        show_message(msg);
    }

    return rtn;
}

//テキストボックスでEnterキー押下時、ボタンクリックを発火
$(document).on('keydown', '#txt_poke_name', function (event) {
    if (event.key === 'Enter') {
        $('#btn').click();
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
    tile.addClass('tile_disappear');
    await sleep(250);
    tile.text(s);
    tile.removeClass('tile_disappear');
}

async function update_row_by_judge(poke_name, parent, judges) {
    await sleep(100);
    for (var i = 0; i < poke_name.length; ++i) {
        update_tile_by_judge($(parent.children()[i]), poke_name.charAt(i), judges[i])
        await sleep(250);
    }
}

async function update_tile_by_judge(tile, s, judge) {
    tile.addClass('tile_disappear');
    await sleep(250);
    tile.text(s);
    var class_name = `judge${judge}`;
    tile.addClass(`judge${judge}`);
    tile.removeClass('tile_disappear');
}

//ENDボタンクリック
$(document).on('click', '#btn_reset', function () {
    /*    socket.emit('btn_reset_click');*/
    socket.emit('btn_reset_click', { room_code: room_code });
});

//答えを見るボタンクリック
$(document).on('click', '.upper_anser', function () {
    socket.emit('see_answer', { room_code: room_code });
});

//対戦相手が退出時のOKボタンクリック
$(document).on('click', '#btn_opponent_exit', function () {
    document.location.href = 'https://www.vs-pokemon-wordle.com/';
});

//EXITボタンクリック
$(document).on('click', '#btn_exit', function () {
    document.location.href = 'https://www.vs-pokemon-wordle.com/';
});

async function reset_row() {
    for (var i = 0; i < 5; ++i) {
        reset_tile($($('#answer_l').children()[i]))
        reset_tile($($('#answer_r').children()[i]))
        await sleep(250);
    }
}

async function reset_tile(tile) {
    tile.addClass('tile_disappear');
    await sleep(250);
    tile.text('');
    tile.removeClass('tile_disappear');
}

function slice_max_length(elem, maxLength) {
    elem.value = elem.value.slice(0, maxLength);
}

async function show_message(msg) {
    $('#msg').text(msg);
    $('#msg_container').removeClass('collapse');
    $('#msg').removeClass('transparent');
    await sleep(1500);
    $('#msg_container').addClass('collapse');
    $('#msg').addClass('transparent');
}