library('openxlsx');

excelDirectory <- "./tmp/";

writeResultsToExcel <- function (tabs, allData, imgList, calcType) {
  outwb <- createWorkbook();
  
  startingRow <- 20;
  
  for(n in 1:length(tabs)) {
    PPVTableData <- allData[[n]]$PPVData
    cNPVTableData <- allData[[n]]$cNPVData
    
    startcol <- ncol(PPVTableData) + ncol(cNPVTableData)
    
    curSheet <- tabs[[n]]
    addWorksheet(outwb, curSheet)
    
    leftImage <- imgList[[2 * n - 1]]
    rightImage <- imgList[[2 * n]]
    
    ppvDf <- as.data.frame.matrix(PPVTableData)
    cnpvDf <- as.data.frame.matrix(cNPVTableData)

    writeData(outwb, curSheet, ppvDf, startRow = startingRow, startCol = 1, rowNames = FALSE, colNames = TRUE)
    writeData(outwb, curSheet, cnpvDf, startRow = startingRow, startCol = startcol, rowNames = FALSE, colNames = TRUE)
    
#     row <- getRows(curSheet, rowIndex = startingRow)
#     cells <- getCells(row)
#     
#     setCellStyle(cells, cellStyle = cellStyleGray)
    
#     setColumnWidth(curSheet, 1, startingRow)
#     setColumnWidth(curSheet, startcol, startingRow)
    
    setColWidths(outwb, curSheet, cols = 1:ncol(ppvDf), widths = "auto")
    setColWidths(outwb, curSheet, cols = startcol:(startcol + ncol(cnpvDf) - 1), widths = "auto")
    
    if (file.exists(leftImage)) {
      insertImage(outwb, curSheet, leftImage, startRow = 1, startCol = 1, width = 6, height = 4, units = "in")
    }
    if (file.exists(rightImage)) {
      insertImage(outwb, curSheet, rightImage, startRow = 1, startCol = startcol, width = 6, height = 4, units = "in")
    }
    
  }
  
  # formatting time to use in filename
  time <- gsub(":","",gsub("-","",gsub(" ","", Sys.time() , fixed=TRUE)));
  
  fileName <- toString(paste(excelDirectory, "sample_size_calculation_",calcType,"_", time, '.xlsx',sep=''));
  
  saveWorkbook(outwb, fileName, overwrite = TRUE);

  fileName;
}