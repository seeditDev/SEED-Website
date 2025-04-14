
/**
* Template Name: Arsha - v2.2.1
* Template URL: https://bootstrapmade.com/arsha-free-bootstrap-html-template-corporate/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
!(function($) {
  "use strict";

  // Preloader
  

  // Smooth scroll for the navigation menu and links with .scrollto classes
  var scrolltoOffset = $('#header').outerHeight() - 2;
  $(document).on('click', '.nav-menu a, .mobile-nav a, .scrollto', function(e) {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      if (target.length) {
        e.preventDefault();

        var scrollto = target.offset().top - scrolltoOffset;
        if ($(this).attr("href") == '#header') {
          scrollto = 0;
        }

        $('html, body').animate({
          scrollTop: scrollto
        }, 1500, 'easeInOutExpo');

        if ($(this).parents('.nav-menu, .mobile-nav').length) {
          $('.nav-menu .active, .mobile-nav .active').removeClass('active');
          $(this).closest('li').addClass('active');
        }

        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
          $('.mobile-nav-overly').fadeOut();
        }
        return false;
      }
    }
  });

  // Activate smooth scroll on page load with hash links
  $(document).ready(function() {
    if (window.location.hash) {
      var initial_nav = window.location.hash;
      if ($(initial_nav).length) {
        var scrollto = $(initial_nav).offset().top - scrolltoOffset;
        $('html, body').animate({
          scrollTop: scrollto
        }, 1500, 'easeInOutExpo');
      }
    }
  });

  // Mobile Navigation
  if ($('.nav-menu').length) {
    var $mobile_nav = $('.nav-menu').clone().prop({
      class: 'mobile-nav d-lg-none'
    });
    $('body').append($mobile_nav);
    $('body').prepend('<button type="button" class="mobile-nav-toggle d-lg-none"><i class="icofont-navigation-menu"></i></button>');
    $('body').append('<div class="mobile-nav-overly"></div>');

    $(document).on('click', '.mobile-nav-toggle', function(e) {
      $('body').toggleClass('mobile-nav-active');
      $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
      $('.mobile-nav-overly').toggle();
    });

    $(document).on('click', '.mobile-nav .drop-down > a', function(e) {
      e.preventDefault();
      $(this).next().slideToggle(300);
      $(this).parent().toggleClass('active');
    });

    $(document).click(function(e) {
      var container = $(".mobile-nav, .mobile-nav-toggle");
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
          $('.mobile-nav-overly').fadeOut();
        }
      }
    });
  } else if ($(".mobile-nav, .mobile-nav-toggle").length) {
    $(".mobile-nav, .mobile-nav-toggle").hide();
  }

  // Navigation active state on scroll
  var nav_sections = $('section');
  var main_nav = $('.nav-menu, #mobile-nav');

  $(window).on('scroll', function() {
    var cur_pos = $(this).scrollTop() + 200;

    nav_sections.each(function() {
      var top = $(this).offset().top,
        bottom = top + $(this).outerHeight();

      if (cur_pos >= top && cur_pos <= bottom) {
        if (cur_pos <= bottom) {
          main_nav.find('li').removeClass('active');
        }
        main_nav.find('a[href="#' + $(this).attr('id') + '"]').parent('li').addClass('active');
      }
      if (cur_pos < 300) {
        $(".nav-menu ul:first li:first").addClass('active');
      }
    });
  });

  // Toggle .header-scrolled class to #header when page is scrolled
  $(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
      $('#header').addClass('header-scrolled');
    } else {
      $('#header').removeClass('header-scrolled');
    }
  });

  if ($(window).scrollTop() > 100) {
    $('#header').addClass('header-scrolled');
  }

  // Back to top button
  $(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
      $('.back-to-top').fadeIn('slow');
    } else {
      $('.back-to-top').fadeOut('slow');
    }
  });

  $('.back-to-top').click(function() {
    $('html, body').animate({
      scrollTop: 0
    }, 1500, 'easeInOutExpo');
    return false;
  });


})(jQuery);
(function($, document) {
    
      // get tallest tab__content element
      let height = -1;

    $('.tab__content').each(function() {
      height = height > $(this).outerHeight() ? height : $(this).outerHeight();
         $(this).css('position', 'absolute');
    });
      
      // set height of tabs + top offset
    $('[data-tabs]').css('min-height', height + 40 + 'px');
   
}(jQuery, document));


// window.onscroll = function() {myFunction()};

// var navbar = document.getElementById("navbar");
// var sticky = navbar.offsetTop;

// function myFunction() {
//   if (window.pageYOffset >= sticky) {
//     navbar.classList.add("sticky")
//   } else {
//     navbar.classList.remove("sticky");
//   }
// }

function myMoreFunction() {
  var dots = document.getElementById("dots");
  var moreText = document.getElementById("more");
  var btnText = document.getElementById("myBtn");
  var divShow = document.getElementById("trainerProfileHide");
  var divHide = document.getElementById("trainerProfile");
  var divHeight = document.getElementById("testingDivHeight");

  if (dots.style.display === "none") {
    dots.style.display = "inline";
    btnText.innerHTML = "Read more"; 
    moreText.style.display = "none";
    divHide.style.display = "block";
    divShow.style.display = "none";
    divHeight.style.height = "1300px";
    divHeight.classList.remove("mobile_width")
  } else {
   	dots.style.display = "none";
    btnText.innerHTML = "Read less"; 
    moreText.style.display = "inline";
    divHide.style.display = "none"; 
    divShow.style.display = "block";
    divHeight.style.height = "2750px";
     divHeight.classList.add("mobile_width")
  }
  
}

function myMoreNewFunction() {
  var dotsNew = document.getElementById("dotsNew");
  var moreTextNew= document.getElementById("moreNew");
  var btnTextNew = document.getElementById("myBtnNew");

  if (dotsNew.style.display === "none") {
    dotsNew.style.display = "inline";
    btnTextNew.innerHTML = "Read more"; 
    moreTextNew.style.display = "none";
  } else {
    dotsNew.style.display = "none";
    btnTextNew.innerHTML = "Read less"; 
    moreTextNew.style.display = "inline";
  }
}
function myExpandFunction() {
  var expand = document.getElementById("expand");
  var shrinkbtn= document.getElementById("shrinkbtn");
  var expandbtn = document.getElementById("expandbtn");

  if (expand.style.display === "none") {
    expand.style.display = "inline";
    expandbtn.innerHTML = "Read more"; 
    shrinkbtn.style.display = "none";
  } else {
    expand.style.display = "none";
    expandbtn.innerHTML = "Read less"; 
    shrinkbtn.style.display = "inline";
  }
}

function newFunction() {
  var more_dots = document.getElementById("more_dots");
  var moreNewBtn= document.getElementById("moreNewBtn");
  var more_btn = document.getElementById("more_btn");

  if (more_dots.style.display === "none") {
    more_dots.style.display = "inline";
    moreNewBtn.innerHTML = "Read more"; 
    more_btn.style.display = "none";
  } else {
    more_dots.style.display = "none";
    moreNewBtn.innerHTML = "Read less"; 
    more_btn.style.display = "inline";
  }
}
function BigParaFunction() {
  var big_para = document.getElementById("big_para");
  var paraBtn= document.getElementById("paraBtn");
  var big_para_show= document.getElementById("big_para_show");

  if (big_para.style.display === "none") {
    big_para.style.display = "inline";
    paraBtn.innerHTML = "Read more"; 
    big_para_show.style.display = "none";
  } else {
    big_para.style.display = "none";
    paraBtn.innerHTML = "Read less"; 
    big_para_show.style.display = "inline";
  }
}
function iqFunction() {
  var iq_start = document.getElementById("iq_start");
  var iqBtn= document.getElementById("iqBtn");
  var iq_expand= document.getElementById("iq_expand");

  if (iq_start.style.display === "none") {
    iq_start.style.display = "inline";
    iqBtn.innerHTML = "Read more"; 
    iq_expand.style.display = "none";
  } else {
    iq_start.style.display = "none";
    iqBtn.innerHTML = "Read less"; 
    iq_expand.style.display = "inline";
  }
}
function courseFunction() {
  var course_details = document.getElementById("course_details");
  var courseBtn= document.getElementById("courseBtn");
  var course_more= document.getElementById("course_more");

  if (course_details.style.display === "none") {
    course_details.style.display = "inline";
    courseBtn.innerHTML = "Read more"; 
    course_more.style.display = "none";
  } else {
    course_details.style.display = "none";
    courseBtn.innerHTML = "Read less"; 
    course_more.style.display = "inline";
  }
}
function digMarketFunction() {
  var digMarketMore = document.getElementById("digMarketMore");
  var digMarketBtn= document.getElementById("digMarketBtn");
  var digMarketExpand= document.getElementById("digMarketExpand");

  if (digMarketMore.style.display === "none") {
    digMarketMore.style.display = "inline";
    digMarketBtn.innerHTML = "Read more"; 
    digMarketExpand.style.display = "none";
  } else {
    digMarketMore.style.display = "none";
    digMarketBtn.innerHTML = "Read less"; 
    digMarketExpand.style.display = "inline";
  }
}


//new code starts here


