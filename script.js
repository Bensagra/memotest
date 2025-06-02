// ----------------------
// 1) Configuración inicial
// ----------------------

// 1.1) Carpeta donde están las imágenes (relativo a index.html)
const IMAGE_PATH = "images/";

// 1.2) Lista con todos los nombres de archivo en /images/
//     --> El navegador NO puede leer carpetas, así que hay que ponerlos manualmente.
//     --> Cada par debe compartir un PREFIJO antes del guión bajo, p.ej. A_1.png y A_2.png.
const ALL_IMAGE_FILES = [
  "A_1.png", "A_2.png",
  "B_1.png", "B_2.png",
  "C_1.png", "C_2.png",
  "D_1.png", "D_2.png",
  "E_1.png", "E_2.png",
  "F_1.png", "F_2.png",
  "G_1.png", "G_2.png",
  "H_1.png", "H_2.png"
  // … si tienes más pares, agrégalos aquí
];

// 1.3) Indica cuántas cartas quieres usar:
//      - Debe ser un número PAR
//      - Debe ser <= ALL_IMAGE_FILES.length
//      - Ejemplo: 16 → usará 8 pares (16 cartas).
//      - Si quieres usar todas, pon ALL_IMAGE_FILES.length.
const DESIRED_TOTAL_CARDS = 16;

const boardEl = document.getElementById("game-board");
const startBtn = document.getElementById("start-btn");

// Variables de estado globales (para resize dinámico)
let firstFlippedCard = null;
let secondFlippedCard = null;
let lockBoard = false;
let matchesFound = 0;
let totalPairs = 0;

// Guardaremos cuántas filas/columnas tenemos en la última generación
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

// 2.3) Crea el elemento DOM de cada carta
function createCardElement(imageFile) {
  // imageFile = "A_1.png", etc.
  const cardContainer = document.createElement("div");
  cardContainer.classList.add("card");
  cardContainer.dataset.prefix = imageFile.split("_")[0]; // ej. "A"

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

  // Evento de click para voltear
  cardContainer.addEventListener("click", () => {
    if (lockBoard) return;
    if (cardContainer === firstFlippedCard) return;
    flipCard(cardContainer);
  });

  return cardContainer;
}

// 2.4) Lógica de “flip”
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
  const isMatch = firstFlippedCard.dataset.prefix === secondFlippedCard.dataset.prefix;

  if (isMatch) {
    // Si coinciden, deshabilitamos el click en esas dos cartas
    firstFlippedCard.removeEventListener("click", () => {});
    secondFlippedCard.removeEventListener("click", () => {});
    resetFlippedCards();
    matchesFound++;
    if (matchesFound === totalPairs) {
      setTimeout(() => alert("¡Ganaste! 🎉"), 200);
    }
  } else {
    // Si no coincide, damos 800ms para que el usuario vea y luego volteamos de vuelta
    setTimeout(() => {
      firstFlippedCard.classList.remove("flipped");
      secondFlippedCard.classList.remove("flipped");
      resetFlippedCards();
    }, 800);
  }
}

// 2.6) Resetea el estado de las cartas volteadas
function resetFlippedCards() {
  [firstFlippedCard, secondFlippedCard] = [null, null];
  lockBoard = false;
}

// ----------------------
// 3) Función principal: genera el juego y calcula dimensiones
// ----------------------

function startGame() {
  // 3.1) Validaciones básicas
  if (DESIRED_TOTAL_CARDS % 2 !== 0) {
    alert("❌ DESIRED_TOTAL_CARDS debe ser un número par.");
    return;
  }
  if (DESIRED_TOTAL_CARDS > ALL_IMAGE_FILES.length) {
    alert(
      `❌ Quieres ${DESIRED_TOTAL_CARDS} cartas, pero solo hay ${ALL_IMAGE_FILES.length} archivos en ALL_IMAGE_FILES.`
    );
    return;
  }

  // 3.2) Reseteamos tablero y estado
  boardEl.innerHTML = "";
  matchesFound = 0;

  // 3.3) Agrupamos todos los archivos por prefijo
  const grouped = groupByPrefix(ALL_IMAGE_FILES);
  const prefixes = Object.keys(grouped);

  // 3.4) Filtramos solo los prefijos que tengan al menos 2 archivos
  const validPrefixes = prefixes.filter((p) => grouped[p].length >= 2);

  // 3.5) Comprobamos que tengamos suficientes pares
  const neededPairs = DESIRED_TOTAL_CARDS / 2;
  if (validPrefixes.length < neededPairs) {
    alert(
      `❌ No hay suficientes prefijos con al menos dos imágenes. Necesitas ${neededPairs} pares, pero solo hay ${validPrefixes.length}.`
    );
    return;
  }

  // 3.6) Mezclamos prefijos y elegimos los primeros neededPairs
  shuffleArray(validPrefixes);
  const selectedPrefixes = validPrefixes.slice(0, neededPairs);

  // 3.7) Armamos la lista cardsToUse con dos archivos de cada prefijo seleccionado
  const cardsToUse = [];
  selectedPrefixes.forEach((pref) => {
    const pairFiles = grouped[pref].slice(0, 2); // Tomamos solo los primeros 2 (si hubiera más)
    cardsToUse.push(...pairFiles);
  });

  // Ahora cardsToUse.length === DESIRED_TOTAL_CARDS
  shuffleArray(cardsToUse);

  // 3.8) Calculamos cuántas filas (rows) y columnas (cols) nos hacen falta
  currentRows = 1;
  currentCols = DESIRED_TOTAL_CARDS;
  const root = Math.floor(Math.sqrt(DESIRED_TOTAL_CARDS));
  for (let i = root; i >= 1; i--) {
    if (DESIRED_TOTAL_CARDS % i === 0) {
      currentRows = i;
      currentCols = DESIRED_TOTAL_CARDS / i;
      break;
    }
  }
  // Ahora currentRows × currentCols = DESIRED_TOTAL_CARDS.

  // 3.9) Configuramos el CSS Grid: number of columns/rows
  boardEl.style.gridTemplateColumns = `repeat(${currentCols}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${currentRows}, 1fr)`;

  // 3.10) Creamos cada carta y la agregamos al DOM
  cardsToUse.forEach((fileName) => {
    const cardEl = createCardElement(fileName);
    boardEl.appendChild(cardEl);
  });

  // 3.11) Guardamos el total de pares para saber cuándo terminó
  totalPairs = neededPairs;

  // 3.12) Ajustamos el tamaño real del tablero para que quepa en pantalla
  adjustBoardSize();
}

// ----------------------
// 4) Recalcula dimensiones cuando la ventana cambia de tamaño
// ----------------------

function adjustBoardSize() {
  if (currentRows === 0 || currentCols === 0) return;

  // 4.1) Espacio horizontal disponible (quitamos algo de margen izquierdo/derecho)
  const viewportWidth = window.innerWidth;   // ancho total de la ventana
  const viewportHeight = window.innerHeight; // alto total de la ventana

  // 4.2) Calculamos cuánto ocupa la parte superior (h1 + botón + márgenes)
  // boardEl.offsetTop nos da la distancia desde el top de la página hasta el tablero,
  // incluyendo márgenes de h1 y botón.
  const occupiedAbove = boardEl.offsetTop;

  // 4.3) Definimos el gap que hay entre cartas (en px). Debe concordar con CSS: gap: 10px.
  const gap = 10;

  // 4.4) Ancho y alto disponibles para el grid propiamente dicho
  const availableWidth  = viewportWidth  - gap * (currentCols - 1);
  const availableHeight = viewportHeight - occupiedAbove - gap * (currentRows - 1);

  // 4.5) Calculamos el tamaño máximo en px que puede tener cada carta para que cuadre todo
  const cardSizeH = Math.floor(availableHeight / currentRows);
  const cardSizeW = Math.floor(availableWidth  / currentCols);
  const cardSize  = Math.min(cardSizeH, cardSizeW);

  // 4.6) Ahora determinamos el tamaño total del tablero (incluyendo gaps)
  const boardWidth  = cardSize * currentCols + gap * (currentCols - 1);
  const boardHeight = cardSize * currentRows + gap * (currentRows - 1);

  // 4.7) Ajustamos el contenedor #game-board a ese ancho y alto
  boardEl.style.width  = `${boardWidth}px`;
  boardEl.style.height = `${boardHeight}px`;
}

// Reajustar cuando el usuario redimensione la ventana
window.addEventListener("resize", () => {
  adjustBoardSize();
});

// ----------------------
// 5) Eventos
// ----------------------

startBtn.addEventListener("click", startGame);
window.addEventListener("load", startGame);