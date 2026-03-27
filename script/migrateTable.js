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
  "formatCurrency": "moeda"
}

const getResolvedFormat = (col) => {
  const formatKey = Object.keys(convertFormat).find(key => col[key]);
  return formatKey ? convertFormat[formatKey] : "";
};

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
          "className": "txt-align-center"
      },
      "cells": {
          "formatter": "function() {return cellFormatter({ value: this.value });}",
          "className": "txt-align-center"
      },
      "width": 300
    });
  }

  novasColunas.push({
    id: idDimensao,
    enabled: idDimensao !== "dimensao", // Exemplo: desabilitar a primeira se for repetida
    header: {
      format: col.headerName,
      className: "txt-align-center",
    },
    cells: {
      formatter: "function() {return cellFormatter({ value: this.value});}",
      className: "txt-align-center",
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

const processarPivot = (col, metricas, novoHeader) => {
  // No novo formato, o pivot é um container que agrupa as métricas
  const fallbackFormat = getResolvedFormat(col);

  const pivotHeader = {
    pivot: col.field,
    className: "txt-align-center"
  };

  if (col.order) {
    pivotHeader.order = col.order;
  }

  pivotHeader.columns = metricas.map((m) => {
    // Idealmente usamos o formato específico da métrica, com fallback no formato do pivot
    const metricFormat = getResolvedFormat(m) || fallbackFormat;
    
    return {
      columnId: m.field,
      format: m.headerName,
      width: m.width || 140,
      className:
        m.cellStyle?.textAlign === "end"
          ? "txt-align-right"
          : "txt-align-center", 
      cells: { 
        formatter: `function() {return cellFormatter({value: this.value, ${metricFormat ? `format: '${metricFormat}',` : ""}precision: ${m.precision ?? 2},customStyle: ${m.cellStyle ? JSON.stringify(m.cellStyle).replace(/"([^"]+)":/g, '$1:').replaceAll(" ","") : "null"}});}`
      },
    };
  });

  novoHeader.push(pivotHeader);
};

const processarMetrica = (col, novasColunas) => {
  const resolvedFormat = getResolvedFormat(col);

  novasColunas.push({
    id: col.field,
    width: col.width || 100,
    header:{
      format: col.headerName,
      className: "txt-align-center",
    },
    className:
      col.cellStyle?.textAlign === "end"
        ? "txt-align-right"
        : "txt-align-center", 
    cells: { 
      formatter: `function() {return cellFormatter({value: this.value, ${resolvedFormat ? `format: '${resolvedFormat}',` : ""}precision: ${col.precision ?? 2},customStyle: ${col.cellStyle ? JSON.stringify(col.cellStyle).replace(/"([^"]+)":/g, '$1:').replaceAll(" ","") : "null"}});} `
    },
  });
};

function migrarTabela(table) {
  const comp = table.components[0];
  // 1. Mapeamento básico de tipos e metadados
  const nova = {
    components: [
      {
        ...comp,
        type: "grid",
        gridOptions: {
          columns: [],
          header: [],
          sorting: {
            enabled: true,
          },
          rendering: {
            theme: theme[comp.gridOptions.defaultColDef.headerClass] ?? "default-green-theme with-borders",
          },
        },
      },
    ],
    config: table.config,
  };

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
      processarAgrupador(col, novasColunas, novoHeader, nova.components[0].gridOptions.columns);
    } 
    else if (col.pivot) {
      processarPivot(col, metricas, novoHeader);
    } 
    else if (!hasPivot) {
      // Se tiver pivot, não processamos colunas como nova coluna, evitando duplicidades.
      processarMetrica(col, novasColunas);
    }
  });

  // Removendo propriedades antigas que não existem no novo modelo
  delete nova.components[0].columns;
  delete nova.components[0].wrapHeader;

  nova.components[0].gridOptions.columns = novasColunas;
  nova.components[0].gridOptions.header = novoHeader;
  return JSON.stringify(nova);
}

exports.migrarTabela = migrarTabela;