$(document).ready(function() {

	if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
		document.addEventListener('deviceready', onDeviceReady, false);
	} else {
		soundManager.setup({
			url: 'lib/swf/',
			flashVersion: 9,
			onready: function() {
				appInit();
			}
		});
	}

	// click to turn pages
	$('.left-grad').live('click', function() {
		$('.prev-page').trigger('click')
	});
	$('.right-grad').live('click', function() {
		$('.next-page').trigger('click')
	});

	// swipe to turn pages
	$('.book-inner').live('swipeleft',function(){
		$('.next-page').trigger('click');
	}).live('swiperight', function() {
		$('.prev-page').trigger('click');
	});

	initRateThisApp();
});

function appInit() {
	var pagesCollection = new PagesCollection(book_data.pages);
	window.bookView = new BookView({'collection':pagesCollection, 'el': '#book-outer','pg':'#book-pagination'});
	pagesCollection.setPage(0);
}

function onBackKeyDown() {
	if (confirm('Back to book list?')) {
		location.replace('index.html');
	}
}

function onDeviceReady() {
	document.addEventListener("backbutton", onBackKeyDown, false);
	appInit();
}

function initRateThisApp() {
	$(".rating-stars, .rate-this-app").live('click', function(e) {
		e.stopPropagation();
		if (device.platform == "Android") {
			window.open('market://details?id=com.hundredlanterns.whyyubooks', '_system');
			return;
		}
		if (device.platform != "iOS") {
			window.open('http://staging.whyyu.com/apps/whyyubooks/rating/ios', '_system');
		}
	});
}