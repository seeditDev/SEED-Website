 jQuery(function($) { // DOM is now read and ready to be manipulated
  
    //Tab to top
    $(window).scroll(function() {
    if ($(this).scrollTop() > 1){  
        $('.scroll-top-wrapper').addClass("show");
    }
    else{
        $('.scroll-top-wrapper').removeClass("show");
    }
});
    $(".scroll-top-wrapper").on("click", function() {
     $("html, body").animate({ scrollTop: 0 }, 600);
    return false;
});


 $('.navbar .dropdown').hover(function() {
      $(this).find('.dropdown-menu').first().stop(true, true).slideDown(150);
    }, function() {
      $(this).find('.dropdown-menu').first().stop(true, true).slideUp(105)
    });




equalheight = function(container){

var currentTallest = 0,
     currentRowStart = 0,
     rowDivs = new Array(),
     $el,
     topPosition = 0;
 $(container).each(function() {

   $el = $(this);
   $($el).height('auto')
   topPostion = $el.position().top;

   if (currentRowStart != topPostion) {
     for (currentDiv = 0 ; currentDiv < rowDivs.length ; currentDiv++) {
       rowDivs[currentDiv].height(currentTallest);
     }
     rowDivs.length = 0; // empty the array
     currentRowStart = topPostion;
     currentTallest = $el.height();
     rowDivs.push($el);
   } else {
     rowDivs.push($el);
     currentTallest = (currentTallest < $el.height()) ? ($el.height()) : (currentTallest);
  }
   for (currentDiv = 0 ; currentDiv < rowDivs.length ; currentDiv++) {
     rowDivs[currentDiv].height(currentTallest);
   }
 });
}

$(window).load(function() {
  equalheight('.eq-blocks');
});


$(window).resize(function(){
  equalheight('.eq-blocks');
});

jQuery(function($) {
	 $('.wpcf7-select option[value="Online Training"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Classroom Training - Chennai"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Classroom Training - Coimbatore"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Classroom Training - Madurai"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Corporate Training"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Trending Courses"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="RPA Technologies"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Cloud Computing"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Big Data"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Web Design & Development"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Programming"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Mobile Application"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Software Testing Technologies"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Microsoft Technologies"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="JAVA"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Database"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Networking & Cyber Security"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Digital Marketing Training"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Finance & Accounting"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Business Intelligence & Data Warehousing"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Language & Proficiency Exam"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Career Development"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="CRM & BPM Tools"]').attr('disabled','disabled');
	 $('.wpcf7-select option[value="Others"]').attr('disabled','disabled');
	 
});

$(function () {
    var resultListItemjo = "#jobopeningdetails div.job-openings";
    var itemCountjo = $(resultListItemjo).size();
    x = 10;
  
    $(resultListItemjo + ':lt(' + x + ')').show();
  
    $('#load-more-jo-results').click(function () {
        x = (x + 1 <= itemCountjo) ? x + 1 : itemCountjo;
        $(resultListItemjo + ':lt(' + x + ')').show();
		$("#show-less-jo-results").addClass("active");
    });
  
    $('#show-less-jo-results').click(function () {
		var lmcount = x;
		//console.log("sdfdasf " + lmcount);
		 x = ( x - lmcount < 1 ) ? 10 : x - lmcount;
        //x = ( x - 1 < 0 ) ? 1 : x - 1;
        $(resultListItemjo).not(':lt(' + x + ')').hide();
		$('html, body').animate({
          'scrollTop' : $("#jobopen-btn").position().top
      	});
		$(this).removeClass('active');
    });
  
}); 

});

jQuery(function () {
    var resultListItem = "#testimonialrow div.col-md-4";
    var itemCount = $(resultListItem).size();
    x = 9;
  
    jQuery(resultListItem + ':lt(' + x + ')').show();
  
    jQuery('#load-more-results').click(function () {
        x = (x + 7 <= itemCount) ? x + 9 : itemCount;
        jQuery(resultListItem + ':lt(' + x + ')').show();
		$("#show-less-results").addClass("active");
    });
  
    jQuery('#show-less-results').click(function () {
		var slrcount = x;
		//console.log("sdfdasf " + slrcount);
		x = ( x - slrcount < 3 ) ? 9 : x - slrcount;
        //x = ( x - 3 < 0 ) ? 3 : x - 3;
        jQuery(resultListItem).not(':lt(' + x + ')').hide();
		$('html, body').animate({
          'scrollTop' : $("#show-less-results").position().top
      	});
		$(this).removeClass('active');
    });
  
});




