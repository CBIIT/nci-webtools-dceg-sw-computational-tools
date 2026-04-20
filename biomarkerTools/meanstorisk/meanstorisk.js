(function() {
  var cases_string;
  var uniqueKey;
  var thisTool = $("#meanstorisk");
  var valuesFromFile = [];
  var numberOfRows;
  var numberOfCols;
  var specificity_string, prevalence_string;
  var ppv_tabs = {
    "PPV": "PPV = Positive Predictive Value (PPV)",
    "cNPV": "cNPV = 1 - PPV = Compliment of the Negative Predictive Value",
    "Risk Difference": "PPV - cNPV",
    "Cases per 1000 Screened": "# of Cases Detected per 1000 Screened",
    "Cases per 1000 Positive": "# of Cases Detected per 1000 Who Screened Positive",
    "Cases per 1000 with Disease": "# of Cases Detected per 1000 with the Disease"
  };
  
  $(function(){
    thisTool = $("#meanstorisk");
    thisTool.find('#errors').alert();
    bind_calculate_button();
    bind_download_button();
    bind_option_choices();
    thisTool.find("#cases_control").on('click', function () {
      thisTool.find("#download_button").addClass('hide');
    });
    thisTool.find('#file_upload, #cases_control').on('show.bs.collapse', function(){
      if (this.id == "file_upload") {
        thisTool.find('#cases_control').collapse('hide');
      } else {
        thisTool.find('#file_upload').collapse('hide');
      }
      thisTool.find('.panel-body').not( document.getElementById(this.id) )
        .removeClass('in')
        .addClass('collapse');
    });
  });
  
  $('a[href="#meanstorisk"]').on('shown.bs.tab',function(e){
    thisTool = $("#meanstorisk");
    init_meanstorisk();
  });
  
  function init_meanstorisk(){
    thisTool.find("#please_wait_calculate").modal({ autoOpen: false, position: 'top', title: "Please Wait", height: 60 });
    thisTool.find("#please_wait_download").modal({ autoOpen: false, position: 'top', title: "Please Wait", height: 60 });
    thisTool.find("#errors").addClass('hide');

    thisTool.off('shown.bs.collapse.mtrAria hidden.bs.collapse.mtrAria', '#file_upload, #cases_control')
      .on('shown.bs.collapse.mtrAria hidden.bs.collapse.mtrAria', '#file_upload, #cases_control', function() {
        $(this).removeAttr('aria-expanded');
      });
    thisTool.find('#file_upload, #cases_control').removeAttr('aria-expanded');
  
    thisTool.find('.panel-heading a').on('click',function(e) {
      if($(this).parents('.panel').children('.panel-collapse').hasClass('in')) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }
  
  function prepare_upload (e) {
    thisTool.find("#errors").addClass("hide").empty();
  
    var file_types = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv" ];
  
    var files = e.target.files;
    if(files.length > 0){
      var correct_type = ($.inArray(files[0].type, file_types) > -1) ? true : false;
  
      if(correct_type){
        if ( window.FileReader ) {
          var fr = new FileReader();
          fr.onload = function(e) {
            var txt = e.target.result;
            var lines = txt.split("\n");
            if (lines.length > 0) numberOfCols = lines[0].split(",").length;
            numberOfRows = 0;
            if(numberOfCols != 2) {
              display_errors([ " 2 columns of data expected in CSV file. Found " + numberOfCols + " columns." ]);
            }
            else {
              valuesFromFile = [];
              for (var count = 0; count < lines.length;count++) {
                var arr = lines[count].split(",");
                if (!isNaN(arr[0]) && !isNaN(arr[1]) ) {
                  valuesFromFile = valuesFromFile.concat(arr);
                  numberOfRows++;
                }
              }
            }
          };
          fr.readAsText(files[0]);
        }
        else {
          var filePath = thisTool.find("#input_file_upload").val();
          var fso = new ActiveXObject("Scripting.FileSystemObject");
          var textStream = fso.OpenTextFile(filePath);
          var fileData = textStream.ReadAll();
          var lines = fileData.split("\n");
          numberOfRows = lines.length;
          if (numberOfRows > 0) numberOfCols = lines[0].split(",").length;
  
          if(numberOfCols != 2){
            display_errors([ "2 columns of data expected in CSV file. Found " +
                    numberOfCols + " columns." ]);
          }
          else {
            valuesFromFile = [];
            for (count = 0; count < lines.length;count++) {
              var arr = lines[count].split(",");
              if (!isNaN(arr[0]) && !isNaN(arr[1]) ) {
                valuesFromFile = valuesFromFile.concat(arr);
              }
            }
          }
        }
      }
      else {
        display_errors(["Incorrect file type detected. Please upload a csv file."]);
      }
    }
  }
  
  function bind_option_choices() {
    thisTool.find( "#input_file_upload" ).on('change', prepare_upload);
  }
  
  function bind_calculate_button() {
    thisTool.find("#calculate_button").on('click', function() {
      thisTool.find('#errors').fadeOut();
      var validation_check = [false];
      validation_check = validate_input(false);
      if (!validation_check[0]) {
        display_errors(validation_check[1]);
      } else {
        make_call();
      }
    });
  }
  function validate_input(valid){
    var messages = [];
    var valueMissing = function(el) {
      return el.validity ? el.validity.valueMissing : el.val().trim() === "";
    };
  
    var specificitySplit = thisTool.find("input#specificity").val().split(",");
    var prevalenceSplit = thisTool.find("input#prevalence").val().split(",");
  
    $.each(specificitySplit, function(ind, singleSpec){
      if(!isNumberBetweenZeroAndOne(singleSpec))
        messages.push("Specficity contains an invalid value: '" + singleSpec + "'");
    });
  
    $.each(prevalenceSplit, function(ind, singlePrev){
      if(!isNumberBetweenZeroAndOne(singlePrev))
        messages.push("Prevalence contains an invalid value: '" + singlePrev + "'");
    });
  
    if(valueMissing(thisTool.find("input#specificity").eq(0))){
      messages.push("Specificity is required");
    }
  
    if(valueMissing(thisTool.find("input#prevalence").eq(0))){
      messages.push("Prevalence is required");
    }
  
    if (thisTool.find(".accordion").find(".panel-body:first").hasClass("in") && valuesFromFile.length === 0) {
      messages.push("Please Upload a file or pick the normalized option and enter key data first");
    }
    if(thisTool.find(".accordion").find(".panel-body:nth(1)").hasClass("in")){
  
      var inputs = thisTool.find(".accordion").find(".panel-body:nth(1) input");
  
      var empty = false;
  
      inputs.each(function(){
        if(this.value.length === 0){
          empty = true;
        }
        if(isNaN(this.value))
          messages.push("'"+ this.value +"' is not a valid value for " + this.labels[0].textContent);
  
        if(this.id == "N_cases_input" || this.id == "N_controls_input" ){
          if(this.value < 0) {
            messages.push(this.labels[0].textContent + " must be greater than 0. You entered '" + this.value + "'");
          }
        }
      });
  
      if(empty)
        messages.push("Please enter input values for normal distribution.");
    }
  
    if(messages.length > 0)
      valid = false;
    else{
      valid = true;
    }
    return [valid, messages];
  }
  
  function make_call() {
    thisTool.find("#spinner").removeClass("hide");
    thisTool.find("#calculate_button").text("Please Wait....");
    thisTool.find("#calculate_button").attr('disabled', '');
    disableAll();
  
    if (thisTool.find("#file_upload").hasClass("in")) {
      get_inputs_for_user_defined_calculation();
      make_ajax_call_user_defined_calculation();
    } else if (thisTool.find("#cases_control").hasClass("in")) {
      get_inputs_for_standard_calculation();
      make_ajax_call_standard_calculation();
    }
  }
  
  function bind_download_button() {
    thisTool.find("#download_button").click(function() {
      var activePanelIndex = thisTool.find(".accordion .collapse.in").index() - 2;
      if (activePanelIndex === 0) {
  
        if (valuesFromFile.length === 0) {
          display_errors("Please Upload a file or pick the normalized option and enter key data first");
        } else {
          get_inputs_for_user_defined_calculation();
          make_excel_call_user_defined_calculation();
        }
      } else {
        get_inputs_for_standard_calculation();
        make_excel_call_standard_calculation();
      }
    });
  }
  
  function get_inputs_for_user_defined_calculation () {
    specificity_string="" + thisTool.find("#specificity").val() + "";
    prevalence_string="" + thisTool.find("#prevalence").val() + "";
  
  }
  
  function get_inputs_for_standard_calculation () {
  
    var mean_cases = parseFloat(thisTool.find("#mean_cases_input").val());
    var mean_controls = parseFloat(thisTool.find("#mean_controls_input").val());
    var stderr_cases = parseFloat(thisTool.find("#stderr_cases_input").val());
    var stderr_controls = parseFloat(thisTool.find("#stderr_controls_input").val());
    var N_cases = parseFloat(thisTool.find("#N_cases_input").val());
    var N_controls = parseFloat(thisTool.find("#N_controls_input").val());
  
    cases_string = mean_cases+","+stderr_cases+","+N_cases;
    controls_string = mean_controls+","+stderr_controls+","+N_controls;
    specificity_string= thisTool.find("#specificity").val();
    prevalence_string= thisTool.find("#prevalence").val();
  
  }
  
  function set_standard_inputs(mean_cases,mean_controls,stderr_cases,stderr_controls,N_cases,N_controls) {
  
  
    set_value("#mean_cases",mean_cases);
    set_value("#mean_controls",mean_controls);
    set_value("#stderr_cases",stderr_cases);
    set_value("#stderr_controls",stderr_controls);
    set_value("#N_cases",N_cases);
    set_value("#N_controls",N_controls);
  
  
    var deviation_cases= stderr_cases * Math.sqrt(N_cases);
    set_value("#deviation_cases",deviation_cases.toPrecision(4) );
    var deviation_controls= stderr_controls * Math.sqrt(N_controls);
    set_value("#deviation_controls",deviation_controls.toPrecision(4) );
    var variance_cases= deviation_cases * deviation_cases;
    set_value("#variance_cases",variance_cases.toPrecision(4) );
    var variance_controls= deviation_controls * deviation_controls;
    set_value("#variance_controls",variance_controls.toPrecision(4) );
    var variance_overall = ( (N_cases * variance_cases) + (N_controls * variance_controls) )/ (N_cases + N_controls);
    set_value("#variance_overall",variance_overall.toPrecision(4) );
  
    var mean_overall = ( (N_cases * mean_cases) + (N_controls * mean_controls) )/ (N_cases + N_controls);
    set_value("#mean_overall",mean_overall.toPrecision(4) );
  
    var N_overall = N_cases + N_controls;
    set_value("#N_overall",N_overall.toPrecision(4) );
  
    var cv_cases = Math.sqrt(variance_cases) / mean_cases;
    set_value("#cv_cases",cv_cases.toPrecision(4) );
    var cv_controls = Math.sqrt(variance_controls) / mean_controls;
    set_value("#cv_controls",cv_controls.toPrecision(4) );
    var cv_overall = Math.sqrt(variance_overall) / mean_overall;
    set_value("#cv_overall",cv_overall.toPrecision(4) );
  
    var difference_in_mean = mean_cases - mean_controls;
    set_value("#mean_difference",difference_in_mean.toPrecision(4) );
    set_value("#diff_overall",difference_in_mean.toPrecision(4) );
  
    var delta = difference_in_mean / Math.sqrt(variance_overall);
    set_value("#delta_overall",delta.toPrecision(4) );
  
    delta_string = "c("+delta.toPrecision(4)+")";
  
  }
  
  function make_ajax_call_user_defined_calculation() {
    uniqueKey = generateUniqueKey();
  
    var hostname = window.location.hostname;
    var url = window.location.protocol + '//' + window.location.host + window.location.pathname + rest + "/meanstorisk/";
  
  
    $.ajax({
      type: "POST",
      url: url,
      data: {
        option:1,
        spec:specificity_string,
        prev: prevalence_string,
        datarowcount: numberOfRows,
        colcount: numberOfCols,
        unique_key: uniqueKey,
        graphkey:'CSV',
        dataCSV: valuesFromFile.join()
      },
      dataType: "json",
      success: set_data_meanstorisk,
      error: function(request,status,error){
      default_ajax_error(request, status, error);
      }
    }).always(function(){
      thisTool.find("#calculate_button").text("Calculate");
      enableAll();
      thisTool.find("#spinner").addClass("hide");
    });
  }
  function make_ajax_call_standard_calculation() {
  
    uniqueKey = generateUniqueKey();
    hostname = window.location.hostname;
    url = window.location.protocol + '//' + window.location.host + window.location.pathname + rest + "/meanstorisk/";
  
    $.ajax({
      type: "POST",
      url: url,
      data: {
        option:2,
        spec:specificity_string,
        prev: prevalence_string,
        cases: cases_string,
        controls: controls_string,
        unique_key: uniqueKey,
        graphkey:'input'
      },
      dataType: "json",
      success: set_data_meanstorisk,
      error: function(request,status,error){
      default_ajax_error(request, status, error);
      }
    }).always(function(){
      thisTool.find("#calculate_button").text("Calculate");
      enableAll();
      thisTool.find("#spinner").addClass("hide");
    });
  }
  
  function make_excel_call_user_defined_calculation() {
    uniqueKey = generateUniqueKey();
    hostname = window.location.hostname;
    url = window.location.protocol + '//' + window.location.host + window.location.pathname + rest + "/meanstorisk/";
  
    thisTool.find("#spinner").removeClass("hide");
  
    disableAll();
  
    $.ajax({
      type: "POST",
      url: url,
      data: {
        option:3,
        spec:specificity_string,
        prev: prevalence_string,
        datarowcount: numberOfRows,
        colcount: numberOfCols,
        unique_key: uniqueKey,
        graphkey:'CSV',
        dataCSV: valuesFromFile.join()
      },
      dataType: "json",
      success: set_excel,
      error: function(request,status,error){
      default_ajax_error(request, status, error);
      }
    }).always(function(){
      thisTool.find("#calculate_button").text("Calculate");
      enableAll();
      thisTool.find("#spinner").addClass("hide");
    });
  }
  
  function make_excel_call_standard_calculation() {
    uniqueKey = generateUniqueKey();
    hostname = window.location.hostname;
    url = window.location.protocol + '//' + window.location.host + window.location.pathname + rest + "/meanstorisk/";
  
    thisTool.find("#spinner").removeClass("hide");
  
    disableAll();
  
    $.ajax({
      type: "POST",
      url: url,
      data: {
        option:4,
        spec:specificity_string,
        prev: prevalence_string,
        cases: cases_string,
        controls: controls_string,
        unique_key: uniqueKey,
        graphkey:'input'
      },
      dataType: "json",
      success: set_excel,
      error: function(request,status,error){
      default_ajax_error(request, status, error);
      }
    }).always(function(){
      thisTool.find("#calculate_button").text("Calculate");
      enableAll();
      thisTool.find("#spinner").addClass("hide");
    });
  }
  
  function set_data_meanstorisk(dt) {
    set_values_table(dt);
    create_tabbed_table(dt);
    draw_graph();
  
    thisTool.find("#download_button").removeClass("hide");
  }
  
  function set_excel(dt) {
    thisTool.find("#please_wait_download").modal("hide");
    if(dt.length > 0)
      window.open(dt);
    else {
      display_errors("There was a problem generating or downloading the excel file.");
      console.log("problem generating excel file");
    }
  
  }
  
  function set_values_table(dt) {
    var values = dt.Delta;
  
  
    if (values[0].Cases) set_value("#mean_cases",values[0].Cases.toPrecision(2)); else set_value("#mean_cases","");
    if (values[0].Controls) set_value("#mean_controls",values[0].Controls.toPrecision(2));    else set_value("#mean_controls","");
    if (values[0].Overall) set_value("#mean_overall",values[0].Overall.toPrecision(2) ); else set_value("#mean_overall","");
  
  
    if (values[1].Cases) set_value("#stderr_cases",values[1].Cases.toPrecision(4));    else set_value("#stderr_cases","");
    if (values[1].Controls) set_value("#stderr_controls",values[1].Controls.toPrecision(4)); else set_value("#stderr_controls","");
    if (values[1].Overall) set_value("#stderr_overall",values[1].Overall.toPrecision(4)); else set_value("#stderr_overall","");
  
    if (values[2].Cases) set_value("#N_cases",values[2].Cases); else set_value("#N_cases","");
    if (values[2].Controls) set_value("#N_controls",values[2].Controls);    else set_value("#N_controls","");
    if (values[2].Overall) set_value("#N_overall",values[2].Overall); else set_value("#N_overall","");
  
    if (values[3].Cases) set_value("#deviation_cases",values[3].Cases.toPrecision(4)); else set_value("#deviation_cases","");
    if (values[3].Controls) set_value("#deviation_controls",values[3].Controls.toPrecision(4) ); else set_value("#deviation_controls","");
    if (values[3].Overall) set_value("#deviation_overall",values[3].Overall.toPrecision(4) );else set_value("#deviation_overall","");
  
    if (values[4].Cases) set_value("#variance_cases",values[4].Cases.toPrecision(4) ); else set_value("#variance_cases","");
    if (values[4].Controls) set_value("#variance_controls",values[4].Controls.toPrecision(4)); else set_value("#variance_controls","");
    if (values[4].Overall) set_value("#variance_overall",values[4].Overall.toPrecision(4) ); else set_value("#variance_overall","");
  
    if (values[5].Cases) set_value("#cv_cases",values[5].Cases.toPrecision(4) ); else set_value("#cv_cases","");
    if (values[5].Controls) set_value("#cv_controls",values[5].Controls.toPrecision(4)); else set_value("#cv_controls","");
    if (values[5].Overall) set_value("#cv_overall",values[5].Overall.toPrecision(4) ); else set_value("#cv_overall","");
  
    if (values[6].Overall) set_value("#diff_overall",values[6].Overall.toPrecision(4) ); else set_value("#diff_overall","");
  
    if (values[7].Overall) set_value("#delta_overall",values[7].Overall.toPrecision(4) ); else set_value("#delta_overall","");
  
    if (values[8]&& values[8].Overall) set_value("#auc_overall",values[8].Overall.toPrecision(4) ); else set_value("#auc_overall","");
  }
  
  function create_tabbed_table(dt) {
  
    make_tabs();
  
    set_matrix("tab-1", 'PPV', 'Risk of Disease after a POSITIVE Test', 'Positive Predictive Value (PPV)',
           dt['Sensitivity Given Specificity'], dt.PPV);
    set_matrix("tab-2", 'cNPV', 'Risk of Disease after a NEGATIVE Test', 'Complement of the Negative Predictive Value (cNPV)',
           dt['Sensitivity Given Specificity'], dt.cNPV);
    set_matrix("tab-3", 'PPVmcNPV', 'Range of Risk after Test Results', 'PPV &minus; cNPV',
           dt['Sensitivity Given Specificity'], dt['PPV-cNPV']);
    set_matrix("tab-4", 'ProgramBased', '# of Cases Detected per 1000 People Screened', 'Program &minus; Based',
           dt['Sensitivity Given Specificity'], dt['Program-Based']);
    set_matrix("tab-5", 'PPV', '# of Cases Detected per 1000 Who are Screen Positive', 'PPV &minus; Based',
           dt['Sensitivity Given Specificity'], dt['PPV-Based']);
    set_matrix("tab-6", 'Sens', '# of Cases Detected per 1000 With Disease', 'Sensitivity &minus; Based',
           dt['Sensitivity Given Specificity'], dt['Sensitivity-Based']);
    set_matrix("tab-7", 'DominatedByRareDisease', '# Per 1000 Screenees Who Screen Positive', 'Dominated by Specificity for Rare Disease',
           dt['Sensitivity Given Specificity'], dt['Dominated by Specificity for a Rare Disease']);
  
  }
  
  function make_tabs() {
    var tabs = $("<div id='tabs'></div>");
    $(".tabbed_output_panel").empty().append(tabs);
    var tabList = $("<ul class='nav nav-tabs' role='tablist'></ul>");
    var tabContent = $("<div class='tab-content'></div>");
    tabs.append(tabList);
    tabs.append(tabContent);

    var index = 0;
    for (var key in ppv_tabs) {
      index++;
      var panelId = "tab-" + index;
      var labelId = "mtr-ppv-tab-" + index;
      var isFirst = index === 1;

      var li = $("<li role='presentation'></li>");
      if (isFirst) {
        li.addClass("active");
      }
      var a = $("<a></a>")
        .attr("href", "#" + panelId)
        .attr("data-toggle", "tab")
        .attr("role", "tab")
        .attr("id", labelId)
        .attr("aria-controls", panelId)
        .attr("aria-selected", isFirst ? "true" : "false")
        .attr("title", ppv_tabs[key])
        .css({ fontWeight: "bold", fontSize: "1.2em", color: "#000" })
        .text(key);
      li.append(a);
      tabList.append(li);

      var pane = $("<div></div>")
        .attr("id", panelId)
        .attr("role", "tabpanel")
        .attr("aria-labelledby", labelId)
        .addClass("tab-pane fade");
      if (isFirst) {
        pane.addClass("in active");
      }
      tabContent.append(pane);
    }

    tabs.on("shown.bs.tab", "a[data-toggle='tab']", function () {
      tabs.find("a[role='tab']").attr("aria-selected", "false");
      $(this).attr("aria-selected", "true");
    });
  }
  
  function set_matrix(tab_id, type, table_name, table_second_name, sensitivity_matrix, matrix) {
    var prevalence_values = Object.keys(matrix[0]);
    var prevalence_count = prevalence_values.length;
    var specificity_count = matrix.length;
    var general_table = $("<TABLE></TABLE>");
    $("#"+tab_id).empty().append(general_table);
    var caption = $("<caption style='font-size: 1.2em; color: #000;' id='mtr-caption-" + tab_id + "' class='header text-center'>" + table_name +
          "<br /><a id='" + type + tab_id + "' " + ( $_Glossary[type] === undefined ? "" : " class='define text-center " + type + "_stripe' data-term='" + type + "'" ) +
          ">" + table_second_name + "</a></caption>");

    caption.appendTo(general_table);
    var second_header_row = $("<tr></tr>");

    second_header_row.appendTo(general_table);
    var third_header_row = $("<tr></tr>");
    third_header_row.append("<TH id='header-Sens2-" + tab_id + "' class='header text-center' colspan='4' style='border-right:1px solid black;'>" +
                              "<div class='define' data-term='Sens'>Sensitivity Given Specificity <br /> for Given Delta </div>" +
                            "</TH>" );
    third_header_row.append("<TH id='header-DP2-" + tab_id + "' class='header text-center' colspan='" + prevalence_count + "' >" +
                              "<div class='define' data-term='DP'>Disease Prevalence</div>" +
                            "</TH>");
    third_header_row.appendTo(general_table);
    var header_row = $("<tr></tr>");
    header_row.attr('id', type + '_table_row_header_' + tab_id);
    header_row.append("<TH id='header-spec-" + tab_id + "' class='header text-center' headers='header-Sens2-" + tab_id + "'><div class='define' id='Spec-" + tab_id + "' data-term='Spec'>Specificity</div></TH>");
    header_row.append("<TH id='header-sens-" + tab_id + "' class='header text-center' headers='header-Sens2-" + tab_id + "'><div class='define' id='Sens-" + tab_id + "' data-term='Sens'>Sensitivity</div></TH>");
    header_row.append("<TH id='header-lrp-" + tab_id + "' class='header text-center' headers='header-Sens2-" + tab_id + "'><div class='define' id='LRP-" + tab_id + "' data-term='LRP'>LR+</div></TH>");
    header_row.append("<TH id='header-lrn-" + tab_id + "' class='header text-center' headers='header-Sens2-" + tab_id + "' style='border-right:1px solid black;'><div class='define' id='LRN-"+tab_id+"' data-term='LRN'>LR-</div></TH>");
    for(var x=0;x<prevalence_count;x++) {
      var prevSlug = (format_number(prevalence_values[x])).replace(".","_");
      header_row.append("<TH id='header-prevalence-" + tab_id + "-" + prevSlug + "' class='header text-center' headers='header-DP2-" + tab_id + "'>" + format_number(prevalence_values[x]) + "</TH>");
    }
    header_row.appendTo(general_table);

    for(var y=0;y < specificity_count;y++) {
      var row = $("<tr></tr>");

      row.attr('id', type + '_table_row_' + y + '_' + tab_id);
      row.append("<TD headers='header-Sens2-" + tab_id + " header-spec-" + tab_id + "' class='col1 text-center'>" + format_number(sensitivity_matrix[y].Specificity) + "</TD>");
      row.append("<TD headers='header-Sens2-" + tab_id + " header-sens-" + tab_id + "' class='col1 text-center'>" + format_number(sensitivity_matrix[y].Sensitivity) + "</TD>");
      row.append("<TD headers='header-Sens2-" + tab_id + " header-lrp-" + tab_id + "' class='col1 text-center'>" + format_number(sensitivity_matrix[y]['LR+']) + "</TD>");
      row.append("<TD headers='header-Sens2-" + tab_id + " header-lrn-" + tab_id + "' class='col1 text-center' style='border-right:1px solid black;'>" +
             format_number(sensitivity_matrix[y]['LR-']) + "</TD>");


      for(var z = 0; z < prevalence_count; z++) {
        var prevalence_value = prevalence_values[z];
        var prevSlugZ = (format_number(prevalence_values[z])).replace(".","_");
        row.append("<TD headers='header-DP2-" + tab_id + " header-prevalence-" + tab_id + "-" + prevSlugZ + "' class='col1 text-center'>" + format_number(matrix[y][prevalence_value]) + "</TD>");
      }
      row.appendTo(general_table);
    }
  }
  
  function draw_graph() {
    var graph_file;
  
  
    var activePanelId = thisTool.find(".accordion .collapse.in").attr('id');
    if (activePanelId == "file_upload") {
      graph_file = "tmp/CSV"+uniqueKey+".png?";
    } else {
      graph_file = "tmp/input"+uniqueKey+".png?";
    }
  
    thisTool.find(".graph").empty().append("<IMG class='output_graph expand' alt='generated output graph for means to risk calculation' src='" + graph_file + "'/>");
  }
  
  function set_value(field, value) {
    thisTool.find(field).text("" + value);
    thisTool.find(field).addClass('highlight');
    setTimeout(
      function() { thisTool.find(field).removeClass('highlight'); },
      2000
    );
  }
  
  function format_number(num) {
  
  
  
    return num;
  }
  
  function reset_meanstorisk(){
    thisTool.find("#calculate_button").removeAttr("disabled").text("Calculate");
  
    thisTool.find('#errors').fadeOut();
    var fileControl = thisTool.find("input#input_file_upload");
    thisTool.find("#mtr-results .table_row:not(:first-child) .table_data:not(:first-child), .tabbed_output_panel, .graph").html("");
  
    thisTool.find("input#specificity").val("0.8, 0.9, 0.95, 0.99, 0.999");
    thisTool.find("input#prevalence").val("0.1, 0.05, 0.01, 0.005, 0.001");
  
    thisTool.find("input#mean_cases_input").val("4");
    thisTool.find("input#mean_controls_input").val("1");
    thisTool.find("input#stderr_cases_input").val("0.1");
    thisTool.find("input#stderr_controls_input").val("0.1");
    thisTool.find("input#N_cases_input").val("100");
    thisTool.find("input#N_controls_input").val("200");
  
    thisTool.find("#download_button").addClass("hide");
    thisTool.find("#spinner").addClass('hide');
    valuesFromFile = [];
  }
  
  thisTool.find("#reset").on("click", reset_meanstorisk);
  
  
  Object.keys = Object.keys || function(o) {
    var result = [];
    for(var name in o) {
      if (o.hasOwnProperty(name))
        result.push(name);
    }
    return result;
  };
  
})();
