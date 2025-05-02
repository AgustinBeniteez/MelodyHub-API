import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import colors from "picocolors";
import { readFileSync } from "fs";

// Leer la versión desde package.json
const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url))
);
const { version } = packageJson;

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
  res.setHeader("Content-Type", "Text/html");
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          background-color: black;
          color: white;
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        h1 {
          color: white;
        }
        p {
          color: white;
        }
      </style>
    </head>
    <body>
      <h1>Bienvenido a MelodyHub API</h1>
      <p>Version: ${version}</p>
      <p>Puerto: ${PORT}</p>

      <h2>Documentacion</h2>
      <p>Para obtener informacion sobre los datos del hub, visita <a href="/hub" style="color: white;">/hub</a>.</p>
      <p>Para buscar informacion de un artista especifico, utiliza la ruta <code style="color: white;">/artist/nombre-del-artista</code> </br>Por ejemplo:</p>
      <ul style="color: white;">
        <li><a href="/artist/Linkin Park" style="color: white;">/artist/Linkin Park</a> - Obtiene informacion sobre Linkin Park y sus albumes</li>
      </ul>
    </body>
    </html>
  `);
  
});

// Ruta para obtener todos los datos del hub
app.get("/hub", (req, res) => {
  try {
    const hubData = readFileSync(new URL("./hub/api.json", import.meta.url));
    res.json(JSON.parse(hubData));
  } catch (error) {
    console.error("Error al leer el archivo JSON:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para buscar artista por nombre
app.get("/artist/:name", (req, res) => {
  try {
    const artistName = req.params.name;
    const hubData = JSON.parse(readFileSync(new URL("./hub/api.json", import.meta.url)));
    
    // Buscar el artista en todos los géneros
    let artistInfo = null;
    for (const genre of hubData.genres) {
      const artist = genre.artists.find(a => a.name.toLowerCase() === artistName.toLowerCase());
      if (artist) {
        artistInfo = {
          name: artist.name,
          genre: genre.name,
          albums: artist.albums
        };
        break;
      }
    }

    if (artistInfo) {
      res.json(artistInfo);
    } else {
      res.status(404).json({ error: "Artista no encontrado" });
    }
  } catch (error) {
    console.error("Error al buscar artista:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(
    `Servidor MelodyHub API corriendo en${colors.green(
      ` http://localhost:${PORT}`
    )}`
  );
});
