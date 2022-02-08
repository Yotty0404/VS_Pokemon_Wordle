var socket = io();

// �ڑ��Ґ��̍X�V
socket.on('count_update', function (msg) {
    $('#user_count').html(msg.user_count);
});

// �e�L�X�g�G���A�̍X�V
socket.on('text_update', function (msg) {
    $('#text').val(msg.text);
});

// �e�L�X�g�G���A���ύX�����ƌĂяo�����
$('#text').on('change keyup input', function () {
    socket.emit('text_update_request', { text: $(this).val() });
});