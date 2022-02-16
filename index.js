const express = require('express');
const app = express();         
const bodyParser = require('body-parser');
const port = 3000; //porta padrão
const sql = require('mssql');
const connStr = "YOUR STRING CONNECTION"; 

//projeto não foi feito com o intuito de .env podendo ser adicionado

//fazendo a conexão global
sql.connect(connStr)
   .then(conn => global.conn = conn)
   .catch(err => console.log(err));

//configurando o body parser para pegar POSTS mais tarde
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//listagem de clientes
function execSQLQuery(sqlQry, res){
    global.conn.request()
               .query(sqlQry)
               .then(result => res.json(result.recordset))
               .catch(err => res.json(err));
};

//definindo as rotas
const router = express.Router();
router.get('/', (req, res) => res.json({ message: 'Funcionando!' }));
app.use('/', router);

//rota de clientes
router.get('/clientes', (req, res) =>{
    execSQLQuery('SELECT * FROM Clientes', res);
});

//rota de clientes por id
router.get('/clientes/:id?', (req, res) =>{
    let filter = '';
    if(req.params.id) filter = ' WHERE ID=' + parseInt(req.params.id);
    execSQLQuery('SELECT * FROM Clientes' + filter, res);
});

//deletando um cliente especifico
router.delete('/clientes/:id', (req, res) =>{
    execSQLQuery('DELETE Clientes WHERE ID=' + parseInt(req.params.id), res);
});

//adicionando um cliente
router.post('/clientes', (req, res) =>{
    const id = parseInt(req.body.id);
    const nome = req.body.nome.substring(0,150);
    const cpf = req.body.cpf.substring(0,11);
    execSQLQuery(`INSERT INTO Clientes(ID, Nome, CPF) VALUES(${id},'${nome}','${cpf}')`, res);
});

//atualizando um cliente
router.patch('/clientes/:id', (req, res) =>{
    const id = parseInt(req.params.id);
    const nome = req.body.nome.substring(0,150);
    const cpf = req.body.cpf.substring(0,11);
    execSQLQuery(`UPDATE Clientes SET Nome='${nome}', CPF='${cpf}' WHERE ID=${id}`, res);
});

//Executando muitas operações SQL (function para ordenar os comandos)
//Neste exemplo eu possuía um array de itens que eram endereços de email que eu queria 
//excluir do banco de dados. O i passado por parâmetro inicialmente é 0, quando chamarmos esta 
//função a primeira vez e depois vai sendo incrementado recursivamente. Já o objeto conn é a 
//conexão do banco de dados, que você pode omitir se estiver usando ela global.
//O primeiro if do código garante a condição de parada da recursão e o catch na promise 
//da query te contará se houver algum erro. Nada muito rebuscado, mas me foi bem útil!
function execute(items, i, conn){
    if(!items[i]) return console.log("terminou");

    conn.request()
        .query(`DELETE Usuario WHERE email='${items[i]}'`)
        .then(result => {
            console.log(result)
            execute(items, ++i, conn)//faz o próximo
        })
        .catch(err => console.log(err));
};

// criando uma tabela e inserindo dados
function createTable(conn){
    const table = new sql.Table('Clientes');
    table.create = true;
    table.columns.add('ID', sql.Int, {nullable: false, primary: true});
    table.columns.add('Nome', sql.NVarChar(150), {nullable: false});
    table.columns.add('CPF', sql.NChar(11), {nullable: false});
    table.rows.add(1, 'teste1', '12345678901');
    table.rows.add(2, 'teste2', '09876543210');
    table.rows.add(3, 'teste3', '12312312399');
    table.rows.add(4, 'teste4', '12312213255');
    table.rows.add(5, 'teste5', '12312325229');

    const request = new sql.Request()
    request.bulk(table)
           .then(result => console.log('funcionou'))
           .catch(err => console.log('erro no bulk. ' + err));
};

//iniciando a api > node index.js
app.listen(port);
console.log('API funcionando!');

