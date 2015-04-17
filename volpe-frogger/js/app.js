//global vars
var CANVAS_DIMENSIONS = [505, 606],
    ENEMY_HEIGHTS = [63, 146, 229],
    ENEMY_IMAGE = [
        'images/enemy-bug-grn.png',
        'images/enemy-bug-org.png',
        'images/enemy-bug-prp.png'
    ],
    PLAYER_IMAGES = [
        'images/char-boy.png',
        'images/char-cat-girl.png',
        'images/char-horn-girl.png',
        'images/char-princess-girl.png'
    ],
    AVATAR_RECT_IMAGES = [
        'images/char-boy-rect.png',
        'images/char-cat-girl-rect.png',
        'images/char-horn-girl-rect.png',
        'images/char-princess-girl-rect.png'
    ],
    PRIZE_LOW_IMAGE = [
        'images/Heart.png',
        'images/Key.png'
    ],
    PRIZE_HIGH_IMAGE = 'images/Star.png';
var MIC_IMAGE = ['images/mic50x50.jpg', 'images/mic_grey.jpg']; //first image for audio player on, second image for off
var ENEMY_VELOCITY = [60, 200]; //increase the low range of velocity to make game slightly easier; 60, 180
var PLAYER_START_LOC = [202, 405];
var PLAYER_MOVE = [101, 83];
var PRIZE_X = [0, 101, 202, 303, 404];
var PRIZE_Y = [72, 155, 238];
var BUTTON_DIMENSIONS = [90, 40]; //width and height
var SCORE_TO_WIN = 20; //default 10 points to win game
var GAME_OVER_STR = ['Game Over', 'You Win'];
var gameStates = ['notStarted', 'started', 'over'];
var score = 0;
var lives = 3;
var curGameState = gameStates[0];
var gameStarted = false;
var avatarIdx = 0;
var gameLength = 120; //default 120
var lastPrizePos = []; //0 index for x position; 1 index for y position of last prize
var lastPrizeHighPos = [];
var startTime;

//helper functions
/**
 * Random integer generator
 * @param {integer} min - Minimum range of the resulting random number (inclusive).
 * @param {integer} max - Maximum range of the resulting random number (exclusive). Essentially the maximum will be max - 1.
 * @returns {integer} - Random number between min and (max - 1), inclusive.
 */
function getRandomInt(min, max) { 
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Use to determine enemy-player collisions. Each stone is considered a cell in a grid.
 * If the player and enemy are in the same cell simultaneously, a collision will be detected in Player's checkCollisions() function.
 * @param {integer} x - X position of the current item (i.e. bug, player, prize)
 * @param {integer} y - Y position of the current item
 * @returns {array of integers} - The first element of the array represents the column number for the item location on the stones. 
       The second element represents the row number for the item location on the stones.
       If the item is not on any stone, the return value will be [-1, -1].
 */
function getStoneCell(x, y) {
    var stoneCell = [];
    var cellx = -1;
    var celly = -1;
    if (x >= 0 && x < CANVAS_DIMENSIONS[0] && y >= 63 && y <=249) {
        if (x % 101 >= 51) { //makes collision detection a little more sensitive when bug is midway between cells
            cellx = Math.ceil(x / 101);
        } else {
            cellx = Math.floor(x / 101);
        }
        celly = Math.floor(y / 83);
    }
    stoneCell[0] = cellx;
    stoneCell[1] = celly;

    return stoneCell;
}

/**
 * Given a player or enemy's current position, returns the point at the approximate center of the player/enemy. Used in collision detection
 * (circle collision pattern).
 * @param x {integer}: X position of player/enemy
 * @param y {integer}: Y position of player/enemy
 */
function getCenter(x, y) {
    var xOffset = 50.5;
    var yOffset = 105;
    var center = []; //idx 0 - x position; idx 1 - y position

    center[0] = x + xOffset;
    center[1] = y + yOffset;
    console.log('player x center: ' + center[0]);
    console.log('player y center: ' + center[1]);
    return center;
}

/**
 * Given two points, returns the distance between them.
 * @param point1 {[integer, integer]}: point1[0] is the x position; point1[1] is the y position
 * @param point2 {[integer, integer]}: point2[0] is the x position; point2[1] is the y position
 */
function distance(point1, point2) {
    var dist;
    dist = Math.sqrt((point2[0] - point1[0]) * (point2[0] - point1[0]) + (point2[1] - point1[1]) * (point2[1] - point1[1]));
    return dist;
}

//classes
/**
 * Represents an element which is dynamic. Superclass to elements such as player, enemy, prizes.
 * @constructor
 * @param {integer} x - initial X position for the element
 * @param {integer} x - initial Y position for the element
 */
var DynamicElement = function(x, y) {
    this.x = x;
    this.y = y;
    this.sprite = ''; //url for the image
};

/** Renders a dynamic element */
DynamicElement.prototype.render = function() {
    if (lives > 0) {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    }
};

/**
 * Enemies our player must avoid
 * @constructor
 * @param {integer} x - initial X position for the element
 * @param {integer} x - initial Y position for the element
 */
var Enemy = function(x, y) {
    DynamicElement.call(this, x, y);
    this.sprite = ENEMY_IMAGE[getRandomInt(0, 3)];
    this.velocity = getRandomInt(ENEMY_VELOCITY[0], ENEMY_VELOCITY[1]);
};

Enemy.prototype = Object.create(DynamicElement.prototype);
Enemy.prototype.constructor = Enemy;

/**
 * Update the enemy's position, required method for game
 * @param {integer} dt - a time delta between ticks
 */
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    if (this.x < CANVAS_DIMENSIONS[0] + 101) {
        this.x += this.velocity * dt;
    }
    if (this.x > CANVAS_DIMENSIONS[0]) {
        this.reset();
    }
};

/**
 * Reset the enemy's position after it has moved off the right edge. Gives a random velocity and initial position.
 * @param {integer} dt - a time delta between ticks
 */
Enemy.prototype.reset = function() {
    this.x = getRandomInt(-500, 1); //staggers the timing when the bug will reappear on the screen
    this.y = ENEMY_HEIGHTS[getRandomInt(0, 3)];
    this.velocity = getRandomInt(ENEMY_VELOCITY[0], ENEMY_VELOCITY[1]);
};

// This class requires an update(), render() and
// a handleInput() method.
/**
 * Represents the game player
 * @constructor
 * @param {integer} x - initial X position for the element
 * @param {integer} x - initial Y position for the element
 * @param {integer} avatarIdx - indicates the player's selected avatar and will be used to display the
 *      appropriate image.
 */
var Player = function(x, y) {
    //not sure if I should write a unique constructor to take in the avatar index as param
    DynamicElement.call(this, x, y);
    this.sprite = PLAYER_IMAGES[avatarIdx]; //path for the player image
};

Player.prototype = Object.create(DynamicElement.prototype);
Player.prototype.constructor = Player;

/** 
 * Handles key inputs for player controls. Moves the player by one grid cell value in the given direction.
 * Prevents the player from moving off the screen when moving near the left edge, right edge, or bottom edge.
 * @param {string} direction - Values may be 'left', 'right', 'up', or 'down' and correspond to key inputs.
 */
Player.prototype.handleInput = function(direction) {
    if (direction == 'left') {
        if (this.x - PLAYER_MOVE[0] >= 0) { //checks that player can't move off screen left
            this.x -= PLAYER_MOVE[0];
        }
    } else if (direction == 'up') {
        this.y -= PLAYER_MOVE[1];
    } else if (direction == 'right') { //checks that player can't move off screen right
        if (this.x + PLAYER_MOVE[0] < CANVAS_DIMENSIONS[0]) {
            this.x += PLAYER_MOVE[0];
        }
    } else { //direction == 'down' 
        if (this.y + PLAYER_MOVE[1] <= PLAYER_START_LOC[1]) { //checks that player can't move below initial screen y position
            this.y += PLAYER_MOVE[1];
        }
    }
};

/** If the player falls into the water, calls the player's reset() function and decrements the lives count by 1.*/
Player.prototype.update = function() {
    if (this.y < 63) {
        this.reset();
        lives -= 1;
    }
};

/** 
 * Checks whether the player has collided with any bug or prize. If there is a collision with a bug, the player's reset() will be
       called and the lives count will be decremented by 1. If there is a collision with a prize, the prize's reset() will be 
       called and the score will be incremented by 1.
 */
Player.prototype.checkCollisions = function() {
    var playerStoneCell = [],
        enemyStoneCell = [],
        prizeStoneCell = [],
        prizeHighStoneCell = [],
        playerCenter = [],
        enemyCenter = [],
        numAllEnemies = allEnemies.length;

    //check for collision with bug (circle collision)
    playerCenter = getCenter(player.x, player.y);
    for (var i=0; i < numAllEnemies; i++) {
        enemyCenter = getCenter(allEnemies[i].x, allEnemies[i].y + 10); //added 10 to enemy height to correct for difference in placement with player
        //enemyCenter[1] += 10; //correcting for some error in measure
        var distPlayerEnemy = distance(playerCenter, enemyCenter);
        //TODO need to clean up logic such that
        //if player and enemy are in same row, the difference between their center X positions < 80 results in collision
        if ((playerCenter[1] == enemyCenter[1] && Math.abs(playerCenter[0] - enemyCenter[0]) < 80)) {
            this.reset()
            lives -= 1;
        } //check if player has died
        if (lives <= 0) {
            curGameState = gameStates[2];
        }
    }

    //check for collision with prize
    //TODO broke this part but do not know why
    prizeStoneCell = getStoneCell(prize.x, prize.y);
    prizeHighStoneCell = getStoneCell(prizeHigh.x, prizeHigh.y);
    playerStoneCell = getStoneCell(player.x, player.y);
    if (playerStoneCell[0] == prizeStoneCell[0] && playerStoneCell[1] == prizeStoneCell[1]) {
        prize.reset();
        score += 1;
    } else if (playerStoneCell[0] == prizeHighStoneCell[0] && playerStoneCell[1] == prizeHighStoneCell[1]) {
        prizeHigh.reset();
        score += 3;
    }
    //check if player has won game
    if (score >= SCORE_TO_WIN) {
        curGameState = gameStates[2];
    }
};

/** Updates the player to its starting position.*/
Player.prototype.reset = function() {
    this.x = PLAYER_START_LOC[0];
    this.y = PLAYER_START_LOC[1];
};

// This class requires an update(), render() and
// a handleInput() method.
/**
 * Represents the player's avatar
 * @constructor
 * @param {integer} x - initial X position for the element
 * @param {integer} y - initial Y position for the element
 * @param {integer} avatarIdx - indicates the index of the avatar and will be used to display the
 *      appropriate image.
 * @param {boolean} isSelected - indicates whether the avatar is currently selected by the user.
 *      on initial creation, the first avatar will be selected.
 */

var Avatar = function(x, y, avatarIndex) { //, isSelected
//    DynamicElement.call(this, x, y);
    this.x = x;
    this.y = y;
    this.idx = avatarIndex;
    if (this.idx == avatarIdx) {
        this.sprite = AVATAR_RECT_IMAGES[this.idx]; //path for the player image with rectangle
    } else if (this.idx != avatarIdx) {
        this.sprite = PLAYER_IMAGES[this.idx]; //path for the player image without rectangle
    }
};

/** Renders a dynamic element */
Avatar.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

/**
 * Update the avatar's sprite if user selection has changed
 */
Avatar.prototype.update = function() {
    if ((this.idx) == avatarIdx) {
        this.sprite = AVATAR_RECT_IMAGES[this.idx]; //path for the player image with rectangle
    } else {
        this.sprite = PLAYER_IMAGES[this.idx];
    }
};

/**
 * Represents a prize, such as heart or key.
 * @constructor
 * @param {integer} x - initial X position for the element
 * @param {integer} x - initial Y position for the element
 */
 var Prize = function(x, y) {
    DynamicElement.call(this, x, y);
    this.sprite = PRIZE_LOW_IMAGE[getRandomInt(0, 2)]; //gets a random image path
    this.active = true;
    lastPrizePos[0] = x;
    lastPrizePos[1] = y;
};
Prize.prototype = Object.create(DynamicElement.prototype);
Prize.prototype.constructor = Prize;

/** 
 * After the player has collected a prize, the prize is reset with a new,
 * random location and random image. Additional conditions check that a new 
 * prize is not positioned adjacent to where the last prize was located.
 */
Prize.prototype.reset = function() {
    var newX,
        newY;
    newX = PRIZE_X[getRandomInt(1, 5)];
    newY = PRIZE_Y[getRandomInt(0, 3)];

    //add challenge to the game to move new prizes away from old prize position 
    while (newX == (lastPrizePos[0]) || newX == (lastPrizePos[0]) + 101 || newX == (lastPrizePos[0]) - 101 || newY == (lastPrizePos[1])) {
        newX = PRIZE_X[getRandomInt(1, 5)];
        newY = PRIZE_Y[getRandomInt(0, 3)];
    }

    this.x = newX;
    this.y = newY;
    lastPrizePos[0] = newX;
    lastPrizePos[1] = newY;
    this.sprite = PRIZE_LOW_IMAGE[getRandomInt(0, 2)];
};

/**
 * Represents a high scoring prize, or star.
 * @constructor
 * @param {integer} x - initial X position for the element
 * @param {integer} x - initial Y position for the element
 */
 var PrizeHigh = function(x, y) {
    DynamicElement.call(this, x, y);
    this.sprite = PRIZE_HIGH_IMAGE; //gets a random image path
    this.active = true;
    lastPrizeHighPos[0] = x;
    lastPrizeHighPos[1] = y;
};

/**
 * Renders high scoring prize when one minute left in the game.
 * Only renders in alternating 10 second intervals.
 */
PrizeHigh.prototype.render = function() {
    if (lives > 0 && timer.min == 0 && timer.secTen % 2 == 1 && score <= 14) {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    }
};

/** 
 * After the player has collected a prize, the prize is reset with a new,
 * random location in the first column. Additional conditions check that a new 
 * prize is not positioned adjacent to where the last prize was located.
 */
PrizeHigh.prototype.reset = function() {
    var newY;

    newY = PRIZE_Y[getRandomInt(0, 3)];
    //avoid creating new prize in same place or below the last prize
    if (newY == (lastPrizeHighPos[1] + 83) || newY == (lastPrizeHighPos[1])) {
        newY = PRIZE_Y[getRandomInt(0, 3)];
        //console.log('y while loop called');
    }
    this.y = newY;
    lastPrizeHighPos[1] = newY;
    this.sprite = PRIZE_HIGH_IMAGE;
};

/**
 * Represents the audio icon.
 * @constructor
 * @param {integer} x - Initial X position for the element
 * @param {integer} x - Initial Y position for the element
 * @property {integer} on - If the value is 1, the audio player should be on. If the value is -1, the audio player should be paused.
 */
var AudioIcon = function(x, y) {
    DynamicElement.call(this, x, y);
    this.sprite = ''; //url to the image
    this.on = 1;
};

AudioIcon.prototype = Object.create(DynamicElement.prototype);
AudioIcon.prototype.constructor = AudioIcon;

/** 
 * Toggles the audio player to play or pause depending on the this.on property value. When paused, the image should display in grey. 
 * When playing, the image should display in black.
 */
AudioIcon.prototype.update = function() {
    if (this.on > 0) {
        this.sprite = 'images/mic50x50.jpg';
        document.getElementById("bgdAudio").play();
    } else { // pause audio player
        this.sprite = 'images/mic_grey.jpg';
        document.getElementById("bgdAudio").pause();
    }
};

/** Called by a click event listener so that when the player clicks the audio icon, it will toggle the this.on value.*/
AudioIcon.prototype.togglePlay = function() {
    this.on *= -1; //toggle audio element to play or pause
};

/**
 * Represents a text element. Used for the score and lives count.
 * @constructor
 * @param {string} str - Static part of the text element
 * @param {integer} num - Numeric part of the text element. For ex. lives count or score value.
 */
var Text = function(str, num) {
    this.str = str;
    this.displayStr = this.str + ' ' + num.toString();
};

/** Updates the text element with the latest relevant numeric count (for lives or score).*/
Text.prototype.update = function(curCount) { //not completely sure why this was necessary but otherwise lives count would not update onscreen
    this.displayStr = this.str + ' ' + curCount.toString();
};

//needs render function; will be used by Start button and Replay button
var Button = function(y, displayStr) {
    this.x = CANVAS_DIMENSIONS[0] / 2 - BUTTON_DIMENSIONS[0] / 2; //this is a constant value, centering the button in the canvas
    this.y = y;
    this.displayStr = displayStr;
};

Button.prototype.render = function() {
    //draw btn rect
    var metrics = ctx.measureText(this.displayStr);
    var displayStrWidth = metrics.width;

    ctx.fillStyle = '#a3bdc8';
    ctx.fillRect(this.x, this.y, BUTTON_DIMENSIONS[0], BUTTON_DIMENSIONS[1]); //start button y: 175
    //draw button text
    ctx.font = '400 16pt Nunito';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    ctx.fillText(this.displayStr, (CANVAS_DIMENSIONS[0] / 2), this.y + 40 / 4 + 16); //16 - font size //
};

var GameStartText = function(y) {
    this.x = 0;
    this.y = y;
    this.lines = [
        'Welcome.',
        'Our roads are filled with magical objects like hearts',
        'and keys. Stars are special and worth 3 points.',
        'If you can get 20 points, you will be awarded',
        'Master Dodger.',
        'Navigate using the arrow keys.',
        'Beware! Deadly bugs guard the roads. If you cross',
        'too quickly, you may fall into the lake and drown.',
        'Click on an avatar and then Start.',
        'Take care and godspeed.'
    ];
};

GameStartText.prototype.render = function() {
    ctx.fillStyle = 'black';
    ctx.font = '400 14pt Nunito';
    ctx.textAlign = 'left';
    var linesLength = this.lines.length;
    for (var m = 0; m < linesLength; m++) {
        ctx.fillText(this.lines[m], this.x, this.y + 26 * m);//y = 240
    }
};

//needs render and update functions
var GameOverText = function(y, displayStr) {
    this.y = y;
    this.displayStr = displayStr;
};

GameOverText.prototype.render = function() {
    ctx.fillStyle = '#bf0e0e';
    ctx.font = '700 36pt Nunito';
    ctx.textAlign = 'center';
    ctx.fillText(this.displayStr, CANVAS_DIMENSIONS[0] / 2, this.y);//y = 240
};

GameOverText.prototype.update = function() {
    if (score >= SCORE_TO_WIN) { //player won
        this.displayStr = GAME_OVER_STR[1];
    } else {
        this.displayStr = GAME_OVER_STR[0];
    }
};

//needs render and update functions
var Timer = function(length) {
    this.length = length;
    this.min = Math.floor(length / 60);
    this.secTen = Math.floor(length % 60 / 10);
    this.secOne = (length % 60) % 10;
    this.displayStr = this.min.toString() + ':' + this.secTen.toString() + this.secOne.toString();
    this.startTime = 0;
};

Timer.prototype.render = function() {
    var metrics = ctx.measureText(this.displayStr);
    var timerX = CANVAS_DIMENSIONS[0] / 2 - metrics.width / 2;
    ctx.clearRect(timerX, 0, metrics.width, 43);
    ctx.fillStyle = '#580189';
    ctx.font = '400 24pt Nunito'; //not sure why this is not getting applied
    ctx.fillText(this.displayStr, CANVAS_DIMENSIONS[0] / 2 - metrics.width / 2, 40);
};

Timer.prototype.update = function(curTime) {
    var timeDifference = Math.floor((curTime - this.startTime) / 1000);
    this.min = Math.floor((this.length - timeDifference) / (60));
    this.secTen = Math.floor((this.length - timeDifference) % (60) / 10);
    this.secOne = ((this.length - timeDifference) % (60)) % 10;
    if (this.min >= 0 && this.secTen >=0 && this.secOne >= 0) {
        this.displayStr = this.min.toString() + ':' + this.secTen.toString() + this.secOne.toString();
    } else {
        curGameState = gameStates[2];
    }
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

var allAvatars = [];
var avatar = new Avatar(50, 0, 0);
allAvatars.push(avatar);

for (var k = 1; k < 4; k++) {
    var avatar1 = new Avatar(50 + 101 * k, 0, k);
    allAvatars.push(avatar1);
}

var startBtn = new Button(175, 'Start');
var replayBtn = new Button(280, 'Replay');

var player = new Player(PLAYER_START_LOC[0], PLAYER_START_LOC[1]);
var allEnemies = [];

for (var j = 0; j < 8; j++) { //increased enemy count to 7 to make more challenging
    var enemy = new Enemy(0, ENEMY_HEIGHTS[getRandomInt(0, 3)]);
    allEnemies.push(enemy);
}

var livesText = new Text('Lives', lives);
var scoreText = new Text('Score', score);
var timer = new Timer(gameLength);
var prize = new Prize(303, 155);
var prizeHigh = new PrizeHigh(0, 72);
var gameStartText = new GameStartText(250);
var gameOverText = new GameOverText(240, GAME_OVER_STR[0]);

/** Renders the Score at the left edge.*/
scoreText.render = function() {
    var metrics = ctx.measureText(this.displayStr);
    ctx.clearRect(0, 0, metrics.width, 43);
    ctx.fillStyle = 'black';
    ctx.textAlign = 'start';
    ctx.font = '400 24pt Nunito';
    ctx.fillText(this.displayStr, 0, 40);
};

/** Renders the Lives at the right edge.*/
livesText.render = function() {
    var metrics = ctx.measureText(this.displayStr);
    ctx.clearRect(CANVAS_DIMENSIONS[0] - metrics.width, 0, metrics.width, 43);
    ctx.fillStyle = 'black';
    ctx.textAlign = 'start';
    ctx.font = '400 24pt Nunito';
    ctx.fillText(this.displayStr, CANVAS_DIMENSIONS[0] - metrics.width, 40);
};

var audioIcon = new AudioIcon(CANVAS_DIMENSIONS[0] - 180, 0, 38, 38);

/**
 *  This listens for key presses and sends the keys to your
 *  Player.handleInput() method. You don't need to modify this.
 *  Updated from initial logic using event.keyCode b/c MDN mentioned deprecated (OK for firefox).
 *  But having a challenge finding which keyboard event value format Chrome is currently using.
 *  Might have to accept both e.key and e.keyCode?
 */
document.addEventListener('keyup', function(e) {
    var allowedKeys = ['Left', 'Right', 'Down', 'Up', 'k', 'i', 'j', 'l'];
    var allowedKeyCodes = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        73: 'up',
        74: 'left',
        75: 'down',
        76: 'right'
    };

    if (e.keyCode != undefined) {
        player.handleInput(allowedKeyCodes[e.keyCode]);
    } else if (e.key != undefined) {
        if (allowedKeys.indexOf(e.key) != -1) { //e.key works in firefox but breaks chrome
            switch (e.key) {
                case 'Left': // | 'j':
                    player.handleInput('left'); //e.keyCode
                    break;
                case 'j':
                    player.handleInput('left'); //e.keyCode
                    break;
                case 'Right': // | 'l':
                    player.handleInput('right'); //e.keyCode
                    break;
                case 'l':
                    player.handleInput('right'); //e.keyCode
                    break;
                case 'Down': //| 'k':
                    player.handleInput('down'); //e.keyCode
                    break;
                case 'k':
                    player.handleInput('down'); //e.keyCode
                    break;
                case 'Up': // | 'i':
                    player.handleInput('up'); //e.keyCode
                    break;
                case 'i':
                    player.handleInput('up'); //e.keyCode
                    break;
            }
        }
    }
});

/** Listens for mouse clicks on the audio icon. */
//TODO update to listen for avatar selection, dependent on game state
document.addEventListener('click', function(e) {
    var myCanvas = document.querySelector('canvas');
    var mPos = getMousePos(myCanvas, e);
    if (curGameState == gameStates[1]) {
        if (mPos.x >= myCanvas.width - 170 && mPos.x <= myCanvas.width - 132 && mPos.y >= 10 && mPos.y <= 48) {
            audioIcon.togglePlay();
        }
    } else if (curGameState == gameStates[0]) {
        if (mPos.y >= 45 && mPos.y <= 113) { //if user selected an avatar, updates the avatar image with a rectangle
            if (mPos.x >= 50 && mPos.x < 151) {
                avatarIdx = 0;
            } else if (mPos.x >= 151 && mPos.x < 252) {
                avatarIdx = 1;
            } else if (mPos.x >= 252 && mPos.x < 353) {
                avatarIdx = 2;
            } else if (mPos.x >= 353 && mPos.x < 454) {
                avatarIdx = 3;
            }
            player.sprite = PLAYER_IMAGES[avatarIdx];
        } else if (mPos.x >= (CANVAS_DIMENSIONS[0] / 2 - 45) && mPos.x <= (CANVAS_DIMENSIONS[0] / 2 + 45) && mPos.y >= 175 && mPos.y <= 215) { //if user presses the Start button, updates the game state
            curGameState = gameStates[1];
            timer.startTime = Date.now();
            //console.log('timer startTime: ' + timer.startTime);
        }
    } else if (curGameState == gameStates[2]) {
        if (mPos.x >= (CANVAS_DIMENSIONS[0] / 2 - 45) && mPos.x <= (CANVAS_DIMENSIONS[0] / 2 + 45) && mPos.y >= 280 && mPos.y <= 320) { //if user presses replay button
            curGameState = gameStates[1];
            player.reset();
            timer.startTime = Date.now();
            score = 0;
            lives = 3;
        }
    }
});

/** Gets the mouse position relative to the canvas. Corrects for the white rectangle around the canvas.*/
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}