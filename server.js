const express = require('express');
const migrationService = require('./service/migrationService');

const app = express();
const port = 3333;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/heatlh', (req, res) => {
  res.json({ message: 'Api is RUNNING' });
});

const token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjM3MzAwNzY5YTA3ZTA1MTE2ZjdlNTEzOGZhOTA5MzY4NWVlYmMyNDAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdjM2MC1wbGF0Zm9ybS1kZXYiLCJhdWQiOiJ2MzYwLXBsYXRmb3JtLWRldiIsImF1dGhfdGltZSI6MTc3MzQyNzg2MSwidXNlcl9pZCI6Ijc4NjIiLCJzdWIiOiI3ODYyIiwiaWF0IjoxNzc0NDY5NzIzLCJleHAiOjE3NzQ0NzMzMjMsImVtYWlsIjoicmFmYWVsLnNvdXNhQG1ldXZhcmVqbzM2MC5jb20uYnIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJyYWZhZWwuc291c2FAbWV1dmFyZWpvMzYwLmNvbS5iciJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.nUrdxb0wzlGxyr8fHbixYd5NkTS_07Hd5dFOWFBAARV6xECSeqgr89uPZPb8d644wnPgtNgxQ_4_rrfTflNb3Lisf5WltKglTZXU0Hk94WIqSrV_wfBKvngImcTUotGoiSgc2fSOGIcsFO55kqnonfDgP_6jGi8HjeSiJG3iqwx0xiwbOJqbyEz23gJpDXltNOMSWlqjTFKeLbmnVVuXhKEJHxKKbPEUK0AaRFdf-1XawPQVpXuwkeslRKTPvEsVy3pq2CITqaOKFTy-VcMfTTH_cDGeK1rNGoUK8riVPEovyCMApIOTeuI4HuANn9bpPdbPvged58JYm8BylCnaSw"

app.post('/migrar-tabela', (req, res) => {
    try{
    const { ids } = req.body;

    ids.forEach(id => migrationService.batchMigrateTables(id, token));
    res.json({ message: 'Migration started' });
    }
    catch(error){
        console.error('Error migrating table:', error);
        res.status(500).json({ error: 'Error migrating table' });
    }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});