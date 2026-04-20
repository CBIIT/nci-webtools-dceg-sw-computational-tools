(function() {

  var thisTool = $('#help');

  function toTop(){
      $('<a/>', { class: 'pull-right', href: '#toc', text: 'Top' }).appendTo(this);
  }

  $(function(){
      thisTool = $('#help');
      var glossary = $('#glossary');
      var keys = [];
      var terms = {};
      for (var term in $_Glossary) {
        if (keys.indexOf(term.toUpperCase()) < 0) {
          keys.push(term.toUpperCase());
          terms[term.toUpperCase()] = $_Glossary[term];
        }
      }
      keys = keys.sort();
      for (var index in keys) {
        index = keys[index];
        var paragraph = $('<p/>');
        $('<b/>').text(terms[index].fullName + ':').appendTo(paragraph);
        $('<span/>').text(' ' + (terms[index].glossaryDefinition || terms[index].definition)).appendTo(paragraph);
        paragraph.appendTo(glossary);
      }
      thisTool.find('h4').each(toTop);
  });

  $('a[href="#help"]').on('shown.bs.tab',function(e){
      thisTool = $("#help");
  });

  $('.goToTopic').on('click', function(){
      goToTarget(this);
  });

})();