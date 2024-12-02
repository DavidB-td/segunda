const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const app = express();
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("O arquivo não é uma imagem."), false);
    }
  },
});

const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
};

let connection;

function handleDisconnect() {
  connection = mysql.createConnection(dbConfig);

  connection.connect((err) => {
    if (err) {
      console.error("Erro ao conectar ao MySQL:", err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log("Conectado ao MySQL");
      setupDatabase();
    }
  });

  connection.on("error", (err) => {
    console.error("Erro no banco de dados:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

function setupDatabase() {
  connection.query(
    `
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            sobrenome VARCHAR(255) NOT NULL,
            foto VARCHAR(255) NOT NULL
        )
    `,
    (err) => {
      if (err) {
        console.error("Erro ao criar a tabela:", err);
      } else {
        console.log('Tabela "usuarios" criada ou já existente');
      }
    }
  );
}

handleDisconnect();

app.use(express.json());
app.use(cors());

app.get("/dados", (req, res) => {
  connection.query("SELECT * FROM usuarios", (err, results) => {
    if (err) {
      console.error("Erro ao buscar dados:", err);
      res.status(500).json({ error: "Erro ao buscar dados" });
    } else {
      res.json(results);
    }
  });
});

app.post("/dados", upload.single("foto"), (req, res) => {
  const { nome, sobrenome } = req.body;
  const foto = req.file.filename;

  console.log("Dados recebidos:", { nome, sobrenome, foto });

  const query = "INSERT INTO usuarios (nome, sobrenome, foto) VALUES (?, ?, ?)";
  connection.query(query, [nome, sobrenome, foto], (err, result) => {
    if (err) {
      console.error("Erro ao inserir dados:", err);
      res.status(500).json({ error: "Erro ao inserir dados" });
    } else {
      console.log("Dados inseridos com sucesso:", result);
      res.sendStatus(200);
    }
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
