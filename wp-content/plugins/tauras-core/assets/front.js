/* Таурас: формы заявок и всплывающие окна. Без jQuery. */
(function () {
	'use strict';
	var T = window.TaurasFront || {};
	var store = {
		get: function (k) { try { return JSON.parse(localStorage.getItem('tauras_' + k)); } catch (e) { return null; } },
		set: function (k, v) { try { localStorage.setItem('tauras_' + k, JSON.stringify(v)); } catch (e) {} }
	};
	function goal(name) {
		if (name && window.ym && T.metrika) { try { window.ym(T.metrika, 'reachGoal', name); } catch (e) {} }
	}

	/* ---------- UTM: запоминаем при первом заходе ---------- */
	(function () {
		var q = new URLSearchParams(location.search), utm = [];
		['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid'].forEach(function (k) {
			if (q.get(k)) utm.push(k.replace('utm_', '') + '=' + q.get(k));
		});
		// метки живут 30 дней; вместе с ними — страница, на которую человек пришёл по рекламе
		if (utm.length) store.set('utm2', { v: utm.join('; '), land: location.href, t: Date.now() });
		if (!store.get('ref') && document.referrer && document.referrer.indexOf(location.host) === -1) store.set('ref', document.referrer);
	})();

	/* ---------- Маска телефона +7 (___) ___-__-__ ---------- */
	function maskPhone(input) {
		input.addEventListener('input', function () {
			var d = input.value.replace(/\D/g, '');
			if (d[0] === '8') d = '7' + d.slice(1);
			if (d && d[0] !== '7') d = '7' + d;
			d = d.slice(0, 11);
			var out = d ? '+7' : '';
			if (d.length > 1) out += ' (' + d.slice(1, 4);
			if (d.length >= 4) out += ') ' + d.slice(4, 7);
			if (d.length >= 7) out += '-' + d.slice(7, 9);
			if (d.length >= 9) out += '-' + d.slice(9, 11);
			input.value = out;
		});
		input.addEventListener('focus', function () { if (!input.value) input.value = '+7 ('; });
		input.addEventListener('blur', function () { if (input.value.replace(/\D/g, '').length <= 1) input.value = ''; });
	}

	/* ---------- День и время визита: кнопки «Сегодня / Завтра / …» вместо календаря ---------- */
	var WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
	var MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
	function pad(n) { return (n < 10 ? '0' : '') + n; }
	function fmt(d) { return WD[d.getDay()] + ', ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }
	function fillTimes(select, day) {
		if (!select) return;
		var weekend = day && (day.getDay() === 0 || day.getDay() === 6);
		var r = (select.dataset[weekend ? 'weekend' : 'weekday'] || '7-23').split('-').map(Number);
		var now = new Date(), from = r[0];
		if (day && day.toDateString() === now.toDateString()) from = Math.max(from, now.getHours() + 1);
		var keep = select.value, first = select.options[0];
		select.innerHTML = '';
		select.appendChild(first);
		for (var h = from; h < r[1]; h++) {
			var o = document.createElement('option');
			o.textContent = pad(h) + ':00';
			select.appendChild(o);
		}
		select.value = keep;
		if (select.value !== keep) select.value = '';
	}
	function initVisit(native) {
		var box = native.closest('.tauras-visit'), form = native.form;
		var time = form.querySelector('.tauras-visit__time');
		var hidden = document.createElement('input');
		hidden.type = 'hidden';
		hidden.name = native.name;
		native.removeAttribute('name');
		native.required = false;
		hidden.required = native.hasAttribute('required');
		var chips = document.createElement('div');
		chips.className = 'tauras-visit__days';
		var today = new Date();
		today.setHours(0, 0, 0, 0);
		var days = Math.max(1, parseInt(native.dataset.days, 10) || 7);
		function select(btn, date) {
			chips.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
			hidden.value = date ? fmt(date) : '';
			box.classList.remove('is-error');
			fillTimes(time, date);
		}
		for (var i = 0; i < days; i++) {
			(function (d) {
				var b = document.createElement('button');
				b.type = 'button';
				b.className = 'tauras-visit__day';
				b.setAttribute('aria-pressed', 'false');
				var top = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : WD[d.getDay()];
				b.innerHTML = '<b>' + top + '</b><span>' + d.getDate() + ' ' + MON[d.getMonth()] + '</span>';
				if (d.getDay() === 0 || d.getDay() === 6) b.classList.add('is-weekend');
				b.addEventListener('click', function () {
					var on = b.getAttribute('aria-pressed') === 'true';
					native.hidden = true;
					select(on && !hidden.required ? null : b, on && !hidden.required ? null : d);
				});
				chips.appendChild(b);
			})(new Date(today.getTime() + i * 864e5));
		}
		var other = document.createElement('button');
		other.type = 'button';
		other.className = 'tauras-visit__day tauras-visit__other';
		other.setAttribute('aria-pressed', 'false');
		other.innerHTML = '<b>Другая</b><span>дата</span>';
		other.addEventListener('click', function () {
			select(other, null);
			native.hidden = false;
			try { native.showPicker(); } catch (e) { native.focus(); }
		});
		chips.appendChild(other);
		native.hidden = true;
		native.addEventListener('change', function () {
			if (!native.value) return;
			var p = native.value.split('-'), d = new Date(+p[0], p[1] - 1, +p[2]);
			hidden.value = fmt(d);
			fillTimes(time, d);
		});
		box.insertBefore(chips, native);
		box.appendChild(hidden);
		form.addEventListener('tauras:sent', function () { select(null, null); native.value = ''; native.hidden = true; });
	}

	/* ---------- Отправка форм ---------- */
	function initForm(form) {
		if (form.dataset.ready) return;
		form.dataset.ready = '1';
		var ts = form.querySelector('[name="ts"]');
		if (ts) ts.value = Math.floor(Date.now() / 1000);
		form.querySelectorAll('input[type="tel"]').forEach(maskPhone);
		form.querySelectorAll('.tauras-visit__date').forEach(initVisit);
		// «Налогоплательщик и клиент — одно лицо»: прячем поля клиента
		var same = form.querySelector('[name="f[same_person]"]');
		if (same) {
			var toggle = function () {
				form.querySelectorAll('[name^="f[client_"]').forEach(function (el) { el.closest('label').hidden = same.checked; });
			};
			same.addEventListener('change', toggle);
			toggle();
		}

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var btn = form.querySelector('[type="submit"]'), msg = form.querySelector('.tauras-form__msg');
			form.querySelectorAll('.is-error').forEach(function (el) { el.classList.remove('is-error'); });
			var bad = Array.prototype.filter.call(form.querySelectorAll('[required]'), function (el) {
				return el.type === 'checkbox' ? !el.checked : !el.value.trim();
			});
			if (bad.length) {
				bad.forEach(function (el) { (el.closest('label') || el.closest('.tauras-visit') || el).classList.add('is-error'); });
				msg.textContent = 'Заполните обязательные поля';
				msg.className = 'tauras-form__msg is-error';
				bad[0].focus();
				return;
			}
			var fd = new FormData(form);
			fd.append('action', 'tauras_submit');
			fd.append('form', form.dataset.form);
			fd.append('page', location.href);
			fd.append('page_title', document.title);
			var u = store.get('utm2'), fresh = u && u.t && Date.now() - u.t < 30 * 864e5;
			fd.append('utm', fresh ? u.v : '');
			fd.append('utm_land', fresh ? u.land : '');
			fd.append('ref', store.get('ref') || '');
			btn.disabled = true;
			btn.classList.add('is-loading');
			fetch(T.ajax, { method: 'POST', body: fd, credentials: 'same-origin' })
				.then(function (r) { return r.json(); })
				.then(function (res) {
					var d = res.data || {};
					if (!res.success) {
						msg.textContent = d.message || 'Не удалось отправить. Позвоните нам, пожалуйста.';
						msg.className = 'tauras-form__msg is-error';
						Object.keys(d.fields || {}).forEach(function (k) {
							var el = form.querySelector('[name="f[' + k + ']"]');
							if (el) (el.closest('label') || el).classList.add('is-error');
						});
						if (window.smartCaptcha) try { window.smartCaptcha.reset(); } catch (er) {}
						return;
					}
					store.set('lead', Date.now());
					goal(form.dataset.goal);
					goal('tauras_lead');
					var popup = form.closest('.tp-popup');
					if (popup) goal('popup_' + popup.id.replace('tp-popup-', '') + '_lead');
					var go = function () { if (d.redirect) location.href = d.redirect; };
					// UIS: передаём заявку так же, как старый сайт (Comagic.addOfflineRequest)
					if (d.uis && window.Comagic && window.Comagic.addOfflineRequest) {
						window.Comagic.addOfflineRequest(d.uis, go);
						if (d.redirect) setTimeout(go, 3000); // на случай проблем с сетью
					} else {
						go();
					}
					form.reset();
					if (ts) ts.value = Math.floor(Date.now() / 1000);
					msg.textContent = d.message;
					msg.className = 'tauras-form__msg is-ok';
					form.classList.add('is-sent');
					form.dispatchEvent(new CustomEvent('tauras:sent'));
				})
				.catch(function () {
					msg.textContent = 'Нет связи с сервером. Попробуйте ещё раз или позвоните нам.';
					msg.className = 'tauras-form__msg is-error';
				})
				.finally(function () { btn.disabled = false; btn.classList.remove('is-loading'); });
		});
	}

	/* ---------- Яндекс SmartCaptcha (если ключ задан) ---------- */
	function initCaptcha() {
		var boxes = document.querySelectorAll('.tauras-captcha');
		if (!T.captcha || !boxes.length) return;
		window.taurasCaptchaReady = function () {
			boxes.forEach(function (b) { if (!b.dataset.ready) { b.dataset.ready = 1; window.smartCaptcha.render(b, { sitekey: T.captcha, hl: 'ru' }); } });
		};
		var s = document.createElement('script');
		s.src = 'https://smartcaptcha.yandexcloud.net/captcha.js?render=onload&onload=taurasCaptchaReady';
		s.defer = true;
		document.head.appendChild(s);
	}

	/* ---------- Всплывающие окна ---------- */
	var isMobile = window.matchMedia('(max-width: 720px)').matches;
	var shownThisPage = false;

	function canShow(cfg) {
		if (cfg.devices === 'desktop' && isMobile) return false;
		if (cfg.devices === 'mobile' && !isMobile) return false;
		if (cfg.noLead && store.get('lead')) return false;
		var st = store.get('popup_' + cfg.id) || {};
		if (st.v !== cfg.v) st = {}; // окно поменяли в админке — начинаем заново
		if (cfg.max && (st.n || 0) >= cfg.max) return false;
		if (st.closed && cfg.repeat > 0 && Date.now() - st.closed < cfg.repeat * 864e5) return false;
		return true;
	}

	function open(cfg, force) {
		if (shownThisPage || (!force && !canShow(cfg))) return;
		var el = document.getElementById('tp-popup-' + cfg.id);
		if (!el) return;
		shownThisPage = true;
		var st = store.get('popup_' + cfg.id) || {};
		if (st.v !== cfg.v) st = { v: cfg.v };
		st.n = (st.n || 0) + 1;
		if (!st.first) st.first = Date.now();
		store.set('popup_' + cfg.id, st);
		el.hidden = false;
		document.documentElement.classList.add('tp-open');
		requestAnimationFrame(function () { el.classList.add('is-visible'); });
		goal(cfg.goal + '_show');
		startTimer(el, cfg, st.first);
		var focusable = el.querySelector('input, button');
		if (focusable) setTimeout(function () { focusable.focus({ preventScroll: true }); }, 300);

		function close() {
			el.classList.remove('is-visible');
			document.documentElement.classList.remove('tp-open');
			setTimeout(function () { el.hidden = true; }, 250);
			var s = store.get('popup_' + cfg.id) || {};
			s.closed = Date.now();
			store.set('popup_' + cfg.id, s);
			document.removeEventListener('keydown', onKey);
		}
		function onKey(e) { if (e.key === 'Escape') close(); }
		el.querySelectorAll('[data-tp-close]').forEach(function (b) { b.addEventListener('click', close); });
		el.querySelectorAll('[data-tp-goal]').forEach(function (b) { b.addEventListener('click', function () { goal(cfg.goal + '_click'); }); });
		document.addEventListener('keydown', onKey);
	}

	function startTimer(el, cfg, first) {
		var box = el.querySelector('[data-tp-timer]');
		if (!box || cfg.timer === 'none') return;
		var end = cfg.timer === 'date' || cfg.timer === 'until' ? cfg.until : first + cfg.timerMin * 6e4; // until — своя дата и час, date — конец показа окна
		if (!end) { box.hidden = true; return; }
		var pad = function (n) { return (n < 10 ? '0' : '') + n; };
		var cells = { d: box.querySelector('[data-d]'), h: box.querySelector('[data-h]'), m: box.querySelector('[data-m]'), s: box.querySelector('[data-s]') };
		(function tick() {
			var left = Math.max(0, Math.floor((end - Date.now()) / 1000));
			cells.d.textContent = pad(Math.floor(left / 86400));
			cells.h.textContent = pad(Math.floor(left % 86400 / 3600));
			cells.m.textContent = pad(Math.floor(left % 3600 / 60));
			cells.s.textContent = pad(left % 60);
			box.classList.toggle('no-days', left < 86400);
			if (left > 0) setTimeout(tick, 1000);
		})();
	}

	function initPopups() {
		var preview = parseInt(new URLSearchParams(location.search).get('tp_preview'), 10);
		(T.popups || []).forEach(function (cfg) {
			if (preview) { if (cfg.id === preview) open(cfg, true); return; } // предпросмотр из админки: сразу, без условий показа
			if (!canShow(cfg)) return;
			if (cfg.delay > 0) setTimeout(function () { open(cfg); }, cfg.delay * 1000);
			if (cfg.scroll > 0) {
				var onScroll = function () {
					var h = document.documentElement.scrollHeight - innerHeight;
					if (h > 0 && scrollY / h * 100 >= cfg.scroll) { removeEventListener('scroll', onScroll); open(cfg); }
				};
				addEventListener('scroll', onScroll, { passive: true });
			}
			if (cfg.exit && !isMobile) {
				document.addEventListener('mouseout', function onOut(e) {
					if (!e.relatedTarget && e.clientY <= 0) { document.removeEventListener('mouseout', onOut); open(cfg); }
				});
			}
		});
	}

	function init() {
		document.querySelectorAll('form[data-form]').forEach(initForm);
		initCaptcha();
		initPopups();
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
	window.TaurasForms = { init: initForm };
})();
