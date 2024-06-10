var sportsZone = function() {
    'use strict';
    var screenWidth = $(window).width();
    var homeSearch = function() {
        var quikSearch = jQuery("#quik-search-btn");
        var quikSearchRemove = jQuery("#quik-search-remove");
        quikSearch.on('click', function() {
            jQuery('.dez-quik-search').animate({
                'width': '100%'
            });
            jQuery('.dez-quik-search').delay(500).css({
                'left': '0'
            });
        });
        quikSearchRemove.on('click', function() {
            jQuery('.dez-quik-search').animate({
                'width': '0%',
                'right': '0'
            });
            jQuery('.dez-quik-search').css({
                'left': 'auto'
            });
        });
    }
    var cartButton = function() {
        $(".item-close").on('click', function() {
            $(this).closest(".cart-item").hide('500');
        });
        $('.cart-btn').unbind().on('click', function() {
            $(".cart-list").slideToggle('slow');
        })
    }
    var onePageLayout = function() {
        var headerHeight = parseInt($('.onepage').css('height'), 10);
        $(".scroll").unbind().on('click', function(event) {
            event.preventDefault();
            if (this.hash !== "") {
                var hash = this.hash;
                var seactionPosition = $(hash).offset().top;
                var headerHeight = parseInt($('.onepage').css('height'), 10);
                $('body').scrollspy({
                    target: ".navbar",
                    offset: headerHeight + 2
                });
                var scrollTopPosition = seactionPosition - (headerHeight);
                $('html, body').animate({
                    scrollTop: scrollTopPosition
                }, 800, function() {});
            }
        });
        $('body').scrollspy({
            target: ".navbar",
            offset: headerHeight + 2
        });
    }
    var handleResizeElement = function() {
        $('.header').css('height', '');
        var headerHeight = $('.header').height();
        $('.header').css('height', headerHeight);
    }
    var dzTheme = function() {
        if (screenWidth < 991) {
            if ($('.mo-left .header-nav').children('div').length == 0) {
                var logoData = jQuery('<div>').append($('.mo-left .logo-header').clone()).html();
                jQuery('.mo-left .header-nav').prepend(logoData);
                jQuery('.mo-left .header-nav .logo-header > a > img').attr('src', 'images/logo.png');
                jQuery('.mo-left.lw .header-nav .logo-header > a > img').attr('src', 'images/logo-white.png');
            }
        } else {
            jQuery('.mo-left .header-nav div').empty();
            jQuery('.mo-left.lw .header-nav div').empty();
        }
        if (screenWidth <= 991) {
            jQuery('.navbar-nav > li > a, .sub-menu > li > a').unbind().on('click', function(e) {
                if (jQuery(this).parent().hasClass('open')) {
                    jQuery(this).parent().removeClass('open');
                } else {
                    jQuery(this).parent().parent().find('li').removeClass('open');
                    jQuery(this).parent().addClass('open');
                }
            });
        }
    }
    var MagnificPopup = function() {
        if (jQuery('.mfp-gallery').length) {
            jQuery('.mfp-gallery').magnificPopup({
                delegate: '.mfp-link',
                type: 'image',
                tLoading: 'Loading image #%curr%...',
                mainClass: 'mfp-img-mobile',
                gallery: {
                    enabled: true,
                    navigateByImgClick: true,
                    preload: [0, 1]
                },
                image: {
                    tError: '<a href="%url%">The image #%curr%</a> could not be loaded.',
                    titleSrc: function(item) {
                        return item.el.attr('title') + '<small></small>';
                    }
                }
            });
        }
        if (jQuery('.video').length) {
            jQuery('.video').magnificPopup({
                type: 'iframe',
                iframe: {
                    markup: '<div class="mfp-iframe-scaler">' +
                        '<div class="mfp-close"></div>' +
                        '<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>' +
                        '<div class="mfp-title">Some caption</div>' +
                        '</div>'
                },
                callbacks: {
                    markupParse: function(template, values, item) {
                        values.title = item.el.attr('title');
                    }
                }
            });
        }
        if (jQuery('.popup-youtube, .popup-vimeo, .popup-gmaps').length) {
            $('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
                disableOn: 700,
                type: 'iframe',
                mainClass: 'mfp-fade',
                removalDelay: 160,
                preloader: false,
                fixedContentPos: true
            });
        }
    }
    var scrollTop = function() {
        var scrollTop = jQuery("button.scroltop");
        scrollTop.on('click', function() {
            jQuery("html, body").animate({
                scrollTop: 0
            }, 1000);
            return false;
        })
        jQuery(window).bind("scroll", function() {
            var scroll = jQuery(window).scrollTop();
            if (scroll > 900) {
                jQuery("button.scroltop").fadeIn(1000);
            } else {
                jQuery("button.scroltop").fadeOut(1000);
            }
        });
    }
    var handleAccordian = function() {
        jQuery('#accordion').on('hidden.bs.collapse', function(e) {
            jQuery(e.target).prev('.panel-heading').find("i.indicator").toggleClass('glyphicon-minus glyphicon-plus');
        });
        jQuery('#accordion').on('shown.bs.collapse', function(e) {
            jQuery(e.target).prev('.panel-heading').find("i.indicator").toggleClass('glyphicon-minus glyphicon-plus');
        });
    }
    var footerAlign = function() {
        jQuery('.site-footer').css('display', 'block');
        jQuery('.site-footer').css('height', 'auto');
        var footerHeight = jQuery('.site-footer').outerHeight();
        if (screenWidth > 1280) {
            jQuery('.footer-fixed > .page-wraper').css('padding-bottom', footerHeight);
        }
        jQuery('.site-footer').css('height', footerHeight);
    }
    var fileInput = function() {
        jQuery(document).on('change', '.btn-file :file', function() {
            var input = jQuery(this);
            var numFiles = input.get(0).files ? input.get(0).files.length : 1;
            var label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
            input.trigger('fileselect', [numFiles, label]);
        });
        jQuery('.btn-file :file').on('fileselect', function(event, numFiles, label) {
            input = jQuery(this).parents('.input-group').find(':text');
            var log = numFiles > 10 ? numFiles + ' files selected' : label;
            if (input.length) {
                input.val(log);
            } else {
                if (log) alert(log);
            }
        });
    }
    var headerFix = function() {
        jQuery(window).bind('scroll', function() {
            if (jQuery('.sticky-header').length) {
                var menu = jQuery('.sticky-header');
                if ($(window).scrollTop() > menu.offset().top) {
                    menu.addClass('is-fixed');
                } else {
                    menu.removeClass('is-fixed');
                }
            }
        });
    }
    var handleMasonryBox = function(i) {
        var masonryId = '#masonry' + i;
        var masonryClass = '.masonry' + i;
        var filtersClass = '.filters' + i;
        if (jQuery(masonryId + ', ' + masonryClass).length > 0) {
            jQuery(filtersClass + ' li').removeClass('active');
            jQuery(filtersClass + ' li:first').addClass('active');
            var self = jQuery(masonryId + ', ' + masonryClass);
            var filterValue = "";
            if (jQuery('.card-container').length > 0) {
                var gutterEnable = self.data('gutter');
                var gutter = (self.data('gutter') === undefined) ? 0 : self.data('gutter');
                gutter = parseInt(gutter);
                var columnWidthValue = (self.attr('data-column-width') === undefined) ? '' : self.attr('data-column-width');
                if (columnWidthValue != '') {
                    columnWidthValue = parseInt(columnWidthValue);
                }
                self.imagesLoaded(function() {
                    filter: filterValue,
                    self.masonry({
                        gutter: gutter,
                        columnWidth: columnWidthValue,
                        isAnimated: true,
                        itemSelector: ".card-container",
                    });
                });
            }
        }
        if (jQuery(filtersClass).length) {
            jQuery(filtersClass + " li:first").addClass('active');
            jQuery(filtersClass).on("click", "li", function() {
                jQuery(filtersClass + ' li').removeClass('active');
                jQuery(this).addClass('active');
                var filterValue = $(this).attr("data-filter");
                self.isotope({
                    filter: filterValue,
                    masonry: {
                        gutter: gutter,
                        columnWidth: columnWidthValue,
                        isAnimated: true,
                        itemSelector: ".card-container"
                    }
                });
            });
        }
    }
    var handleMasonryBoxLoop = function() {
        for (var i = 1; i <= 10; i++) {
            handleMasonryBox(i);
        }
    }
    var counter = function() {
        if (jQuery('.counter').length) {
            jQuery('.counter').counterUp({
                delay: 10,
                time: 3000
            });
        }
    }
    var handleVideo = function() {
        jQuery('iframe[src*="youtube.com"]').wrap('<div class="embed-responsive embed-responsive-16by9"></div>');
        jQuery('iframe[src*="vimeo.com"]').wrap('<div class="embed-responsive embed-responsive-16by9"></div>');
    }
    var handleFilterMasonary = function() {
        if (jQuery('#image-gallery-mix').length) {
            jQuery('.gallery-filter').find('li').each(function() {
                $(this).addClass('filter');
            });
            jQuery('#image-gallery-mix').mixItUp();
        };
        if (jQuery('.gallery-filter.masonary').length) {
            jQuery('.gallery-filter.masonary').on('click', 'span', function() {
                var selector = $(this).parent().attr('data-filter');
                jQuery('.gallery-filter.masonary span').parent().removeClass('active');
                jQuery(this).parent().addClass('active');
                jQuery('#image-gallery-isotope').isotope({
                    filter: selector
                });
                return false;
            });
        }
    }
    var handleBootstrapSelect = function() {
        if (jQuery('select').length > 0) {
            $('select').selectpicker();
        }
    }
    var handleBootstrapTouchSpin = function() {
        if (jQuery("input[name='demo_vertical2']").length) {
            jQuery("input[name='demo_vertical2']").TouchSpin({
                verticalbuttons: true,
                verticalupclass: 'ti-plus',
                verticaldownclass: 'ti-minus'
            });
        }
    }
    var handleBannerResize = function() {
        $(".full-height").css("height", $(window).height());
    }
    var handleCountDown = function(WebsiteLaunchDate) {
        if ($(".countdown").length) {
            $('.countdown').countdown({
                date: WebsiteLaunchDate + ' 23:5'
            }, function() {
                $('.countdown').text('we are live');
            });
        }
    }
    var handleCustomScroll = function() {
        if ((screenWidth > 768) && $(".content-scroll").length > 0) {
            $(".content-scroll").mCustomScrollbar({
                setWidth: false,
                setHeight: false,
                axis: "y"
            });
        }
    }
    var wow_animation = function() {
        if ($('.wow').length > 0) {
            var wow = new WOW({
                boxClass: 'wow',
                animateClass: 'animated',
                offset: 50,
                mobile: false
            });
            wow.init();
        }
    }
    var handleSideBarMenu = function() {
        $('.openbtn').on('click', function(e) {
            e.preventDefault();
            if ($('#mySidenav').length > 0) {
                document.getElementById("mySidenav").style.left = "0";
            }
            if ($('#mySidenav1').length > 0) {
                document.getElementById("mySidenav1").style.right = "0";
            }
        })
        $('.closebtn').on('click', function(e) {
            e.preventDefault();
            if ($('#mySidenav').length > 0) {
                document.getElementById("mySidenav").style.left = "-300px";
            }
            if ($('#mySidenav1').length > 0) {
                document.getElementById("mySidenav1").style.right = "-820px";
            }
        })
    }
    var priceslider = function() {
        if ($(".price-slide, .price-slide-2").length > 0) {
            $("#slider-range,#slider-range-2").slider({
                range: true,
                min: 300,
                max: 4000,
                values: [0, 5000],
                slide: function(event, ui) {
                    var min = ui.values[0],
                        max = ui.values[1];
                    $('#' + this.id).prev().val("$" + min + " - $" + max);
                }
            });
        }
    }
    var handleBGElements = function() {
        if (screenWidth > 1023) {
            if (jQuery('.bgeffect').length) {
                var s = skrollr.init({
                    edgeStrategy: 'set',
                    easing: {
                        WTF: Math.random,
                        inverted: function(p) {
                            return 1 - p;
                        }
                    }
                });
            }
        }
    }
    var boxHover = function() {
        jQuery('.box-hover').on('mouseenter', function() {
            jQuery('.box-hover').removeClass('active');
            jQuery(this).addClass('active');
        })
    }
    var reposition = function() {
        var modal = jQuery(this),
            dialog = modal.find('.modal-dialog');
        modal.css('display', 'block');
        dialog.css("margin-top", Math.max(0, (jQuery(window).height() - dialog.height()) / 2));
    }
    var handleResize = function() {
        jQuery(window).on('resize', function() {
            jQuery('.modal:visible').each(reposition);
            footerAlign();
        });
    }
    var handleSupport = function() {
        var support = '';
        jQuery('body').append(support);
    }
    var WebsiteLaunchDate = new Date();
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    WebsiteLaunchDate.setMonth(WebsiteLaunchDate.getMonth() + 1);
    var WebsiteLaunchDate = WebsiteLaunchDate.getDate() + " " + monthNames[WebsiteLaunchDate.getMonth()] + " " + WebsiteLaunchDate.getFullYear();
    var lightGallery = function() {
        if (($('#lightgallery, .lightgallery').length > 0)) {
            $('#lightgallery, .lightgallery').lightGallery({
                selector: '.check-km',
                loop: true,
                thumbnail: true,
                exThumbImage: 'data-exthumbimage'
            });
        }
    }
    var handleShowPass = function() {
        jQuery('.show-pass').on('click', function() {
            var inputType = jQuery(this).parent().find('.dz-password');
            if (inputType.attr('type') == 'password') {
                inputType.attr('type', 'text');
                jQuery(this).addClass('active');
            } else {
                inputType.attr('type', 'password');
                jQuery(this).removeClass('active');
            }
        });
    }
    var handleScreenLock = function() {
        jQuery('.navbar-toggler').on('click', function() {
            jQuery('body').toggleClass('screen-lock');
            jQuery('.styleswitcher, .DZ-theme-btn').toggleClass('hide');
        });
    }
    return {
        init: function() {
            boxHover();
            wow_animation();
            priceslider();
            onePageLayout();
            dzTheme();
            handleResizeElement();
            homeSearch();
            MagnificPopup();
            handleAccordian();
            scrollTop();
            footerAlign();
            fileInput();
            headerFix();
            handleVideo();
            handleCountDown(WebsiteLaunchDate);
            handleCustomScroll();
            handleScreenLock();
            handleShowPass();
            handleSideBarMenu();
            cartButton();
            handleBannerResize();
            handleResize();
            lightGallery();
            handleMasonryBoxLoop();
            jQuery('.modal').on('show.bs.modal', reposition);
        },
        load: function() {
            handleBGElements();
            handleBootstrapSelect();
            handleBootstrapTouchSpin();
            counter();
            handleSupport();
            handleMasonryBoxLoop();
        },
        resize: function() {
            screenWidth = $(window).width();
            dzTheme();
            handleSideBarMenu();
            handleResizeElement();
        }
    }
}();
jQuery(document).ready(function() {
    sportsZone.init();
    jQuery('.navicon').on('click', function() {
        $(this).toggleClass('open');
    });
    $('a[data-bs-toggle="tab"]').click(function() {
        $('a[data-bs-toggle="tab"]').click(function() {
            $($(this).attr('href')).show().addClass('show active').siblings().hide();
        })
    });
});
jQuery(window).on("load", function(e) {
    sportsZone.load();
    setTimeout(function() {
        jQuery('#loading-area').remove();
    }, 300);
});
jQuery(window).on('resize', function() {
    sportsZone.resize();
});