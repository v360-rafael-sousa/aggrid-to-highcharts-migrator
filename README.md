```sql
-- Consulta para encontrar as páginas com tabelas do AG-GRID
SELECT
  p.id,
  (select id from report r where p.report_type_id = r.report_type_id limit 1),
  p.report_type_id,
  p.title,
  p.description,
  p."section"
FROM page p
WHERE p.specification::jsonb @> '{"components": [{"type": "nova-tabela"}]}';
```
