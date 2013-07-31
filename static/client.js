(function () {
  "use strict";

  $('#navTabs a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });

  function addFunctionalityToEachLink () {
    $('.megalLink').each(function () {
      var self = this;
      $(this).click(function (e) {
        e.preventDefault();
        loadReport(self.attributes[2].textContent);
      });
    });
  }

  addFunctionalityToEachLink(); 

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

})();