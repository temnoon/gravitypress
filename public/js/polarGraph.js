const canvas = document.getElementById('polarGraph');
const ctx = canvas.getContext('2d');

let selectedElements = [];

function parseNumberList(input) {
    const cleanedInput = input.replace(/\s+/g, '').replace(/\.(?=\d)/g, '0.').split(',');
    return cleanedInput.map(parseFloat).filter(n => !isNaN(n));
}

function parseThicknessList(input) {
    const thicknesses = parseNumberList(input);
    return thicknesses.length > 0 ? thicknesses : [1];
}

function drawPolarGraph(size, circles, spokes, circleThicknesses, spokeThicknesses, startCircles, endCircles, extendCircles) {
    canvas.width = size;
    canvas.height = size;
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate actual number of circles to draw
    const actualCircles = extendCircles ? Math.ceil(Math.sqrt(2) * circles) : circles;

    // Draw circles
    for (let i = 1; i <= actualCircles; i++) {
        ctx.beginPath();
        const radius = (baseRadius / circles) * i;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.lineWidth = circleThicknesses[(i - 1) % circleThicknesses.length];
        ctx.stroke();
    }

    // Draw spokes
    for (let i = 0; i < spokes; i++) {
        const angle = (i / spokes) * 2 * Math.PI;
        const startCircle = startCircles[i % startCircles.length];
        const endCircle = endCircles.length > 0 ? endCircles[i % endCircles.length] : circles;

        const startRadius = (baseRadius / circles) * startCircle;
        const endRadius = (baseRadius / circles) * endCircle;

        ctx.beginPath();
        ctx.moveTo(
            centerX + startRadius * Math.cos(angle),
            centerY + startRadius * Math.sin(angle)
        );
        ctx.lineTo(
            centerX + endRadius * Math.cos(angle),
            centerY + endRadius * Math.sin(angle)
        );
        ctx.lineWidth = spokeThicknesses[i % spokeThicknesses.length];
        ctx.stroke();
    }

    // Highlight selected elements
    selectedElements.forEach(element => {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        if (element.type === 'spoke') {
            const angle = (element.index / spokes) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + baseRadius * Math.cos(angle), centerY + baseRadius * Math.sin(angle));
            ctx.stroke();
        } else if (element.type === 'circle') {
            ctx.beginPath();
            ctx.arc(centerX, centerY, (baseRadius / circles) * element.index, 0, 2 * Math.PI);
            ctx.stroke();
        }
    });
}

function updateGraph() {
    const size = parseInt(document.getElementById('canvasSize').value);
    const circles = parseInt(document.getElementById('circles').value);
    const spokes = parseInt(document.getElementById('spokes').value);
    const circleThicknesses = parseThicknessList(document.getElementById('circleThicknesses').value);
    const spokeThicknesses = parseThicknessList(document.getElementById('spokeThicknesses').value);
    const startCircles = parseNumberList(document.getElementById('startCircles').value);
    const endCircles = parseNumberList(document.getElementById('endCircles').value);
    const extendCircles = document.getElementById('extendCircles').checked;

    drawPolarGraph(size, circles, spokes, circleThicknesses, spokeThicknesses, startCircles, endCircles, extendCircles);
}

function applySymmetry() {
    const symmetry = parseInt(document.getElementById('symmetry').value);
    const circles = parseInt(document.getElementById('circles').value);
    const spokes = parseInt(document.getElementById('spokes').value);
    
    // Apply symmetry to circle thicknesses
    let circleThicknesses = parseThicknessList(document.getElementById('circleThicknesses').value);
    circleThicknesses = circleThicknesses.slice(0, Math.ceil(circles / symmetry));
    document.getElementById('circleThicknesses').value = [...Array(symmetry)].flatMap(() => circleThicknesses).slice(0, circles).join(', ');
    
    // Apply symmetry to spoke thicknesses
    let spokeThicknesses = parseThicknessList(document.getElementById('spokeThicknesses').value);
    spokeThicknesses = spokeThicknesses.slice(0, Math.ceil(spokes / symmetry));
    document.getElementById('spokeThicknesses').value = [...Array(symmetry)].flatMap(() => spokeThicknesses).slice(0, spokes).join(', ');
    
    updateGraph();
}

function applySelectedThickness() {
    const thickness = parseFloat(document.getElementById('selectedThickness').value);
    selectedElements.forEach(element => {
        if (element.type === 'spoke') {
            let thicknesses = parseThicknessList(document.getElementById('spokeThicknesses').value);
            thicknesses[element.index] = thickness;
            document.getElementById('spokeThicknesses').value = thicknesses.join(', ');
        } else if (element.type === 'circle') {
            let thicknesses = parseThicknessList(document.getElementById('circleThicknesses').value);
            thicknesses[element.index - 1] = thickness;
            document.getElementById('circleThicknesses').value = thicknesses.join(', ');
        }
    });
    updateGraph();
}

canvas.addEventListener('click', (event) => {
    if (!document.getElementById('selectionMode').checked) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    
    const circles = parseInt(document.getElementById('circles').value);
    const spokes = parseInt(document.getElementById('spokes').value);
    
    const radius = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx);
    
    const clickedCircle = Math.round(radius / (Math.min(centerX, centerY) / circles));
    const clickedSpoke = Math.round((angle + Math.PI) / (2 * Math.PI) * spokes) % spokes;
    
    if (radius < 10) {
        // Clicked near the center, do nothing
    } else if (Math.abs(radius - (clickedCircle * Math.min(centerX, centerY) / circles)) < 10) {
        // Clicked on a circle
        selectedElements = [{ type: 'circle', index: clickedCircle }];
    } else {
        // Clicked on a spoke
        selectedElements = [{ type: 'spoke', index: clickedSpoke }];
    }
    
    updateGraph();
});

// Add event listeners for auto-update
document.getElementById('canvasSize').addEventListener('input', updateGraph);
document.getElementById('circles').addEventListener('input', updateGraph);
document.getElementById('spokes').addEventListener('input', updateGraph);
document.getElementById('extendCircles').addEventListener('change', updateGraph);

// Initial draw
updateGraph();