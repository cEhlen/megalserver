(function () {
  "use strict";
  var currentReport = '';
  $('#navTabs a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
	if($(this).attr('href') === '#megal'){
		loadMegal();
	}
	else if($(this).attr('href') === '#config'){
		$('#conf-warn').html('');
		loadConf();
	}
  });
  
  function loadMegal(){
	$.ajax({url: currentReport + '.megal'}).done(function(data){
		$('#megal-code').html(data);
	});
  }
  
  function loadConf(){
	$.ajax({url: currentReport.substring(0, currentReport.lastIndexOf('/') + 1) + 'mega.conf'}).done(function(data){
		$('#megal-conf').html(data);		
	}).fail(function(){
		$('#conf-warn').html('mega.conf not found. Loading default.');
		$.ajax({url:  'files/megal/application.conf'}).done(function(data){
			$('#megal-conf').html(data);		
	})
	});
  }
  
  function addFunctionalityToEachLink () {
    $('.megalLink').each(function () {
      var self = $(this);
      $(this).click(function (e) {
        e.preventDefault();
		$('#navTabs a[href=\"#report\"]').click();
		currentReport = self.attr('data-path').substring(0,self.attr('data-path').lastIndexOf('.'));
        loadReport(self.attr('data-path'));
      });
    });
  }

  function loadReport (path) {
    Handlebars.registerHelper('src', function(text) {
      //var result = hljs.highlight('python', text).value;
      var result = "<pre><code>"+text+"</pre></code>";
      return new Handlebars.SafeString(result);
    });

    $.getJSON(path, function(json) {
      $('#reportTable').empty();
      var html = _.map(json.events, function(e){
        var source   = $("#"+e.event).html();
        var template = Handlebars.compile(source);
        return template(e);
      });
      $('#reportTable').append(html);
      $('pre code').each(function(i, e) {hljs.highlightBlock(e)});
    });
  }

  addFunctionalityToEachLink();
})();