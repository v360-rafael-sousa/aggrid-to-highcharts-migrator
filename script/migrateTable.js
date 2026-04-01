const theme = {
    "custom-header-blue": "default-blue-theme with-borders",
    "custom-header-green": "default-green-theme with-borders",
    "custom-header-black": "default-black-theme with-borders",
    "custom-header-red": "default-red-theme with-borders",
    "custom-header-white": "default-white-theme with-borders",
}

const convertFormat = {
  "formatNumber":"number",
  "formatPercentage":"porcentagem",
  "formatCurrency": "moeda",
  "formatType": "number",
}

const convertGridStyle = {
  "chartWidth": "width",
  "chartHeight": "height"
}

  

const getResolvedFormat = (col) => {
  const formatKey = Object.keys(convertFormat).find(key => col[key]);
  return formatKey ? convertFormat[formatKey] : "";
};

const isNumericColumn = (col) => {
  return col.type === "numericColumn" || 
         col.filter === "agNumberColumnFilter" || 
         !!getResolvedFormat(col);
};

const extractGridStyle = (component) =>{
  const gridStyle = {};
  Object.keys(convertGridStyle).forEach(key => {
    if(component[key]) gridStyle[convertGridStyle[key]] = component[key];
    delete component[key];
  });
  return gridStyle;
}

const buildFormatterString = (format, precision, cellStyle, isNumeric) => {
  const options = ["value: this.value"];
  if (format) options.push(`format: '${format}'`);
  
  if (format === "moeda" || format === "porcentagem") {
    options.push(`precision: 2`);
  } else if (precision !== undefined && precision !== null && precision !== "") {
    options.push(`precision: ${precision}`);
  } else if (isNumeric || format) {
    options.push(`precision: 2`);
  }

  if (cellStyle && cellStyle !== undefined && cellStyle !== null && cellStyle !== "") {
    options.push(`customStyle: ${JSON.stringify(cellStyle)}`);
  }
  
  return `function() {return cellFormatter({${options.join(", ")}});} `;
};

const setTitleStyle = (component) =>{
  if(component.title){
    component.titleStyle = {
      "textAlign": "center",
    }
  }
}

const processarAgrupador = (col, novasColunas, novoHeader, colunasExistentes) => {
  const useHeaderNameAsTitle = col.headerName.includes("<") && col.headerName.includes(">");
  const colId = useHeaderNameAsTitle ? col.headerName : col.field;
  const idDimensao = col.field || col.colId || colId;

  // add sku column
  // Verifica em novasColunas para ter a lista real de colunas sendo geradas
  if (col.field === "sku" && !novasColunas.some(c => c.id === "sku")) {
    novasColunas.push({
      id: "sku",
      enabled: true,
      header: {
          "format": "sku",
          "className": "txt-align-left"
      },
      "cells": {
          "formatter": "function() {return cellFormatter({ value: this.value });}",
          "className": "txt-align-left"
      },
      "width": 300
    });
  }

  novasColunas.push({
    id: idDimensao,
    enabled: true,
    header: {
      format: col.headerName,
      className: "txt-align-left",
    },
    cells: {
      formatter: "function() {return cellFormatter({ value: this.value});}",
      className: "txt-align-left",
    },
    width: 150,
  });

  // Adiciona ao header como agrupador (garantindo apenas 1 groupedBy)
  const hasGroupedBy = novoHeader.some(h => typeof h === 'object' && h !== null && 'groupedBy' in h);
  if (hasGroupedBy) {
    novoHeader.push(idDimensao); // O segundo (ou terceiro, etc) vira apenas string
  } else {
    novoHeader.push({ groupedBy: idDimensao });
  }
};

const processarPivot = (col, metricas, novoHeader, isNovaTabela) => {
  // No novo formato, o pivot é um container que agrupa as métricas
  const fallbackFormat = getResolvedFormat(col);
  const isPivotNumeric = isNumericColumn(col);

  const pivotHeader = {
  };

  if (!isNovaTabela) {
    pivotHeader.className = "txt-align-left";
  }
  
  pivotHeader.pivot = col.field;

  if (col.order) {
    pivotHeader.order = col.order;
  }

  pivotHeader.columns = metricas.map((m) => {
    // Idealmente usamos o formato específico da métrica, com fallback no formato do pivot
    const metricFormat = getResolvedFormat(m) || fallbackFormat;
    const isNum = isNumericColumn(m) || isPivotNumeric || !!metricFormat;
    
    const isHeatmapMetric = isNovaTabela && m.field === "html";

    const baseCol = {
      columnId: isHeatmapMetric ? "html" : m.field,
      format: isHeatmapMetric ? "" : m.headerName,
      ...(!isHeatmapMetric && { width: m.width || 140 }),
      cells: { 
        formatter: isHeatmapMetric 
            ? "function() { const pivotColumn = this.column.id.split('_pivot_')[1]; const bgColor = this.row.data[`cor_fundo_pivot_${pivotColumn}`]; const txtColor = this.row.data[`cor_texto_pivot_${pivotColumn}`]; return cellFormatter({ value: this.value, customStyle: {backgroundColor: bgColor, color: txtColor} }) }"
            : buildFormatterString(metricFormat, m.precision ?? 0, m.cellStyle, isNum),
        className: isHeatmapMetric ? "txt-align-center no-padding" : "txt-align-left",
      },
      ...(isHeatmapMetric && { className: "no-padding txt-align-center" })
    };
    return baseCol;
  });

  if (isNovaTabela) {
    pivotHeader.columns.push({
      columnId: "cor_fundo",
      enabled: false
    });
    pivotHeader.columns.push({
      columnId: "cor_texto",
      enabled: false
    });
  }

  novoHeader.push(pivotHeader);
};

const processarMetrica = (col, novasColunas, rowStyle) => {
  const resolvedFormat = getResolvedFormat(col);
  const mergeStyle = {...col.cellStyle, ...rowStyle};
  const isNum = isNumericColumn(col);
  
  const novaCol = {
    id: col.field,
    width: col.width || 100,
    header:{
      format: col.headerName,
      className: "txt-align-left",
    },
    cells: { 
      formatter: buildFormatterString(resolvedFormat, col.precision ?? 0, mergeStyle, isNum),
      className: "txt-align-left",
    },
  };

  novasColunas.push(novaCol);
};

function migrarTabela(table) {
  const nova = {
    components: [],
    config: table.config,
  };

  if (!table.components || !Array.isArray(table.components)) {
    return JSON.stringify(nova);
  }

  table.components.forEach((comp) => {
    // 1. Identifica se é uma tabela antiga do AG-Grid (possui columns e gridOptions)
    if (comp.columns && Array.isArray(comp.columns) && comp.gridOptions) {
      const isNovaTabela = comp.type === "nova-tabela";
      const headerClass = comp.gridOptions.defaultColDef?.headerClass;
      
      const novoComp = {
        ...comp,
        type: "grid",
        gridOptions: {
          columns: [],
          header: [],
          sorting: {
            enabled: true,
          },
          rendering: {
            theme: theme[headerClass] ?? "default-green-theme with-borders",
            ...(isNovaTabela ? { rows: { bufferSize: 100 } } : {})
          },
        },
        gridStyle: isNovaTabela ? { padding: "0px", margin: "0px" } : {...extractGridStyle(comp), ...comp.style},
      };
      // set title style
      setTitleStyle(novoComp);

      const novasColunas = [];
      const novoHeader = [];
      
      // Identifica se há colunas de pivot e quais são as métricas mapeadas nelas
      const hasPivot = comp.columns.some(col => col.pivot);
      const metricas = comp.columns.filter((c) => !c.rowGroup && !c.pivot && c.colId !== "rowIndex");

      // 2. Processar colunas do AG-Grid
      comp.columns.forEach((col) => {
        if(col.colId === "rowIndex"){
          novoHeader.push("rowIndex");
          return;
        }

        if (col.rowGroup) {
          processarAgrupador(col, novasColunas, novoHeader, novoComp.gridOptions.columns);
        } 
        else if (col.pivot) {
          processarPivot(col, metricas, novoHeader, isNovaTabela);
        } 
        else if (!hasPivot) {
          // Se tiver pivot, não processamos colunas como nova coluna, evitando duplicidades.
          processarMetrica(col, novasColunas, comp.gridOptions.rowStyle);
        }
      });

      // Removendo propriedades antigas que não existem no novo modelo
      delete novoComp.columns;
      delete novoComp.wrapHeader;

      delete novoComp.chartWidth;
      delete novoComp.chartHeight;
      delete novoComp.style;
      
      novoComp.gridOptions.columns = novasColunas;
      novoComp.gridOptions.header = novoHeader;
      
      nova.components.push(novoComp);
    } else {
      // 3. Mantém componentes que não são grids (ou que já foram migrados) intactos
      nova.components.push(comp);
    }
  });

  return JSON.stringify(nova);
}

exports.migrarTabela = migrarTabela;