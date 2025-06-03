// ----------------------
// 1) Configuración inicial
// ----------------------

// 1.1) Carpeta donde están las imágenes (relativo a index.html)
const IMAGE_PATH = "images/";

// 1.2) LISTA MANUAL de todos los nombres de archivo en /images/
//     --> El navegador NO puede listar carpetas solo, así que enumera aquí cada imagen.
//     --> Cada par debe compartir el mismo prefijo antes del "_".
const ALL_IMAGE_FILES = [
  "A_1.png", "A_2.png",
  "B_1.png", "B_2.png",
  "C_1.png", "C_2.png",
  "D_1.png", "D_2.png",
  "E_1.png", "E_2.png",
  "F_1.png", "F_2.png",
  "G_1.png", "G_2.png",
  "H_1.png", "H_2.png",
  "I_1.png", "I_2.png",
  "J_1.png", "J_2.png",
  "K_1.png", "K_2.png",
  "L_1.png", "L_2.png",
   // Ejemplo para llegar a 32
  // … agrega/quita según tus archivos. Total debe ser par.
];

// 1.3) Variables derivadas
const totalCards = ALL_IMAGE_FILES.length;  // e.g. 32

const boardEl = document.getElementById("game-board");
const startBtn = document.getElementById("start-btn");

// Estado actual del juego
let firstFlippedCard  = null;
let secondFlippedCard = null;
let lockBoard         = false;
let matchesFound      = 0;
let totalPairs        = 0;

// Guardaremos cuántas filas/columnas tiene la última generación
let currentRows = 0;
let currentCols = 0;

// ----------------------
// 2) Funciones auxiliares
// ----------------------

// 2.1) Agrupa nombres de archivo por prefijo (todo lo antes del "_").
function groupByPrefix(fileNames) {
  const groups = {};
  fileNames.forEach((file) => {
    const prefix = file.split("_")[0];
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(file);
  });
  return groups;
}

// 2.2) Baraja un array in-place (Fisher–Yates).
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 2.3) Crea el elemento DOM de cada carta (sin placeholder)
function createCardElement(imageFile) {
  const cardContainer = document.createElement("div");
  cardContainer.classList.add("card");
  cardContainer.dataset.prefix = imageFile.split("_")[0]; // ejemplo: "A"

  const inner = document.createElement("div");
  inner.classList.add("card-inner");

  // Cara trasera (back)
  const backFace = document.createElement("div");
  backFace.classList.add("card-face", "card-back");
  backFace.textContent = "❓";

  // Cara frontal con la imagen
  const frontFace = document.createElement("div");
  frontFace.classList.add("card-face", "card-front");
  const imgEl = document.createElement("img");
  imgEl.src = IMAGE_PATH + imageFile;
  imgEl.alt = imageFile;
  frontFace.appendChild(imgEl);

  inner.appendChild(backFace);
  inner.appendChild(frontFace);
  cardContainer.appendChild(inner);

  // Evento click para voltear
  cardContainer.addEventListener("click", () => {
    if (lockBoard) return;
    if (cardContainer === firstFlippedCard) return;
    flipCard(cardContainer);
  });

  return cardContainer;
}

// 2.4) Lógica de voltear carta
function flipCard(card) {
  card.classList.add("flipped");

  if (!firstFlippedCard) {
    firstFlippedCard = card;
    return;
  }
  secondFlippedCard = card;
  lockBoard = true;
  checkForMatch();
}

// 2.5) Comprueba si las dos cartas volteadas coinciden
function checkForMatch() {
  const isMatch =
    firstFlippedCard.dataset.prefix ===
    secondFlippedCard.dataset.prefix;

  if (isMatch) {
    // 2.5.1) Si coinciden, agregamos la clase “match” para flash verde
    firstFlippedCard.classList.add("match");
    secondFlippedCard.classList.add("match");

    matchesFound++;

    // Tras 0.6s (duración animación), quitamos la clase y reseteamos estado
    setTimeout(() => {
      firstFlippedCard.classList.remove("match");
      secondFlippedCard.classList.remove("match");
      resetFlippedCards();

      // Si ya encontramos todos los pares, avisamos victoria
      if (matchesFound === totalPairs) {
        setTimeout(() => alert("¡Ganaste! 🎉"), 200);
      }
    }, 1500);

  } else {
    // 2.5.2) Si no coinciden, agregamos la clase “mismatch” para flash rojo
    firstFlippedCard.classList.add("mismatch");
    secondFlippedCard.classList.add("mismatch");

    // Tras 0.6s, quitamos “mismatch” y volteamos ambas cartas de nuevo a tapado
    setTimeout(() => {
      firstFlippedCard.classList.remove("mismatch", "flipped");
      secondFlippedCard.classList.remove("mismatch", "flipped");
      resetFlippedCards();
    }, 1500);
  }
}

// 2.6) Resetea el estado de cartas volteadas
function resetFlippedCards() {
  [firstFlippedCard, secondFlippedCard] = [null, null];
  lockBoard = false;
}

// ----------------------
// 3) Función principal: genera el juego con EXACTAMENTE 4 filas
// ----------------------

function startGame() {
  // 3.1) Validaciones: debe haber un número par de imágenes
  if (totalCards % 2 !== 0) {
    alert("❌ Debe haber un número par de imágenes en ALL_IMAGE_FILES.");
    return;
  }

  // 3.2) Reseteamos tablero y estado
  boardEl.innerHTML = "";
  matchesFound = 0;

  // 3.3) Agrupamos todos los archivos por prefijo
  const grouped = groupByPrefix(ALL_IMAGE_FILES);
  const prefixes = Object.keys(grouped);

  // 3.4) Filtramos solo aquellos prefijos con AL MENOS 2 archivos
  const validPrefixes = prefixes.filter((p) => grouped[p].length >= 2);

  // 3.5) Comprobamos que haya suficientes pares
  totalPairs = totalCards / 2;
  if (validPrefixes.length < totalPairs) {
    alert(
      `❌ No hay suficientes prefijos con al menos dos imágenes. ` +
      `Necesitas ${totalPairs} pares, pero solo hay ${validPrefixes.length}.`
    );
    return;
  }

  // 3.6) Mezclamos los prefijos y tomamos EXACTAMENTE totalPairs prefijos
  shuffleArray(validPrefixes);
  const selectedPrefixes = validPrefixes.slice(0, totalPairs);

  // 3.7) Construimos el array “cardsToUse” con 2 imágenes por prefijo
  const cardsToUse = [];
  selectedPrefixes.forEach((pref) => {
    // Tomamos solo los primeros 2 archivos de cada grupo
    const pairFiles = grouped[pref].slice(0, 2);
    cardsToUse.push(...pairFiles);
  });

  // Verificación: cardsToUse debe tener exactamente totalCards elementos
  if (cardsToUse.length !== totalCards) {
    alert("❌ Error interno: cardsToUse no coincide con totalCards.");
    return;
  }

  // 3.8) Barajamos el array final de cartas
  shuffleArray(cardsToUse);

  // 3.9) Fijamos filas = 4 y calculamos cuántas columnas hacen falta
  const rows = 4;
  const cols = Math.ceil(totalCards / rows);

  // 3.10) Calculamos tamaño responsivo de cada carta para que quepan 4 filas × cols columnas
  const gap = 10; // debe coincidir con `gap: 10px` en CSS

  // Espacio disponible en pantalla
  const viewportWidth  = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const occupiedAbove  = boardEl.offsetTop; // altura ocupada por <h1> + botón

  // Restamos gaps: horizontalmente hay (cols−1) gaps; verticalmente (rows−1) gaps
  const availableWidth  = viewportWidth  - gap * (cols - 1);
  const availableHeight = viewportHeight - occupiedAbove - gap * (rows - 1);

  // Tamaño máximo posible de cada carta
  const cardSizeW = Math.floor(availableWidth  / cols);
  const cardSizeH = Math.floor(availableHeight / rows);
  const cardSize  = Math.min(cardSizeW, cardSizeH);

  // 3.11) Guardamos filas/columnas en variables globales
  currentRows = rows;
  currentCols = cols;

  // 3.12) Ajustamos la grid a “repeat(cols, 1fr)” × “repeat(4, 1fr)”
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  boardEl.style.gridTemplateRows    = `repeat(${rows}, 1fr)`;

  // 3.13) Fijamos el tamaño total del tablero (incluyendo gaps)
  const boardWidth  = cardSize * cols + gap * (cols - 1);
  const boardHeight = cardSize * rows + gap * (rows - 1);
  boardEl.style.width  = `${boardWidth}px`;
  boardEl.style.height = `${boardHeight}px`;

  // 3.14) Creamos e insertamos cada carta (row by row).
  //        Después, si sobran celdas (4×cols − totalCards), ponemos “placeholders” vacíos.
  let inserted = 0;
  // 3.14.1) Añadimos las cartas reales
  cardsToUse.forEach((fileName) => {
    const cardEl = createCardElement(fileName);
    boardEl.appendChild(cardEl);
    inserted++;
  });

  // 3.14.2) Cuántos espacios vacíos faltan para completar 4×cols
  const totalCells    = rows * cols;
  const placeholders  = totalCells - inserted;
  for (let i = 0; i < placeholders; i++) {
    const ph = document.createElement("div");
    ph.classList.add("card", "placeholder");
    boardEl.appendChild(ph);
  }
}

// ----------------------
// 4) Reajustar al redimensionar (sin volver a barajar)
// ----------------------

function adjustBoardSizeOnResize() {
  if (currentRows === 0 || currentCols === 0) return;

  const rows = currentRows;
  const cols = currentCols;
  const gap  = 10;

  const viewportWidth  = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const occupiedAbove  = boardEl.offsetTop;

  // Igual cálculo de tamaño para que 4 filas × cols columnas sigan cabiendo
  const availableWidth  = viewportWidth  - gap * (cols - 1);
  const availableHeight = viewportHeight - occupiedAbove - gap * (rows - 1);

  const cardSizeW = Math.floor(availableWidth  / cols);
  const cardSizeH = Math.floor(availableHeight / rows);
  const cardSize  = Math.min(cardSizeW, cardSizeH);

  const boardWidth  = cardSize * cols + gap * (cols - 1);
  const boardHeight = cardSize * rows + gap * (rows - 1);

  boardEl.style.width  = `${boardWidth}px`;
  boardEl.style.height = `${boardHeight}px`;
}

// Reajustamos tamaño cuando la ventana cambie
window.addEventListener("resize", () => {
  adjustBoardSizeOnResize();
});

// ----------------------
// 5) Eventos
// ----------------------

startBtn.addEventListener("click", startGame);
window.addEventListener("load", startGame);