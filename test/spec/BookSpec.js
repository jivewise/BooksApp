/* global PagesCollection, TextModel, PageModel, BookModel */
describe("Book APP", function () {

  beforeEach(function () {

  });

  describe("TextModel", function () {
    var textModel;

    beforeEach(function () {
      textModel = new TextModel();
    });

    it('can prepare text', function () {
      textModel.set({
        text: ['*[0 - 624]Hi ', '*[0 - 415]there ']
      });

      expect(textModel.prepareText()).toEqual(
        '<p><span><span class="text-span" data-starttime-attr="0" data-endtime-attr="624">Hi</span><span></span> </span></p>' +
        '<p><span><span class="text-span" data-starttime-attr="0" data-endtime-attr="415">there</span><span></span> </span></p>');
    });

    it("can split span up(clean up span)", function () {
      var text = '*[0:00 - 0:10] together *[0:10 - 0:20] we *[0:20 - 0:30] are *[0:30 - 0:40] scorpion';

      expect(textModel.textCleanup(text)).toEqual(
        '<span><span class="text-span" data-starttime-attr="0:00" data-endtime-attr="0:10">together</span><span></span> </span>' +
        '<span><span class="text-span" data-starttime-attr="0:10" data-endtime-attr="0:20">we</span><span></span> </span>' +
        '<span><span class="text-span" data-starttime-attr="0:20" data-endtime-attr="0:30">are</span><span></span> </span>' +
        '<span><span class="text-span" data-starttime-attr="0:30" data-endtime-attr="0:40">scorpion</span><span></span> </span>'
      );
    });

    // what we get is actually a jQuery object, but we can only compare the html part
    it('can get html span', function () {
      var text = '*[0:00 - 0:10] Hi there!';

      expect(textModel.getSpan(text).html()).toEqual(
        '<span class="text-span" data-starttime-attr="0:00" data-endtime-attr="0:10">Hi there</span><span>!</span> '
      );
    });

    it('can trim punctuation', function() {
      var text = 'Do I have a quotation mark?';

      expect(textModel.trimPunctuation(text).noPunc).toBe('Do I have a quotation mark');
      expect(textModel.trimPunctuation(text).punc).toBe('?');
    });

    it('can set span time attributes', function() {
      var span = $("<span class='text-span'></span>");
      var time = '[0:00 - 0:10]Hi there';

      expect(textModel.setSpanTime(span, time)[0].outerHTML).toEqual(
        '<span class="text-span" data-starttime-attr="0:00" data-endtime-attr="0:10"></span>'
      );
    });

    it('can get text html', function() {
      textModel.set({
        text: ['*[0 - 624]Hi ', '*[0 - 415]there ']
      });

      expect(textModel.getTextHtml()).toEqual(
        '<p><span><span class="text-span" data-starttime-attr="0" data-endtime-attr="624">Hi</span><span></span> </span></p>' +
        '<p><span><span class="text-span" data-starttime-attr="0" data-endtime-attr="415">there</span><span></span> </span></p>'
      );
    });
  });


});


describe("PagesCollection", function () {

});


//describe("PageModel", function() {
//	var pageObj;
//	var testPage = {
//		'background': '3.png',
//		'text': ['*[2:00 - 2:30]Gerry Goose came up behind him.',
//				'“*[2:30 - 3:00]Barry! Getting something to eat?” asked Gerry.',
//				'“*[3:00 - 3:30]Yes, quiet, Gerry or you\'ll scare the fish.”']
//	};
//
//	it ('Can get background image', function() {
//		var pageObj = new PageModel(testPage);
//		var pageBackground = pageObj.getBackground();
//
//		expect(pageBackground).toEqual('barry/images/3.png');
//	});
//
//});


//describe("BookModel", function() {
//	var testBook;
//	testBook = {
//		'bookWidth' : 1400,
//		'windowWidth' : 1366
//	};
//	it ('Can center right page', function() {
//		var bookObj = new BookModel(testBook);
//		var leftMargin = bookObj.centerRightPage();
//
//		expect(leftMargin).toEqual(-367);
//	});
//});
