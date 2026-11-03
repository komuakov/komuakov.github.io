/* Временная копия сайта (авария хостинга): формы не отправляются — вместо них телефон и мессенджеры. */
(function () {
	'use strict';
	var html = '<div class="tf-rec">' +
		'<p class="tf-rec__t">Запишитесь по телефону или в мессенджере — ответим быстро</p>' +
		'<a class="tf-rec__btn tf-rec__btn--tel" href="tel:+78123177249">Позвонить +7 (812) 317-72-49</a>' +
		'<div class="tf-rec__row">' +
		'<a class="tf-rec__btn tf-rec__btn--wa" href="https://wa.me/+79112777766" target="_blank" rel="noopener">WhatsApp</a>' +
		'<a class="tf-rec__btn tf-rec__btn--tg" href="https://t.me/Taurasfitnes_bot" target="_blank" rel="noopener">Telegram</a>' +
		'<a class="tf-rec__btn tf-rec__btn--max" href="https://max.ru/u/f9LHodD0cOKWPyt2Y78mZ8BtKr5GJamdx3WI1PPy0oZzxma38LGVMUCVDvE" target="_blank" rel="noopener">MAX</a>' +
		'</div></div>';
	function run() {
		// фильтры каталога/команды и формы отзывов работают через сервер — во временной копии их прячем
		document.querySelectorAll('.shop_search, form.tf-subscribe, form.subscription, form[action*="wp-comments-post"], form[method="get"]').forEach(function (el) {
			(el.closest('.shop_search') || el).style.display = 'none';
		});
		// формы заявок -> телефон и мессенджеры
		document.querySelectorAll('form.tauras-form').forEach(function (f) {
			if (f.classList.contains('tf-rec-done') || f.style.display === 'none') return;
			f.insertAdjacentHTML('beforebegin', html);
			f.style.display = 'none';
			f.classList.add('tf-rec-done');
		});
		document.addEventListener('submit', function (e) { e.preventDefault(); }, true);
		document.querySelectorAll('img').forEach(function (i) { if (i.complete && !i.naturalWidth) ph(i); });
	}
	/* фото, которых не нашлось в копиях, — фирменная заглушка вместо «битой» картинки */
	function ph(img) {
		if (img.dataset.ph) return;
		if (img.hasAttribute('srcset')) { // сначала пробуем обычный размер из src (часто нет только @2x)
			img.removeAttribute('srcset');
			var pic = img.closest('picture');
			if (pic) pic.querySelectorAll('source').forEach(function (s) { s.remove(); });
			img.src = img.getAttribute('src');
			return;
		}
		img.dataset.ph = 1;
		img.src = '/ph.svg';
		img.style.objectFit = 'cover';
	}
	document.addEventListener('error', function (e) { if (e.target.tagName === 'IMG') ph(e.target); }, true);
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
