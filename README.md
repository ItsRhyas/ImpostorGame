# El Impostor

Un juego de deducción social *pass-and-play* (pasarse el dispositivo) para jugar de forma presencial con un solo dispositivo móvil o computadora. Inspirado en juegos de mesa clásicos de identidades secretas.

## ¿De qué trata?

El juego reúne a un grupo de jugadores alrededor de un concepto secreto. Todos los jugadores son "Civiles" y conocen la palabra clave, excepto uno o más jugadores que son "Impostores" y reciben pistas genéricas en lugar de la palabra.

1. **Fase de Preparación:** Ingresa los nombres de los jugadores. El motor de juego asignará los roles de manera aleatoria.
2. **Revelación Secreta:** Los jugadores se turnan para ver su rol en secreto en la pantalla (manteniendo presionado para evitar miradas indiscretas).
3. **Discusión:** Durante el tiempo límite, los jugadores hacen preguntas y discuten para encontrar al Impostor, mientras que el Impostor intenta descifrar cuál es la palabra secreta sin ser descubierto.
4. **Votación:** Al finalizar el tiempo, la mesa vota a quién expulsar. 

## Reglas del Motor
- **Mínimo de jugadores:** 3 (1 impostor, 2 civiles).
- El número máximo de impostores se calcula automáticamente según la cantidad de jugadores: `Math.floor((jugadores - 1) / 2)`.
- El Impostor gana si los Civiles expulsan a un inocente, o si el tiempo se acaba.
- Los Civiles ganan si descubren y expulsan al Impostor correcto.

## Cómo Ejecutarlo Localmente

Dado que el juego utiliza JavaScript Vanilla con **ES Modules** (`<script type="module">`), los navegadores modernos bloquean la ejecución si abres el archivo `index.html` directamente (políticas de seguridad CORS sobre el protocolo `file://`).

Debes servir el proyecto a través de un servidor HTTP local.

### Si usas Python (Recomendado en Linux/Mac)

1. Abre tu terminal en la carpeta del proyecto.
2. Ejecuta el siguiente comando para levantar el servidor en el puerto 8000:
   ```bash
   python3 -m http.server 8000
   ```
3. Abre tu navegador y navega a: [http://localhost:8000](http://localhost:8000)

**Para detener el servidor:**
Presiona `Ctrl + C` en la terminal donde lo ejecutaste. 

*Si lo ejecutaste en segundo plano (background):*
- Para ver si está corriendo: `pgrep -f "python3 -m http.server 8000"`
- Para detenerlo: `pkill -f "python3 -m http.server 8000"`

### Si usas Node.js
Puedes usar utilidades como `serve`:
```bash
npx serve .
```

## Despliegue en Producción
Este proyecto está escrito 100% en Vanilla Frontend (HTML, CSS, JS puro), por lo que no requiere procesos de *build* (ni Webpack, ni Vite). Puede ser desplegado instantáneamente en cualquier hosting estático gratuito como **GitHub Pages**, **Vercel** o **Netlify** simplemente subiendo los archivos.