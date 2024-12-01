const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const app = express();
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de tamanho de arquivo: 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("File is not an image"), false);
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
      console.error("Error connecting to MySQL:", err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log("Connected to MySQL");
      setupDatabase();
    }
  });

  connection.on("error", (err) => {
    console.error("Database error:", err);
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
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            sobrenome VARCHAR(255) NOT NULL,
            foto VARCHAR(255) NOT NULL
        )
    `,
    (err) => {
      if (err) {
        console.error("Error creating table:", err);
      } else {
        console.log('Table "users" exists or created successfully');
      }
    }
  );
}

handleDisconnect();

app.use(express.json());
app.use(cors());

app.get("/data", (req, res) => {
  connection.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res.status(500).json({ error: "Error fetching data" });
    } else {
      res.json(results);
    }
  });
});

app.post("/data", upload.single("foto"), (req, res) => {
  const { nome, sobrenome } = req.body;
  const foto = req.file.filename;

  console.log("Received data:", { nome, sobrenome, foto });

  const query = "INSERT INTO users (nome, sobrenome, foto) VALUES (?, ?, ?)";
  connection.query(query, [nome, sobrenome, foto], (err, result) => {
    if (err) {
      console.error("Error inserting data:", err);
      res.status(500).json({ error: "Error inserting data" });
    } else {
      console.log("Data inserted successfully:", result);
      res.sendStatus(200);
    }
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
