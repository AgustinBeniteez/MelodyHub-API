# MelodyHub-API

Bienvenido a MelodyHub API
Versión: 1.4.4

Puerto: 10000

## Documentación
Despertar el servidor con la ruta `/wakeup`

### Todo el contenido en un JSON
Para obtener información sobre los datos del hub, visita `/hub`.

### Búsqueda de Artistas

Para buscar información de un artista específico, utiliza la ruta `/artist/nombre-del-artista`

Por ejemplo:

- `/artist/Linkin Park` - Obtiene información sobre Linkin Park y sus álbumes
- `/artist/Linkin Park/2007` - Obtiene los álbumes de Linkin Park del año 2007
- `/artist/Linkin Park/album/from Zero` - Obtiene información específica del álbum From Zero de Linkin Park

### Búsqueda por Género y Canciones

Para obtener todos los artistas de un género específico, utiliza la ruta `/genre/nombre-del-genero/artists`

Por ejemplo:

- `/genre/Rock/artists` - Obtiene todos los artistas del género Rock

Para buscar información sobre una canción específica, utiliza la ruta `/song/nombre-de-la-cancion`

Por ejemplo:

- `/song/Anti-Hero` - Obtiene información sobre la canción Anti-Hero

## Características

- Acceso a metadatos musicales completos
- Información detallada de álbumes, pistas y artistas
- Portadas en alta resolución
- Integración fácil mediante JSON sobre HTTP
- Desarrollado con Node.js
