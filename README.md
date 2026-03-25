```sql
-- Consulta para encontrar as páginas com tabelas do AG-GRID
SELECT DISTINCT
p.id,
p.report_type_id,
p.title,
p.description,
p."section"
FROM page p
WHERE p.specification::jsonb @> '{"components": [{"gridOptions": {"groupDefaultExpanded": -1}}]}';
```
