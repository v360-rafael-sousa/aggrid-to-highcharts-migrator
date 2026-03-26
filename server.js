const express = require("express");
const migrationService = require("./service/migrationService");

const app = express();
const port = 3333;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/heatlh", (req, res) => {
  res.json({ message: "Api is RUNNING" });
});

app.post("/migrar-tabela", (req, res) => {
  try {
    const { pagesIds } = req.body;
    const headers  = req.headers;
    const pagesMigrates = [];
    pagesIds.forEach((pageId) =>
      (migrationService.batchMigrateTables(pageId, headers.authorization))
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
