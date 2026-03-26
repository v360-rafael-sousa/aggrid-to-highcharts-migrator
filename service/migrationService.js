const axios = require('axios');
const script = require('../script/migrateTable');


const batchMigrateTables = async (pageId, token) => { 
    try{
        const res = await axios.get(`http://localhost:4201/page/${pageId}`,
             {headers: {
                'authorization': `Bearer ${token}`}});
        const pagina = res.data;
        const novaPagina = {...pagina, specification: script.migrarTabela(JSON.parse(pagina.specification))};
        
        // save page
        const savePage = await axios.put(`http://localhost:4201/page/${pageId}`, novaPagina, {
            headers: {
                'authorization': `Bearer ${token}`
            }
        })
        if(savePage.status !== 200){
            throw new Error(`Failed to save page ${pageId}`);
        }

        console.log(`Page ${pageId} migrated successfully!`);
        return pageId;
    }
    catch(error){
        console.error('Error migrating table:', error);
        throw error;
    }
}


exports.batchMigrateTables = batchMigrateTables;