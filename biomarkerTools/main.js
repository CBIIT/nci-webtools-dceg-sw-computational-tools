if (typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
  };
}

var default_ajax_error;
var rest = "biomarkerToolsRest"; 
var activeRequest = false; 
var custom_po_tmpl = "<div class='popover' role='tooltip'><div class='arrow'></div><h3 class='popover-title'></h3><div class='popover-content'></div></div>";
var allowedRequireModules = {
  bc: true,
  meanstorisk: true,
  riskStratAdvanced: true,
  meanRiskStratification: true,
  help: true,
};

function getSafeHashId(rawHash) {
  if (typeof rawHash !== 'string') {
    return null;
  }
  var normalized = rawHash.trim().replace(/^#/, '');
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(normalized)) {
    return null;
  }
  return normalized;
}

function getSafeElementIdFromHash(rawHash) {
  var id = getSafeHashId(rawHash);
  if (!id) {
    return null;
  }
  return document.getElementById(id) ? id : null;
}

function requireSafeModule(moduleId) {
  if (allowedRequireModules[moduleId]) {
    require([moduleId]);
  }
}

function disableAll(){
  activeRequest = true;
  $("a, button,select,input").attr("disabled","").addClass("disable_control");

  $("[data-toggle='tab']").attr("data-toggle", "disabledTab");
  $("[data-toggle='collapse']").attr("data-toggle", "disabledCollapse");
}

function enableAll() {
  activeRequest = false;
  $("a, button, select, input").removeAttr("disabled").removeClass("disable_control");
  $(".disable_control").unbind("click");

  $("[data-toggle='disabledTab']").attr("data-toggle", "tab");
  $("[data-toggle='disabledCollapse']").attr("data-toggle", "collapse");
}

function generateUniqueKey(){
  // Math.seedrandom();
  var multiples = [100, 1000, 10000, 100000, 1000000, 10000000,100000000, 1000000000];
  var randomKey = Math.floor(Math.random() * multiples[Math.floor(Math.random() * multiples.length)]);

  return randomKey;
}

$(document).ready(function(){
  this.title = "Biomarker Tools: Home";
});

$(document).on('hide.bs.tab', function (e) {
  if (!e.relatedTarget || !e.relatedTarget.hash) {
    return;
  }
  var safeId = getSafeElementIdFromHash(e.relatedTarget.hash);
  if (!safeId) {
    return;
  }
  if (safeId !== "home" && safeId !== "help") {
    thisTool = $('#' + safeId);
  }
});

$(document).on('shown.bs.tab', function (e) {
  if(e.target.hash !== undefined){
    var id = getSafeHashId(e.target.hash.toString());
    if (id && id !== 'home') {
      requireSafeModule(id);
    }
  }
});

$('#contentTabs .nav-tabs').on('show.bs.tab', function(el){
  var id = getSafeHashId(el.target.hash.toString());
  if (id && id !== 'home') {
    requireSafeModule(id);
  }
  var title = "Biomarker Tools: " + el.target.text;
  document.title = title;
});

$(document).on('click touchstart keydown', '.define', termDisplay).on('focus', function() {
    $(this).trigger('mouseover');
  }).on('blur', function() {
    $(this).trigger('mouseout');
  });

$('.disable_control').on('click',function(e){
  e.preventDefault();
});

$('.goToGlossary').on('click', function(el){
  var id = el.target.hash;
  var $this = this;

  $(".nav a[href='#help']").tab('show');
  $(".nav a[href='#help']").on('shown.bs.tab', function(){
    document.getElementById("header-glossary").scrollIntoView(true);
  });

});

$('.goToHelp').on('click', function(el){
  var $this = this;
  $(".nav a[href='#help']").tab('show');
  $(".nav a[href='#help']").on('shown.bs.tab', function(){
    var selector = getSafeElementIdFromHash($($this).attr('href').toString());
    if (selector) {
      document.getElementById(selector).scrollIntoView(true);
    }
  });
});

$('.goToTab').on('click', function(el){
  el.preventDefault();
  var ref = $(this).attr('href');
  var safeRefId = getSafeHashId(ref);
  if (!safeRefId) {
    return;
  }
  $('.nav li.active').removeClass('active');
  $(".nav a[href='#" + safeRefId + "']").tab('show').parent().addClass('active');
  if (safeRefId !== 'home') {
    requireSafeModule(safeRefId);
  }
});


function goToTarget(tar) {
  if (!tar || typeof tar.hash !== 'string') {
    return;
  }
  var safeTarget = getSafeElementIdFromHash(tar.hash);
  if (safeTarget) {
    document.getElementById(safeTarget).scrollIntoView(true);
  }
}

function default_ajax_error(request, status, error){
  var logError;
  try {
    logError = JSON.parse(request.responseText).error;
  } catch (e) {
    logError = error;
  }
  display_errors([logError]);
}

function isNumberBetweenZeroAndOne(n) {
  if(isNaN(n))
    return false;
  if (isNaN(parseFloat(n)))
    return false;
  if (n >= 1)
    return false;
  if (n <= 0)
    return false;
  return true;
}

function isInt(n){
  return Number(n) == n && n % 1 === 0;
}

function display_errors(message) {
  var errors = [];
  if ($.isArray(message) && message.length > 0) {
    $(message).each(function (i, v) {
      errors.push(String(v));
    });
  } else if (typeof message == "string") {
    errors.push(message);
  }
  if(thisTool.find('#errors').length > 0){
    thisTool.find("#errors").empty().remove();
  }

  var errorBox = $('<div/>', {
    id: 'errors',
    class: 'alert alert-danger fade in'
  });
  var list = $('<ul/>', { class: 'list-unstyled' });
  if (errors.length === 0) {
    list.append($('<li/>').text('An unexpected error occurred.'));
  } else {
    $(errors).each(function (i, v) {
      list.append($('<li/>').text(v));
    });
  }
  errorBox.append(list);

  thisTool.find("#helpGlossaryLinks").after(errorBox);

  thisTool.find('#errors').fadeIn();
  document.querySelector('header').scrollIntoView(true);
}
