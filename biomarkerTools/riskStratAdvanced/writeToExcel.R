library('openxlsx');
library('RJSONIO');
library('stringr');

excelDirectory <- "./tmp/";

loadJSON <- function(string) {
    string = str_replace_all(str_replace_all(string, "u'","'"), "\n","")
    string = str_replace_all(string, "'", "\\\"")
    return (fromJSON(content =string,depth = 4))
}

writeResultsToExcel <- function (JSONstring, tabHeaders) {
    
  outwb <- createWorkbook();
  
  excelData <- loadJSON(JSONstring)
  startingRow <- 22;
  tabs <- list()
  
  columnNames <- names(excelData[[1]][[1]]$data[[1]])

  #create two sheets at a time
  for(n in seq(from = 1, to=length(tabHeaders$fixedValues[[1]]))) {
        tabIndexes = list(excelData[[1]][[n]]$tabId, excelData[[2]][[n]]$tabId )
        tabId = tabHeaders$fixedValues[[1]][ n ]

        # using fixed category value for the tab titles
        Sheet1 <- paste(tabHeaders$fixedHeader, tabId)
        addWorksheet(outwb, Sheet1)
        
        cNPVTable1 = excelData[[2]][[n]]$data
        cNPVTableData1 = matrix(unlist(cNPVTable1), nrow= length(cNPVTable1), byrow=T)
        cnpvImg1 = excelData[[2]][[n]]$imagePath
        writeData(outwb, Sheet1, tabHeaders$cnpv, startRow = startingRow - 1, startCol = 2, colNames = FALSE)
        colnames(cNPVTableData1) = columnNames
        cnpvDf <- as.data.frame.matrix(cNPVTableData1)
        writeData(outwb, Sheet1, cnpvDf, startRow = startingRow, startCol = 2, rowNames = FALSE, colNames = TRUE)
        if (file.exists(cnpvImg1)) {
          insertImage(outwb, Sheet1, cnpvImg1, startRow = 1, startCol = 2, width = 6, height = 4, units = "in")
        }
        
        startcol <- max(ncol(cnpvDf) + 4, 8)
        
        
        PPVTable1 = excelData[[1]][[n]]$data
        PPVTableData1 = matrix(unlist(PPVTable1), nrow= length(PPVTable1), byrow=T)
        ppvImg1 = excelData[[1]][[n]]$imagePath
        writeData(outwb, Sheet1, tabHeaders$ppv, startRow = startingRow - 1, startCol = startcol, colNames = FALSE)
        colnames(PPVTableData1) = columnNames
        ppvDf <- as.data.frame.matrix(PPVTableData1)
        writeData(outwb, Sheet1, ppvDf, startRow = startingRow, startCol = startcol, rowNames = FALSE, colNames = TRUE)
        if (file.exists(ppvImg1)) {
          insertImage(outwb, Sheet1, ppvImg1, startRow = 1, startCol = startcol, width = 6, height = 4, units = "in")
        }

        setColWidths(outwb, Sheet1, cols = 2:(1 + ncol(cnpvDf)), widths = "auto")
        setColWidths(outwb, Sheet1, cols = startcol:(startcol + ncol(ppvDf) - 1), widths = "auto")
  }
  
  # formatting time to use in filename
  time <- gsub(":","",gsub("-","",gsub(" ","", Sys.time() , fixed=TRUE)));
  
  fileName <- toString(paste(excelDirectory, "risk_stratification_analysis_", time, '.xlsx',sep=''));
  saveWorkbook(outwb, fileName, overwrite = TRUE);

  fileName;
}