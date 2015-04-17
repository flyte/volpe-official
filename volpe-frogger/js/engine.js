var Engine = (function(global) {
    var doc = global.document,
        win = global.window,
        canvas = doc.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        gameOverString = 'GAME OVER',
        patterns = {},
        lastTime,
        curCanvas;

    canvas.id = 'my_canvas';
    canvas.width = 505;
    canvas.height = 606;
    doc.body.appendChild(canvas);
    ctx.font = "400 30pt Nunito"; //lives, score

    function main() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (curGameState == gameStates[1]) { //game started and in play
            var now = Date.now(),
            dt = (now - lastTime) / 1000.0; //dt is about 0.016 b/c of the requestAnimationFrame() at end of main()
            update(dt);
            render();
            gameOverString = 'Game Over';
            lastTime = now;
        } else if (curGameState == gameStates[0]) { //game not started
            gameStartText.render();
            allAvatars.forEach(function(my_avatar) {
                my_avatar.update();
                my_avatar.render();
            });
            startBtn.render();
        } else if (curGameState == gameStates[2]) { //game over
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            gameOverText.update();
            gameOverText.render();
            replayBtn.render();
        }
        win.requestAnimationFrame(main);
    }

    function init() {
        //TODO add check for game state and display of screen to select the player
        //and start the game play
        reset(); //this is not actually being used
        lastTime = Date.now();
        main();
    }

    function update(dt) {
        updateEntities(dt);
        // checkCollisions();
    }

    function updateEntities(dt) {
        allEnemies.forEach(function(enemy) {
            enemy.update(dt);
        });
        player.checkCollisions();
        player.update();
        audioIcon.update();
        scoreText.update(score);
        livesText.update(lives);
        timer.update(Date.now());
    }

    function render() {
        var rowImages = [
                'images/water-block.png',
                'images/stone-block.png',
                'images/stone-block.png',
                'images/stone-block.png',
                'images/grass-block.png',
                'images/grass-block.png'
            ],
            numRows = 6,
            numCols = 5,
            row, col,
            micPath = 'images/mic50x50.jpg';
        for (row = 0; row < numRows; row++) {
            for (col = 0; col < numCols; col++) {
                ctx.drawImage(Resources.get(rowImages[row]), col * 101, row * 83);
            }
        }
        renderEntities();
    }

    function renderEntities() {
        allEnemies.forEach(function(enemy) {
            enemy.render();
        });
        player.render();
        prize.render();
        audioIcon.render();
        scoreText.render();
        livesText.render();
        timer.render();
        prizeHigh.render()
    }

    function reset() {
        // noop
    }

    Resources.load([
        'images/stone-block.png',
        'images/water-block.png',
        'images/grass-block.png',
        'images/enemy-bug.png',
        'images/char-boy.png',
        'images/char-boy-rect.png',
        'images/char-cat-girl.png',
        'images/char-cat-girl-rect.png',
        'images/char-horn-girl.png',
        'images/char-horn-girl-rect.png',
        'images/char-princess-girl.png',
        'images/char-princess-girl-rect.png',
        'images/enemy-bug-grn.png',
        'images/enemy-bug-org.png',
        'images/enemy-bug-prp.png',
        'images/Heart.png',
        'images/Key.png',
        'images/Star.png',
        'images/mic50x50.jpg',
        'images/mic_grey.jpg'
    ]);
    Resources.onReady(init);

    global.ctx = ctx;
})(this);