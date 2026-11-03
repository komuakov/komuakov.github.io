/* TAURAS FITNESS — поведение темы без jQuery: меню, окна с формами, плавающая кнопка, видео, просмотр фото, вкладки. */
(function () {
	'use strict';
	var $ = function (s, c) { return (c || document).querySelector(s); };
	// прилипание карточек в лентах — только после первого действия посетителя (см. theme.css, «NO_LCP»)
	['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (ev) { addEventListener(ev, function () { document.documentElement.classList.add('tf-snap'); }, { once: true, passive: true }); });
	var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

	/* Как на старом сайте: на экранах уже 1023px меню переезжает в строку шапки (рядом с логотипом) */
	var topMenu = $('.top-menu-block'), headerBlock = $('.header-block'), header = $('.header');
	function placeMenu() {
		if (!topMenu || !headerBlock || !header) return;
		if (window.innerWidth < 1023) {
			if (topMenu.parentElement !== headerBlock) headerBlock.insertBefore(topMenu, $('.action', headerBlock) || $('.header-right-block', headerBlock));
		} else if (topMenu.parentElement !== header) {
			header.appendChild(topMenu);
		}
	}
	placeMenu();
	window.addEventListener('resize', placeMenu, { passive: true });

	/* Гамбургер и выпадающее меню (на телефоне подменю раскрывается по тапу) */
	// Как на старом сайте: body.left_bl сдвигает страницу на 320px и открывает меню слева, #overlay затемняет остальное.
	var overlay = document.getElementById('overlay');
	if (!overlay) {
		overlay = document.createElement('div');
		overlay.id = 'overlay';
		overlay.hidden = true;
		document.body.appendChild(overlay);
	}
	function setMenu(on) {
		$$('.c-hamburger').forEach(function (b) {
			b.classList.toggle('is-active', on);
			b.setAttribute('aria-expanded', on ? 'true' : 'false');
			var block = b.closest('.top-menu-block');
			if (block) block.classList.toggle('active', on);
		});
		document.body.classList.toggle('left_bl', on);
		document.documentElement.classList.toggle('tf-menu-open', on);
		overlay.hidden = !on;
		overlay.style.display = on ? 'block' : 'none';
	}
	$$('.c-hamburger').forEach(function (b) {
		b.addEventListener('click', function (e) {
			e.preventDefault();
			setMenu(!b.classList.contains('is-active'));
		});
	});
	overlay.addEventListener('click', function () { setMenu(false); });
	document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('left_bl')) setMenu(false); });
	window.addEventListener('resize', function () { if (window.innerWidth > 1022 && document.body.classList.contains('left_bl')) setMenu(false); });
	// Телефон/планшет: пункт с подменю раскрывается по нажатию (аккордеон), открыт только один;
	// первым в подменю — ссылка на сам раздел («Все: …»), если у пункта есть своя страница.
	$$('.top-menu > ul > li.parent').forEach(function (li) {
		var a = li.querySelector(':scope > a'), sub = li.querySelector(':scope > .menu');
		if (!a || !sub) return;
		var href = a.getAttribute('href') || '';
		if (href && href !== '#' && !sub.querySelector('.tf-sub-all')) {
			var all = document.createElement('li');
			all.className = 'tf-sub-all';
			all.innerHTML = '<a href="' + a.href + '">Все: ' + a.textContent.trim() + '</a>';
			sub.insertBefore(all, sub.firstChild);
		}
		a.setAttribute('aria-expanded', 'false');
		a.addEventListener('click', function (e) {
			if (window.innerWidth >= 1023) return; // на компьютере — как раньше: подменю по наведению, клик ведёт на страницу
			e.preventDefault();
			var open = !li.classList.contains('is-open');
			$$('.top-menu > ul > li.parent.is-open').forEach(function (o) { if (o !== li) { o.classList.remove('is-open'); o.querySelector(':scope > a').setAttribute('aria-expanded', 'false'); } });
			li.classList.toggle('is-open', open);
			a.setAttribute('aria-expanded', open ? 'true' : 'false');
		});
	});
	var sub = $('.top-menu-block .substrate');
	$$('.top-menu > ul > li.parent').forEach(function (li) {
		li.addEventListener('mouseenter', function () { if (sub && window.innerWidth > 1024) sub.classList.add('active'); });
		li.addEventListener('mouseleave', function () { if (sub) sub.classList.remove('active'); });
	});

	/* Окна с формами: ссылки #form-КЛЮЧ / data-tf-modal="КЛЮЧ" */
	function openModal(key) {
		var d = document.getElementById('tf-modal-' + key);
		if (!d) return false;
		if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
		var f = d.querySelector('input:not([type=hidden]):not(.tauras-hp)');
		if (f) setTimeout(function () { f.focus(); }, 50);
		return true;
	}
	document.addEventListener('click', function (e) {
		var a = e.target.closest('[data-tf-modal], a[href^="#form-"]');
		if (a) {
			var key = a.getAttribute('data-tf-modal') || a.getAttribute('href').slice(6);
			// data-tf-interest="Аква + Фитнес · «Полный»" — что выбрал человек: подпись в окне и строка «Интересует» в заявке
			var md = document.getElementById('tf-modal-' + key);
			if (md) {
				var want = a.getAttribute('data-tf-interest') || '', fm = md.querySelector('form'), sub = md.querySelector('.tf-modal__interest');
				if (fm) { var hi = fm.querySelector('input[name="f[_interest]"]'); if (!hi) { hi = document.createElement('input'); hi.type = 'hidden'; hi.name = 'f[_interest]'; fm.appendChild(hi); } hi.value = want; }
				if (!sub) { sub = document.createElement('div'); sub.className = 'tf-modal__interest'; var h = md.querySelector('.h3'); if (h) h.after(sub); }
				// посетителю — без служебной приставки «Баннер:», цены и номера не рвутся (29 900 ₽ — неразрывно)
				sub.textContent = want.replace(/^(Баннер|Акция):\s*/, '').replace(/(\d)\s+(?=\d{3}\b)/g, '$1\u00A0').replace(/(\d)\s*(₽|руб\.?)/g, '$1\u00A0$2'); sub.hidden = !want;
			}
			if (openModal(key)) e.preventDefault();
			return;
		}
		var x = e.target.closest('[data-tf-close]');
		if (x) { var d = x.closest('dialog'); if (d) d.close(); return; }
		if (e.target.tagName === 'DIALOG' && e.target.classList.contains('tf-modal')) e.target.close(); // клик по фону
	});
	if (/^#form-/.test(location.hash)) openModal(location.hash.slice(6));

	/* Плавающая кнопка связи */
	var fb = $('[data-tf-float]');
	if (fb) {
		var menu = $('.tf-float__menu');
		var setFloat = function (open) { menu.hidden = !open; fb.setAttribute('aria-expanded', open ? 'true' : 'false'); fb.classList.toggle('is-open', open); };
		fb.addEventListener('click', function () { setFloat(menu.hidden); });
		// Закрываем меню: крестиком, выбором пункта (окно с формой открывается поверх), тапом мимо, Esc
		menu.addEventListener('click', function (e) { if (e.target.closest('[data-tf-float-close], a')) setFloat(false); });
		document.addEventListener('click', function (e) { if (!menu.hidden && !e.target.closest('.tf-float')) setFloat(false); });
		document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setFloat(false); });
	}

	/* Видео YouTube: плеер грузится только по клику (не тормозит страницу) */
	document.addEventListener('click', function (e) {
		var b = e.target.closest('.tf-video__play');
		if (b) {
			var box = b.parentElement, id = box.getAttribute('data-youtube');
			box.innerHTML = '<iframe src="https://www.youtube.com/embed/' + id + '?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Видео"></iframe>';
			return;
		}
		var v = e.target.closest('[data-tf-video-url]');
		if (v) {
			// окно с видео: шапка с названием, плеер 16:9 (запуск сразу), под ним — запись на экскурсию
			var url = v.getAttribute('data-tf-video-url');
			if (!/[?&]autoplay=/.test(url)) url += (url.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1';
			var title = (v.getAttribute('data-tf-video-title') || v.textContent || 'Видео').trim();
			var esc = function (t) { var x = document.createElement('div'); x.textContent = t; return x.innerHTML; };
			var d = document.createElement('dialog');
			d.className = 'tf-vmodal';
			d.setAttribute('aria-label', title);
			d.innerHTML = '<div class="tf-vmodal__box"><div class="tf-vmodal__head"><span class="tf-vmodal__dot" aria-hidden="true"></span><b>' + esc(title) + '</b>'
				+ '<button type="button" class="tf-vmodal__x" data-tf-close aria-label="Закрыть"></button></div>'
				+ '<div class="tf-vmodal__frame"><iframe src="' + url + '" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen title="' + esc(title) + '"></iframe></div>'
				+ '<div class="tf-vmodal__foot"><span>Понравилось? Приходите посмотреть клуб вживую — экскурсия бесплатно.</span>'
				+ '<a class="btn btn_app tf-vmodal__cta" href="#form-ekskursiya" data-tf-modal="ekskursiya">Записаться на экскурсию</a>'
				+ '</div></div>';
			document.body.appendChild(d);
			d.addEventListener('close', function () { d.remove(); });
			d.addEventListener('click', function (k) { if (k.target === d) d.close(); }); // клик по затемнению — закрыть
			d.querySelector('.tf-vmodal__cta').addEventListener('click', function () { d.close(); });
			d.showModal();
		}
	});

	/* Схема клуба: вкладки этажей (+ адрес #etazh-N), точка ↔ зона в списке подсвечиваются вместе, нажатие на точку — фото зоны */
	(function () {
		var tabs = $$('[data-tf-sk-tab]');
		if (!tabs.length) return;
		var floors = $$('[data-tf-sk-floor]');
		function show(n, push) {
			tabs.forEach(function (t, i) { t.setAttribute('aria-selected', i === n ? 'true' : 'false'); });
			floors.forEach(function (f, i) { f.hidden = i !== n; });
			if (push) history.replaceState(null, '', '#etazh-' + (n + 1));
		}
		tabs.forEach(function (t, i) { t.addEventListener('click', function () { show(i, true); }); });
		var h = location.hash.match(/^#etazh-(\d+)$/);
		if (h && floors[h[1] - 1]) show(h[1] - 1);
		floors.forEach(function (f) {
			var mark = function (i, on) { $$('[data-tf-sk-i="' + i + '"]', f).forEach(function (x) { x.classList.toggle('is-hl', on); }); };
			$$('[data-tf-sk-i]', f).forEach(function (el) {
				var i = el.getAttribute('data-tf-sk-i');
				el.addEventListener('mouseenter', function () { mark(i, true); });
				el.addEventListener('mouseleave', function () { mark(i, false); });
				if (el.classList.contains('tf-sk__pin')) el.addEventListener('click', function () { var a = f.querySelector('a.tf-sk__zone[data-tf-sk-i="' + i + '"]'); if (a) a.click(); });
			});
		});
	})();

	/* Ленты-слайдеры [data-tf-scroller] (педагоги, отзывы): лента листается пальцем; под лентой переключатель .tf-nav —
	   слева «2 / 5», справа стрелки, ниже точки (страница = ширина ленты); прячется, если всё помещается */
	$$('[data-tf-scroller]').forEach(function (track) {
		var box = document.createElement('div');
		box.className = 'tf-sc';
		track.parentNode.insertBefore(box, track);
		box.appendChild(track);
		track.classList.add('tf-sc__track');
		var nav = document.createElement('div');
		nav.className = 'tf-nav tf-sc__nav' + (track.closest('.tf-tr__reviews') ? '' : ' tf-nav--light'); // отзывы — на тёмном фоне
		nav.innerHTML = '<span class="tf-nav__count" aria-live="polite"></span><div class="tf-nav__arrows"></div><div class="tf-nav__dots"></div>';
		box.appendChild(nav);
		var arrows = $('.tf-nav__arrows', nav), bar = $('.tf-nav__dots', nav), cnt = $('.tf-nav__count', nav);
		var mk = function (dir, label) { var b = document.createElement('button'); b.type = 'button'; b.className = 'tf-nav__arrow tf-nav__arrow--' + dir; b.setAttribute('aria-label', label); arrows.appendChild(b); return b; };
		var prev = mk('prev', 'Назад'), next = mk('next', 'Вперёд');
		var pages = 1, cur = 0;
		var step = function () { var it = track.firstElementChild; if (!it) return track.clientWidth; var gap = parseFloat(getComputedStyle(track).columnGap) || 0; return Math.max(it.getBoundingClientRect().width + gap, Math.floor((track.clientWidth + gap) / (it.getBoundingClientRect().width + gap)) * (it.getBoundingClientRect().width + gap)); };
		function build() {
			pages = Math.max(1, Math.ceil((track.scrollWidth - 4) / track.clientWidth));
			box.classList.toggle('is-static', pages < 2);
			bar.innerHTML = '';
			for (var i = 0; i < pages; i++) { var d = document.createElement('button'); d.type = 'button'; d.setAttribute('aria-label', 'Страница ' + (i + 1)); (function (n) { d.onclick = function () { track.scrollTo({ left: n * step(), behavior: 'smooth' }); }; })(i); bar.appendChild(d); }
			sync();
		}
		function sync() {
			var max = track.scrollWidth - track.clientWidth;
			cur = max <= 0 ? 0 : Math.min(pages - 1, Math.round(track.scrollLeft / max * (pages - 1)));
			$$('button', bar).forEach(function (d, i) { d.classList.toggle('is-on', i === cur); });
			cnt.innerHTML = '<b>' + (cur + 1) + '</b> / ' + pages;
			prev.disabled = track.scrollLeft < 4; next.disabled = track.scrollLeft > max - 4;
		}
		prev.onclick = function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); };
		next.onclick = function () { track.scrollBy({ left: step(), behavior: 'smooth' }); };
		track.addEventListener('scroll', function () { window.requestAnimationFrame(sync); }, { passive: true });
		window.addEventListener('resize', build);
		build();
	});
	/* Фотогалереи [tauras_gallery template="slider"] (UIkit slider): номер текущего фото в «1 / N» под лентой */
	$$('[data-tf-gal]').forEach(function (g) {
		var items = $$('.uk-slider-items > li', g), b = $('.tf-nav__count b', g);
		if (b) g.addEventListener('itemshow', function (e) { var i = items.indexOf(e.target); if (i > -1) b.textContent = i + 1; });
	});
	/* Точки на схемах (детский сад и др., UIkit uk-marker): вместо маленького окошка — сразу фото на весь экран */
	document.addEventListener('click', function (e) {
		var m = e.target.closest('[uk-marker]');
		if (!m) return;
		var drop = m.nextElementSibling, a = drop && drop.querySelector('a.scheme-marker[data-tf-lightbox]');
		if (!a) return;
		e.preventDefault(); e.stopPropagation();
		a.click();
	}, true);

	/* Правила клуба: в оглавлении подсвечивается раздел, который сейчас читают; на телефоне оглавление свёрнуто */
	(function () {
		var toc = $('.tf-rules__toc');
		if (!toc) return;
		if (window.innerWidth < 768) toc.open = false;
		var links = $$('a', toc);
		$$('a', toc).forEach(function (a) { a.addEventListener('click', function () { if (window.innerWidth < 768) toc.open = false; }); });
		if (!('IntersectionObserver' in window)) return;
		var io = new IntersectionObserver(function (es) {
			es.forEach(function (x) {
				if (!x.isIntersecting) return;
				links.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + x.target.id); });
			});
		}, { rootMargin: '-20% 0px -70% 0px' });
		$$('.tf-rules__sec').forEach(function (s) { io.observe(s); });
	})();

	/* Страница тренера: «▶ Видео» — ролик со звуком на месте фото */
	document.addEventListener('click', function (e) {
		var b = e.target.closest('[data-tf-tr-video]');
		if (!b) return;
		var v = document.createElement('video');
		v.src = b.getAttribute('data-tf-tr-video'); v.controls = true; v.autoplay = true; v.playsInline = true;
		b.parentNode.appendChild(v); b.remove(); v.play && v.play().catch(function () {});
	});

	/* Фото клуба: «Показать ещё» открывает остальные фото альбома */
	document.addEventListener('click', function (e) {
		var b = e.target.closest('[data-tf-ph-more]');
		if (!b) return;
		$$('.tf-ph__item[hidden]').forEach(function (a) { a.hidden = false; });
		b.parentNode.remove();
	});

	/* Отзыв в ленте: длинный текст свёрнут, «Читать полностью» раскрывает */
	document.addEventListener('click', function (e) {
		var b = e.target.closest('[data-tf-review-more]');
		if (!b) return;
		var r = b.closest('.tauras-review'), open = r.classList.toggle('is-open');
		b.textContent = open ? 'Свернуть' : 'Читать полностью';
	});

	/* Просмотр фото на весь экран */
	document.addEventListener('click', function (e) {
		var a = e.target.closest('a[data-tf-lightbox]');
		if (!a) return;
		e.preventDefault();
		var group = $$('a[data-tf-lightbox="' + a.getAttribute('data-tf-lightbox') + '"]'), i = group.indexOf(a);
		var d = document.createElement('dialog');
		d.className = 'tf-lightbox';
		// фото по центру экрана, под ним подпись (название зоны/фото) и «3 / 21»; листание стрелками, клавишами и свайпом
		d.innerHTML = '<button type="button" class="tf-modal__x" data-tf-close aria-label="Закрыть">×</button><figure class="tf-lightbox__fig"><img alt=""><figcaption><b></b><span></span></figcaption></figure>'
			+ (group.length > 1 ? '<button type="button" class="tf-lightbox__prev" aria-label="Назад">‹</button><button type="button" class="tf-lightbox__next" aria-label="Вперёд">›</button>' : '');
		var img = d.querySelector('img'), cap = d.querySelector('figcaption b'), cnt = d.querySelector('figcaption span');
		var show = function (n) {
			i = (n + group.length) % group.length;
			img.src = group[i].href;
			var t = group[i].getAttribute('data-tf-caption') || (group[i].querySelector('img') || {}).alt || group[i].getAttribute('title') || '';
			img.alt = t; cap.textContent = t; cnt.textContent = group.length > 1 ? (i + 1) + ' / ' + group.length : '';
		};
		var sx = null;
		d.addEventListener('touchstart', function (t) { sx = t.touches[0].clientX; }, { passive: true });
		d.addEventListener('touchend', function (t) { if (sx === null) return; var dx = t.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); sx = null; });
		d.addEventListener('click', function (k) { if (k.target === d || k.target.classList.contains('tf-lightbox__fig')) d.close(); });
		if (group.length > 1) {
			d.querySelector('.tf-lightbox__prev').onclick = function () { show(i - 1); };
			d.querySelector('.tf-lightbox__next').onclick = function () { show(i + 1); };
		}
		d.addEventListener('keydown', function (k) { if (k.key === 'ArrowLeft') show(i - 1); if (k.key === 'ArrowRight') show(i + 1); });
		d.addEventListener('close', function () { d.remove(); });
		document.body.appendChild(d);
		show(i);
		d.showModal();
	});

	/* Карточки тренеров: на компьютере при наведении на фото играет беззвучный ролик (как на старом сайте) */
	if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
		document.addEventListener('mouseover', function (e) {
			var box = e.target.closest && e.target.closest('.shop_img.is-video');
			if (!box || box.contains(e.relatedTarget)) return;
			var v = box.querySelector('.shop-item__video');
			if (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
		});
		document.addEventListener('mouseout', function (e) {
			var box = e.target.closest && e.target.closest('.shop_img.is-video');
			if (!box || box.contains(e.relatedTarget)) return;
			var v = box.querySelector('.shop-item__video');
			if (v) v.pause();
		});
	}

	/* Телефон: ролик тренера играет, пока палец удерживает фото; отпустили — пауза (карточка при этом не открывается).
	   Короткий тап — открывает карточку, прокрутка — ролик не запускает. */
	(function () {
		var timer = 0, active = null, suppress = false, startY = 0;
		var stop = function () {
			clearTimeout(timer);
			if (active) {
				var v = active.querySelector('.shop-item__video');
				if (v) v.pause();
				active.classList.remove('is-playing');
				active = null;
				suppress = true; // это было удержание — переход по ссылке не нужен
				setTimeout(function () { suppress = false; }, 400);
			}
		};
		document.addEventListener('touchstart', function (e) {
			var box = e.target.closest && e.target.closest('.shop_img.is-video');
			if (!box || e.touches.length > 1) return;
			startY = e.touches[0].clientY;
			timer = setTimeout(function () {
				var v = box.querySelector('.shop-item__video');
				if (!v) return;
				active = box;
				box.classList.add('is-playing');
				var p = v.play();
				if (p && p.catch) p.catch(function () {});
			}, 200);
		}, { passive: true });
		document.addEventListener('touchmove', function (e) {
			if (!active && Math.abs(e.touches[0].clientY - startY) > 10) clearTimeout(timer);
		}, { passive: true });
		document.addEventListener('touchend', stop);
		document.addEventListener('touchcancel', stop);
		document.addEventListener('click', function (e) {
			if (suppress && e.target.closest && e.target.closest('.shop_img.is-video')) { e.preventDefault(); e.stopPropagation(); }
		}, true);
		document.addEventListener('contextmenu', function (e) {
			if (e.target.closest && e.target.closest('.shop_img.is-video')) e.preventDefault();
		});
	})();

	/* «Показать ещё» (как на старом сайте): подгружает следующую страницу ленты/команды и дописывает карточки */
	document.addEventListener('click', function (e) {
		var btn = e.target.closest('[data-tf-more]');
		if (!btn) return;
		e.preventDefault();
		var list = $('.news_list .uk-scope, .shop_list .shop-pane');
		if (!list) { location.href = btn.href; return; }
		btn.classList.add('is-loading');
		fetch(btn.href, { credentials: 'same-origin' }).then(function (r) { return r.text(); }).then(function (html) {
			var doc = new DOMParser().parseFromString(html, 'text/html');
			var next = doc.querySelector('.news_list .uk-scope, .shop_list .shop-pane');
			if (next) $$(':scope > *', next).forEach(function (el) { list.appendChild(document.importNode(el, true)); });
			var oldMore = btn.parentElement, newMore = doc.querySelector('.paginator_more'), oldPag = $('.paginator'), newPag = doc.querySelector('.paginator');
			if (oldPag && newPag) oldPag.replaceWith(document.importNode(newPag, true));
			if (newMore) oldMore.replaceWith(document.importNode(newMore, true)); else oldMore.remove();
			if (history.replaceState) history.replaceState(null, '', btn.href);
		}).catch(function () { location.href = btn.href; });
	});

	/* Фильтр команды: применяется сразу при отметке галочки (как на старом сайте — без кнопки) */
	$$('form[data-tf-autosubmit]').forEach(function (f) {
		if (f.closest('[data-tf-tm-wrap]')) return; // «Наша команда» — обновление на месте (ниже)
		f.addEventListener('change', function () { f.submit(); });
	});
	// «Наша команда»: галочка фильтра — список обновляется на месте, без перезагрузки и прыжка наверх; адрес в строке меняется
	document.addEventListener('change', function (e) {
		var f = e.target.closest('[data-tf-tm-wrap] form[data-tf-autosubmit]');
		if (!f || !window.fetch) { if (f) f.submit(); return; }
		var wrap = f.closest('[data-tf-tm-wrap]');
		var url = f.action.split('?')[0].replace(/page\d+\/?$/, '') + '?' + new URLSearchParams(new FormData(f)).toString();
		url = url.replace(/\?$/, '');
		var open = f.classList.contains('is-open');
		wrap.classList.add('is-loading');
		fetch(url, { credentials: 'same-origin' }).then(function (r) { return r.text(); }).then(function (html) {
			var doc = new DOMParser().parseFromString(html, 'text/html'), fresh = doc.querySelector('[data-tf-tm-wrap]');
			if (!fresh) { location.href = url; return; }
			wrap.innerHTML = fresh.innerHTML;
			$$('[data-tf-bg]', wrap).forEach(function (el) { el.style.backgroundImage = 'url(' + JSON.stringify(el.getAttribute('data-tf-bg')) + ')'; el.removeAttribute('data-tf-bg'); });
			var nf = $('.tf-tm__filter', wrap); if (nf && open) { nf.classList.add('is-open'); var t = $('[data-tf-tm-toggle]', nf); if (t) t.setAttribute('aria-expanded', 'true'); }
			history.replaceState(null, '', url);
			wrap.classList.remove('is-loading');
		}).catch(function () { location.href = url; });
	});
	// «Наша команда»: на телефоне фильтр раскрывается кнопкой «Подобрать тренера»
	document.addEventListener('click', function (e) {
		var b = e.target.closest('[data-tf-tm-toggle]');
		if (!b) return;
		var f = b.closest('.tf-tm__filter'), open = f.classList.toggle('is-open');
		b.setAttribute('aria-expanded', open ? 'true' : 'false');
	});

	/* Галерея раздела на «Фитнес услуги и секции»: стрелки, миниатюры, свайп пальцем */
	$$('[data-tf-catgal]').forEach(function (g) {
		var items = $$('.shop_cat__images_big-item', g), thumbs = g.nextElementSibling && g.nextElementSibling.classList.contains('tf-cat-gal__thumbs') ? $$('.tf-cat-gal__thumb', g.nextElementSibling) : [], cnt = $('.tf-cat-gal__count span', g), i = 0;
		var vbtn = g.nextElementSibling ? $('.tf-cat-gal__thumb--video', g.nextElementSibling) : null;
		if (vbtn) vbtn.addEventListener('click', function () { // видео — в рамке фото
			var f = g.querySelector('.tf-yt__frame');
			if (!f) {
				f = document.createElement('iframe');
				f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(vbtn.getAttribute('data-yt')) + '?autoplay=1&rel=0';
				f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture'; f.allowFullscreen = true; f.title = vbtn.getAttribute('aria-label') || 'Видео';
				f.className = 'tf-yt__frame tf-cat-gal__video';
				g.appendChild(f);
			}
			g.classList.add('is-video');
			thumbs.forEach(function (t) { t.classList.toggle('active', t === vbtn); });
		});
		if (items.length < 2 && !vbtn) return;
		var show = function (n) {
			var f = g.querySelector('.tf-cat-gal__video'); if (f) f.remove(); g.classList.remove('is-video');
			i = (n + items.length) % items.length;
			items.forEach(function (it, k) { it.hidden = k !== i; });
			thumbs.forEach(function (t, k) { t.classList.toggle('active', k === i); });
			if (cnt) cnt.textContent = i + 1;
		};
		$$('.tf-cat-gal__nav', g).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); show(i + +b.getAttribute('data-dir')); }); });
		thumbs.forEach(function (t, k) { if (!t.hasAttribute('data-yt')) t.addEventListener('click', function () { show(k); }); });
		var x0 = null;
		g.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
		g.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); x0 = null; });
	});
	/* Длинный текст раздела: показываем часть, «Читать полностью» / «Свернуть» */
	$$('[data-tf-clamp]').forEach(function (el) {
		var btn = document.createElement('button');
		btn.type = 'button'; btn.className = 'tf-clamp__btn'; btn.textContent = 'Читать полностью';
		el.after(btn);
		var check = function () { btn.hidden = !el.classList.contains('is-open') && el.scrollHeight <= el.clientHeight + 4; el.classList.toggle('is-clamped', !btn.hidden && !el.classList.contains('is-open')); };
		btn.addEventListener('click', function () { var o = el.classList.toggle('is-open'); btn.textContent = o ? 'Свернуть' : 'Читать полностью'; check(); });
		window.addEventListener('resize', check); check();
		document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.shop_cat__preview')) setTimeout(check, 50); });
	});
	/* Слайдер акций/новостей на главной: стрелки, точки, счётчик «N / всего», свайп (прокрутка с привязкой) */
	$$('[data-tf-ps]').forEach(function (box) {
		var track = $('.tf-ps__track', box), items = $$('.tf-ps__item', track), dots = $$('.tf-ps__dots button', box),
			prev = $('.tf-ps__btn--prev', box), next = $('.tf-ps__btn--next', box), cnt = $('.tf-ps__count b', box);
		if (items.length < 2) return;
		var step = function () { return items[1].offsetLeft - items[0].offsetLeft; };
		var perView = function () { return Math.max(1, Math.round(track.clientWidth / step())); };
		var cur = function () { return Math.round(track.scrollLeft / step()); };
		var go = function (i) { track.scrollTo({ left: Math.max(0, Math.min(i, items.length - 1)) * step(), behavior: 'smooth' }); };
		var sync = function () {
			var i = cur(), pv = perView(), last = items.length - pv;
			if (cnt) cnt.textContent = pv > 1 ? (i + 1) + '–' + Math.min(i + pv, items.length) : i + 1;
			dots.forEach(function (d, k) { d.classList.toggle('is-on', k >= i && k < i + pv); });
			if (prev) prev.disabled = i <= 0;
			if (next) next.disabled = i >= last;
			box.classList.toggle('is-static', last <= 0); // всё помещается — стрелки и точки не нужны
		};
		if (prev) prev.addEventListener('click', function () { go(cur() - perView()); });
		if (next) next.addEventListener('click', function () { go(cur() + perView()); });
		dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
		track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(cur() + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur() - 1); } });
		var t; track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(sync, 60); }, { passive: true });
		window.addEventListener('resize', sync); sync();
	});

	/* Страница направления: нижняя панель «Записаться» на телефоне (видна, когда кнопка в карточке ушла с экрана, а форма ещё не видна);
	   подсветка пункта навигации по странице */
	(function () {
		var bar = $('[data-tf-prog-bar]'), cta = $('.tf-prog__cta'), form = document.getElementById('tf-signup');
		if (bar && cta && form) { // по прокрутке: кнопка в карточке ушла вверх и форма не на экране
			var upd = function () {
				var c = cta.getBoundingClientRect(), f = form.getBoundingClientRect(), h = innerHeight;
				var show = innerWidth <= 641 && c.bottom < 0 && !(f.top < h && f.bottom > 0);
				if (bar.hidden === show) { bar.hidden = !show; document.body.classList.toggle('tf-has-bar', show); }
			};
			var tk = false; window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; upd(); }); } }, { passive: true });
			window.addEventListener('resize', upd); upd();
		}
		var links = $$('.tf-prog__nav a');
		if (links.length && 'IntersectionObserver' in window) {
			var io = new IntersectionObserver(function (es) {
				es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + e.target.id); }); });
			}, { rootMargin: '-40% 0px -55% 0px' });
			links.forEach(function (a) { var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) io.observe(t); });
		}
	})();

	/* Главный слайдер: панель под картинкой — кнопки текущего слайда, счётчик, полоски с прогрессом автопрокрутки */
	$$('[data-tf-hs]').forEach(function (hs) {
		var items = $$('.uk-slideshow-items > li', hs), acts = $$('.tf-hs__act', hs), dots = $$('.tf-hs__dots button', hs), cnt = $('.tf-hs__count b', hs);
		var set = function (i) {
			acts.forEach(function (a, k) { a.classList.toggle('is-on', k === i); a.setAttribute('aria-hidden', k === i ? 'false' : 'true'); $$('a', a).forEach(function (l) { l.tabIndex = k === i ? 0 : -1; }); });
			dots.forEach(function (d, k) { d.classList.remove('is-on'); void d.offsetWidth; d.classList.toggle('is-on', k === i); d.classList.toggle('is-done', k < i); });
			if (cnt) cnt.textContent = i + 1;
		};
		hs.addEventListener('itemshow', function (e) { var i = items.indexOf(e.target); if (i > -1) set(i); });
		hs.addEventListener('mouseenter', function () { hs.classList.add('is-paused'); });
		hs.addEventListener('mouseleave', function () { hs.classList.remove('is-paused'); });
	});

	/* «Абонементы»: вкладки тарифов; нижняя панель «Узнать цены» на телефоне, когда форма вверху ушла с экрана */
	$$('[data-tf-ab-tabs]').forEach(function (t) {
		var bs = $$('[data-tab]', t), ps = $$('[data-pane]', t);
		bs.forEach(function (b) { b.addEventListener('click', function () { var n = b.getAttribute('data-tab'); bs.forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', x === b); }); ps.forEach(function (p) { var on = p.getAttribute('data-pane') === n; p.hidden = !on; p.classList.toggle('is-on', on); }); }); });
	});
	(function () {
		var bar = $('[data-tf-ab-bar]'), f = document.getElementById('tf-ab-form') || document.getElementById('tf-pr-form') || document.getElementById('tf-kg-form');
		if (!bar || !f) return;
		var upd = function () { var r = f.getBoundingClientRect(), show = innerWidth <= 641 && r.bottom < 0; if (bar.hidden === show) { bar.hidden = !show; document.body.classList.toggle('tf-has-bar', show); } };
		window.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
	})();

	/* Сервисные страницы (body.tf-doc-page): реквизиты — строки «Название: значение» с кнопкой «Скопировать»,
	   ссылки на PDF/DOC — плитки файлов, у длинных текстов — оглавление по заголовкам */
	(function () {
		if (!document.body.classList.contains('tf-doc-page')) return;
		var text = $('.content .text'); if (!text) return;
		var copy = function (val, btn) {
			var done = function () { var t = btn.textContent; btn.textContent = 'Скопировано ✓'; btn.classList.add('is-done'); setTimeout(function () { btn.textContent = t; btn.classList.remove('is-done'); }, 1600); };
			if (navigator.clipboard) navigator.clipboard.writeText(val).then(done, function () {}); else { var a = document.createElement('textarea'); a.value = val; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) {} a.remove(); }
		};
		if (document.body.classList.contains('tf-doc--rekvizity')) {
			var ps = $$(':scope > p', text), all = [];
			var box = document.createElement('div'); box.className = 'tf-req';
			ps.forEach(function (p) {
				var t = p.textContent.replace(/\s+/g, ' ').trim(); if (!t) return;
				var m = t.match(/^([^:]{2,40}):\s*(.+)$/), row = document.createElement('div'); row.className = 'tf-req__row';
				var k = document.createElement('span'), v = document.createElement('b'), b = document.createElement('button');
				k.className = 'tf-req__k'; v.className = 'tf-req__v'; b.type = 'button'; b.className = 'tf-req__copy'; b.textContent = 'Скопировать';
				k.textContent = m ? m[1] : (/банк/i.test(t) ? 'Банк' : 'Получатель'); v.textContent = m ? m[2] : t; all.push(k.textContent + ': ' + v.textContent);
				b.addEventListener('click', function () { copy(v.textContent, b); });
				row.append(k, v, b); box.appendChild(row); p.remove();
			});
			var allBtn = document.createElement('button'); allBtn.type = 'button'; allBtn.className = 'btn btn_app tf-req__all'; allBtn.textContent = 'Скопировать все реквизиты';
			allBtn.addEventListener('click', function () { copy(all.join('\n'), allBtn); });
			text.prepend(box); box.after(allBtn);
		}
		$$('a[href]', text).forEach(function (a) {
			if (!/\.(pdf|docx?|xlsx?)(\?|$)/i.test(a.getAttribute('href'))) return;
			if (!a.textContent.trim()) { a.remove(); return; }
			a.classList.add('tf-file'); a.setAttribute('data-ext', (a.getAttribute('href').match(/\.(\w+)(\?|$)/) || [, 'PDF'])[1].toUpperCase());
			var s = document.createElement('span'); s.className = 'tf-file__sub'; s.textContent = 'Открыть документ'; a.appendChild(s);
			var p = a.closest('p'); if (p) p.classList.add('tf-file-wrap');
		});
		var hs = $$('h2, h3', text).filter(function (h) { return h.textContent.trim().length > 2; });
		if (hs.length >= 4) {
			var nav = document.createElement('nav'); nav.className = 'tf-toc'; nav.setAttribute('aria-label', 'Содержание');
			nav.innerHTML = '<div class="tf-toc__t">Содержание</div>';
			hs.forEach(function (h, i) { if (!h.id) h.id = 'p' + (i + 1); var l = document.createElement('a'); l.href = '#' + h.id; l.textContent = h.textContent.trim(); if (h.tagName === 'H3') l.className = 'is-sub'; nav.appendChild(l); });
			text.parentElement.classList.add('has-toc'); text.before(nav);
		}
	})();

	/* Видео на странице направления: по нажатию на обложку вставляем плеер с автозапуском (нажатие = разрешение браузера на звук) */
	document.addEventListener('click', function (e) {
		var b = e.target.closest('.tf-vplay[data-src]'); if (!b) return;
		var f = document.createElement('iframe');
		f.src = b.getAttribute('data-src'); f.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock'; f.allowFullscreen = true; f.setAttribute('frameborder', '0');
		f.title = b.getAttribute('aria-label') || 'Видео'; f.className = 'tf-vplay__frame';
		b.replaceWith(f);
	});

	/* Таймер акции: data-tf-countdown="ISO-дата окончания" */
	$$('[data-tf-countdown]').forEach(function (t) {
		var end = Date.parse(t.getAttribute('data-tf-countdown')), p = function (n) { return (n < 10 ? '0' : '') + n; };
		var tick = function () {
			var s = Math.max(0, Math.floor((end - Date.now()) / 1000));
			$('[data-d]', t).textContent = Math.floor(s / 86400); $('[data-h]', t).textContent = p(Math.floor(s % 86400 / 3600));
			$('[data-m]', t).textContent = p(Math.floor(s % 3600 / 60)); $('[data-s]', t).textContent = p(s % 60);
			if (!s) { t.hidden = true; clearInterval(iv); }
		};
		var iv = setInterval(tick, 1000); tick();
	});

	/* Формы: строка доверия под кнопкой (текст — «Тексты сайта», пусто — нет строки) */
	(function () {
		var t = document.body.getAttribute('data-tf-trust'); if (!t) return;
		$$('.custom_form .tauras-form').forEach(function (f) {
			if (f.closest('.tp-layout-envybox') || $('.tf-trust', f)) return;
			var b = $('.tauras-form__btn', f); if (!b) return;
			var d = document.createElement('div'); d.className = 'tf-trust';
			t.split('·').forEach(function (x) { x = x.trim(); if (x) { var s = document.createElement('span'); s.textContent = x; d.appendChild(s); } });
			b.after(d);
		});
	})();

	/* Детский сад: «Записаться в группу» — подставляет группу в форму первого экрана и прокручивает к ней */
	$$('[data-tf-kg-pick]').forEach(function (b) {
		b.addEventListener('click', function () {
			var f = document.querySelector('#tf-kg-form form'); if (!f) return;
			var hi = f.querySelector('input[name="f[_interest]"]'); if (hi) hi.value = 'Группа: ' + b.getAttribute('data-tf-kg-pick');
			var h = document.querySelector('#tf-kg-form .tf-kg__form-sub'); if (h) h.textContent = 'Вы выбрали: ' + b.getAttribute('data-tf-kg-pick');
			setTimeout(function () { var i = f.querySelector('input[type=text]'); if (i) i.focus({ preventScroll: true }); }, 600);
		});
	});

	/* Видео YouTube: плеер подгружается только по нажатию на обложку */
	$$('.tf-yt[data-yt]').forEach(function (b) {
		b.addEventListener('click', function () {
			var f = document.createElement('iframe');
			f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(b.getAttribute('data-yt')) + '?autoplay=1&rel=0';
			f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture'; f.allowFullscreen = true; f.title = b.getAttribute('aria-label') || 'Видео';
			f.className = 'tf-yt__frame';
			b.replaceWith(f);
		});
	});

	/* Первая страница каталога: клик по превью раскрывает подраздел (остальные сворачиваются) */
	$$('[data-tf-accordion]').forEach(function (list) {
		var cats = $$(':scope > .shop_cat', list);
		cats.forEach(function (c) {
			var p = $('.shop_cat__preview', c);
			if (!p) return;
			var open = function () { cats.forEach(function (x) { x.classList.toggle('active', x === c); x.classList.toggle('small', x !== c); }); };
			p.addEventListener('click', open);
			p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
		});
	});

	/* Галерея карточки услуги: клик по превью показывает большое фото */
	$$('[data-tf-show]').forEach(function (p) {
		p.addEventListener('click', function (e) {
			e.preventDefault();
			var n = +p.getAttribute('data-tf-show');
			$$('.shop-item-big-images .shop-item-image').forEach(function (a, i) { a.hidden = i !== n; a.classList.toggle('active', i === n); });
			$$('[data-tf-show]').forEach(function (q) { q.classList.toggle('active', q === p); });
		});
	});

	/* Слайдер «Клуб» на главной: по одному слайду, смена каждые 5 секунд */
	$$('[data-tf-rotate]').forEach(function (box) {
		var slides = $$('.slide', box), i = 0;
		if (slides.length < 2) return;
		var show = function () { slides.forEach(function (s, n) { s.hidden = n !== i; }); };
		show();
		setInterval(function () { if (!document.hidden) { i = (i + 1) % slides.length; show(); } }, 5000);
	});

	/* Ссылки на PDF-расписания: вторая строка-подпись под названием (оформление — CSS) */
	$$('.tabs__content a[href$=".pdf"]').forEach(function (a) {
		if ($('.tf-pdf-sub', a)) return;
		a.textContent = a.textContent.trim();
		var s = document.createElement('span'); s.className = 'tf-pdf-sub'; s.textContent = 'Открыть расписание · PDF';
		a.appendChild(s);
	});

	/* Вкладки старого сайта (ul.tabs__captions + div.tabs__content), например «Расписание / Расписание в PDF» */
	$$('ul.tabs__captions').forEach(function (ul) {
		var tabs = ul.closest('.tabs'), panes = $$(':scope > .tabs__content', tabs);
		// Виджет 1С стоит после вкладок — показываем его только на первой вкладке («Расписание»), на «Расписание в PDF» скрываем
		var cal = tabs.parentElement && $('[data-fit1c-calendar]', tabs.parentElement);
		$$('li', ul).forEach(function (li, n) {
			li.setAttribute('role', 'tab');
			li.tabIndex = 0;
			var act = function () {
				$$('li', ul).forEach(function (x) { x.classList.remove('active'); });
				li.classList.add('active');
				panes.forEach(function (p, m) { p.classList.toggle('active', m === n); });
				if (cal) cal.hidden = n !== 0;
			};
			li.addEventListener('click', act);
			li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
		});
		if (!$('li.active', ul) && $('li', ul)) $('li', ul).click();
		if (location.hash === '#pdf' && panes.some(function (p) { return $('a[href$=".pdf"]', p); })) { // /raspisanie/#pdf — сразу вкладка с PDF
			var k = panes.findIndex(function (p) { return $('a[href$=".pdf"]', p); }); if ($$('li', ul)[k]) $$('li', ul)[k].click();
		}
	});

	/* Подложка шапки при прокрутке, кнопка «Наверх» и плашка cookies — как на старом сайте */
	// Как на старом сайте: стоит прокрутить страницу — body.fixed (шапка получает тёмную подложку, пункты меню читаются на любом фоне) и появляется «Наверх»
	var up = $('.btn_top');
	var onScroll = function () {
		var scrolled = window.scrollY > 0;
		document.body.classList.toggle('fixed', scrolled);
		if (up) up.hidden = !scrolled;
	};
	window.addEventListener('scroll', onScroll, { passive: true });
	onScroll();
	if (up) up.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
	// Плашка cookies: пока она видна, кнопки «Наверх» и «Связаться» поднимаются над ней (не наезжают)
	var ck = document.getElementById('cookieNotice');
	var liftButtons = function () {
		var h = ck && !ck.hidden ? ck.offsetHeight : 0;
		document.documentElement.style.setProperty('--tf-cookie-h', h + 'px');
	};
	if (ck) {
		var accepted = false;
		try { accepted = !!localStorage.getItem('cookieAccepted'); } catch (e) {}
		ck.hidden = accepted;
		document.getElementById('cookieAcceptBtn').addEventListener('click', function () {
			try { localStorage.setItem('cookieAccepted', 'true'); } catch (e) {}
			ck.hidden = true;
			liftButtons();
		});
		liftButtons();
		window.addEventListener('resize', liftButtons);
	}

	/* Телефон: на узком экране нажатие на трубку открывает номер, мессенджеры и адрес; второй тап по номеру — звонок */
	var telA = $('.header-right-block .tel a'), telPop = document.getElementById('tf-tel-pop');
	if (telA && telPop) {
		var setTel = function (open) {
			telPop.hidden = !open;
			telA.setAttribute('aria-expanded', open ? 'true' : 'false');
			if (open) { // хвостик карточки — точно под трубкой
				var icon = telA.closest('.tel').getBoundingClientRect(), pop = telPop.getBoundingClientRect();
				telPop.style.setProperty('--tf-caret', Math.max(8, Math.round(pop.right - (icon.left + icon.width / 2) - 6)) + 'px');
			}
		};
		telA.setAttribute('aria-controls', 'tf-tel-pop');
		// Слушаем весь значок, а не ссылку: на телефоне номер скрыт и ссылка 0×0 — палец попадает в значок
		var telBox = telA.closest('.tel');
		telBox.setAttribute('role', 'button');
		telBox.setAttribute('tabindex', '0');
		telBox.setAttribute('aria-label', 'Телефон и мессенджеры');
		var toggleTel = function (e) {
			if (window.innerWidth > 640) return; // на компьютере и планшете номер виден — обычный звонок
			e.preventDefault();
			setTel(telPop.hidden);
		};
		telBox.addEventListener('click', toggleTel);
		telBox.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') toggleTel(e); });
		document.addEventListener('click', function (e) { if (!telPop.hidden && !e.target.closest('.tel, #tf-tel-pop')) setTel(false); });
		document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setTel(false); });
		window.addEventListener('scroll', function () { if (!telPop.hidden && window.scrollY > 200) setTel(false); }, { passive: true });
	}

	/* «TAURAS-FITNESS» в заголовках не переносится по дефису (на узком экране было «TAURAS-» / «FITNESS») */
	$$('main h1, main h2, main h3, main .block_header, main .headline, main .advant_title').forEach(function (h) {
		var walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT), node, list = [];
		while ((node = walker.nextNode())) if (/tauras-(fitness|kids)/i.test(node.nodeValue)) list.push(node);
		list.forEach(function (t) {
			var span = document.createElement('span');
			span.innerHTML = t.nodeValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/(tauras-(?:fitness|kids))/ig, '<span class="tf-nowrap">$1</span>');
			t.parentNode.replaceChild(span, t);
		});
	});
})();
