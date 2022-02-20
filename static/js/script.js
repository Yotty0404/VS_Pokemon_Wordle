function setHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setHeight();
window.addEventListener('resize', setHeight);

var poke_data = [];

//json取得
$.getJSON('./static/json/poke.json', function (data) {
    poke_data = data;
});

//3文字のポケモンデータ
var poke3_data = [];

//json取得
$.getJSON('./static/json/poke3.json', function (data) {
    poke3_data = data;
});

//3文字のポケモンの名前をランダムに取得
function get_3poke_name() {
    var random = Math.floor(Math.random() * poke3_data.length);
    return poke3_data[random]['name'];
}

var socket = io();

var room_code = '';
var p1_id = '';
var p2_id = '';
var is_in_game = false;
var is_end = false;
var is_high_contrast = false;
var is_flick = true;

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

    $('#twitter').attr('href', $('#twitter').attr('href').replace(/{room_code}/g, room_code));
    $('#line').attr('href', $('#line').attr('href').replace(/{room_code}/g, room_code));
    $('#twitter').removeClass('collapse');
    $('#line').removeClass('collapse');

    if (p1_id != '' && p2_id != '') {
        $('#txt_poke_name').prop('disabled', false);
        $('#btn_enter,#kb_key_enter').prop('disabled', false);

        //フリックを入力可能のスタイルに
        if (is_flick) {
            $('.kb_input').find('.kb_key').each(function () {
                $(this).removeClass('kb_key_no_input');
            });
        }

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
    $('#btn_enter,#kb_key_enter').prop('disabled', false);

    //フリックを入力可能のスタイルに
    if (is_flick) {
        $('.kb_input').find('.kb_key').each(function () {
            $(this).removeClass('kb_key_no_input');
        });
    }

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
        $('#btn_enter,#kb_key_enter').prop('disabled', false);

        //フリックを入力可能のスタイルに
        if (is_flick) {
            $('.kb_input').find('.kb_key').each(function () {
                $(this).removeClass('kb_key_no_input');
            });
        }
    }
    else if (p2_id == socket.id) {
        $('#txt_poke_name').prop('disabled', true);
        $('#btn_enter,#kb_key_enter').prop('disabled', true);

        //フリックを入力不可のスタイルに
        $('.kb_input').find('.kb_key').each(function () {
            $(this).addClass('kb_key_no_input');
        });
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
            $('#btn_enter,#kb_key_enter').prop('disabled', false);

            //フリックを入力可能のスタイルに
            if (is_flick) {
                $('.kb_input').find('.kb_key').each(function () {
                    $(this).removeClass('kb_key_no_input');
                });
            }
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
            $('#btn_enter,#kb_key_enter').prop('disabled', false);

            //フリックを入力可能のスタイルに
            if (is_flick) {
                $('.kb_input').find('.kb_key').each(function () {
                    $(this).removeClass('kb_key_no_input');
                });
            }
        }

        $('#img_yajirushi').removeClass('turn180');
    }
});

//入力履歴を更新
socket.on('update_input_word', async function (data) {
    if (is_end) {
        return;
    }

    await sleep(2000);
    for (var i = 0; i < data.poke_name.length; ++i) {
        var word = $(".kb_key_item:contains(" + data.poke_name.charAt(i) + ")");
        var hasJudge1 = word.hasClass('judge1') || word.hasClass('judge1_hc');
        var hasJudge2 = word.hasClass('judge2') || word.hasClass('judge2_hc');

        if (data.judges[i] == '1') {
            word.removeClass('judge0');
            word.removeClass('judge0_hc');
            word.removeClass('judge2');
            word.removeClass('judge2_hc');

            word.addClass(get_judge_class(1));
            continue;
        }

        if (data.judges[i] == '2' && !hasJudge1) {
            word.removeClass('judge0');
            word.removeClass('judge0_hc');

            word.addClass(get_judge_class(2));
            continue;
        }

        if (data.judges[i] == '0' && !hasJudge1 && !hasJudge2) {

            word.addClass(get_judge_class(0));
            continue;
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
    $('#btn_enter,#kb_key_enter').prop('disabled', false);

    //フリックを入力可能のスタイルに
    if (is_flick) {
        $('.kb_input').find('.kb_key').each(function () {
            $(this).removeClass('kb_key_no_input');
        });
    }

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
socket.on('reset', function (data) {
    reset_row();
    $('#predict_l_container').empty();
    $('#predict_r_container').empty();
    $('#btn_exit').prop('disabled', true);
    $('#btn_reset').prop('disabled', true);
    $('#img_yajirushi').removeClass('turn180');
    $('#upper_answer_l').addClass('transparent');
    $('#upper_answer_r').addClass('transparent');

    $(".kb_key_item").each(function () {
        $(this).removeClass('judge0');
        $(this).removeClass('judge1');
        $(this).removeClass('judge2');
        $(this).removeClass('judge0_hc');
        $(this).removeClass('judge1_hc');
        $(this).removeClass('judge2_hc');
    });

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

//起動時イベント
$(document).ready(function () {
    var cookie = Cookies.get('is_high_contrast')
    if (cookie === undefined) {
        //クッキーの初期化
        Cookies.set('is_high_contrast', 'false', { expires: 30 });
        cookie = 'false'
    }

    is_high_contrast = JSON.parse(cookie.toLowerCase());
    $('#chk_high_contrast_mode').prop('checked', is_high_contrast);

    if (is_high_contrast) {
        $('#tgl_high_contrast_mode').toggleClass('checked');
    }

    Cookies.set('is_high_contrast', cookie, { expires: 30 });


    //フリック入力
    cookie = Cookies.get('is_flick')
    if (cookie === undefined) {
        //クッキーの初期化
        Cookies.set('is_flick', 'true', { expires: 30 });
        cookie = 'true';
    }

    is_flick = JSON.parse(cookie.toLowerCase());
    $('#chk_flick').prop('checked', is_flick);

    if (is_flick) {
        $('#tgl_flick').toggleClass('checked');
        $('#footer_text').addClass('display_none');
        $('#footer_flick').removeClass('display_none');
    }
    else {
        $('#footer_text').removeClass('display_none');
        $('#footer_flick').addClass('display_none');
    }

    Cookies.set('is_flick', cookie, { expires: 30 });
});

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

    socket.emit('join', { user_name: temp_user_name, room_code: temp_room_code });
});

//ENTERボタンクリック
$(document).on('click', '#btn_enter', etner_click);
$(document).on('touchstart', '#kb_key_enter', etner_click);
function etner_click() {
    if ($('#btn_enter').is(':disabled')) {
        return;
    }

    var poke_name = $('#txt_poke_name').val();

    check_poke_name(poke_name).then(result => {
        if (!result) {
            return;
        }

        if (!is_end) {
            $('#txt_poke_name').prop('disabled', true);
            $('#btn_enter,#kb_key_enter').prop('disabled', true);

            //フリックを入力不可のスタイルに
            $('.kb_input').find('.kb_key').each(function () {
                $(this).addClass('kb_key_no_input');
            });
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

        for (var i = 0; i < 5; i++) {
            var tile = $($('#input_tile_row').children()[i]);
            tile.text('');
            tile.addClass('blank_tile');
        }
    });
}


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
        $('#btn_enter').click();
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

    //タイルの色を初期化
    tile.removeClass('judge0');
    tile.removeClass('judge1');
    tile.removeClass('judge2');
    tile.removeClass('judge0_hc');
    tile.removeClass('judge1_hc');
    tile.removeClass('judge2_hc');

    var class_name = `judge${judge}`;
    if (is_high_contrast) {
        class_name += '_hc';
    }
    tile.addClass(class_name);
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

//?ボタンクリック
$(document).on('click', '.btn_help', function () {
    $('#help_container').removeClass('transparent');
});

//設定ボタンクリック
$(document).on('click', '.btn_settings', function () {
    $('#settings_container').removeClass('transparent');

    update_row_by_judge(get_3poke_name(), $('#example_row'), [1, 2, 0]);
});

//×ボタンクリック
$(document).on('click', '.window_btn_close', function () {
    $('#help_container').addClass('transparent');
    $('#settings_container').addClass('transparent');

    //設定画面のタイルの色を初期化
    $('#example_row').find('div').each(function (index, tile) {
        $(tile).removeClass('judge0');
        $(tile).removeClass('judge1');
        $(tile).removeClass('judge2');
        $(tile).removeClass('judge0_hc');
        $(tile).removeClass('judge1_hc');
        $(tile).removeClass('judge2_hc');
    })
});

//スイッチクリック
$(document).on('click', '.toggle', function () {
    $(this).toggleClass('checked');
    if (!$(this).children('input').prop('checked')) {
        $(this).children('input').prop('checked', true);
    } else {
        $(this).children('input').prop('checked', false);
    }
});

//ハイコントラストモードクリック
$(document).on('click', '#tgl_high_contrast_mode', function () {
    if ($(this).children('input').prop('checked')) {
        is_high_contrast = true;
        Cookies.set('is_high_contrast', 'true', { expires: 30 });
    }
    else {
        is_high_contrast = false;
        Cookies.set('is_high_contrast', 'false', { expires: 30 });
    }

    update_row_by_judge(get_3poke_name(), $('#example_row'), [1, 2, 0]);

    //すでに表示されているタイルの色を更新
    $('.predict').children().each(function (index, row) {
        $(row).children().each(function (index, tile) {
            if ($(tile).hasClass('judge1')) {
                $(tile).removeClass('judge1');
                $(tile).addClass('judge1_hc');
            }
            else if ($(tile).hasClass('judge1_hc')) {
                $(tile).removeClass('judge1_hc');
                $(tile).addClass('judge1');
            }
            else if ($(tile).hasClass('judge2')) {
                $(tile).removeClass('judge2');
                $(tile).addClass('judge2_hc');
            }
            else if ($(tile).hasClass('judge2_hc')) {
                $(tile).removeClass('judge2_hc');
                $(tile).addClass('judge2');
            }
        })
    })


    $('.kb_key_item').each(function (index, kb_key) {
        if ($(kb_key).hasClass('judge1')) {
            $(kb_key).removeClass('judge1');
            $(kb_key).addClass('judge1_hc');
        }
        else if ($(kb_key).hasClass('judge1_hc')) {
            $(kb_key).removeClass('judge1_hc');
            $(kb_key).addClass('judge1');
        }
        else if ($(kb_key).hasClass('judge2')) {
            $(kb_key).removeClass('judge2');
            $(kb_key).addClass('judge2_hc');
        }
        else if ($(kb_key).hasClass('judge2_hc')) {
            $(kb_key).removeClass('judge2_hc');
            $(kb_key).addClass('judge2');
        }
    })
});


//フリック入力クリック
$(document).on('click', '#tgl_flick', function () {
    if ($(this).children('input').prop('checked')) {
        is_flick = true;
        Cookies.set('is_flick', 'true', { expires: 30 });
        $('#footer_text').addClass('display_none');
        $('#footer_flick').removeClass('display_none');

        if ($('#txt_poke_name').is(':disabled')) {
            return;
        }
        $('.kb_input').find('.kb_key').each(function () {
            $(this).removeClass('kb_key_no_input');
        });
    }
    else {
        is_flick = false;
        Cookies.set('is_flick', 'false', { expires: 30 });
        $('#footer_text').removeClass('display_none');
        $('#footer_flick').addClass('display_none');

        $('.kb_input').find('.kb_key').each(function () {
            $(this).addClass('kb_key_no_input');
        });
    }
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


/*フリック用キーボード*/
var direction = '';
var position = '';

function onTouchStart(event) {
    if ($('#txt_poke_name').is(':disabled') || !is_flick) {
        return;
    }
    $(event.currentTarget).addClass('gray_for_touch');

    position = getPosition(event);
    direction = 'c';

    //フリックのオブジェクトの位置を移動させておく
    offset = $(event.currentTarget).offset();
    $('.kb_key_u').offset({ top: offset.top - 48, left: offset.left });
    $('.kb_key_d').offset({ top: offset.top + 48, left: offset.left });
    $('.kb_key_l').offset({ top: offset.top, left: offset.left - 48 });
    $('.kb_key_r').offset({ top: offset.top, left: offset.left + 48 });


    //テキストセット
    $('.kb_key_u').text($($(event.currentTarget).find('.kb_key_item')[1]).text());
    $('.kb_key_d').text($($(event.currentTarget).find('.kb_key_item')[7]).text());
    $('.kb_key_l').text($($(event.currentTarget).find('.kb_key_item')[3]).text());
    $('.kb_key_r').text($($(event.currentTarget).find('.kb_key_item')[5]).text());
}

function onTouchMove(event) {
    if ($('#txt_poke_name').is(':disabled') || !is_flick) {
        return;
    }

    direction = 'c';
    $('.kb_key_u').addClass('transparent');
    $('.kb_key_d').addClass('transparent');
    $('.kb_key_l').addClass('transparent');
    $('.kb_key_r').addClass('transparent');
    $(event.currentTarget).addClass('gray_for_touch');
    $(event.currentTarget).removeClass('transparent');

    var new_position = getPosition(event);
    var u = position.screenY - new_position.screenY;
    var d = new_position.screenY - position.screenY;
    var l = position.screenX - new_position.screenX;
    var r = new_position.screenX - position.screenX;
    var max = Math.max(u, d, r, l);

    if (max < 20) {
        return;
    }

    var key = $(event.currentTarget).find('.kb_key_item');
    var input_key = $(key[4]).text();
    if (input_key == 'ヤ' && (max == l || max == r)) {
        return;
    }
    if (input_key == 'ワ' && (max == l || max == d)) {
        return;
    }
    if (input_key == '♂' && max == d) {
        return;
    }

    $(event.currentTarget).removeClass('gray_for_touch');
    $(event.currentTarget).addClass('transparent');

    if (max == u) {
        direction = 'u';
        $('.kb_key_u').removeClass('transparent');
    }
    else if (max == d) {
        direction = 'd';
        $('.kb_key_d').removeClass('transparent');
    }
    else if (max == l) {
        direction = 'l';
        $('.kb_key_l').removeClass('transparent');
    }
    else if (max == r) {
        direction = 'r';
        $('.kb_key_r').removeClass('transparent');
    }
}

async function onTouchEnd(event) {
    if ($('#txt_poke_name').is(':disabled') || !is_flick) {
        return;
    }

    $('.kb_key_u').addClass('transparent');
    $('.kb_key_d').addClass('transparent');
    $('.kb_key_l').addClass('transparent');
    $('.kb_key_r').addClass('transparent');
    $(event.currentTarget).removeClass('gray_for_touch');
    $(event.currentTarget).removeClass('transparent');

    var input_key = '';
    var key = $(event.currentTarget).find('.kb_key_item');

    if (direction == 'c') {
        input_key = $(key[4]).text();
    }
    else if (direction == 'u') {
        input_key = $(key[1]).text();
    }
    else if (direction == 'd') {
        input_key = $(key[7]).text();
    }
    else if (direction == 'l') {
        input_key = $(key[3]).text();
    }
    else if (direction == 'r') {
        input_key = $(key[5]).text();
    }

    temp_poke_name = $('#txt_poke_name').val();
    if (temp_poke_name.length >= 5 || input_key == '') {
        return;
    }

    $('#txt_poke_name').val(temp_poke_name + input_key);

    var index = $('#txt_poke_name').val().length - 1;
    var tile = $($('#input_tile_row').children()[index]);
    tile.removeClass('blank_tile');
    tile.text(input_key);
    tile.addClass('tile_animation');
    await sleep(100);
    tile.removeClass('tile_animation');
}

//座標を取得
function getPosition(event) {
    return event.originalEvent.touches[0];
}

$(document).on('touchstart', '.kb_input .kb_key:not("#kb_key_switch")', onTouchStart);
$(document).on('touchmove', '.kb_input .kb_key:not("#kb_key_switch")', onTouchMove);
$(document).on('touchend', '.kb_input .kb_key:not("#kb_key_switch")', onTouchEnd);


$(document).on('touchstart', '#kb_key_bs', function () {
    var index = $('#txt_poke_name').val().length - 1;
    var tile = $($('#input_tile_row').children()[index]);
    tile.text('');
    tile.addClass('blank_tile');

    temp_poke_name = $('#txt_poke_name').val();
    $('#txt_poke_name').val(temp_poke_name.slice(0, -1));
});

const l_word = [
    ['ア', 'ァ']
    , ['イ', 'ィ']
    , ['ウ', 'ゥ']
    , ['エ', 'ェ']
    , ['オ', 'ォ']
    , ['カ', 'ガ']
    , ['キ', 'ギ']
    , ['ク', 'グ']
    , ['ケ', 'ゲ']
    , ['コ', 'ゴ']
    , ['サ', 'ザ']
    , ['シ', 'ジ']
    , ['ス', 'ズ']
    , ['セ', 'ゼ']
    , ['ソ', 'ゾ']
    , ['タ', 'ダ']
    , ['チ', 'ヂ']
    , ['ツ', 'ッ', 'ヅ']
    , ['テ', 'デ']
    , ['ト', 'ド']
    , ['ハ', 'バ', 'パ']
    , ['ヒ', 'ビ', 'ピ']
    , ['フ', 'ブ', 'プ']
    , ['ヘ', 'ベ', 'ペ']
    , ['ホ', 'ボ', 'ポ']
    , ['ヤ', 'ャ']
    , ['ユ', 'ュ']
    , ['ヨ', 'ョ']
]

const l_word_dakuten = [
    ['カ', 'ガ']
    , ['キ', 'ギ']
    , ['ク', 'グ']
    , ['ケ', 'ゲ']
    , ['コ', 'ゴ']
    , ['サ', 'ザ']
    , ['シ', 'ジ']
    , ['ス', 'ズ']
    , ['セ', 'ゼ']
    , ['ソ', 'ゾ']
    , ['タ', 'ダ']
    , ['チ', 'ヂ']
    , ['ツ', 'ヅ', 'ッ']
    , ['テ', 'デ']
    , ['ト', 'ド']
    , ['ハ', 'バ', 'パ']
    , ['ヒ', 'ビ', 'ピ']
    , ['フ', 'ブ', 'プ']
    , ['ヘ', 'ベ', 'ペ']
    , ['ホ', 'ボ', 'ポ']
]

const l_word_handakuten = [
    ['ハ', 'バ', 'パ']
    , ['ヒ', 'ビ', 'ピ']
    , ['フ', 'ブ', 'プ']
    , ['ヘ', 'ベ', 'ペ']
    , ['ホ', 'ボ', 'ポ']
]


function get_judge_class(judge_no) {
    var class_name = `judge${judge_no}`;

    if (is_high_contrast) {
        class_name += '_hc';
    }

    return class_name;
}


function onTouchStart_switch(event) {
    if ($('#txt_poke_name').is(':disabled') || !is_flick) {
        return;
    }
    $(event.currentTarget).addClass('gray_for_touch');

    position = getPosition(event);
    direction = 'c';

    //フリックのオブジェクトの位置を移動させておく
    offset = $(event.currentTarget).offset();
    $('.kb_key_u').offset({ top: offset.top - 48, left: offset.left });
    $('.kb_key_d').offset({ top: offset.top + 48, left: offset.left });
    $('.kb_key_l').offset({ top: offset.top, left: offset.left - 48 });
    $('.kb_key_r').offset({ top: offset.top, left: offset.left + 48 });


    //テキストセット
    $('.kb_key_l').text('゛');
    $('.kb_key_r').text('゜');
}

function onTouchMove_switch(event) {
    if ($('#txt_poke_name').is(':disabled') || !is_flick) {
        return;
    }

    direction = 'c';
    $('.kb_key_l').addClass('transparent');
    $('.kb_key_r').addClass('transparent');
    $(event.currentTarget).removeClass('gray_for_touch');
    $(event.currentTarget).removeClass('transparent');

    var new_position = getPosition(event);
    var l = position.screenX - new_position.screenX;
    var r = new_position.screenX - position.screenX;
    var max = Math.max(r, l);

    if (max < 20) {
        return;
    }

    $(event.currentTarget).addClass('transparent');

    if (max == l) {
        direction = 'l';
        $('.kb_key_l').removeClass('transparent');
    }
    else if (max == r) {
        direction = 'r';
        $('.kb_key_r').removeClass('transparent');
    }
}

async function onTouchEnd_switch(event) {
    if ($('#txt_poke_name').is(':disabled') || !is_flick) {
        return;
    }

    $('.kb_key_l').addClass('transparent');
    $('.kb_key_r').addClass('transparent');
    $(event.currentTarget).removeClass('gray_for_touch');
    $(event.currentTarget).removeClass('transparent');


    temp_poke_name = $('#txt_poke_name').val();
    targer_word = temp_poke_name.slice(-1);
    var input_key = '';



    if (direction == 'c') {
        var l_switch = l_word.find(x => x.includes(targer_word));
        if (l_switch === undefined) {
            return;
        }

        var index = l_switch.indexOf(targer_word);
        if (index < 0) {
            return;
        }
        else if (index == l_switch.length - 1) {
            index = 0;
        }
        else {
            index += 1;
        }
        input_key = l_switch[index];
    }

    else if (direction == 'l') {
        var l_switch = l_word_dakuten.find(x => x.includes(targer_word));
        if (l_switch === undefined) {
            return;
        }

        var index = l_switch.indexOf(targer_word);
        if (index < 0) {
            return;
        }
        else {
            index = 1;
        }
        input_key = l_switch[index];
    }

    else if (direction == 'r') {
        var l_switch = l_word_handakuten.find(x => x.includes(targer_word));
        if (l_switch === undefined) {
            return;
        }

        var index = l_switch.indexOf(targer_word);
        if (index < 0) {
            return;
        }
        else {
            index = 2;
        }
        input_key = l_switch[index];
    }


    $('#txt_poke_name').val(temp_poke_name.slice(0, -1) + input_key);
    var word_index = $('#txt_poke_name').val().length - 1;
    var tile = $($('#input_tile_row').children()[word_index]);
    tile.text(input_key);
    tile.addClass('tile_animation');
    await sleep(100);
    tile.removeClass('tile_animation');
}



$(document).on('touchstart', '#kb_key_switch', onTouchStart_switch);
$(document).on('touchmove', '#kb_key_switch', onTouchMove_switch);
$(document).on('touchend', '#kb_key_switch', onTouchEnd_switch);