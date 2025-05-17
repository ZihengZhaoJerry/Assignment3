// script.js

const POKEMON_API = "https://pokeapi.co/api/v2/pokemon/";
let firstCard = null;
let secondCard = null;
let clickCount = 0;
let pairsMatched = 0;
let pairsLeft = 0;
let timer;
let timeLeft = 60;
let lockBoard = false;
let powerUpUsed = false;

// Fetch Pokémon images and setup the game
async function setupGame(difficulty) {
    let pairCount;
    switch (difficulty) {
        case "easy":
            pairCount = 4;
            timeLeft = 60;
            break;
        case "medium":
            pairCount = 6;
            timeLeft = 70;
            break;
        case "hard":
            pairCount = 8;
            timeLeft = 80;
            break;
        default:
            pairCount = 4;
            timeLeft = 60;
    }

    const ids = getRandomPokemonIds(pairCount);
    const pairs = [];
    for (const id of ids) {
        const imgSrc = await fetchPokemonData(id);
        pairs.push({ id, imgSrc });
        pairs.push({ id, imgSrc });
    }

    // Shuffle the pairs
    pairs.sort(() => Math.random() - 0.5);

    // Reset game state
    pairsLeft = pairCount;
    pairsMatched = 0;
    clickCount = 0;
    powerUpUsed = false;
    resetCards();
    updateStatus();
    createGameGrid(pairs);
    startTimer();
}

// Generate random Pokémon IDs
function getRandomPokemonIds(count) {
    const ids = new Set();
    while (ids.size < count) {
        const randomId = Math.floor(Math.random() * 150) + 1;
        ids.add(randomId);
    }
    return [...ids];
}

// Fetch Pokémon image from the API
async function fetchPokemonData(id) {
    try {
        const response = await fetch(`${POKEMON_API}${id}`);
        const data = await response.json();
        return data.sprites.other["official-artwork"].front_default;
    } catch (error) {
        console.error("Error fetching Pokémon data:", error);
        return "back.webp";  // Use a default image in case of error
    }
}

// Create the game grid
function createGameGrid(pairs) {
    const grid = $("#game_grid");
    grid.empty();
    pairs.forEach((pair) => {
        const card = $(`
            <div class="card" data-id="${pair.id}">
                <div class="card-inner">
                    <img class="front_face" src="${pair.imgSrc}" alt="">
                    <img class="back_face" src="back.webp" alt="">
                </div>
            </div>
        `);
        grid.append(card);
    });
    $(".card").on("click", handleCardClick);
}

// Handle card click logic
function handleCardClick() {
    if (lockBoard) return;

    const card = $(this);

    // Prevent double-clicking the same card
    if (card.hasClass("flip") || card.hasClass("matched")) return;

    card.addClass("flip");
    clickCount++;
    updateStatus();

    if (!firstCard) {
        firstCard = card;
    } else {
        secondCard = card;
        lockBoard = true;

        // Check for a match
        if (firstCard.data("id") === secondCard.data("id")) {
            pairsMatched++;
            pairsLeft--;
            firstCard.addClass("matched");
            secondCard.addClass("matched");
            resetCards();
            updateStatus();

            // Apply the power-up here
            addTimePowerUp();

            // Check if the game is won
            if (pairsLeft === 0) showWinningMessage();
        } else {
            // If not a match, flip back after a short delay
            setTimeout(() => {
                firstCard.removeClass("flip");
                secondCard.removeClass("flip");
                resetCards();
            }, 1000);
        }
    }
}

// Reset the selected cards
function resetCards() {
    firstCard = null;
    secondCard = null;
    lockBoard = false;
}

// Start the game timer
function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        updateStatus();
        if (timeLeft <= 0) {
            clearInterval(timer);
            alert("Game Over!");
        }
    }, 1000);
}

// Update the game status display
function updateStatus() {
    $("#click-count").text(clickCount);
    $("#pairs-matched").text(pairsMatched);
    $("#pairs-left").text(pairsLeft);
    $("#time-left").text(timeLeft);
}

// Show the winning message
function showWinningMessage() {
    clearInterval(timer);
    alert("You Win!");
}

// Power-up to reveal all cards briefly
function powerUp() {
    if (powerUpUsed) return;

    powerUpUsed = true;
    $(".card").addClass("flip");
    setTimeout(() => {
        $(".card").removeClass("flip");
    }, 1500);
}

// Power-Up: Add 5 seconds when a pair is matched
function addTimePowerUp() {
    timeLeft += 5;
    updateStatus();
    console.log("Power-up activated! 5 extra seconds added.");
}

// Set up event listeners when the document is ready
$(document).ready(() => {
    $("#start-btn").on("click", () => setupGame($("#difficulty").val()));
    $("#reset-btn").on("click", () => setupGame($("#difficulty").val()));
    $("#theme").on("change", () => $("body").removeClass("light dark").addClass($("#theme").val()));
    $("#powerup-btn").on("click", powerUp);
});
