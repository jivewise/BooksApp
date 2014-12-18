/* global soundManager */
/* animal story */
/* toddler story book */
/* adventure story */

// set underscore template interpolation options
_.templateSettings.interpolate = /{{=(.+?)}}/g;
_.templateSettings.evaluate = /{{(.+?)}}/g;

window.requestAnimFrame = (function () {
	return window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function (callback) {
		window.setTimeout(callback, 1000 / 60);
	};
})();

var PageModel, TextModel, BookModel, BookView, PagesCollection, PageView, SoundModel, MediaModel, SMModel, BookControls;
MediaModel = Backbone.Model.extend({
	initialize: function () {
		var url = this.get('url');
		var success = _.bind(this.success, this);
		var error = _.bind(this.error, this);
		var state = _.bind(this.state, this);

		this.sound = new Media(url, success, error, state);
	},
	setSound: function (soundObj) {
		this.sound = soundObj;
	},
	success: function (s) {
		this.stateChange(s);
	},
	state: function (s) {
		this.stateChange(s);
	},
	stateChange: function (s) {
		var position = this.get('events').position;

		if ((s === Media.MEDIA_STARTING || s === Media.MEDIA_RUNNING) && position && position.markers) {
			this.nextMarker = position.markers[0];
			this.markerArray = position.markers;
		} else if (this.playing && s === Media.MEDIA_STOPPED) {
			this.playing = false;
			if (this.get('events').finish) {
				this.get('events').finish();
			}
		}
	},
	error: function (s) {
	},
	play: function (time) {
		if (time) {
			this.sound.seekTo(parseInt(time.from, 10));
			var duration = time.to - time.from;
			setTimeout(_.bind(function () {
				this.stop();
			}, this), duration);
		} else {
			this.playing = true;
		}

		this.time = 0;
		this.sound.play();
		var updateProgress = _.bind(this.updateProgress, this);
		//start timer on play
		window.requestAnimFrame(updateProgress);
	},
	updateProgress: function () {
		if (this.playing && this.get('events').position) {
			var positionCallback = _.bind(function (time) {
				this.time = parseFloat(time, 10) * 1000;
				this.markersCallback(this.time);
			}, this);
			var errorCallback = function (e) {
			};

			this.lastTime = this.lastTime ? this.lastTime : 1;

			var elapsedTime = Date.now() - this.lastTime;

			if (elapsedTime >= 100) {
				this.lastTime = Date.now();
				this.sound.getCurrentPosition(positionCallback, errorCallback);
			} else {
				this.time += Date.now() - this.lastTime;
				positionCallback(this.time / 1000);
			}

			var updateProgress = _.bind(this.updateProgress, this);
			window.requestAnimFrame(updateProgress);
		}
	},
	markersCallback: function (time) {
		var events = this.get('events');

		if (this.nextMarker !== null && typeof(this.nextMarker) !== 'undefined' && time > this.nextMarker) {
			events.position.callback(time);
			this.nextMarker = this.markerArray.shift();
		}
	},
	pause: function () {
		this.playing = false;
		this.sound.pause();
	},
	stop: function () {
		this.playing = false;
		this.sound.stop();
	}
});
SMModel = Backbone.Model.extend({
	initialize: function () {
		var url = this.get('url');
		var events = this.get('events');
		var id = "s_" + this.get('id');
		var volume = this.get('volume');

		var setSound = _.bind(this.setSound, this);
		soundManager.createSound({
			autoLoad: true,
			id: id,
			url: url,
			volume: volume,
			onload: function () {
				setSound(soundManager.getSoundById(id), events);
			},
			onfinish: function () {
				if (events.finish) {
					events.finish();
				}
			}
		});
	},
	setSound: function (soundObj, events) {
		this.sound = soundObj;
		if (events.position) {
			_.each(events.position.markers, function (value) {
				soundObj.onPosition(value, events.position.callback);
			});
		}
		if (this.get('playingWhenLoaded')) {
			this.sound.play();
		}
	},
	play: function (time) {
		if (this.sound) {
			this.sound.play(time);
		} else {
			this.set('playingWhenLoaded');
		}
	},
	pause: function () {
		if (this.sound) {
			this.sound.pause();
		}
	},
	stop: function () {
		if (this.sound) {
			this.sound.stop();
		}
	}
});

PageModel = Backbone.Model.extend({
	imageDomain: book_data.image_path,
	soundDomain: book_data.sound_path,
	initialize: function () {
		this.textModel = new TextModel({'text': this.get('text')});
	},
	getPhoneGapPath: function () {
		// for phonegap android
		if (navigator.userAgent.match(/Android/)) {
			var path = window.location.pathname;
			return "file://" + path.replace(book_data.book_html_file, "");
		}
		// for other platforms
		return "";
	},
	getSound: function () {
		return this.getPhoneGapPath() + this.soundDomain + this.get('sound');
	},
	getBackground: function () {
		if (isRetina()) {
			return this.imageDomain + this.get('background_2x');
		} else {
			return this.imageDomain + this.get('background');
		}
	},

	getTextHtml: function () {
		return this.textModel.getTextHtml();
	}
});

TextModel = Backbone.Model.extend({
	initialize: function () {
	},

	prepareText: function () {
		var textArray = this.get('text');
		var paragraphArray = [];

		for (var i = 0; i < textArray.length; i++) {
			paragraphArray.push(this.textCleanup(textArray[i]));
		}

		return "<p>" + paragraphArray.join("</p><p>") + "</p>";
	},

	textCleanup: function (textElem) {
		var spanArray = textElem.split("*");
		var paragraph = $("<p></p>");

		for (var i = 0; i < spanArray.length; i++) {
			var spanText = spanArray[i];
			var span = this.getSpan(spanText);

			paragraph.append(span);
		}

		return paragraph.html();
	},

	getSpan: function (spanText) {
		if (spanText.trim() === "") {
			return null;
		}

		var span = $("<span class='text-span'></span>");

		var text = this.trimPunctuation(spanText.substr(spanText.indexOf("]") + 1).trim());

		span.html(text.noPunc.trim());

		var puncSpan = $("<span/>").html(text.punc);
		var spanWrap = $("<span/>").append(span).append(puncSpan).append(" ");
		this.setSpanTime($(span, 'text-span'), spanText);

		return spanWrap;
	},

	trimPunctuation: function (spanText) {
		var noPunc = "";
		var punc = "";
		var i = spanText.length - 1;

		while (i >= 0) {
			if (/^[a-z0-9]+$/i.test(spanText[i])) {
				noPunc = spanText.substr(0, i + 1);
				break;
			} else {
				punc = spanText[i] + punc;
			}
			i--;
		}
		return {noPunc: noPunc, punc: punc};
	},
	setSpanTime: function (span, timeStr) {
		var split1 = timeStr.split("[");
		var split2 = split1[1].split("]");
		var timeArr = split2[0].split("-");

		span.attr('data-starttime-attr', $.trim(timeArr[0]));
		span.attr('data-endtime-attr', $.trim(timeArr[1]));

    return span;
	},

	getTextHtml: function () {
		this.text = this.prepareText();
		return this.text;
	}
});

BookModel = Backbone.Model.extend({
	defaults: {
		numPages: 0,
		playing: false,
		curPage: 0
	},
	centerRightPage: function () {
		var pageWidth, bookLeft;
		pageWidth = this.get('bookWidth') / 2;
		// bookLeft = -pageWidth/2 + (this.get('windowWidth') - pageWidth)/2 - 10;
		bookLeft = -pageWidth / 2 + (this.get('windowWidth') - pageWidth) / 2;
		return bookLeft;
	},
	isPlaying: function () {
		return this.get('playing');
	}
});

PagesCollection = Backbone.Collection.extend({
	model: PageModel,

	pageNumber: 0,

	prevPage: function () {
		this.setPage(this.pageNumber);
	},
	nextPage: function () {
		this.setPage(this.pageNumber);
	},
	setPage: function (pageNum) {
		if (pageNum >= 0 && pageNum < this.length) {
			this.pageNumber = pageNum;
			//trigger change
			this.trigger('change');
		}
	},
	getCurrentPage: function () {
		return this.pageNumber;
	}
});

BookControls = Backbone.View.extend({
	el: '#book-controls',
	play: '#play-book',
	events: {
		'click #play-book': 'togglePlay',
		'click a.next-page': 'nextClicked',
		'click a.prev-page': 'prevClicked'
	},
	initialize: function (args) {
		this.parent = args.parent;
		this.model = args.model;
		this.$play = $(this.play);
	},
	togglePlay: function () {
		if (this.model.isPlaying()) {
			this.parent.pause();
		} else {
			this.parent.start();
		}
		this.$play.toggleClass('playing');
		this.$play.toggleClass('paused');
	},
	nextClicked: function () {
		this.parent.nextPage();
	},
	prevClicked: function () {
		this.parent.prevPage();
	}
});

BookView = Backbone.View.extend({
	pages: [],
	getPhoneGapPath: function () {
		// for phonegap android
		if (navigator.userAgent.match(/Android/)) {
			var path = window.location.pathname;
			return "file://" + path.replace(book_data.book_html_file, "");
		}
		// for other platforms
		return "";
	},
	backgroundUrl: book_data.sound_path + 'background.mp3',
	lastPageTemplate: '#last-page-template',
	events: {
		"click #read-again": "restartBook"
	},
	initialize: function () {
		// set background sound url
		this.backgroundUrl = this.getPhoneGapPath() + book_data.sound_path + 'background.mp3';
		//set SoundModel based on detection
		SoundModel = typeof(Media) !== "undefined" && Media ? MediaModel : SMModel;

		this.$el = $(this.el);
		this.$pages = this.$el.find('div#pages');
		this.$pages.html('');
		this.$pg = $(this.options.pg);
		this.$pg.html('');

		//set resize event
		this.bookModel = new BookModel({
			'bookWidth': this.$el.width(),
			'windowWidth': $(window).width()
		});

		this.controls = new BookControls({
			parent: this,
			model: this.bookModel
		});

		this.resize();
		$(window).on('resize', this.resize.bind(this));

		this.collection.on('change', this.render, this);
		this.collection.on('add', this.render, this);

		this.collection.each(this.drawPage, this);

		this.drawLastPage();
		this.setupBackgroundSound();
		this.setupBooklet();
		this.jumpToPage(1);

	},
	resize: function () {
		this.bookModel.set({
			'bookWidth': this.$el.width(),
			'windowWidth': $(window).width()
		});
		this.$el.css({'margin-left': this.bookModel.centerRightPage() + "px"});
	},

	drawPage: function (page) {
		var pageObj = new PageView({'model': page});
		var pageCont = pageObj.render(this.collection.indexOf(page));

		this.pages.push(pageObj);

		this.$pages.append(pageCont);
	},
	drawLastPage: function () {
		var template = _.template($(this.lastPageTemplate).html());

		var $lastPage = $(template());
		this.$pages.append($lastPage);
	},
	setPage: function (page) {
		var curPage = this.bookModel.get('curPage');
		if (curPage && this.pages[curPage]) {
			this.pages[curPage].endPage();
		}

		//set cur page number into book model
		this.bookModel.set('curPage', page);

		// check if the page param is less than the collection.length; or playing page gives error
		//check if auto play is true
		if (this.bookModel.isPlaying() && page < this.collection.length) {
			//add callback for when page is finished playing
			var finishPageCallback = _.bind(this.nextPage, this);
			//start playing page
			this.pages[page].startPage(finishPageCallback);
		}
	},
	nextPage: function () {
		var curPage = this.bookModel.get('curPage');
		// on the last page, if click next return false
		if (curPage == this.pages.length) {
			return false;
		}
		if (this.pages[curPage]) {
			this.pages[curPage].endPage();
		}
		this.drawPagination(curPage + 2);
		this.booklet.next();
	},
	prevPage: function () {
		var curPage = this.bookModel.get('curPage');
		// on first page return false if click prev button
		if (curPage == 0) {
			return false;
		}
		if (this.pages[curPage]) {
			this.pages[curPage].endPage();
		}
		this.drawPagination(curPage);
		this.booklet.prev();
	},
	jumpToPage: function (toPage) {
		var curPage = this.bookModel.get('curPage');

		if (!toPage) {
			return false;
		}

		if (this.booklet.isAnimating) {
			return false;
		}

		if (this.pages[curPage]) {
			this.pages[curPage].endPage();
		}
		this.drawPagination(toPage);
		this.booklet.jump(toPage);
	},
	drawPagination: function (toPage) {

		this.$pg.html('');
		var curPage = this.bookModel.get('curPage') + 1;
		var pageCount = this.collection.length + 1;
		var endPage = 0;
		var pgHtml = '<span id="page-count">' + toPage + '/' + pageCount + '</span>';

		if (toPage !== 1) {
			pgHtml += '<a class="page-number" href="javascript:this.bookView.jumpToPage(1)" title="Page 1">1</a>';
		}

		if (toPage >= 6) {
			pgHtml += '<span class="page-ellipsis">...</span>';
		}

		if (pageCount > toPage + 3) {
			endPage = toPage + 3;
		} else {
			endPage = pageCount;
		}

		for (var i = toPage - 3; i <= endPage; i++) {
			if (i > 0) {
				if (i === toPage) {
					pgHtml += '<a class="current-page" title="Page ' + i + '" href="javascript:this.bookView.jumpToPage(' + i + ')">' + i + '</a>';
				} else if (i !== 1 && i !== pageCount) {
					pgHtml += '<a class="page-number" title="Page ' + i + '" href="javascript:this.bookView.jumpToPage(' + i + ')">' + i + '</a>';
				}
			}
		}

		if (toPage + 3 < pageCount) {
			pgHtml += '<span class="page-ellipsis">...</span>';
		}

		if (toPage !== pageCount) {
			pgHtml += '<a class="page-number" href="javascript:this.bookView.jumpToPage(' + pageCount + ')" title="Last Page">' + pageCount + '</a>';
		}

		this.$pg.append(pgHtml);
	},
	start: function () {
		this.bookModel.set('playing', true);
		this.setPage(this.bookModel.get('curPage'));
		this.playBackgroundSound();
	},
	pause: function () {
		var curPage = this.bookModel.get('curPage');
		if (this.pages[curPage]) {
			this.pages[curPage].endPage();
		}

		this.bookModel.set('playing', false);
		this.backgroundSound.pause();
	},
	playBackgroundSound: function () {
		this.backgroundSound.play();
	},
	setupBackgroundSound: function () {
		var backgroundUrl = this.backgroundUrl;
		var loopBackground = _.bind(this.playBackgroundSound, this);
		//start background music
		this.backgroundSound = new SoundModel({
			id: 'background',
			url: backgroundUrl,
			volume: 50,
			events: {
				finish: loopBackground
			}
		});
	},
	restartBook: function () {
		// simple jump or click  does not work on android
		location.reload();
	},
	setupBooklet: function () {
		var setPage = _.bind(this.setPage, this);

		this.booklet = this.$pages.bookblock({
			speed: 800,
			perspective: 2000,
			shadowSides: 0.8,
			shadowFlip: 0.4,
			onEndFlip: function (old, page) {
				setPage(page);
			}
		});
	}
});

PageView = Backbone.View.extend({
	model: PageModel,
	pageTemplate: '#page-template',
	highlightedSpan: null,
	events: {
		'click span.text-span': 'playSpanSound'
	},
	playSpanSound: function (e) {
		// if on mobile, just ignore the click and play one word event
		if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
			return false;
		}
		this.sound.stop();
		this.sound.play({
			from: parseInt($(e.target).attr('data-starttime-attr'), 10),
			to: parseInt($(e.target).attr('data-endtime-attr') - 175, 10)
		});
	},
	endPage: function () {
		this.sound.stop();
		this.clearHighlightSpan();
	},
	getMarkers: function () {
		var markers = [];
		$('span.text-span', this.$el).each(function () {
			var startTime = parseInt($(this).attr('data-endtime-attr'), 10) === 0 ?
				1
				: $(this).attr('data-starttime-attr');

			markers.push(parseInt(startTime, 10));
			markers.push(parseInt($(this).attr('data-endtime-attr'), 10));
		});

		var uniqueMarkers = [];
		$.each(markers, function (i, el) {
			i = $.inArray(el, uniqueMarkers) === -1 && uniqueMarkers.push(el);
		});

		return uniqueMarkers;
	},
	initialize: function () {
		var template = _.template($(this.pageTemplate).html());

		this.$el = $(template({
			'text': this.model.getTextHtml(),
			'image': this.model.getBackground()
		}));


		this.el = this.$el[0];
	},
	render: function (index) {
		this.index = index;

		this.$el.addClass('page' + index);
		this.setSound(index);

		return this.$el;
	},
	setSound: function () {
		var markers = this.getMarkers();
		var positionCallback = _.bind(this.shiftHighlight, this);
		var finishCallback = _.bind(this.finishPage, this);
		this.sound = new SoundModel({
			id: this.index,
			url: this.model.getSound(),
			events: {
				position: {markers: markers, callback: positionCallback},
				finish: finishCallback
			}
		});
	},
	finishPage: function () {
		this.clearHighlightSpan();
		this.finishPageCallback();
	},
	startPage: function (finishPageCallback) {
		this.finishPageCallback = finishPageCallback;
		this.sound.play();
	},
	shiftHighlight: function (passed) {
		var setHighlightSpan = _.bind(this.setHighlightSpan, this);
		$('span.text-span', this.$el).each(function () {
			var startTime = $(this).attr('data-starttime-attr');
			var endTime = $(this).attr('data-endtime-attr');

			if (startTime <= passed && endTime >= passed) {
				setHighlightSpan($(this));
			}
		});
	},
	setHighlightSpan: function (span) {
		this.clearHighlightSpan();
		this.highlightedSpan = span;
		this.highlightedSpan.addClass('highlight-span');
	},
	clearHighlightSpan: function () {
		if (this.highlightedSpan) {
			this.highlightedSpan.removeClass('highlight-span');
		}
	}
});