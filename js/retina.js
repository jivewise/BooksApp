/* returns true when the none retina image is not clear enough for current screen
*   so it does not only check if it is retina screen; do not use explicitly in other projects
* */
function isRetina() {

	var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5),\
					(min--moz-device-pixel-ratio: 1.5),\
					(-o-min-device-pixel-ratio: 3/2),\
					(min-resolution: 1.5dppx)";
	
	var height = window.screen.height;
	var width = window.screen.width;
	var orientation = window.orientation;

	if (window.devicePixelRatio === 2) {
		// iphone 5 do not use higher resolution images
		if (height === 568 && orientation === (0 || 180)) { return true; }

		if (width === 568 && orientation === (90 || -90) ) { return true; }

		// iphone 4/4s neither
		if (height === 480 && orientation === (0 || 180) ) { return false; }

		if (width === 480 && orientation === (90 || -90) ) { return false; }

		// ipad 3 or higher use higher resolution images
		if (height === 1024 && orientation === (0 || 180) ) { return true; }

		if (width === 1024 && orientation === (90 || -90) ) { return true; }
	}

	// check others; generally, mobile are below 768, tablet/mac/pc are above or equal
	if ( width >= 768 ) {
		if (window.matchMedia && window.matchMedia(mediaQuery).matches) { return true; }
		
		if ( window.devicePixelRatio > 1 ) { return true; }
	};

	return false;
}

console.log('Load @2x images : ' + isRetina());