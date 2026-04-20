(function() {
  var oTable;
  var outputTable;
  var giRedraw = false;
  var aData;
  var numberOfRows;
  var uniqueKey;
  
  var old_value;
  var editing = false;
  var row;
  var col;
  var validPrevValue = false;
  var tableFirstColLabel;
  var tableFirstRowLabel;
  var validation_rules = [
    'Specificity, Sensitivity, PPV, cNPV, and Prevalence can only be 0 to 1',
    'Delta can be 0 to 5',
    'cNPV < Prevalence',
    'For arrays: max(cNPV) < min(Prevalence)',
    'Prevalence < PPV',
    'For arrays: max(prev) < min(PPV)',
    'Sensitivity+Specificity-1 > 0'
  ];
  var keysforfunctionnames = [ "", "Sens", "Spec", "PPV", "cNPV", "Prev", "Delta" ];
  var functionnames = [ "", "sensitivity", "specificity", "ppv", "cnpv", "prevalence", "delta" ];
  var invalidCombos = [ "delta-sensitivity-specificity", "cnpv-delta-ppv", "cnpv-ppv-prevalence", "cnpv-ppv-sensitivity", "cnpv-ppv-specificity", "delta-ppv-prevalence", "cnpv-delta-prevalence" ];
  var initialData = [ "", "0.8, 0.85,0.9, 0.95, 0.995", "0.6, 0.75, 0.8, 0.86, 0.92", "0.6, 0.7, 0.8, 0.9, 0.95", "0.39, 0.48, 0.59, 0.62, 0.78", "0.01, 0.05, 0.1", "1, 1.5, 2, 3" ];
  
  var validCombo = false;
  var rulesViolationMsg = [];
  
  var rfunctions = [ "SensPPVDelta", "SensPPVPrev", "SensSpecPPV", "SensPrevDelta", "SenscNPVDelta", "SenscNPVPrev", "SensSpeccNPV", "SensSpecPrev", "SpecPPVDelta", "SpecPPVPrev", "SpecPrevDelta", "SpeccNPVDelta", "SpeccNPVPrev" ];
  
  var keyShort = [ {
    1 : "Prevalence"
  }, {
    1 : 'Delta',
    2 : 'Specificity'
  }, {
    1 : 'Prevalence'
  }, {
    1 : 'PPV',
    2 : 'cNPV'
  }, {
    1 : 'Prevalence'
  }, {
    1 : 'Delta',
    2 : 'Specificity'
  }, {
    1 : 'Prevalence'
  }, {
    1 : 'PPV',
    2 : 'cNPV'
  }, {
    1 : 'Prevalence'
  }, {
    1 : 'Delta',
    2 : 'Sensitivity'
  }, {
    1 : 'PPV',
    2 : 'cNPV'
  }, {
    1 : 'Prevalence'
  }, {
    1 : 'Delta',
    2 : 'Sensitivity'
  } ];
  var keyLong = [
    {
      1 : "Prevalence given desired PPV, delta, and sensitivity",
      2 : "Specificity given desired PPV, delta, and sensitivity"
    },
    {
      1 : "Delta given desired PPV, prevalence, and sensitivity",
      2 : "Specificity given desired PPV, prevalence, and sensitivity"
    },
    {
      1 : "Prevalence given desired PPV, specificity, and sensitivity",
      2 : "Delta given desired PPV, specificity, and sensitivity"
    },
    {
      1 : "Positive Predictive Value given sensitivity, prevalence, and delta",
      2 : "Complement of the Negative Predictive Value given sensitivity, prevalence, and delta"
    },
    {
      1 : "Prevalence given desired cNPV, delta, and sensitivity",
      2 : "Specificity given desired cNPV, delta, and sensitivity"
    },
    {
      1 : "Delta given desired cNPV, prevalence, and sensitivity",
      2 : "Specificity given desired cNPV, prevalence, and sensitvity"
    },
    {
      1 : "Prevalence given desired cNPV, specificity, and sensitivity",
      2 : "Delta given specificity and sensitivity"
    },
    {
      1 : "Positive Predictive Value given sensitivity, specificity, and prevalence",
      2 : "Complement of the Negative Predictive Value given sensitivity, specificity, and prevalence"
    },
    {
      1 : "Prevalence given desired PPV, delta, and specificity",
      2 : "Sensitivity given desired PPV, delta, and specificity"
    },
    {
      1 : "Delta given desired PPV, prevalence, and specificity",
      2 : "Sensitivity given desired PPV, prevalence, and specificity"
    },
    {
      1 : "Positive Predictive Value given specificity, prevalence, and delta",
      2 : "Complement of the Negative Predictive Value given specificity, prevalence, and delta",
      3 : "Sensitivity given delta and specificity"
    }, {
      1 : "Prevalence given desired cNPV, delta, and specificity",
      2 : "Sensitivity given desired cNPV, delta, and specificity"
    }, {
      1 : "Delta given desired cNPV, prevalence, and specificity",
      2 : "Sensitivity given desired cNPV, prevalence, and specificity"
    } ];
  
  var thisTool = $("#riskStratAdvanced");
  var columnHeadings;
  var riskStratAdvanced = {excelFile: ''};
  
  
  $("a[href='#riskStratAdvanced']").on("shown.bs.tab",function(e){
    thisTool = $("#riskStratAdvanced");
  });
  
  $(function(){
    thisTool = $("#riskStratAdvanced");
  
    thisTool.find("select").on('change',function() {
      makeSelectionsUnique(this.id);
    });
  
    thisTool.find("#reset").on("click", resetPage);
    thisTool.find("input").keyup(checkInputFields);
    thisTool.find("input").change(checkInputFields);
    thisTool.find("#add-test-data").click(addTestData);
    thisTool.find("#download").on("click", function() {
      if (riskStratAdvanced.excelFile)
        window.location = riskStratAdvanced.excelFile;
      else
        display_errors(["There was a problem generating the excel file."]);
    });
    thisTool.find("#calculate").on("click", function(e) {
      e.preventDefault();
      riskStratAdvanced.excelFile = '';
      $("#errors, #download").addClass("hide");
      if (checkRules() == "Fail") {
        display_errors(validation_rules);
        return false;
      } else {
        calculate_riskStrat();
      }
    });
  });
  
  function addTestData() {
    thisTool.find("#independent_dropdown_rs").val("specificity");
    thisTool.find("#contour_dropdown_rs").val("prevalence");
    thisTool.find("#fixed_dropdown_rs").val("delta");
  
    makeSelectionsUnique("independent_dropdown_rs");
  
    thisTool.find("#independent_rs").val("0.6, 0.75, 0.8, 0.86, 0.92");
    thisTool.find("#contour_rs").val("0.01, 0.05, 0.1");
    thisTool.find("#fixed_rs").val("1, 1.5, 2, 3");
  
    thisTool.find(".variable-example").text("");
    addPopupDefinition();
  }
  
  function addPopupDefinition() {
    var termLookup = {
      ppv : "PPV",
      cnpv : "cNPV",
      sensitivity : "Sens",
      specificity : "Spec",
      delta : "Delta",
      prevalence : "DP"
    };
    var independent = thisTool.find("#independent_dropdown_rs").val();
    var contour = thisTool.find("#contour_dropdown_rs").val();
    var fixedValue = thisTool.find("#fixed_dropdown_rs").val();
    if (!!independent) {
      var independentTerm = termLookup[independent];
      createPopupDefinitionElement("indDef", independentTerm, independentTerm);
    } else {
      thisTool.find("#indDef").removeClass("show");
    }
    if (!!contour) {
      var contourTerm = termLookup[contour];
      createPopupDefinitionElement("contourDef", contourTerm, contourTerm);
    } else {
      thisTool.find("#contourDef").removeClass("show");
    }
    if (!!fixedValue) {
      var fixedValueTerm = termLookup[fixedValue];
      createPopupDefinitionElement("fvDef", fixedValueTerm, fixedValueTerm);
    } else {
      thisTool.find("#fvDef").removeClass("show");
    }
  }
  
  function createPopupDefinitionElement(elementId, termId, dataTerm) {
    var el = thisTool.find("#" + elementId);
    el.attr("name", termId).attr("data-term", dataTerm);
    el.attr("alt", "pop up definition for " + dataTerm);
  
    el.popover('destroy');
    el.unbind('click touchstart keydown', termDisplay);
    el.bind('click touchstart keydown', termDisplay);
  
  
  
  
  
  
         el.addClass('show');
  }
  
  function resetPopupDefinition() {
    thisTool.find("#indDef, #contourDef, #fvDef").removeClass("show");
  }
  
  function resetPage() {
    thisTool.find("#calculate").removeAttr("disabled").text("Calculate");
    makeSelectionsUnique("independent_dropdown_rs");
    thisTool.find("span.variable-example").text("");
    thisTool.find("option").removeAttr("disabled");
    thisTool.find("#errors, #spinner, #download").addClass("hide");
    thisTool.find("select").val("");
    thisTool.find("input").val("");
    thisTool.find(".output").empty();
    resetPopupDefinition();
  }
  
  function sortFloat(a, b) {
    return a - b;
  }
  
  function checkRules() {
  
    var overallStatus = "Pass";
    var numberOfRules = 5;
    var selectedVars = [];
    var values = [];
    var min = [];
    var max = [];
    rulesViolationMsg = [];
  
  
    var ids = thisTool.find("select").map(function() {
      return this.id;
    }).get();
  
    $.each(ids, function(key, elementId) {
      selectedVars.push(thisTool.find("#" + elementId).val());
    });
  
    ids = thisTool.find("input").map(function() {
      return this.id;
    }).get();
  
    $.each(ids, function(key, elementId) {
  
      userInput = $("#" + elementId).val();
      temp = userInput.split(",");
      for (var i; i < temp.length; i++) {
        values[key].push(parseFloat(temp[i]));
      }
  
      values[key] = temp;
      sorted = values[key].sort(sortFloat);
      min[key] = sorted[0];
      max[key] = sorted[sorted.length - 1];
    });
  
    thisTool.find(".rule").removeAttr("style");
    for (var ruleId = 1; ruleId <= numberOfRules; ruleId++) {
      if (checkRule(ruleId, selectedVars, values, min, max) == "Fail") {
        ruleClass = "rule" + ruleId;
        $("." + ruleClass).css("font-weight", "bold");
        overallStatus = "Fail";
      }
    }
  
    return overallStatus;
  
  }
  
  function checkRule(ruleId, vars, values, min, max) {
  
    status = "Pass";
    var prevalencePostion;
    var cnpvPosition;
    switch (ruleId) {
      case 1:
        minValue = 0;
        maxValue = 1;
        $.each(
          vars,
          function(key, selectedVar) {
            if (selectedVar != "delta") {
              if (min[key] < minValue || max[key] > maxValue) {
                status = "Fail";
                rulesViolationMsg.push( "Rule: Specificity, Sensitivity, PPV, cNPV, Prevalence can only be 0 to 1");
              }
            }
          });
        break;
      case 2:
        minValue = 0;
        maxValue = 5;
        $.each(vars, function(key, selectedVar) {
          if (selectedVar == "delta") {
            if (min[key] < minValue || max[key] > maxValue) {
              status = "Fail";
              rulesViolationMsg.push( "Rule: Delta can be 0 to 5");
            }
          }
        });
        break;
      case 3:
        cnpvPostion = $.inArray("cnpv", vars);
        prevalencePostion = $.inArray("prevalence", vars);
        if (cnpvPostion >= 0 && prevalencePostion >= 0) {
          if (max[cnpvPostion] >= min[prevalencePostion]) {
            status = "Fail";
            rulesViolationMsg.push("Rule: max(cNPV) < min(Prevalence)");
          }
        }
        break;
      case 4:
        prevalencePostion = $.inArray("prevalence", vars);
        ppvPostion = $.inArray("ppv", vars);
        if (prevalencePostion >= 0 && ppvPostion >= 0) {
          if (max[prevalencePostion] >= min[ppvPostion]) {
            status = "Fail";
            rulesViolationMsg.push("<div>Rule: max(prev) < min(PPV)</div>");
          }
        }
  
        break;
      case 5:
        sensitivityPosition = $.inArray("sensitivity", vars);
        specificityPosition = $.inArray("specificity", vars);
        if (sensitivityPosition >= 0 && specificityPosition >= 0) {
  
  
          if (max[sensitivityPosition] + max[specificityPosition] <= 1) {
            status = "Fail";
            rulesViolationMsg.push("<div>Rule: max(sensitivity) + max(specificity) > 1</div>");
          }
        }
        break;
    }
    return status;
  }
  
  function checkInputFields() {
    var selectedValues = [];
    var ids = thisTool.find("input").map(function() {
      return this.id;
    }).get();
  
    $.each(ids, function(key, elementId) {
      selectedValues.push(thisTool.find("#" + elementId).val().length);
    });
  
    if ($.inArray(0, selectedValues) == -1 && validCombo) {
      thisTool.find("#errors").remove();
    }
    else{
      display_errors(["One of the fields contains invalid input."]);
    }
  }
  
  function validate_inputs() {
  
     var checkInput = [];
    thisTool.find("input, select").each(function(){
      checkInput.push($(this)[0].checkValidity());
  
      var control = $(this)[0];
      var controlIds = ["independent_rs","contour_rs"];
  
      if($.inArray(this.id, controlIds) >= 0) {
        this.value.split(",").forEach(function(val, ind, arr) {
          if(!isNumberBetweenZeroAndOne(val.trim())) {
            rulesViolationMsg.push("'" + val.trim() + "' is an invalid value. Enter a valid array of floating point values for " + control.labels[0].textContent);
          }
        });
      }
    });
  
    thisTool.find(".output").empty();
  
    if ($.inArray(false, checkInput) >= 0) {
      rulesViolationMsg.push("Invalid input array. Enter a valid array of floating point values.");
      display_errors(rulesViolationMsg);
      return false;
    }
  
    if (rulesViolationMsg.length > 0) {
      display_errors(rulesViolationMsg);
      thisTool.find("#calculate").removeAttr("disabled").text("Calculate");
      thisTool.find("#spinner").addClass("hide");
      enableAll();
      return false;
    }
    else {
      thisTool.find("#errors").fadeOut().remove();
      thisTool.find("#calculate").attr("disabled","").text("Please Wait....");
      thisTool.find("#spinner").removeClass("hide");
      disableAll();
      return true;
    }
  }
  
  function calculate_riskStrat(){
  
     var validated = validate_inputs();
  
    if(validated){
  
         var independent_type = thisTool.find("#independent_dropdown_rs").val();
      var independent_values = thisTool.find("#independent_rs").val().replace(/[^\d,.-]/g, '');
      var indSplit = independent_values.split(",");
      var indMin = Array.min(indSplit);
      var indMax = Array.max(indSplit);
  
      var contour_type = thisTool.find("#contour_dropdown_rs").val();
      var contour_values = thisTool.find("#contour_rs").val().replace(/[^\d,.-]/g, '');
      var columnHeadings = contour_values.split(",");
  
      var fixed_type = thisTool.find("#fixed_dropdown_rs").val();
      var fixed_values = thisTool.find("#fixed_rs").val().replace(/[^\d,.-]/g, '');
      var fixedSplit = fixed_values.split(",");
      var uniqueKey = (new Date()).getTime();
  
      var abbreviatedkeys = [ "Sensitivity", "Delta" ];
      var numberOfKeysForCurrentFunction = 0;
  
      var keyvalueIndex = getKeyValueIndex(independent_type, fixed_type, contour_type);
  
      var keyvalueShort = keyShort[keyvalueIndex];
      var keyvalueLong = keyLong[keyvalueIndex];
  
      for ( var key in keyvalueShort) {
        numberOfKeysForCurrentFunction++;
      }
      var eIndependent = thisTool.find("#independent_dropdown_rs")[0];
      var selectedIndependentValue = eIndependent.options[eIndependent.selectedIndex].text;
  
      var eContour = thisTool.find("#contour_dropdown_rs")[0];
      var selectedContourValue = eContour.options[eContour.selectedIndex].text;
  
      tableFirstRowLabel = selectedIndependentValue;
      tableFirstColLabel = selectedContourValue;
  
      open_threads = numberOfKeysForCurrentFunction.length;
      error_count = 0;
  
      var request_data = [];
      var tableTitle = "";
  
  
  
  
  
               thisTool.find(".output").addClass("hide").empty();
      tabs = $("<div id='riskstrat-output-tabs'></div>");
      thisTool.find(".output").append(tabs);
      tab_names = $("<ul class='nav nav-tabs' role='tablist'></ul>");
      var tab_content = $("<div class='tab-content'></div>");
      tabs.append(tab_names);
      tabs.append(tab_content);

      for (var fixedIndex = 0; fixedIndex < fixed_values.split(",").length; fixedIndex++) {
        var thisFixedValue = fixedSplit[fixedIndex];
        for ( var shortkey in keyvalueShort) {
          request_data.push({
            keyIndex : shortkey,
            independentType : independent_type,
            independent : independent_values,
            independentMin : indMin,
            independentMax : indMax,
            contourType : contour_type,
            contour : contour_values,
            fixed : fixed_values,
            fixedType : fixed_type,
            uniqueId : uniqueKey,
            abreviatedKey : keyvalueShort[shortkey],
            tabValue : thisFixedValue,
            export: false
          });
        }

        var panelId = "fixed-" + (fixedIndex + 1);
        var labelId = "riskstrat-output-tab-label-" + (fixedIndex + 1);
        var isFirst = (fixedIndex === 0);

        var li = $("<li role='presentation'></li>");
        if (isFirst) {
          li.addClass("active");
        }
        var tabLink = $("<a></a>")
          .addClass("extra-padding")
          .attr("href", "#" + panelId)
          .attr("data-toggle", "tab")
          .attr("role", "tab")
          .attr("id", labelId)
          .attr("aria-controls", panelId)
          .attr("aria-selected", isFirst ? "true" : "false")
          .text(fixed_type + " " + thisFixedValue);
        li.append(tabLink);
        tab_names.append(li);

        tab_pane = $("<div></div>")
          .attr("id", panelId)
          .attr("role", "tabpanel")
          .attr("aria-labelledby", labelId)
          .addClass("tab-pane fade");
        if (isFirst) {
          tab_pane.addClass("in active");
        }
        tab_content.append(tab_pane);
        var tabId = "#fixed-" + (fixedIndex + 1);
        createTab(thisFixedValue, fixedIndex, fixed_type, independent_type, contour_type, tabId);
      }

      tabs.on("shown.bs.tab", "a[data-toggle='tab']", function () {
        tabs.find("a[role='tab']").attr("aria-selected", "false");
        $(this).attr("aria-selected", "true");
      });

      getData(request_data).done(function(response) {
          var data_array = response.data;
          riskStratAdvanced.excelFile = response.excelFile;
  
             if (data_array.length > 0){
  
                 for (var i = 0; i < data_array.length; i++) {
            for (var j = 0; j < fixedSplit.length; j++) {
              fillTable(data_array[i], j, columnHeadings, indSplit);
            }
          }
  
        }

        thisTool.find("#download").removeClass("hide");
        return data_array;
      }).fail(function(request, status, error){
        default_ajax_error(request, status, error);
        thisTool.find(".output").addClass("hide").empty().html("");
      }).always(function(){
        after_requests();
      });
  
    }
  
  }
  
  function after_requests(){
    thisTool.find(".output").removeClass("hide");
    thisTool.find("#calculate").removeAttr("disabled").text("Calculate");
    enableAll();
    thisTool.find("#spinner").addClass("hide");
  }
  function getKeyValueIndex(independentvalue, fixedvalue, contourvalue) {
  
    rfunctionname = getFunctionName(independentvalue, fixedvalue, contourvalue);
  
    for (var functions = 0; functions < rfunctions.length; functions++) {
      if (rfunctions[functions] == rfunctionname)
        return functions;
    }
    display_errors("no function mapping available");
    return -1;
  }
  
  function getFunctionName(independent, fixed, contour) {
    rFileName = "";
    var inputnames = [];
    inputnames[0] = independent;
    inputnames[1] = fixed;
    inputnames[2] = contour;
    for (var name = 0; name < functionnames.length; name++) {
      for (var variablename = 0; variablename < inputnames.length; variablename++) {
        if (functionnames[name] == inputnames[variablename]) {
          rFileName = rFileName.concat(keysforfunctionnames[name]);
        }
      }
    }
    return (rFileName);
  }
  
  
  function getData(data) {
  
        var service = window.location.protocol + '//' + window.location.host + window.location.pathname + rest + "/riskStratAdvanced/";
  
  
    return $.ajax({
      type : "POST",
      url : service,
      data : JSON.stringify(data),
      dataType : "json",
      contentType: "application/json"
    }).then(function(data_array) {
      thisTool.find("#download").removeClass("hide");
      return JSON.parse(JSON.stringify(data_array));
    });
  }
  
  function retrieve_excel(e) {
  
     var service = window.location.protocol + '//' + window.location.host + window.location.pathname + rest + "/riskStratAdvanced/";
  
      $.ajax({
      type : "POST",
      url : service,
      data : JSON.stringify([{ export: true }]),
      dataType : "json",
      contentType: "application/json",
      success: function(excel_file) {
        if(excel_file.length <= 1)
          display_errors(["There was a problem generating the excel file."]);
        else
          window.location = excel_file;
      },
      error: default_ajax_error
    });
    e.preventDefault();
  }

  function rsaHeaderIdSlug(s) {
    var t = String(s).trim().replace(/\./g, "_").replace(/\s+/g, "_").replace(/[^A-Za-z0-9_-]/g, "_");
    t = t.replace(/_+/g, "_").replace(/^_|_$/g, "");
    return t || "x";
  }

  function createTab(singleFixed, fixedIndex, fixedType,independentType, contourType, tabElement ){
    var keyvalueIndex = getKeyValueIndex(independentType, fixedType, contourType);
  
    var keyvalueShort = keyShort[keyvalueIndex];
    var keyvalueLong = keyLong[keyvalueIndex];
  
    for (var key in keyvalueShort) {
      $("#graphic-" + keyvalueShort[key] + (fixedIndex + 1) +", #table-" + keyvalueShort[key] + (fixedIndex + 1)).empty();
      table_graph_div = $("<div class='set-" + keyvalueShort[key] + (fixedIndex + 1) + " clearfix'></div>");
      thisTool.find(tabElement).append(table_graph_div);
      graphic_side = ("<div class='graph' id='graphic-" + keyvalueShort[key] + (fixedIndex + 1) + "'></div>");
      table_graph_div.append(graphic_side);
      table_side = $("<div id='table-" + keyvalueShort[key] + (fixedIndex + 1) + "' class='table_container'>" +
                       "<div class='table-header'>" + keyvalueLong[key] + "</div>" +
                     "</div>");
      table_graph_div.append(table_side);
    }
  
  }
  
  function fillTable(resultObject, index, columnHeadings, rowHeadings) {
  
    var singleDataObject = resultObject[index];
  
    var independentArray = thisTool.find("#independent_rs").val();
    independentArraySplit = independentArray.split(",");
    for (var ii = 0; ii < independentArraySplit.length; ii++) {
      independentArraySplit[ii] = independentArraySplit[ii].trim();
    }

    if(singleDataObject.length === 0) return false;
    else {
      var abbreviatedKey = singleDataObject.prefix;
      var tabnumber = singleDataObject.tabId;
  
      var tableId = "example-" + abbreviatedKey + tabnumber;
      var tabElement = "#fixed-" +tabnumber;
  
      var tableElement = thisTool.find(tabElement + " #" + tableId);
  
      if( tableElement[0] ) {
        if($.fn.DataTable.isDataTable(tableElement)){
          tableElement.dataTable().fnDestroy();
          tableElement.empty();
        }
      }
  
      thisTool.find(tabElement+" #table-" + abbreviatedKey + tabnumber + " #" + tableId).html("");
  
      var arr = [];
      var tableData = singleDataObject.data;
      var tableError = singleDataObject.table_error;
      var graphError = singleDataObject.graph_error;
  
      if (tableError != 1) {
        if (!Array.isArray(tableData)) {
          for (var k in rowHeadings) {
            var newData = [];
            newData.push(tableData[parseFloat(rowHeadings[k])]);
            arr.push(newData);
          }
        } else {
          var rows = tableData.length;
          for (var i = 0; i < rows; i++) {
            var values = [];
            row_entries = tableData[i];
  
  
                              for ( var key in columnHeadings) {
              var columnInd = parseFloat(columnHeadings[key]);
              values.push(row_entries[columnInd]);
            }
            arr.push(values);
          }
        }
  
        var headings = [];
        for (var x = 0; x < columnHeadings.length; x++) {
          headings.push({
            "sTitle" : columnHeadings[x]
          });
        }
  
        var table = $("<table cellpadding='0' cellspacing='0' class='cell-border table table-striped ' id='" + tableId + "'></table>");
  
        table.dataTable({
          "aaData" : arr,
          "aoColumns" : headings,
          "bJQueryUI" : true,
          "bAutoWidth" : false,
          "bFilter" : false,
          "bSearchable" : false,
          "bInfo" : false,
          "bSort" : false,
          "bPaginate" : false,
          "bDestroy" : true,
          "aaSorting" : [ [ 0, "asc" ] ]
        });

        $(tabElement + " #table-" + abbreviatedKey + tabnumber).append(table);

        var slugRowDim = rsaHeaderIdSlug(tableFirstRowLabel);
        var slugContour = rsaHeaderIdSlug(tableFirstColLabel);

        thisTool.find(tabElement + " #" + tableId + " tr:first").prepend(
          "<td class='ui-state-default' colspan='2'></td>");

        var y = 0;
        thisTool.find(tabElement + " #" + tableId + " tr:not(:first)").each(function(i, tr) {
            var rowSlug = rsaHeaderIdSlug(independentArraySplit[y]);
            $(tr).prepend("<th scope='row' id='" + tableId + "_header_" + rowSlug + "' class='ui-state-default sorting_disabled'>" +
              independentArraySplit[y] + "</th>");
            y++;
        });

        thisTool.find(tabElement + " #" + tableId + " tr:eq(1)").prepend("<th scope='row' id='" + tableId + "-header-rowdim-" +
          slugRowDim + "' class='header' rowspan='" + independentArraySplit.length +
          "'><div class='vertical-text'>" + tableFirstRowLabel + "</div></th>");

        thisTool.find(tabElement + " #" + tableId + " thead").prepend(
          "<tr><td class='header' colspan='2'></td><th scope='col' class='header' id='" + tableId + "-header-contour-" +
          slugContour + "' colspan='5'>" + tableFirstColLabel + "</th></tr>");

        var $rsaTable = thisTool.find(tabElement + " #" + tableId);
        $rsaTable.find("thead tr").last().find("th").each(function(colIdx) {
          if (colIdx < columnHeadings.length) {
            $(this).attr("id", tableId + "_" + rsaHeaderIdSlug(columnHeadings[colIdx])).attr("scope", "col");
          }
        });

        $rsaTable.find("tbody tr").each(function(i, tr) {
          $(tr).find("td").each(function(j, td) {
            $(td).attr("headers", tableId + "_header_" + rsaHeaderIdSlug(independentArraySplit[i]) + " " +
              tableId + "_" + rsaHeaderIdSlug(columnHeadings[j]));
          });
        });
  
            if(graphError != 1) {
          imgAlt = $_Glossary[abbreviatedKey].fullName + " versus " + tableFirstColLabel +
          " given different values of " + tableFirstRowLabel + " with " +
          fixed_dropdown_rs.value + " equal to " + fixed_rs.value.split(", ")[ tabnumber - 1];
  
          loadImage(tabnumber, abbreviatedKey, singleDataObject.imagePath, imgAlt);
      }
      }
      else {
        display_errors([ singleDataObject.message ]);
      }
    }
  }
  
  function getColumnHeaderData(columnHeadings) {
    var columnHeaderData2d = [];
    for ( var key in columnHeadings) {
      var tempObject = {};
      tempObject.mDataProp = columnHeadings[key];
      tempObject.sTitle = columnHeadings[key];
      tempObject.sWidth = "25%";
      columnHeaderData2d.push(tempObject);
    }
    return columnHeaderData2d;
  }
  
  function loadImage(tabNumber, graphNamePreFix, graphFilename, altText) {
    var imageContainer = thisTool.find("#graphic-" + graphNamePreFix + tabNumber);
    imageContainer.empty();
  
    imageContainer.append(
      "<img class='expand' src='" + graphFilename + "' alt='" + altText + "'>");
  }
  
  function refreshGraph(drawgraph) {
    var graph_file;
  
    if (drawgraph == 1)
      graph_file = "tmp/" + uniqueKey + "SensSpecLR.jpg?";
    else
      graph_file = "./images/fail-message.jpg?";
  
    var d = new Date();
    thisTool.find("#graph").attr("src", graph_file + d.getTime());
  }
  
  function makeSelectionsUnique(elementId) {
    var selectedValues = [];
    var disabledValues;
  
    var dropdowns = thisTool.find("select");
  
    $.each(dropdowns, function(key, dropdown) {
      if ($(dropdown).val() !== "")
        selectedValues.push($(dropdown).val());
    });
  
    $.each(dropdowns, function(key, dropdown) {
      $(dropdown).find('option:not(:selected)').each(function() {
        $(this).removeAttr('disabled');
        if ($.inArray($(this).val(),selectedValues) > -1) {
          $(this).attr('disabled','disabled');
        }
      });
    });
  
    setInitialValue(elementId);
    checkForInvalidVariableCombo(elementId);
  }
  
  function setInitialValue(textboxId) {
    var thisSelect = thisTool.find('#'+textboxId);
    var thisInput = thisTool.find('#'+textboxId.replace('_dropdown','')).attr('placeholder',initialData[$.inArray(thisSelect.val(), functionnames)]).val("");
  
  
     addPopupDefinition();
  }
  
  function checkForInvalidVariableCombo() {
    var selectedValues = [];
    thisTool.find("select").each(function(key, element) {
      if ($(element).val() !== "")
        selectedValues.push($(element).val());
    });
    if (selectedValues.length < 3) {
      thisTool.find("#errors").remove();
      validCombo = false;
    } else if ($.inArray(selectedValues.sort().join("-"), invalidCombos) >= 0) {
      var message = "The variables " + selectedValues[0] + ", " +
        selectedValues[1] + ",  and " + selectedValues[2] +
        " do not form a valid variable combination for this calculation.  " +
        "Please select a vaild variable combination.";
      display_errors([message]);
      validCombo = false;
    } else {
      validCombo = true;
      thisTool.find("#errors").remove();
    }
  }
  
  
  Array.max = function( array ){
    array = array.map(Number);
    return Math.max.apply( Math, array );
  };
  
  Array.min = function( array ){
    array = array.map(Number);
    return Math.min.apply( Math, array );
  };
  
})();
