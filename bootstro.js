/**
 * Bootstro.js Simple way to show your user around, especially first time users
 * Http://github.com/clu3/bootstro.js
 *
 * Credit thanks to
 * Revealing Module Pattern from
 * http://enterprisejquery.com/2010/10/how-good-c-habits-can-encourage-bad-javascript-habits-part-1/
 *
 * Bootstrap popover variable width
 * http://stackoverflow.com/questions/10028218/twitter-bootstrap-popovers-multiple-widths-and-other-css-properties
 */
$(document).ready(function () {
    //Self-Executing Anonymous Func: Part 2 (Public & Private)
    (function (bootstro, $, undefined) {
        var $elements; //jquery elements to be highlighted
        var count;
        var activeIndex = null; //index of active item
        var defaultOrder = true; // if true the DOM order is followed. it is changed to false when step index is given for atleast one element.
        var indexes;

        var defaults = {
            nextButtonText: 'Next &raquo;', //will be wrapped with button as below
            //nextButton: '<button class="btn btn-primary btn-xs bootstro-next-btn">Next &raquo;</button>',
            prevButtonText: '&laquo; Prev',
            //prevButton: '<button class="btn btn-primary btn-xs bootstro-prev-btn">&laquo; Prev</button>',
            finishButtonText: '<i class="icon-ok"></i> Ok I got it, get back to the site',
            //finishButton: '<button class="btn btn-xs btn-success bootstro-finish-btn"><i class="icon-ok"></i> Ok I got it, get back to the site</button>',
            stopOnBackdropClick: true,
            stopOnEsc: true,

            //onComplete: function(params){} //params = {idx : activeIndex}
            //onExit: function(params){} //params = {idx : activeIndex}
            //onStep: function(params){} //params = {idx : activeIndex, direction : [next|prev]} - when user goes next/back explicitly
            //onShow: function(params){} //params = {idx : activeIndex, $element : popover element} - when the popover is shown (incl. the first time)
            //onShown: function(params){} //params = {idx : activeIndex, $element : popover element} - relying on bootstrap shown.bs.popover event

            //url: String // ajaxed url to get show data from

            margin: 100 //if the currently shown element's margin is less than this value
            // the element should be scrolled so that it can be viewed properly. This is useful
            // for sites which have fixed top/bottom nav bar
        };
        var settings;

        //===================PRIVATE METHODS======================
        //http://stackoverflow.com/questions/487073/check-if-element-is-visible-after-scrolling
        function isEntirelyVisible($elem) {
            var docViewTop = $(window).scrollTop();
            var docViewBottom = docViewTop + $(window).height();

            var elemTop = $elem.offset().top;
            var elemBottom = elemTop + $elem.height();

            return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom)
                && (elemBottom <= docViewBottom) && (elemTop >= docViewTop));
        }

        //add the nav buttons to the popover content;

        function addNavBtn(content, i) {
            var $el = getElement(i);
            var nextButton, prevButton, finishButton;
            var defaultBtnClass = 'btn btn-primary btn-xs';

            content = content + '<div class="bootstro-nav-wrapper">';

            if ($el.attr('data-bootstro-nextButton')) {
                nextButton = $el.attr('data-bootstro-nextButton');
            } else if ($el.attr('data-bootstro-nextButtonText')) {
                nextButton = '<button class="' + defaultBtnClass + ' bootstro-next-btn">' + $el.attr('data-bootstro-nextButtonText') + '</button>';
            } else {
                if (typeof settings.nextButton !== 'undefined') {
                    nextButton = settings.nextButton;
                } else {
                    nextButton = '<button class="' + defaultBtnClass + ' bootstro-next-btn">' + settings.nextButtonText + '</button>';
                }
            }

            if ($el.attr('data-bootstro-prevButton')) {
                prevButton = $el.attr('data-bootstro-prevButton');
            } else if ($el.attr('data-bootstro-prevButtonText')) {
                prevButton = '<button class="' + defaultBtnClass + ' bootstro-prev-btn">' + $el.attr('data-bootstro-prevButtonText') + '</button>';
            } else {
                if (typeof settings.prevButton !== 'undefined') {
                    prevButton = settings.prevButton;
                } else {
                    prevButton = '<button class="' + defaultBtnClass + ' bootstro-prev-btn">' + settings.prevButtonText + '</button>';
                }
            }

            if ($el.attr('data-bootstro-finishButton')) {
                finishButton = $el.attr('data-bootstro-finishButton');
            } else if ($el.attr('data-bootstro-finishButtonText')) {
                finishButton = '<button class="' + defaultBtnClass + ' bootstro-finish-btn">' + $el.attr('data-bootstro-finishButtonText') + '</button>';
            } else {
                if (typeof settings.finishButton !== 'undefined') {
                    finishButton = settings.finishButton;
                } else {
                    finishButton = '<button class="' + defaultBtnClass + ' bootstro-finish-btn">' + settings.finishButtonText + '</button>';
                }
            }

            if (count !== 1) {
                if (isFirst(i)) {
                    content = content + nextButton;
                } else if (isLast(i)) {
                    content = content + prevButton;
                } else {
                    content = content + nextButton + prevButton;
                }
            }
            content = content + '</div>';

            content = content + '<div class="bootstro-finish-btn-wrapper">' + finishButton + '</div>';
            return content;
        }

        function nextIndex(indexToTry) {
            var closestIndex = null;

            // loop and find the next available value less than or equal to the indexToTry
            $.each(indexes, function (key, val) {
                if (val >= indexToTry) {
                    closestIndex = val;
                    return false;
                }
            });
            return closestIndex;
        }

        function prevIndex(indexToTry) {
            var closestIndex = null;
            var reverseIndexes = $.makeArray(indexes).reverse();

            // loop and find the previous available value less than or equal to the indexToTry
            $.each(reverseIndexes, function (key, val) {
                if (val <= indexToTry) {
                    closestIndex = val;
                    return false;
                }
            });
            return closestIndex;
        }

        function getStepCount(i) {
            return defaultOrder ? i : $.inArray(i, indexes);
        }

        function isLast(i) {
            return i === (defaultOrder ? count - 1 : indexes.get(-1));
        }

        function isFirst(i) {
            return i === (defaultOrder ? 0 : indexes.get(0));
        }

        //prep objects from json and return selector
        function processItems(popover) {
            var selectorArr = [];
            $.each(popover, function (t, e) {
                //build the selector
                $.each(e, function (j, attr) {
                    if (typeof attr !== 'function') {
                        $(e.selector).attr('data-bootstro-' + j, attr);
                    }
                });

                //only deal with the visible element
                if ($(e.selector).is(':visible')) {
                    selectorArr.push(e.selector);
                }
            });
            return selectorArr.join(',');
        }

        //get the element to intro at stack i 
        function getElement(i) {
            //get the element with data-bootstro-step=i 
            //or otherwise the the natural order of the set
            if ($elements.filter('[data-bootstro-step=' + i + ']').size() > 0) {
                return $elements.filter('[data-bootstro-step=' + i + ']');
            } else {
                return $elements.eq(i);
            }
        }

        function getPopup(i) {
            var p = {};
            var $el = getElement(i);
            var title = '';

            var counterPrefix = settings.counterPrefix || '';
            var counterSeparator = settings.counterSeparator || '/';

            if (count > 1) {
                title = '<span class="bootstro-counter label label-success">' + counterPrefix + (getStepCount(i) + 1) + counterSeparator + count + '</span>';
            }

            p.title = $el.attr('data-bootstro-title') || '';
            if (p.title !== '' && title !== '') {
                p.title = title + ' - ' + p.title;
            } else if (p.title === '') {
                p.title = title;
            }

            p.content = $el.attr('data-bootstro-content') || '';
            p.content = addNavBtn(p.content, i);
            p.placement = $el.attr('data-bootstro-placement') || 'top';
            var style = '';
            if ($el.attr('data-bootstro-width')) {
                p.width = $el.attr('data-bootstro-width');
                style = style + 'width:' + $el.attr('data-bootstro-width') + ';'
            }
            if ($el.attr('data-bootstro-height')) {
                p.height = $el.attr('data-bootstro-height');
                style = style + 'height:' + $el.attr('data-bootstro-height') + ';'
            }
            p.trigger = 'manual'; //always set to manual.

            p.html = $el.attr('data-bootstro-html') || 'top';

            //resize popover if it's explicitly specified
            //note: this is ugly. Could have been best if popover supports width & height
            p.template = '<div class="popover bootstro-popover bootstro-popover-' + (getStepCount(i) + 1) + '" style="' + style + '">' +
                '<div class="arrow"></div>' +
                '<div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div>' +
                '</div>';

            return p;
        }

        //===================PUBLIC METHODS======================
        //destroy popover at stack index i
        bootstro.destroyPopover = function (i) {
            i = i || 0;
            if (i !== 'all') {
                var $el = getElement(i);
                $el.popover('destroy').removeClass('bootstro-highlight');
            }
        };

        //destroy active popover and remove backdrop
        bootstro.stop = function () {
            bootstro.destroyPopover(activeIndex);
            bootstro.unbind();
            $('.bootstro-backdrop').remove();
            $('body').removeClass('bootstro-open');

            if (typeof settings.onExit === 'function') {
                settings.onExit.call(this, { idx: getStepCount(activeIndex) });
            }
        };

        //go to the popover number idx starting from 0
        bootstro.goTo = function (idx) {
            //destroy current popover if any
            bootstro.destroyPopover(activeIndex);

            if (count !== 0) {
                var p = getPopup(idx);
                var $el = getElement(idx);

                var that = this;
                if (typeof settings.onShow === 'function') {
                    settings.onShow.call(that, { idx: idx, $element: $el });
                }
                if (typeof settings.onShown === 'function') {
                    $el.on('shown.bs.popover', function () {
                        settings.onShown.call(that, { idx: idx, $element: $el });
                    });
                }

                var ancestorClass = 'bootstro-ancestor';
                $('.' + ancestorClass).removeClass(ancestorClass);
                $el.parentsUntil('body,.bootstro-stop-ancestors').addClass(ancestorClass);

                $el.attr('data-bootstro-original-title', $el.attr('title'));
                $el.attr('title', '');
                $el.popover(p).popover('show');
                $el.attr('title', $el.attr('data-bootstro-original-title')); // unfixing bootstrap...

                $el.siblings('.popover')
                    .on('click.bootstro', '.bootstro-next-btn', function (e) {
                        bootstro.next();
                        e.preventDefault();
                        return false;
                    })
                    .on('click.bootstro', '.bootstro-prev-btn', function (e) {
                        bootstro.prev();
                        e.preventDefault();
                        return false;
                    })
                    .on('click.bootstro', '.bootstro-finish-btn', function (e) {
                        e.preventDefault();
                        bootstro.stop();
                    });

                //scroll if neccessary
                var docviewTop = $(window).scrollTop();
                var top = Math.min($('.popover.in').offset().top, $el.offset().top);

                //distance between docviewTop & min.
                var topDistance = top - docviewTop;

                if (topDistance < settings.margin) { //the element too up above
                    $('html,body').animate({ scrollTop: top - settings.margin}, 'slow');
                } else if (!isEntirelyVisible($('.popover.in')) || !isEntirelyVisible($el)) {
                    //the element is too down below
                    $('html,body').animate({ scrollTop: top - settings.margin}, 'slow');
                }

                $el.addClass('bootstro-highlight');
                activeIndex = idx;
            }
        };

        bootstro.next = function () {
            if (isLast(activeIndex)) {
                if (typeof settings.onComplete === 'function') {
                    settings.onComplete.call(this, { idx: getStepCount(activeIndex) });
                }
            } else {
                defaultOrder ? bootstro.goTo(activeIndex + 1) : bootstro.goTo(nextIndex(activeIndex + 1));

                if (typeof settings.onStep === 'function') {
                    settings.onStep.call(this, {idx: getStepCount(activeIndex), direction: 'next'});
                }
            }
        };

        bootstro.prev = function () {
            if (!isFirst(activeIndex)) {
                defaultOrder ? bootstro.goTo(activeIndex - 1) : bootstro.goTo(prevIndex(activeIndex - 1));

                if (typeof settings.onStep === 'function') {
                    settings.onStep.call(this, {idx: getStepCount(activeIndex), direction: 'prev'});
                }
            }
        };

        bootstro._start = function (selector) {
            selector = selector || '.bootstro';

            $elements = $(selector);
            count = $elements.size();
            if (count > 0 && $('div.bootstro-backdrop').length === 0) {
                // Prevents multiple copies
                $('<div class="bootstro-backdrop"></div>').appendTo('body');
                $('body').addClass('bootstro-open');

                bootstro.bind();

                indexes = $elements.map(function () {
                    return parseInt($(this).attr('data-bootstro-step'));
                });

                // set defaultOrder to true in order to follow DOM order when all the elements are not provided with data-bootstro-step attr
                defaultOrder = $.grep(indexes, function (x) {
                    return !isNaN(x);
                }).length === 0;

                if (!defaultOrder) {
                    indexes = indexes.sort(function (a, b) {
                        return a - b;
                    });
                }

                defaultOrder ? bootstro.goTo(0) : bootstro.goTo(nextIndex(0));
            }
        };

        bootstro.start = function (selector, options) {
            settings = $.extend(true, {}, defaults); //deep copy
            $.extend(settings, options || {});
            //if options specifies a URL, get the intro configuration from URL via ajax
            if (typeof settings.url !== 'undefined') {
                //get config from ajax
                $.ajax({
                    url: settings.url,
                    success: function (data) {
                        if (data.success) {
                            //result is an array of {selector:'','title':'','width', ...}
                            var popover = data.result;
                            selector = processItems(popover);
                            bootstro._start(selector);
                        }
                    }
                });
            }
            //if options specifies an items object use it to load the intro configuration
            //settings.items is an array of {selector:'','title':'','width', ...}
            else if (typeof settings.items !== 'undefined') {
                bootstro._start(processItems(settings.items))
            } else {
                bootstro._start(selector);
            }
        };
        //bind the nav buttons click event
        bootstro.bind = function () {
            bootstro.unbind();

            if (settings.stopOnBackdropClick) {
                $('.bootstro-backdrop').on('click.bootstro', function (e) {
                    if ($(e.target).hasClass('bootstro-backdrop')) {
                        bootstro.stop();
                    }
                });
            }

            //bind the key event
            $(document).on('keydown.bootstro', function (e) {
                var code = (e.keyCode ? e.keyCode : e.which);
                if (code === 39 || code === 40) {
                    bootstro.next();
                    e.stopImmediatePropagation();
                } else if (code === 37 || code === 38) {
                    bootstro.prev();
                    e.stopImmediatePropagation();
                } else if (code === 27 && settings.stopOnEsc) {
                    bootstro.stop();
                    e.stopImmediatePropagation();
                }
            })
        };

        bootstro.unbind = function () {
            $('html').unbind('click.bootstro');
            $(document).unbind('keydown.bootstro');
        }

    }(window.bootstro = window.bootstro || {}, jQuery));
});
