import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Configuración de variables de entorno
dotenv.config();

// Crear la aplicación Express
const app = express();

// Configuración de middleware
app.use(cors());
app.use(express.json());

// Puerto para el servidor
const PORT = process.env.PORT || 3000;

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({
    message: "Bienvenido a MelodyHub API",
    version: "1.1.0",
  });
});

// Rutas para álbumes
app.get("/albums/:id", (req, res) => {
  // TODO: Implementar lógica para obtener álbum por ID
  res.json({
    message: `Obtener información del álbum ${req.params.id}`,
  });
});

// Rutas para pistas
app.get("/tracks/:id", (req, res) => {
  // TODO: Implementar lógica para obtener pista por ID
  res.json({
    message: `Obtener información de la pista ${req.params.id}`,
  });
});

// Rutas para artistas
app.get("/artists/:id", (req, res) => {
  // TODO: Implementar lógica para obtener artista por ID
  res.json({
    message: `Obtener información del artista ${req.params.id}`,
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor MelodyHub API corriendo en http://localhost:${PORT}`);
});
