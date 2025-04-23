//NOTE: This file is a hot mess and ideally I'd split it into relevant files but the spec said to keep it all in one so I've commented best I can
//Basis for this was taken from this tutorial: https://dev.to/zippcodder/complete-guide-to-building-games-in-the-browser-kp6
//And adapted and built on using my own js knowledge


// get canvas 2D context object
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

// object for storing globally accessible states
const GLOBALS = {
    up: false, //W pressed
    down: false, //S pressed
    left: false, //A pressed
    right: false, //D pressed
    time: 30, //Time left on timer
    timerInt: null, //Callback for timer to stop it
    score: 0, //score
    bgImage: new Image(),
}

const INVENTORY = [
    raspberries = { //raspberries:
        name: "Raspberries",
        count: 0
    },
    blueRaspberries = { //blueRaspberries: 
        name: "Blue Raspberries",
        count: 0,
    },
    raspberryJuice = { //raspberryJuice: 
        name: "Raspberry Juice",
        count: 0,
    },
    blueRaspberryJuice = { //blueRaspberryJuice: 
        name: "Blue Raspberry Juice",
        count: 0,
    }
]

class Bush {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.img = new Image();
        this.img.src = "../images/WW_Bush.png";
    }

    render() {
        ctx.drawImage(this.img, this.x, this.y, 100, 100);
    }
}


// Array where all props will be stored
const PROPS = [];

//each is calculated to align with the correct bush div on the page
let bush = new Bush(250, 250);
PROPS.push(bush);
bush = new Bush(50, 250);
PROPS.push(bush);
bush = new Bush(250, 50);
PROPS.push(bush);
bush = new Bush(50, 50);
PROPS.push(bush);

//Player character
class Player {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.speed = 3
        this.img = new Image();
        this.angle = 0;
        this.img.src = "../images/WW_PlayerTop.png";
    }

    //Returns the angle in radians given the current keys pressed down (only 8 directions)
    //switch-case better? might convert later
    calcCurrRot() {
        if (GLOBALS.up && GLOBALS.right) {
            return 3.14 / 4
        }
        if (GLOBALS.up && GLOBALS.left) {
            return -3.14 / 4
        }
        if (GLOBALS.down && GLOBALS.left) {
            return -3 * 3.14 / 4
        }
        if (GLOBALS.down && GLOBALS.right) {
            return 3 * 3.14 / 4
        }
        if (GLOBALS.left) {
            return -3.14 / 2
        }
        if (GLOBALS.right) {
            return 3.14 / 2
        }
        if (GLOBALS.down) {
            return 3.14
        }
        return 0
    }

    render() {
        const { up, down, left, right } = GLOBALS
        if (up) this.y = (this.y - this.speed >= 0) ? this.y - this.speed : 0
        if (down) this.y = (this.y + this.speed <= 300) ? this.y + this.speed : 300
        if (left) this.x = (this.x - this.speed >= 0) ? this.x - this.speed : 0
        if (right) this.x = (this.x + this.speed <= 300) ? this.x + this.speed : 300

        this.angle = this.calcCurrRot()
        //console.log(this.angle)

        let { x, y, img, } = this;
        ctx.beginPath();
        ctx.translate(x + 50, y + 50);
        ctx.rotate(this.angle);
        ctx.translate(-x - 50, -y - 50);
        ctx.drawImage(img, x, y, 100, 100);
        ctx.resetTransform();

    }
}

async function regrowBerries(time, target) {
    setTimeout(
        function () {
            document.querySelector('#' + target).classList.remove("hidden")
        }, time)
}

class Pet {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.speed = 1
        this.img = new Image();
        this.angle = 0;
        this.img.src = "../images/WW_PetTop.png";
        this.destX = x
        this.destY = y
        this.targetType = 0 //0 for none, 1 for raspberry, 2 for blue raspberry
        this.target = "none"
        this.energy = 10
    }

    render() {
        if (this.targetType > 0) {
            var changeX = Math.abs(this.destX - this.x)
            var changeY = Math.abs(this.destY - this.y)
            var isLeft = (this.destX < this.x) ? true : false
            var isUp = (this.destY < this.y) ? true : false

            if (changeX < this.speed) {
                this.x = this.destX
            }
            else {
                if (isLeft) {
                    this.x -= this.speed
                }
                else {
                    this.x += this.speed
                }
            }
            if (changeY < this.speed) {
                this.y = this.destY
            }
            else {
                if (isUp) {
                    this.y -= this.speed
                }
                else {
                    this.y += this.speed
                }
            }

            //Angle between two vectors = invcos(u.v/(||u||*||v||))
            //using unit vec of straight up for default pos, <0,1>
            //final eq is invcos(v(y)/||v||)
            //magnitude of v is v.v or sqrt(x2 + y2)

            //angle using just trig = arctan(opp/adj)

            var vMag = Math.sqrt(Math.pow(changeX, 2) + Math.pow(changeY,2))
            changeX = this.destX - this.x
            changeY = this.destY - this.y

            if(changeY != 0){
                this.angle = Math.atan(changeY/changeX) + 3.14/2
                if(isLeft){
                    this.angle += 3.14
                }
            }else{
                if(isLeft){
                    this.angle = -3.14/2
                }else{
                    this.angle = 3.14/2
                }
            }
            console.log(this.angle)

            if (this.y == this.destY && this.x == this.destX) {
                console.log(this.target)
                document.querySelector("#" + this.target).classList.add("hidden")
                if (this.targetType == 1) {
                    INVENTORY[0].count += 1
                    GLOBALS.score += 5
                    regrowBerries(5000,this.target)
                }
                if (this.targetType == 2) {
                    INVENTORY[1].count += 1
                    GLOBALS.score += 10
                    regrowBerries(10000,this.target)
                }
                this.targetType = 0
                this.energy -= 1
            }
        }

        let { x, y, img, } = this;
        ctx.beginPath();
        ctx.translate(x + 50, y + 50);
        ctx.rotate(this.angle);
        ctx.translate(-x - 50, -y - 50);
        ctx.drawImage(img, x, y, 100, 100);
        ctx.resetTransform();
    }
}

// Array where all characters will be stored
const CHARS = [];
let player = new Player(0, 0);
CHARS.push(player);
let pet = new Pet(60, 60)
CHARS.push(pet)

//starts the timer
function startTimer(duration, display) {
    var timer = duration, seconds;
    GLOBALS.timerInt = setInterval(function () {
        seconds = parseInt(timer % 60, 10);
        console.log("hi")

        if (seconds >= 0) {
            display.textContent = seconds;
            GLOBALS.time = timer
            --timer
        }
    }, 1000);
}

//Runs when user clicks on game, starts timer and hides game cover
function start() {
    GLOBALS.score = 0
    INVENTORY.forEach(item => {
        item.count = 0
    })
    var duration = 30,
        display = document.querySelector('#timer');
    startTimer(duration, display);
    GLOBALS.time = 10
    document.querySelector('#startDiv').classList.add('hidden')
}

//creates raspberry juice
function craftRaspberryJuice() {
    //replace with something more general for inventory accessing
    if (GLOBALS.time > 0) {
        var raspberries = INVENTORY[0]
        if (raspberries.count >= 2) {
            GLOBALS.score += 15
            INVENTORY[2].count += 1
            INVENTORY[0].count -= 2
        }
    }
}

//creates blue raspberry juice
function craftBlueRaspberryJuice() {
    //replace with something more general for inventory accessing
    if (GLOBALS.time > 0) {
        var raspberries = INVENTORY[1]
        if (raspberries.count >= 2) {
            GLOBALS.score += 30
            INVENTORY[3].count += 1
            INVENTORY[1].count -= 2
        }
    }
}

//Tell pet to go to clicked berry
function getBerry(destX, destY, berryType, berryID) {
    if (CHARS[1].targetType == 0 && CHARS[1].energy > 0) {
        CHARS[1].destX = destX
        CHARS[1].destY = destY
        CHARS[1].targetType = berryType
        CHARS[1].target = berryID
        console.log("Target acquired!")
    }
}

function feed(amount, invInd){
    if(CHARS[1].energy < 10 && INVENTORY[invInd].count > 0){
        CHARS[1].energy += amount
        INVENTORY[invInd].count -= 1
    }
}

// function for applying any initial settings
function init() {
    GLOBALS.bgImage.src = "../images/WW_Background.png";
    window.addEventListener("keydown", (e) => {
        if (GLOBALS.time > 0) {
            switch (e.code) {
                case "KeyW":
                    GLOBALS.up = true;
                    break;
                case "KeyS":
                    GLOBALS.down = true;
                    break;
                case "KeyA":
                    GLOBALS.left = true;
                    break;
                case "KeyD":
                    GLOBALS.right = true;
            }
        }
    });

    window.addEventListener("keyup", (e) => {
        switch (e.code) {
            case "KeyW":
                GLOBALS.up = false;
                break;
            case "KeyS":
                GLOBALS.down = false;
                break;
            case "KeyA":
                GLOBALS.left = false;
                break;
            case "KeyD":
                GLOBALS.right = false;
        }
    });

}


// function for rendering background elements
function renderBackground() {
    ctx.drawImage(GLOBALS.bgImage, 0, 0, 400, 400);
}

// function for rendering prop objects in PROPS
function renderProps() {
    PROPS.forEach(prop => {
        prop.render()
    });
}

// function for rendering character objects in CHARS
function renderCharacters() {
    CHARS.forEach(character => {
        character.render()
    });
}

// function for rendering onscreen controls 
function renderControls() {
    if (GLOBALS.time <= 0) {
        clearInterval(GLOBALS.timerInt) //stops timer from running each minute
        document.querySelector('#timer').innerHTML = "Time's Up!"
        document.querySelector('#endDiv').classList.remove('hidden')
        document.querySelector('#endDiv').innerHTML = "Refresh the page to try again!"
    }

    var inventoryDisplay = document.querySelector('#inventory')
    inventoryDisplay.innerHTML = "<tr><th>Item</th><th>Count</th></tr>" //header

    //loop through all of inventory and add to display
    INVENTORY.forEach(item => {
        var currElem = document.createElement("tr")
        currElem.innerHTML = `<td>${item.name}</td><td>X${item.count}</td>`
        inventoryDisplay.appendChild(currElem)
    });

    document.querySelector('#score').innerHTML = GLOBALS.score
    document.querySelector('#currEnergy').innerHTML = CHARS[1].energy
}

// main function to be run for rendering frames
function startFrames() {
    // erase entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // render each type of entity in order, relative to layers
    renderBackground();
    renderProps();
    renderCharacters();
    renderControls();

    // rerun function (call next frame)
    window.requestAnimationFrame(startFrames);
}

init(); // initialize game settings
startFrames(); // start running frames
