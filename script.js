const RESOLUTION = 200;
const STABLE_DISTANCE = 0.5;
const MAX_MOVABLE = 10;
const UPDATES_PER_FRAME = 5;
const GRAVITY = 0.01;
const BRUSH_SIZE = 5;
const BRUSH_STRENGTH = 10;

let canvas;
let ctxt;

let pile;
let particles;

let brushX;
let brushY;

window.onload = () => {
    canvas = document.getElementById("canvas");
    
    let ratio = window.innerHeight / window.innerWidth;
    canvas.height = ratio * RESOLUTION;
    canvas.width = RESOLUTION;

    ctxt = canvas.getContext("2d");

    canvas.addEventListener("touchstart", (e) => {
        let rect = e.target.getBoundingClientRect();
        let x = Math.floor((e.targetTouches[0].clientX - rect.x) * RESOLUTION / rect.width);
        let y = Math.floor((e.targetTouches[0].clientY - rect.y) * RESOLUTION / rect.width);
        brushX = x;
        brushY = y;
    });

    canvas.addEventListener("touchmove", (e) => {
        let rect = e.target.getBoundingClientRect();
        let x = Math.floor((e.targetTouches[0].clientX - rect.x) * RESOLUTION / rect.width);
        let y = Math.floor((e.targetTouches[0].clientY - rect.y) * RESOLUTION / rect.width);

        brushX = x;
        brushY = y;
    });

    canvas.addEventListener("touchend", (e) => {
        brushX = undefined;
        brushY = undefined;
    });

    pile = new SandPile();
    particles = new SandParticles();

    loop();
}

window.onresize = () => {
    let ratio = window.innerHeight / window.innerWidth;
    canvas.height = ratio * RESOLUTION;
}

function loop() {
    ctxt.fillStyle = "#87CEEB";
    ctxt.fillRect(0, 0, canvas.width, canvas.height);

    if(brushX !== undefined && brushY !== undefined) {
        for(let i=0;i<BRUSH_STRENGTH;i++) {
            let angle = Math.random() * Math.PI * 2;
            let distance = Math.random() * BRUSH_SIZE / 2;
            let dx = distance * Math.cos(angle);
            let dy = distance * Math.sin(angle);
            particles.addParticle(
                Math.min(Math.max(Math.floor(brushX + dx), 0), RESOLUTION),
                canvas.height - Math.min(Math.max(Math.floor(brushY + dy), 0), canvas.height)
            );
        }
    }

    pile.render();
    particles.render();

    for(let i=0;i<UPDATES_PER_FRAME;i++) {
        pile.update();
        particles.update();
        particles.interactWithPile(pile);
    }
    
    requestAnimationFrame(loop);
}

class SandParticle {
    constructor(y) {
        this.y = y;
        this.speedY = 0;
    }

    update() {
        this.y -= this.speedY;
        this.speedY += GRAVITY;
    }
}

class SandParticles {
    constructor() {
        this.columns = [];
        for(let i=0;i<RESOLUTION;i++) {
            this.columns.push([]);
        }
    }

    addParticle(x, y) {
        this.columns[x].push(new SandParticle(y));
    }

    update() {
        for(let i=0;i<this.columns.length;i++) {
            for(let j=0;j<this.columns[i].length;j++) {
                this.columns[i][j].update();
            }
        }
    }

    render() {
        ctxt.fillStyle = "#D2B48C";
        for(let i=0;i<this.columns.length;i++) {
            for(let j=0;j<this.columns[i].length;j++) {
                ctxt.fillRect(i, canvas.height - Math.floor(this.columns[i][j].y), 1, 1);
            }
        }
    }

    interactWithPile(pile) {
        for(let i=0;i<this.columns.length;i++) {
            for(let j=0;j<this.columns[i].length;j++) {
                if(this.columns[i][j].y < pile.pile[i]) {
                    pile.pile[i] += 1;
                    this.columns[i].splice(j, 1)[0];
                }
            }
        }
    }
}

class SandPile {
    constructor() {
        this.pile = [];
        this.updatePile = [];
        for(let i=0;i<RESOLUTION;i++) {
            this.pile.push(0);
            this.updatePile.push(0);
        }
    }

    render() {
        ctxt.fillStyle = "#D2B48C";
        ctxt.beginPath();
        ctxt.moveTo(0, canvas.height);
        for(let i=0;i<this.pile.length;i++) {
            ctxt.lineTo(i, canvas.height - this.pile[i]);
            ctxt.lineTo(i + 1, canvas.height - this.pile[i]);
        }
        ctxt.lineTo(RESOLUTION, canvas.height);
        ctxt.fill();
    }

    update() {
        for(let i=0;i<this.updatePile.length;i++) {
            this.updatePile[i] = 0
        }

        for(let i=0;i<this.pile.length;i++) {
            let deltaLeft = Math.floor((this.pile[i] - this.pile[i-1]) / 2);
            let deltaRight = Math.floor((this.pile[i] - this.pile[i+1]) / 2);

            let options = [];
            if(deltaLeft > STABLE_DISTANCE) {
                options.push([-1, deltaLeft]);
            }
            if(deltaRight > STABLE_DISTANCE) {
                options.push([1, deltaRight]);
            }

            if(options.length === 0) {
                this.updatePile[i] += this.pile[i];
            } else if(options.length === 1) {
                let offset = options[0][0];
                let delta = options[0][1];
                let movedDelta = Math.min(delta, MAX_MOVABLE);
                this.updatePile[i] += this.pile[i] - movedDelta;
                this.updatePile[i+offset] += movedDelta
            } else {
                let offset1 = options[0][0];
                let offset2 = options[1][0];
                let delta1 = options[0][1];
                let delta2 = options[1][1];
                let movedDelta = Math.min(delta1 + delta2, 2 * MAX_MOVABLE);
                let movedDelta1 = Math.floor(movedDelta / 2);
                let movedDelta2 = Math.ceil(movedDelta / 2)
                this.updatePile[i+offset1] += movedDelta1;
                this.updatePile[i] += this.pile[i] - movedDelta;
                this.updatePile[i+offset2] += movedDelta2;
            }
        }

        //this.updatePile[0] += this.pile[0];
        //this.updatePile[this.pile.length-1] += this.pile[this.pile.length-1];

        let swap = this.pile;
        this.pile = this.updatePile;
        this.updatePile = swap;
    }
}
