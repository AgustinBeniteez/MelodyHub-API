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

      <h2>Busqueda por Genero y Canciones</h2>
      <p>Para obtener todos los artistas de un genero especifico, utiliza la ruta <code style="color: white;">/genre/nombre-del-genero/artists</code> </br>Por ejemplo:</p>
      <ul style="color: white;">
        <li><a href="/genre/Rock/artists" style="color: white;">/genre/Rock/artists</a> - Obtiene todos los artistas del genero Rock</li>
      </ul>

      <p>Para buscar informacion sobre una cancion especifica, utiliza la ruta <code style="color: white;">/song/nombre-de-la-cancion</code> </br>Por ejemplo:</p>
      <ul style="color: white;">
        <li><a href="/song/Anti-Hero" style="color: white;">/song/Anti-Hero</a> - Obtiene informacion sobre la cancion Anti-Hero</li>
      </ul>
    </body>
    </html>
  `);
});

// Ruta para obtener todos los datos del hub
app.get("/hub", async (req, res) => {
  try {
    const hubData = JSON.parse(
      readFileSync(new URL("./hub/api.json", import.meta.url))
    );

    // Procesar todos los álbumes para obtener portadas de Deezer
    const processedGenres = await Promise.all(
      hubData.genres.map(async (genre) => {
        const processedArtists = await Promise.all(
          genre.artists.map(async (artist) => {
            const processedAlbums = await Promise.all(
              artist.albums.map(async (album) => {
                const deezerData = await searchDeezerTrack(
                  album.name,
                  artist.name
                );
                return {
                  ...album,
                  coverImage: deezerData?.albumCover || album.coverImage,
                };
              })
            );
            return {
              ...artist,
              albums: processedAlbums,
            };
          })
        );
        return {
          ...genre,
          artists: processedArtists,
        };
      })
    );

    res.json({
      ...hubData,
      genres: processedGenres,
    });
  } catch (error) {
    console.error("Error al procesar los datos del hub:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para buscar artista por nombre
app.get("/artist/:name", async (req, res) => {
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
        // Procesar los álbumes para obtener las portadas de Deezer
        const processedAlbums = await Promise.all(
          artist.albums.map(async (album) => {
            // Buscar el álbum en Deezer
            const deezerData = await searchDeezerTrack(album.name, artist.name);
            return {
              ...album,
              coverImage: deezerData?.albumCover || album.coverImage,
            };
          })
        );

        artistInfo = {
          name: artist.name,
          genre: genre.name,
          albums: processedAlbums,
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
app.get("/artist/:name/:year", async (req, res) => {
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
          // Procesar los álbumes para obtener las portadas de Deezer
          const processedAlbums = await Promise.all(
            albumsByYear.map(async (album) => {
              const deezerData = await searchDeezerTrack(
                album.name,
                artist.name
              );
              return {
                ...album,
                coverImage: deezerData?.albumCover || album.coverImage,
              };
            })
          );
          artistInfo = {
            name: artist.name,
            genre: genre.name,
            year: year,
            albums: processedAlbums,
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
app.get("/artist/:name/album/:albumName", async (req, res) => {
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
          // Obtener la portada del álbum desde Deezer
          const deezerData = await searchDeezerTrack(album.name, artist.name);
          const processedAlbum = {
            ...album,
            coverImage: deezerData?.albumCover || album.coverImage,
          };
          albumInfo = {
            artist: artist.name,
            genre: genre.name,
            album: processedAlbum,
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

// Ruta para obtener artistas por género
app.get("/genre/:name/artists", (req, res) => {
  try {
    const genreName = req.params.name;
    const hubData = JSON.parse(
      readFileSync(new URL("./hub/api.json", import.meta.url))
    );

    // Buscar el género y obtener sus artistas
    const genre = hubData.genres.find(
      (g) => g.name.toLowerCase() === genreName.toLowerCase()
    );

    if (genre) {
      res.json({
        genre: genre.name,
        artists: genre.artists.map((artist) => ({
          name: artist.name,
          albumCount: artist.albums.length,
        })),
      });
    } else {
      res.status(404).json({ error: "Género no encontrado" });
    }
  } catch (error) {
    console.error("Error al buscar artistas por género:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Función para buscar en Deezer
async function searchDeezerTrack(title, artist) {
  try {
    const query = `${title} ${artist}`;
    const response = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return {
        preview: data.data[0].preview, // URL de preview de 30 segundos
        albumCover:
          data.data[0].album.cover_xl ||
          data.data[0].album.cover_big ||
          data.data[0].album.cover, // URL de la portada del álbum
      };
    }
    return null;
  } catch (error) {
    console.error("Error al buscar en Deezer:", error);
    return null;
  }
}

// Ruta para buscar canción
app.get("/song/:name", async (req, res) => {
  try {
    const songName = req.params.name;
    const hubData = JSON.parse(
      readFileSync(new URL("./hub/api.json", import.meta.url))
    );

    // Buscar la canción en todos los álbumes de todos los artistas
    let songInfo = [];
    for (const genre of hubData.genres) {
      for (const artist of genre.artists) {
        for (const album of artist.albums) {
          const songFound = album.songs.find(
            (song) => song.toLowerCase() === songName.toLowerCase()
          );
          if (songFound) {
            // Construir la ruta del archivo MP3
            const audioPath = new URL(
              `./audio/${artist.name}/${album.name}/${songFound}.mp3`,
              import.meta.url
            );

            let audioUrl = null;
            let albumImageUrl = album.coverImage;
            let source = "local";

            try {
              const stat = readFileSync(audioPath);
              audioUrl = `/stream/${encodeURIComponent(
                artist.name
              )}/${encodeURIComponent(album.name)}/${encodeURIComponent(
                songFound
              )}`;
            } catch (err) {
              // Si el archivo local no existe, buscar en Deezer
              const deezerData = await searchDeezerTrack(
                songFound,
                artist.name
              );
              if (deezerData) {
                audioUrl = deezerData.preview;
                albumImageUrl = deezerData.albumCover;
                source = "deezer";
              }
            }

            songInfo.push({
              title: songFound,
              artist: artist.name,
              album: album.name,
              genre: genre.name,
              releaseYear: album.releaseYear,
              audioUrl: audioUrl,
              albumImageUrl: albumImageUrl,
              source: source,
            });
          }
        }
      }
    }

    if (songInfo.length > 0) {
      res.json(songInfo);
    } else {
      res.status(404).json({ error: "Canción no encontrada" });
    }
  } catch (error) {
    console.error("Error al buscar canción:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para streaming de audio
app.get("/stream/:artist/:album/:song", (req, res) => {
  try {
    const { artist, album, song } = req.params;
    const audioPath = new URL(
      `./audio/${decodeURIComponent(artist)}/${decodeURIComponent(
        album
      )}/${decodeURIComponent(song)}.mp3`,
      import.meta.url
    );

    // Verificar si el archivo existe
    try {
      const stat = readFileSync(audioPath);
      res.writeHead(200, {
        "Content-Type": "audio/mpeg",
        "Content-Length": stat.length,
        "Accept-Ranges": "bytes",
      });

      const readStream = createReadStream(audioPath);
      readStream.pipe(res);
    } catch (err) {
      res.status(404).json({ error: "Archivo de audio no encontrado" });
    }
  } catch (error) {
    console.error("Error al transmitir audio:", error);
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
