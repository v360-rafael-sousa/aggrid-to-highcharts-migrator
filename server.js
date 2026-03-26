const express = require("express");
const migrationService = require("./service/migrationService");

const app = express();
const port = 3333;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/heatlh", (req, res) => {
  res.json({ message: "Api is RUNNING" });
});

const token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjM3MzAwNzY5YTA3ZTA1MTE2ZjdlNTEzOGZhOTA5MzY4NWVlYmMyNDAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdjM2MC1wbGF0Zm9ybS1kZXYiLCJhdWQiOiJ2MzYwLXBsYXRmb3JtLWRldiIsImF1dGhfdGltZSI6MTc3MzQyNzg2MSwidXNlcl9pZCI6Ijc4NjIiLCJzdWIiOiI3ODYyIiwiaWF0IjoxNzc0NTMzMTQxLCJleHAiOjE3NzQ1MzY3NDEsImVtYWlsIjoicmFmYWVsLnNvdXNhQG1ldXZhcmVqbzM2MC5jb20uYnIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJyYWZhZWwuc291c2FAbWV1dmFyZWpvMzYwLmNvbS5iciJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.EsBWy9ZAxfkC1pL1X2p7YFLOvwK3vWss_dl8xUr3d1s1Naj2V5cIz_5KNo_AykaMwuNC4iDIn7ltuE_fqDVUYynJTX4L4mmviyrJCZgEXCDD61QbA_da1Aqb4aduDNd8sdsGdLwQISTf7q2LsB-0mwYvyW7E-dWsqOEOHUmlC4ciWMDAOyjx4PcOKI1GUgl9sSfWlmV9--t3Hq1kBzdiS3akL9yf1x7mEFRjpcLQcqtkiJUGieSHXHFEExdbhQkssHVRNdmepGWw_ITKeNrPYGLwzNWu2-mRpV8nWG8VATld5P3Yyoptme4HAier2fQDlIIvtVjPngADbSOooQ0stQ"
app.post("/migrar-tabela", (req, res) => {
  try {
    const { pagesIds } = req.body;
    const pagesMigrates = [];

    pagesIds.forEach((pageId) =>
      (migrationService.batchMigrateTables(pageId, token))
    );
    res.json({ message: "Migration started", pagesMigrates: pagesMigrates });
  } catch (error) {
    console.error("Error migrating table:", error);
    res.status(500).json({ error: "Error migrating table" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
