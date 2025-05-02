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

// Middleware de registro para todas las solicitudes
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString();
  console.log(
    `[${timestamp}] ${colors.blue(req.method)} ${colors.green(req.url)}`
  );
  next();
});

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
        <li><a href="/artist/Linkin Park/2007" style="color: white;">/artist/Linkin Park/2007</a> - Obtiene los albumes de Linkin Park del year 2007</li>
        <li><a href="/artist/Linkin Park/album/Meteora" style="color: white;">/artist/Linkin Park/album/Meteora</a> - Obtiene informacion especifica del album Meteora de Linkin Park</li>
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
    const hubData = JSON.parse(
      readFileSync(new URL("./hub/api.json", import.meta.url))
    );

    // Buscar el artista en todos los géneros
    let artistInfo = null;
    for (const genre of hubData.genres) {
      const artist = genre.artists.find(
        (a) => a.name.toLowerCase() === artistName.toLowerCase()
      );
      if (artist) {
        artistInfo = {
          name: artist.name,
          genre: genre.name,
          albums: artist.albums,
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

// Ruta para buscar artista por año
app.get("/artist/:name/:year", (req, res) => {
  try {
    const artistName = req.params.name;
    const year = parseInt(req.params.year);
    const hubData = JSON.parse(
      readFileSync(new URL("./hub/api.json", import.meta.url))
    );

    // Buscar el artista y filtrar sus álbumes por año
    let artistInfo = null;
    for (const genre of hubData.genres) {
      const artist = genre.artists.find(
        (a) => a.name.toLowerCase() === artistName.toLowerCase()
      );
      if (artist) {
        const albumsByYear = artist.albums.filter(
          (album) => album.releaseYear === year
        );
        if (albumsByYear.length > 0) {
          artistInfo = {
            name: artist.name,
            genre: genre.name,
            year: year,
            albums: albumsByYear,
          };
        }
        break;
      }
    }

    if (artistInfo) {
      res.json(artistInfo);
    } else {
      res.status(404).json({
        error:
          "No se encontraron álbumes para este artista en el año especificado",
      });
    }
  } catch (error) {
    console.error("Error al buscar artista por año:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para buscar álbum específico de un artista
app.get("/artist/:name/album/:albumName", (req, res) => {
  try {
    const artistName = req.params.name;
    const albumName = req.params.albumName;
    const hubData = JSON.parse(
      readFileSync(new URL("./hub/api.json", import.meta.url))
    );

    // Buscar el artista y el álbum específico
    let albumInfo = null;
    for (const genre of hubData.genres) {
      const artist = genre.artists.find(
        (a) => a.name.toLowerCase() === artistName.toLowerCase()
      );
      if (artist) {
        const album = artist.albums.find(
          (a) => a.name.toLowerCase() === albumName.toLowerCase()
        );
        if (album) {
          albumInfo = {
            artist: artist.name,
            genre: genre.name,
            album: album,
          };
        }
        break;
      }
    }

    if (albumInfo) {
      res.json(albumInfo);
    } else {
      res.status(404).json({ error: "Álbum no encontrado para este artista" });
    }
  } catch (error) {
    console.error("Error al buscar álbum:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(
    `Servidor MelodyHub API ${colors.green(`🟢 corriendo`)} en${colors.blue(
      ` http://localhost:${PORT}`
    )}`
  );
});
