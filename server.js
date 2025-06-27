// Importação dos módulos necessários
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

// --- Configuração do Servidor ---
const app = express();
const PORT = 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Configuração da Conexão com o Banco de Dados MySQL ---
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'SUA_SENHA_DO_MYSQL_AQUI', // Altere quando for usar
    database: 'loja_games'
};

let dbPool;

async function initializeDbPool() {
    try {
        dbPool = mysql.createPool(dbConfig);
        const connection = await dbPool.getConnection();
        console.log('Conexão com o banco de dados MySQL estabelecida com sucesso!');
        connection.release();
    } catch (error) {
        console.error('ERRO FATAL: Não foi possível conectar ao banco de dados MySQL.');
        console.error(`Verifique se o banco de dados 'loja_games' existe e se as credenciais em 'dbConfig' (usuário e senha) estão corretas.`);
        console.error('Erro original:', error.message);
        process.exit(1); 
    }
}


// --- Rotas da API ---

// [GET] /api/produtos - Retorna todos os produtos
app.get('/api/produtos', async (req, res) => {
    try {
        const [rows] = await dbPool.query('SELECT * FROM produtos ORDER BY data_criacao DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// [POST] /api/produtos - Cadastra um novo produto
app.post('/api/produtos', async (req, res) => {
    const { nome, descricao, preco, imagem_url } = req.body;

    if (!nome || !descricao || !preco || !imagem_url) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const query = 'INSERT INTO produtos (nome, descricao, preco, imagem_url) VALUES (?, ?, ?, ?)';
        const [result] = await dbPool.query(query, [nome, descricao, preco, imagem_url]);
        
        const newProduct = {
            id: result.insertId,
            nome,
            descricao,
            preco,
            imagem_url
        };
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// [DELETE] /api/produtos/:id - Exclui um produto
app.delete('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM produtos WHERE id = ?';
        const [result] = await dbPool.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        res.status(200).json({ message: 'Produto excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});


// --- Inicialização do Servidor ---
async function startServer() {
    await initializeDbPool();
    
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
    });
}

// Apenas inicie o servidor se este ficheiro for executado diretamente
if (require.main === module) {
    startServer();
}
