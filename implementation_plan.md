# Adaptar migração para interpretar e converter "nova-tabela" (Heatmap/Pivot Customizado)

A adaptação será feita no script `migrateTable.js` para suportar corretamente componentes cujo tipo original seja `nova-tabela` ou que precisem de formatação com cores dinâmicas (ex: heatmap de `cor_fundo` e `cor_texto` no pivot).

## Proposed Changes

### `script/migrateTable.js`

1. **Identificar "nova-tabela" ou Necessidade de Cores:**
   No loop de componentes, vamos verificar se o objeto possui marcações para esse formato. Por exemplo, se `comp.type === "nova-tabela"`, ou se alguma coluna precisa dessa injeção de estilo via `row.data`.

2. **Injetar Colunas Extras no Pivot:**
   Modificar a função `processarPivot` (ou adicionar condicional). Para cada métrica do pivot (ex: `html` ou `price_index`), se estivermos em uma "nova-tabela", adicionaremos ao `pivotHeader.columns`:
   - A coluna da métrica em si, com um `formatter` avançado que busca `cor_fundo_pivot_${pivotColumn}` e `cor_texto_pivot_${pivotColumn}`.
   - Um objeto para `{ columnId: "cor_fundo", enabled: false }`.
   - Um objeto para `{ columnId: "cor_texto", enabled: false }`.

3. **Gerar o `Formatter` Customizado:**
   Ao invés do `buildFormatterString` tradicional, usaremos uma string customizada semelhante a:
   ```javascript
   function() {
     const pivotColumn = this.column.id.split('_pivot_')[1];
     const bgColor = this.row.data[\`cor_fundo_pivot_\${pivotColumn}\`];
     const txtColor = this.row.data[\`cor_texto_pivot_\${pivotColumn}\`];
     return cellFormatter({
       value: this.value,
       customStyle: { backgroundColor: bgColor, color: txtColor }
     });
   }
   ```
   Além disso, as classes de CSS como `txt-align-center no-padding` serão passadas no lugar da classe fixa.

## Open Questions
> [!IMPORTANT]
> - A injeção das colunas `cor_fundo` e `cor_texto` deve ser feita SEMPRE que o componente pai tiver `type: "nova-tabela"`, ou tem algum outro indicativo na configuração (como `configs.tipo_dados`)?
> - Na métrica principal, o campo que aparece no seu exemplo de origem é `html`, mas no exemplo de destino é `price_index`. Devemos simplesmente pegar o field da métrica existente da tabela antiga e aplicar esse formatter?
