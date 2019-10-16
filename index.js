(function () {
    var container,
        camera,
        canvas,
        controls,
        clock = new THREE.Clock(),
        top, bottom, front, back, left, right,
        currentDirection = 'f',
        lastDirection = 'f',
        wasSegmentAdded = false,
        scene,
        isKeyboardReady = true,
        keyboard = new KeyboardState(),
        renderer,
        isGameOver,
        ANIMATION_DELAY = 25,
        MIN_ANIMATION_DELAY = 10,
        CONTAINER_SIZE = 2000,
        currentSnakeFood,
        animationIterations = 0,
        SCORE = 0,
        SNAKE_SEGMENT_SIZE = 100,
        SNAKE = [];

    function toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    function introTween() {
        document.getElementById("intro").classList.add("fade-out");
        init();
    }

    function handleGameEnd() {
        isGameOver = true;

        var cubeGeometry = new THREE.BoxGeometry(SNAKE_SEGMENT_SIZE + 2, SNAKE_SEGMENT_SIZE + 2, SNAKE_SEGMENT_SIZE + 2);
        var material = new THREE.MeshLambertMaterial({
            color: new THREE.Color(0xff0000)
        });
        var gameEndingPiece = new THREE.Mesh(cubeGeometry, material);
        gameEndingPiece.renderOrder = 1;
        gameEndingPiece.position.set(SNAKE[0].position.x, SNAKE[0].position.y, SNAKE[0].position.z);

        scene.add(gameEndingPiece);

        setTimeout(() => {
            document.getElementById("outro").classList.add("fade-in");
        }, 500);
    }

    function handleGameReset() {
        animationIterations = 0;
        camera = null;
        controls = null;
        currentDirection = 'f';
        lastDirection = 'f';
        scene = null;
        renderer = null;
        isGameOver = false;
        isKeyboardReady = true;
        wasSegmentAdded = false;
        SCORE = 0;
        SNAKE = [];
        document.getElementById("outro").classList.remove("fade-in");
        emptyContainer();
        updateScore(true);
        init();
    }

    function initRenderer() {
        container = document.getElementById("canvas");
        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        renderer.setClearColor(0xffffff, 0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        container.appendChild(renderer.domElement);
    }

    function initCamera() {
        camera = new THREE.PerspectiveCamera(
            20,
            window.innerWidth / window.innerHeight,
            1,
            20000
        );
        camera.position.set(3000, 4000, -8000);
    }

    function initScene() {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        raycaster = new THREE.Raycaster();
        scene = new THREE.Scene();

        var ambientLight = new THREE.AmbientLight(0x1a1a1a);
        scene.add(ambientLight);

        var hemisphereLight = new THREE.HemisphereLight(0xc6c6c6, 0xa1a1a1, 1);
        scene.add(hemisphereLight);
    }

    function initCanvas() {
        canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        var context = canvas.getContext("2d");
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    function createPlaneMaterial() {
        return new THREE.MeshLambertMaterial({
            color: new THREE.Color(0x00ff00),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.2,
            emissive: new THREE.Color(0xff0000)
        });
    }

    function createCustomMaterial() {
        return new THREE.MeshLambertMaterial({
            emissive: new THREE.Color(0x0000ff),
            emissiveIntensity: 5
        });
    }

    function addGameContainer() {
        var planeGeometry = new THREE.PlaneBufferGeometry(CONTAINER_SIZE, CONTAINER_SIZE, 32)
        var topGrid = new THREE.GridHelper(CONTAINER_SIZE, 10, 0x444444, 0x444444);
        topGrid.position.y = CONTAINER_SIZE / 2;

        var bottomGrid = new THREE.GridHelper(CONTAINER_SIZE, 10, 0x444444, 0x444444);
        bottomGrid.position.y = -CONTAINER_SIZE / 2;

        var frontGrid = new THREE.GridHelper(CONTAINER_SIZE, 10, 0x444444, 0x444444);
        frontGrid.rotation.x = toRadians(90);
        frontGrid.position.z = -CONTAINER_SIZE / 2;

        var backGrid = new THREE.GridHelper(CONTAINER_SIZE, 10, 0x444444, 0x444444);
        backGrid.rotation.x = toRadians(90);
        backGrid.position.z = CONTAINER_SIZE / 2;

        var rightGrid = new THREE.GridHelper(CONTAINER_SIZE, 10, 0x444444, 0x444444);
        rightGrid.rotation.z = toRadians(90);
        rightGrid.position.x = -CONTAINER_SIZE / 2;

        var leftGrid = new THREE.GridHelper(CONTAINER_SIZE, 10, 0x444444, 0x444444);
        leftGrid.rotation.z = toRadians(90);
        leftGrid.position.x = CONTAINER_SIZE / 2;

        top = new THREE.Mesh(planeGeometry, createPlaneMaterial());
        top.name = "top";
        top.position.y = 1000;
        top.rotation.x = toRadians(90);

        bottom = new THREE.Mesh(planeGeometry, createPlaneMaterial());
        bottom.name = "bottom";
        bottom.position.y = -1000;
        bottom.rotation.x = toRadians(90);

        front = new THREE.Mesh(planeGeometry, createPlaneMaterial());
        front.name = "front";
        front.position.z = -1000;

        back = new THREE.Mesh(planeGeometry, createPlaneMaterial());
        back.name = "back";
        back.position.z = 1000;

        left = new THREE.Mesh(planeGeometry, createPlaneMaterial());
        left.name = "left";
        left.rotation.y = toRadians(90);
        left.position.x = -1000;

        right = new THREE.Mesh(planeGeometry, createPlaneMaterial());
        right.name = "right";
        right.rotation.y = toRadians(90);
        right.position.x = 1000;

        scene.add(top);
        scene.add(bottom);
        scene.add(front);
        scene.add(back);
        scene.add(left);
        scene.add(right);
        scene.add(topGrid);
        scene.add(bottomGrid);
        scene.add(frontGrid);
        scene.add(backGrid);
        scene.add(rightGrid);
        scene.add(leftGrid);
    }

    function addSnakeFood() {
        var size = Math.random() * 30 + 100;
        var cubeGeometry = new THREE.BoxGeometry(size, size, size);
        var material = new THREE.MeshLambertMaterial({
            emissive: new THREE.Color(0xff0000),
            emissiveIntensity: 10
        });

        currentSnakeFood = new THREE.Mesh(cubeGeometry, material);

        currentSnakeFood.position.set(
            Math.floor(Math.random() * (CONTAINER_SIZE / 2 - SNAKE_SEGMENT_SIZE)) - (CONTAINER_SIZE / 2 - SNAKE_SEGMENT_SIZE),
            Math.floor(Math.random() * (CONTAINER_SIZE / 2 - SNAKE_SEGMENT_SIZE)) - (CONTAINER_SIZE / 2 - SNAKE_SEGMENT_SIZE),
            Math.floor(Math.random() * (CONTAINER_SIZE / 2 - SNAKE_SEGMENT_SIZE)) - (CONTAINER_SIZE / 2 - SNAKE_SEGMENT_SIZE)
        );
        currentSnakeFood.name = 'snakeFood';
        scene.add(currentSnakeFood);
    }

    function buildSnake() {
        for (let i = 0; i < 5; i++) {
            var segmentGeometry = new THREE.BoxGeometry(SNAKE_SEGMENT_SIZE, SNAKE_SEGMENT_SIZE, SNAKE_SEGMENT_SIZE);
            var snakeSegment = new THREE.Mesh(segmentGeometry, createCustomMaterial());
            var position = -1000 - (i * SNAKE_SEGMENT_SIZE);

            snakeSegment.position.set(SNAKE_SEGMENT_SIZE / 2, SNAKE_SEGMENT_SIZE / 2, position + SNAKE_SEGMENT_SIZE / 2);

            SNAKE.push(snakeSegment);
        }
    }

    function drawSnake() {
        for (let i = 0; i < SNAKE.length; i++)
            scene.add(SNAKE[i]);
    }

    function getNewXPosition() {
        if (currentDirection === 'r')
            return -SNAKE_SEGMENT_SIZE;

        if (currentDirection === 'l')
            return SNAKE_SEGMENT_SIZE;

        return 0;
    }

    function getNewYPosition() {
        if (currentDirection === 'u')
            return SNAKE_SEGMENT_SIZE;

        if (currentDirection === 'd')
            return -SNAKE_SEGMENT_SIZE;

        return 0;
    }

    function getNewZPosition() {
        if (currentDirection === 'f')
            return SNAKE_SEGMENT_SIZE;

        if (currentDirection === 'b')
            return -SNAKE_SEGMENT_SIZE;

        return 0;
    }

    function updateSnake() {
        const firstSegmentPosition = SNAKE[0].position;

        SNAKE[SNAKE.length - 1].position.set(
            firstSegmentPosition.x + getNewXPosition(),
            firstSegmentPosition.y + getNewYPosition(),
            firstSegmentPosition.z + getNewZPosition()
        );

        // move the last array item to the beginning
        SNAKE.unshift(SNAKE.pop());
    }

    function updateScore(isReset) {
        var scoreHolder = document.getElementById("score");

        if (scoreHolder) {
            if (!isReset) SCORE++;
            scoreHolder.innerHTML = SCORE;
        }
    }

    function updateWallColors() {
        var distanceToTop = Math.abs((top.position.y - SNAKE[0].position.y) / 30);
        var distanceToBottom = Math.abs((bottom.position.y - SNAKE[0].position.y) / 30);
        var distanceToBack = Math.abs((back.position.z - SNAKE[0].position.z) / 30);
        var distanceToFront = Math.abs((front.position.z - SNAKE[0].position.z) / 30);
        var distanceToLeft = Math.abs((left.position.x - SNAKE[0].position.x) / 30);
        var distanceToRight = Math.abs((right.position.x - SNAKE[0].position.x) / 30);

        top.material.opacity = 1 / distanceToTop;
        top.material.emissiveIntensity = 250 / distanceToTop;

        bottom.material.opacity = 1 / distanceToBottom;
        bottom.material.emissiveIntensity = 250 / distanceToBottom;

        back.material.opacity = 1 / distanceToBack;
        back.material.emissiveIntensity = 250 / distanceToBack;

        front.material.opacity = 1 / distanceToFront;
        front.material.emissiveIntensity = 250 / distanceToFront;

        right.material.opacity = 1 / distanceToRight;
        right.material.emissiveIntensity = 250 / distanceToRight;

        left.material.opacity = 1 / distanceToLeft;
        left.material.emissiveIntensity = 250 / distanceToLeft;
    }

    function addNewSnakeSegment() {
        var segmentGeometry = new THREE.BoxGeometry(SNAKE_SEGMENT_SIZE, SNAKE_SEGMENT_SIZE, SNAKE_SEGMENT_SIZE);
        var snakeSegment = new THREE.Mesh(segmentGeometry, createCustomMaterial());
        var firstSegmentPosition = SNAKE[0].position;

        snakeSegment.position.set(
            firstSegmentPosition.x + getNewXPosition(),
            firstSegmentPosition.y + getNewYPosition(),
            firstSegmentPosition.z + getNewZPosition()
        );

        SNAKE.unshift(snakeSegment);
        scene.add(snakeSegment);
    }

    function initEventListeners() {
        window.addEventListener("resize", onWindowResize, false);
        document.getElementById("resetButton").addEventListener("click", handleGameReset, false);
    }

    function handleLeftTurn() {
        lastDirection = currentDirection;
        currentDirection = 'l';
    }

    function handleRightTurn() {
        lastDirection = currentDirection;
        currentDirection = 'r';
    }

    function handleDownTurn() {
        lastDirection = currentDirection;
        currentDirection = 'd';
    }

    function handleUpTurn() {
        lastDirection = currentDirection;
        currentDirection = 'u';
    }

    function handleForwardTurn() {
        lastDirection = currentDirection;
        currentDirection = 'f';
    }

    function handleBackTurn(offset = -2500) {
        lastDirection = currentDirection;
        currentDirection = 'b';
    }

    function checkKeyPress() {
        keyboard.update();

        if (isKeyboardReady) {
            if (keyboard.down("left") || keyboard.down("A")) {
                if (currentDirection === 'f') {
                    handleLeftTurn();
                } else if (currentDirection === 'l') {
                    handleBackTurn(2500);
                } else if (currentDirection === 'r') {
                    handleForwardTurn();
                } else if (currentDirection === 'b') {
                    handleRightTurn();
                } else if (currentDirection === 'u' || currentDirection === 'd') {
                    if (lastDirection === 'l') {
                        handleBackTurn(2500);
                    } else if (lastDirection === 'r') {
                        handleForwardTurn();
                    } else if (lastDirection === 'b') {
                        handleRightTurn(2500);
                    } else {
                        handleLeftTurn();
                    }
                }

                isKeyboardReady = false;
            }

            if (keyboard.down("right") || keyboard.down("D")) {
                if (currentDirection === 'f') {
                    handleRightTurn();
                } else if (currentDirection === 'l') {
                    handleForwardTurn();
                } else if (currentDirection === 'r') {
                    handleBackTurn(2500);
                } else if (currentDirection === 'b') {
                    handleLeftTurn();
                } else if (currentDirection === 'u' || currentDirection === 'd') {
                    if (lastDirection === 'b') {
                        handleLeftTurn();
                    } else if (lastDirection === 'r') {
                        handleBackTurn(2500);
                    } else if (lastDirection === 'l') {
                        handleForwardTurn();
                    } else {
                        handleRightTurn();
                    }
                }

                isKeyboardReady = false;
            }

            if (keyboard.down("up") || keyboard.down("W")) {
                if (currentDirection === 'f' || currentDirection === 'l' ||
                    currentDirection === 'r' || currentDirection === 'b') {
                    handleUpTurn();
                } else if (currentDirection === 'u' || currentDirection === 'd') {
                    if (lastDirection === 'l') {
                        handleLeftTurn();
                    } else if (lastDirection === 'r') {
                        handleRightTurn();
                    } else if (lastDirection === 'b') {
                        handleBackTurn();
                    } else {
                        handleForwardTurn();
                    }
                }

                isKeyboardReady = false;
            }

            if (keyboard.down("down") || keyboard.down("S")) {
                if (currentDirection === 'f' || currentDirection === 'l' ||
                    currentDirection === 'r' || currentDirection === 'b') {
                    handleDownTurn();
                } else if (currentDirection === 'u' || currentDirection === 'd') {
                    if (lastDirection === 'l') {
                        handleRightTurn();
                    } else if (lastDirection === 'r') {
                        handleLeftTurn();
                    } else if (lastDirection === 'b') {
                        handleForwardTurn();
                    } else {
                        handleBackTurn();
                    }
                }

                isKeyboardReady = false;
            }
        }
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function removeObject(object) {
        var selectedObject = scene.getObjectByName(object.name);
        scene.remove(selectedObject);
    }

    function emptyContainer() {
        while (container.lastChild)
            container.removeChild(container.lastChild);
    }

    function checkFoodIntersection() {
        var distance = SNAKE[0].position.distanceTo(currentSnakeFood.position);

        if (distance < SNAKE_SEGMENT_SIZE) handleFoodIntersection();
    }

    function handleFoodIntersection() {
        updateScore();
        removeObject(currentSnakeFood);
        addNewSnakeSegment();
        addSnakeFood();

        wasSegmentAdded = true;

        if (ANIMATION_DELAY > MIN_ANIMATION_DELAY)
            ANIMATION_DELAY--;
    }

    function checkBoundaryHit() {
        var firstSegmentPosition = SNAKE[0].position;

        if (firstSegmentPosition.x > (CONTAINER_SIZE / 2) ||
            firstSegmentPosition.x < (-CONTAINER_SIZE / 2) ||
            firstSegmentPosition.y > (CONTAINER_SIZE / 2) ||
            firstSegmentPosition.y < (-CONTAINER_SIZE / 2) ||
            firstSegmentPosition.z > (CONTAINER_SIZE / 2) ||
            firstSegmentPosition.z < (-CONTAINER_SIZE / 2)) {
            handleGameEnd();
        }

        for (var i = 1; i < SNAKE.length; i++) {
            var distance = firstSegmentPosition.distanceTo(SNAKE[i].position);

            if (distance < SNAKE_SEGMENT_SIZE) {
                handleGameEnd();
            }
        }
    }

    function animate() {
        if (!isGameOver) {
            requestAnimationFrame(animate);
            checkKeyPress();
            checkFoodIntersection();
            checkBoundaryHit();
            updateWallColors();

            renderer.render(scene, camera);
            controls.update();
            camera.lookAt(scene.position);

            currentSnakeFood.rotation.x += 0.01;
            currentSnakeFood.rotation.y += 0.01;

            if (animationIterations % ANIMATION_DELAY === 0) {
                if (!wasSegmentAdded) {
                    updateSnake();
                    isKeyboardReady = true;
                } else {
                    wasSegmentAdded = false
                }
            }

            animationIterations += 1;
        }
    }

    function init() {
        initRenderer();
        initCamera();
        initScene();
        initCanvas();
        initEventListeners();
        addGameContainer();
        addSnakeFood();
        buildSnake();
        drawSnake();
        animate();
    }

    document.getElementById("startButton").addEventListener("click", introTween, false);
})();