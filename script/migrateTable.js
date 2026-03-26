const theme = {
    "custom-header-blue": "default-blue-theme with-borders",
    "custom-header-green": "default-green-theme with-borders",
}

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

  // 2. Processar colunas do AG-Grid
  comp.columns.forEach((col) => {
    // Lógica para colunas AGRUPADAS (Dimensões)
    if (col.rowGroup) {
      const useHeaderNameAsTitle = col.headerName.includes("<") && col.headerName.includes(">") 
      const colId = useHeaderNameAsTitle ? col.headerName.replace(/<|>/g, "") : col.field;
      const idDimensao = col.field || col.colId || colId; // Garantir que temos um ID único para a dimensão

    // add sku column
     if(col.field === "sku" && !nova.components[0].gridOptions.columns.some(c => c.field === "sku")) {
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
        id: colId,
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

      // Adiciona ao header como agrupador
      novoHeader.push({ groupedBy: idDimensao });
    }

    // Lógica para colunas PIVOT (Métricas que repetem no tempo)
    else if (col.pivot) {
      // No novo formato, o pivot é um container que agrupa as métricas
      // Vamos identificar quais métricas pertencem a este pivot
      const metricas = comp.columns.filter((c) => !c.rowGroup && !c.pivot);

      novoHeader.push({
        pivot: col.field,
        className: "txt-align-center",
        columns: metricas.map((m) => ({
          columnId: m.field,
          format: m.headerName,
          width: m.width || 140,
          className:
            m.cellStyle?.textAlign === "end"
              ? "txt-align-right"
              : "txt-align-center", 
              cells: { 
                formatter: `function() {return cellFormatter({value: this.value, format: '${m.formatCurrency ? "moeda" : "number"}',precision: ${m.precision ?? 2},customStyle: ${m.cellStyle ? JSON.stringify(m.cellStyle).replace(/"([^"]+)":/g, '$1:').replaceAll(" ","") : "null"}});}`},
        })),
      });
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