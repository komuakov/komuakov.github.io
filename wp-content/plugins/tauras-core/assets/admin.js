/* Таурас: админка — выбор картинок, копирование шорткодов, Telegram, поиск по инструкции. */
jQuery(function ($) {
	var A = window.TaurasAdmin || {};

	// Выбор картинки из медиатеки
	$(document).on('click', '.tauras-media-pick', function (e) {
		e.preventDefault();
		var box = $(this).closest('.tauras-media');
		var frame = wp.media({ title: 'Выберите картинку', button: { text: 'Использовать' }, library: { type: 'image' }, multiple: false });
		frame.on('select', function () {
			var img = frame.state().get('selection').first().toJSON();
			box.find('input[type=hidden]').val(img.id);
			box.find('img').attr('src', (img.sizes && img.sizes.medium ? img.sizes.medium.url : img.url)).show();
		});
		frame.open();
	});
	$(document).on('click', '.tauras-media-clear', function (e) {
		e.preventDefault();
		var box = $(this).closest('.tauras-media');
		box.find('input[type=hidden]').val('0');
		box.find('img').attr('src', '').hide();
	});

	// Клик по шорткоду — копирование
	$(document).on('click', '.tauras-copy', function () {
		var el = this, text = el.textContent;
		navigator.clipboard.writeText(text).then(function () {
			var old = el.textContent;
			el.textContent = 'Скопировано ✓';
			setTimeout(function () { el.textContent = old; }, 1200);
		});
	});

	// Telegram: найти группы и проверить отправку
	$(document).on('click', '.tauras-tg-find', function () {
		var out = $(this).siblings('.tauras-tg-result').first();
		if (!out.length) out = $('.tauras-tg-result').first();
		out.text('Ищу группы…');
		$.post(A.ajax, { action: 'tauras_tg_chats', _ajax_nonce: A.nonce }).done(function (r) {
			if (!r.success || !r.data.length) {
				out.html('Групп не найдено. Добавьте бота в группу, напишите там любое сообщение и нажмите кнопку ещё раз.');
				return;
			}
			var html = '<p>Нажмите на группу, чтобы подставить её:</p>';
			r.data.forEach(function (c) {
				html += '<button type="button" class="button tauras-tg-pick" data-chat="' + c.id + '" data-thread="' + c.thread + '">' +
					$('<span>').text(c.title).html() + (c.thread ? ' (тема ' + c.thread + ')' : '') + ' — ' + c.id + '</button> ';
			});
			out.html(html);
		});
	});
	$(document).on('click', '.tauras-tg-pick', function () {
		$('.tauras-tg-chat').val($(this).data('chat'));
		$('.tauras-tg-thread').val($(this).data('thread') || '');
		$('input[name=tg_on]').prop('checked', true);
	});
	$(document).on('click', '.tauras-tg-test', function () {
		var out = $(this).siblings('.tauras-tg-result');
		out.text('Отправляю…');
		$.post(A.ajax, { action: 'tauras_tg_test', _ajax_nonce: A.nonce, chat: $('.tauras-tg-chat').val(), thread: $('.tauras-tg-thread').val() })
			.done(function (r) { out.text(r.success ? '✅ ' + r.data : '⚠️ ' + r.data); });
	});

	// Разрешение Telegram для форм с паспортными данными — с подтверждением
	$(document).on('change', '.tauras-sensitive-ok', function () {
		if (this.checked && !confirm('Заявки с паспортными данными и ИНН будут видны всем участникам Telegram-группы. Разрешить?')) {
			this.checked = false;
		}
	});

	// Поиск по инструкции
	var $search = $('#tauras-help-search');
	if ($search.length) {
		var $items = $('.tauras-help__item');
		$search.on('input', function () {
			var words = $search.val().toLowerCase().trim().split(/\s+/).filter(Boolean);
			var found = 0;
			$items.each(function () {
				var hay = (this.dataset.keys + ' ' + this.textContent).toLowerCase();
				var ok = words.every(function (w) { return hay.indexOf(w.slice(0, Math.max(3, w.length - 2))) !== -1; });
				$(this).toggle(ok);
				if (ok) found++;
			});
			$('.tauras-help__toc').toggle(!words.length);
			$('.tauras-help__none').prop('hidden', found > 0);
		});
	}
});
