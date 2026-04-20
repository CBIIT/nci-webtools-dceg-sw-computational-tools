(function() {
  var thisTool = $("#meanRiskStratification");

  /** Bootstrap sets aria-expanded on panel divs (invalid); remove from collapsible regions only. */
  function stripMrsCollapseRegionAria() {
    thisTool.find('.accordion .panel-collapse.collapse').removeAttr('aria-expanded');
  }

  init_meanRiskStratification();
  function init_meanRiskStratification() {
    thisTool = $("#meanRiskStratification");
    thisTool.on('show.bs.collapse','.option-1', function() {
      $(this).next().next().collapse('hide');
    })
    thisTool.on('show.bs.collapse','.option-2', function() {
      $(this).prev().prev().collapse('hide');
    })
    thisTool.off('shown.bs.collapse.mrsAria hidden.bs.collapse.mrsAria', '.panel-collapse.collapse')
      .on('shown.bs.collapse.mrsAria hidden.bs.collapse.mrsAria', '.panel-collapse.collapse', function() {
        $(this).removeAttr('aria-expanded');
      });
    stripMrsCollapseRegionAria();
  }
  
  $(document).ready(init_meanRiskStratification);
  
  // after panel show finishes
  $('a[href="#meanRiskStratification"]').on('shown.bs.tab', function(e) {
    thisTool.find("#spinner").addClass("hide");
    controls_visibility();
    init_meanRiskStratification();
  });
  
  thisTool.find("#errors").alert();
  // testing
  thisTool.find('a#test1,a#test2').on('click', test);
  thisTool.find('#reset').on('click', reset_mrs);
  thisTool.find('#add-marker').on('click', new_marker);
  thisTool.find('#delete-marker').on('click', delete_marker);
  thisTool.find('#calculate').on('click', calculate_mrs);
  
  function controls_visibility() {
    var controlGroup = thisTool.find('#control-group');
    var numElements = controlGroup.prev().children().length;
    controlGroup = controlGroup.children(':first').children(':not(:last)');
    switch (numElements) {
      case 1:
        controlGroup.eq(0).removeClass('hide');
        controlGroup.eq(1).addClass('hide');
        break;
      case 2:
        controlGroup.eq(0).removeClass('hide');
        controlGroup.eq(1).removeClass('hide');
        break;
      case 3:
        controlGroup.eq(0).addClass('hide');
        controlGroup.eq(1).removeClass('hide');
        break;
    }
  }
  
  function new_marker(e) {
    e.preventDefault()
    var numElements = thisTool.find('#markers').children().length + 1;
    if (numElements < 4) {
      var markerTemplate = thisTool.find('#markers').children(':first-child');
      var newElement = markerTemplate.clone();
      var elementId = 'marker-' + numElements;
      newElement.attr('id', elementId);
      newElement.find('label, input, select').each(function () {
        var newId = this.id + '-bm-' + numElements;
        switch ($(this).prop('tagName')) {
          case 'input':
            $(this).attr('for', this.htmlFor + '-bm-' + numElements);
            break;
          case 'label':
            $(this).attr('id', newId);
            $(this).val('');
            break;
          case 'select':
            $(this).attr('id', newId);
            this.selectedIndex = 0;
            break;
        }
      });
      newElement.find('[data-target]').each(function() {
        $(this).attr('data-target',$(this).attr('data-target').replace($(this).attr('data-parent'),'#'+elementId))
        $(this).attr('data-parent','#'+elementId);
      });
      newElement.find('.option-1.panel-collapse').attr('id', elementId + '-option-1');
      newElement.find('.option-2.panel-collapse').attr('id', elementId + '-option-2');
      newElement.find('[data-toggle="collapse"]').each(function() {
        var $a = $(this);
        var target = $a.attr('data-target') || '';
        if (target.indexOf('option-1') !== -1) {
          $a.attr('aria-controls', elementId + '-option-1');
        } else if (target.indexOf('option-2') !== -1) {
          $a.attr('aria-controls', elementId + '-option-2');
        }
      });
      newElement.find('.panel-heading:first').text('Biomarker #' + numElements);
  
      $(newElement).insertAfter(thisTool.find('#markers').children(':last-child'));
      controls_visibility();
    }
  }
  
  function delete_marker(e) {
    e.preventDefault();
    var markers = thisTool.find('#markers').children();
    var numElements = markers.length;
    if (numElements > 1) {
      markers.last().empty().remove();
      thisTool.find('.bm_'+numElements).addClass("hide");
      controls_visibility();
    }
  }
  
  function calculate_mrs(e) {
    e.preventDefault();
    var service;
    var valuesObj = extract_values(false);
    var valid = valuesObj[1]; // get the boolean value that was returned
    if (valid) {
      thisTool.find("#results, .bm_1, .bm_2, .bm_3").addClass("hide");
      var to_value = 10 * 2500; //25 seconds
      var input = JSON.stringify(valuesObj[0]);
  
      //service = "http://" + window.location.hostname + "/" + rest + "/meanRiskStratification/";
      service = window.location.protocol + '//' + window.location.host + window.location.pathname + rest + "/meanRiskStratification/";
  
      thisTool.find('#spinner').removeClass("hide");
      thisTool.find('#calculate').attr("disabled", "").text("Please Wait....");
      disableAll();
      // ajax call, change to actual service name
      var promise = $.ajax({
        dataType: 'json',
        method: 'POST',
        contentType: 'application/json',
        url: service,
        data: input
      }).then(clean_data, function (request, status, error) {
        default_ajax_error(request, status, error);
      }).done(return_data).always(function(){
        enableAll();
        thisTool.find('#spinner').addClass("hide");
        thisTool.find('#calculate').removeAttr("disabled").text("Calculate");
      });
    }
  }
  
  function clean_data(data) {
    // check to make sure json is in the right format
    return JSON.parse(JSON.stringify(data));
  }
  
  function return_data(data) {
    var numElements = thisTool.find('#markers').children().length;
    for (var i = 1; i < numElements + 1; i++) {
      $('.bm_' + i).removeClass("hide");
    }
  
    $.each(data, function (propName, paramGroup) {
      var ci_lb, ci_ub, params, calc, marker_id;
      for (var i = 1; i < numElements + 1; i++) {
        var markerValue = thisTool.find('#marker-' + i + ' [name="name-input"]').val();
        var name = markerValue.length > 0 ? markerValue + " (CI Low, CI High)" : "Biomarker " + i + " (CI Low, CI High)";
        thisTool.find('.marker_name.bm_' + i).attr('title', name).text(name);
      }
  
      params = paramGroup.parameters;
      calc = paramGroup.calculations;
      marker_id = propName;
  
      // loop through appending data to table
      $.each(params, function (name) {
        var lookup_id = lookup[name];
        var data_item = params[name];
        var formattedText = data_item.Value;
        if (lookup_id != 'rr' && lookup_id != 'nnr' && lookup_id != 'nns' && lookup_id != 'nnt') {
          formattedText += "% ";
          if (data_item["Confidence Interval (lower bound)"] !== null && data_item["Confidence Interval (upper bound)"] !== null) {
            ci_lb = data_item["Confidence Interval (lower bound)"];
            ci_ub = data_item["Confidence Interval (upper bound)"];
            formattedText += "(" + ci_lb + "%, " + ci_ub + "%)";
          }
        } else if (data_item["Confidence Interval (lower bound)"] !== null && data_item["Confidence Interval (upper bound)"] !== null) {
          ci_lb = data_item["Confidence Interval (lower bound)"];
          ci_ub = data_item["Confidence Interval (upper bound)"];
          formattedText += " (" + ci_lb + ", " + ci_ub + ")";
        }
        // append text to table cell
        cell = $('.' + lookup_id + '_result.' + marker_id + '.output_field');
        cell.attr('title', name + " " + formattedText);
        cell.text(formattedText);
      });
      // same loop but through calculations
      $.each(calc, function (name) {
        var lookup_id = lookup[name];
        var data_item = calc[name];
        var formattedText = data_item.Value;
  
        if (lookup_id != 'rr' && lookup_id != 'nnr' && lookup_id != 'nns' && lookup_id != 'nnt') {
          formattedText += "% ";
          if (data_item["Confidence Interval (lower bound)"] !== null && data_item["Confidence Interval (upper bound)"] !== null) {
            ci_lb = data_item["Confidence Interval (lower bound)"];
            ci_ub = data_item["Confidence Interval (upper bound)"];
            formattedText += "(" + ci_lb + "%, " + ci_ub + "%)";
          }
        } else if (data_item["Confidence Interval (lower bound)"] !== null && data_item["Confidence Interval (upper bound)"] !== null) {
          ci_lb = data_item["Confidence Interval (lower bound)"];
          ci_ub = data_item["Confidence Interval (upper bound)"];
          formattedText += " (" + ci_lb + ", " + ci_ub + ")";
        }
  
        cell = thisTool.find('.' + lookup_id + '_result.' + marker_id + '.output_field');
        cell.attr('title', name + " " + formattedText);
        cell.text(formattedText);
      });
    });
  
    thisTool.find("#results").removeClass("hide");
    thisTool.find("#spinner").addClass("hide");
  }
  
  function extract_values(valid) {
    var values = {};
  
    var numElements = thisTool.find('#markers').children().length;
    for (var i = 1; i < numElements + 1; i++) {
      values["bm_" + i] = {};
      var thisMarker = thisTool.find('#marker-' + i);
  
      // inside this marker find inputs by group
      var option_1_controls = thisMarker.find('.option-1 .input_field').serializeArray(); // option 1
      var option_2_controls = thisMarker.find('.option-2 .input_field').serializeArray(); // option 2
      option_1_controls.forEach(function (element) {
        // don't add empty values to object
        if (element.value.length > 0) {
          values["bm_" + i].option = 1;
          values["bm_" + i][element.name] = element.value;
        }
      });
  
      // check option variable
      if (!values["bm_" + i].option) {
  
        // apply option flag
        values["bm_" + i].option = 2;
        var param_1 = [];
        var param_2 = [];
        var param_3 = [];
        var param_4 = [];
        option_2_controls.filter(function (obj) {
          if (obj.value && obj.value.length > 0) {
            switch (obj.name) {
              case "param_1":
                param_1.push(obj);
                break;
              case "param_2":
                param_2.push(obj);
                break;
              case "param_3":
                param_3.push(obj);
                break;
              case "sampsize":
                param_4.push(obj);
                break;
            }
          }
        });
        if (param_1.length > 1 && param_2.length > 1 && param_3.length > 1 && param_4.length > 0) {
          // sample size
          values["bm_" + i][param_4[0].name] = param_4[0].value;
  
          var value_length = [param_1[1].value.length, param_2[1].value.length, param_3[1].value.length];
  
          value_length.forEach(function (el) {
            if (el > 0) {
              valid = false;
              // manually mapping each value pair
              joinObjects(values["bm_" + i], param_1[0], param_1[1]);
              joinObjects(values["bm_" + i], param_2[0], param_2[1]);
              joinObjects(values["bm_" + i], param_3[0], param_3[1]);
            }
          });
        }
  
      }
    }
  
    valid = validate(values);
    return [values, valid];
  }
  
  function joinObjects(parentObj, obj1, obj2) {
    // takes in two objects extracts the value from obj1 as
    // the new key and the value from obj2 as the new value
    parentObj[obj1.value] = obj2.value;
    return parentObj;
  }
  
  function reset_mrs(e) {
    e.preventDefault();
    thisTool.find("#spinner").addClass('hide');
    // resets form to initial state
    var markerChildren = thisTool.find('#markers').children();
  
    // reset drop downs then, text boxes, hide results, then clear the cells
    markerChildren.find('select').find('option:first').attr('selected', 'selected');
    markerChildren.find('input').val('');
  
    // clear all output cells
    thisTool.find('.output_field').text('').attr("title", "");
    thisTool.find('#paramTable th:gt(1), #calcTable th:gt(1)').attr("title", '(Biomarker Title Placeholder)').text('(Biomarker Title Placeholder)');
    thisTool.find('#results, .bm_1, .bm_2, .bm_3').addClass("hide");
  
    // close errors if showing
    thisTool.find('#errors').fadeOut();
  
    thisTool.find("#calculate").removeAttr("disabled").text("Calculate");
  
    reset_markers();
  }
  
  function reset_markers(){
    // remove generated markers first, .remove() doesn't remove element from DOM
    thisTool.find('#markers').children(':not(:first)').each(function () {
      $(this).empty().remove();
    });
    controls_visibility();
  }
  $(document).ready(function() {
    thisTool.find("select").on('change', function() {
      $(this).parent().prev().attr('data-term',$(this).val());
    });
  });
  
  var lookup = {
      "Danger": "concern",
      "Reassurance": "reassurance",
      "Quality of the sensitvity": "q_sens",
      "Quality of the specificity": "q_spec",
      "Mean Risk Stratification": "mrs",
      "Maximum possible MRS": "max_mrs",
      "Population Burden Stratification": "pbs",
      "Number Needed to Recruit": "nnr",
      "Number Needed to Screen": "nns",
      "Number Needed to Test": "nnt",
      "a": "a",
      "b": "b",
      "c": "c",
      "d": "d",
      "P(D+,M+)": "d_pos",
      "P(D+,M-)": "pos_d_neg_m",
      "P(D-,M+)": "neg_d_pos_m",
      "P(D-,M-)": "m_neg",
      "Marker Positivity": "prob_m",
      "Disease Prevalence": "prob_d",
      "Positive Predictive Value": "ppv",
      "complement of the Negative Predictive Value": "c_npv",
      "Sensitivity": "sens",
      "Specificity": "spec",
      "complement of the Specificity": "c_spec",
      "RR": "rr",
      "Risk Difference": "r_diff",
      "Youden": "youden",
      "Area Under the Curve": "auc",
      "Confidence Interval (lower bound)": "ci_lb",
      "Confidence Interval (upper bound)": "ci_ub",
      "Value":"value",
      "Test":"test"
  };
  var values_option_1_bm = [
    {"markerName": "HPV", "a": 471, "b": 13, "c": 4680, "d": 25207},
    {"markerName": "Pap", "a": 466, "b": 25, "c": 4484, "d": 25396},
    {"markerName": "VIA", "a": 270, "b": 225, "c": 2967, "d": 26909}
  ];
  
  var values_option_2_bm = [{
      "markerName": "HPV",
      "ppv": 0.0914,
      "npv": 0.9995,
      "prob_m": 0.1696,
      "sampsize": 30371
    }, {
      "markerName": "Pap",
      "ppv": 0.0941,
      "npv": 0.9990,
      "prob_m": 0.163,
      "sampsize": 30371
    }, {
      "markerName": "VIA",
      "ppv": 0.0834,
      "npv": 0.9917,
      "prob_m": 0.1066,
      "sampsize": 30371
    }];
  
  function setup_test(e) {
    reset_mrs(e);
    new_marker(e);
    new_marker(e);
  }
  
  function test(e) {
    e.preventDefault();
    setup_test(e);
    // capture what element triggered test function
    var choice = $(this).prop('id');
  
    thisTool.find('#markers').children().each(function (key, markerElement) {
      var id = $(this).find('.collapse.in').prop('id');
      var index = key + 1; // biomarker ids are not zero based
  
      switch (choice) {
        case 'test1':
          thisTool.find('#marker-' + index + ' .option-1').collapse('show');
          var dataItem = values_option_1_bm[key];
          $(markerElement).find('[name="name-input"]').val(dataItem.markerName);
          $(markerElement).find("[name='a']").val(dataItem.a);
          $(markerElement).find("[name='b']").val(dataItem.b);
          $(markerElement).find("[name='c']").val(dataItem.c);
          $(markerElement).find("[name='d']").val(dataItem.d);
          break;
        case 'test2':
          thisTool.find('#marker-' + index + ' .option-2').collapse('show');
          var dataItem = values_option_2_bm[key];
          $(markerElement).find('input[name="name-input"]').val(dataItem.markerName);
          $(markerElement).find('input[name="sampsize"]').val(dataItem.sampsize);
          $(markerElement).find('input[name="param_1"]').val(dataItem.ppv);
          $(markerElement).find('input[name="param_2"]').val(dataItem.npv);
          $(markerElement).find('input[name="param_3"]').val(dataItem.prob_m);
          break;
      }
    });
    // collapse('show') on an already-open panel returns before shown.bs.collapse; Collapse ctor still runs addAriaAndCollapsedClass.
    setTimeout(stripMrsCollapseRegionAria, 0);
  }
  function validate(values) {
    var valid = true;
    var messages = [];
  
    thisTool.find("#errors").empty();
  
    var $this = document.getElementsByTagName('form').markers;
    var invalidElements = $($this).find(':invalid');
  
    for (var item in values) {
      var marker_value_keys = Object.keys(values[item]);
      // object will always have one option property so check for less than 2
      if (marker_value_keys.length < 2) {
        valid = false;
        messages.push('You must enter values for either option 1 or 2 in each biomarker.');
      }
      if (values[item].prob_d && values[item].ppv && values[item].npv) {
        var minProbD, maxProbD;
        var cnpv = parseFloat((1 - values[item].npv).toFixed(4));
        if (values[item].ppv > cnpv) {
          minProbD = cnpv;
          maxProbD = values[item].ppv;
        } else {
          minProbD = values[item].ppv;
          maxProbD = cnpv;
        }
        if (values[item].prob_d <= minProbD || values[item].prob_d >= maxProbD) {
          messages.push("Disease Prevalence must be between the PPV (" + values[item].ppv + ") and cNPV (" + cnpv + ").");
        }
      } else if (values[item].prob_m && values[item].sens && values[item].spec) {
        var minProbM, maxProbM;
        var cspec = parseFloat((1 - values[item].spec).toFixed(4));
        if (values[item].sens > cspec) {
          minProbM = cspec;
          maxProbM = values[item].sens;
        } else {
          minProbM = values[item].sens;
          maxProbM = cspec;
        }
        if (values[item].prob_m <= minProbM || values[item].prob_m >= maxProbM) {
          messages.push("Marker Positivity must be between the Sensitivity (" + values[item].sens + ") and the compliment of the Specificity (" + cspec + ").");
        }
      }
    }
  
    for (var i = 0; i != invalidElements.length; i++) {
      var text;
      valid = invalidElements[i].valid;
      var validityObj = invalidElements[i].validity;
      if (validityObj.badInput) {
        text = "The value you entered contains an invalid character. " +
          invalidElements[i].validationMessage;
      }
      if (validityObj.patternMismatch) {
        text = "The value you entered '" + invalidElements[i].value + "' contains an invalid character. " +
          invalidElements[i].validationMessage;
      }
      if (validityObj.rangeOverflow || validityObj.rangeUnderflow) {
        if (invalidElements[i].min && invalidElements[i].max) {
          text = "The value you entered '" + invalidElements[i].value + "' must be decimal value between " +
            invalidElements[i].min + " and " + invalidElements[i].max;
        }
        else if (invalidElements[i].min && !invalidElements[i].max) {
          text = "The value you entered '" + invalidElements[i].value + "' must be decimal value greater than " +
            invalidElements[i].min;
        }
        else {
          text = "The value you entered '" + invalidElements[i].value + "' must be decimal value less than " +
            invalidElements[i].max;
        }
      }
      // prevent duplicate messages
      if ($.inArray(text, messages) == -1) messages.push(text);
    }
  
    if (messages.length > 0) {
      valid = false;
      display_errors(messages);
    }
    else thisTool.find("#errors").fadeOut();
  
    return valid;
  }
})()
