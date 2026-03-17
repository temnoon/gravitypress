let draw;
let savedConfigurations = {};

function initializeSVG() {
    if (!draw) {
        draw = SVG().addTo('#graph-container').size(1500, 1500);
    }
}

function parseNumberList(input) {
    return (input.replace(/\s+/g, '').replace(/\.(?=\d)/g, '0.').split(',')).map(parseFloat).filter(n => !isNaN(n));
}

function parseThicknessList(input) {
    const thicknesses = parseNumberList(input);
    return thicknesses.length > 0 ? thicknesses : [1];
}

function createGradient(type, startColor, endColor) {
    let gradient;
    switch (type) {
        case 'radial-center':
            gradient = draw.gradient('radial', function(add) {
                add.stop(0, startColor);
                add.stop(1, endColor);
            });
            break;
        case 'radial-edge':
            gradient = draw.gradient('radial', function(add) {
                add.stop(0, endColor);
                add.stop(1, startColor);
            });
            break;
        case 'linear-horizontal':
            gradient = draw.gradient('linear', function(add) {
                add.stop(0, startColor);
                add.stop(1, endColor);
            }).from(0, 0).to(1, 0);
            break;
        case 'linear-vertical':
            gradient = draw.gradient('linear', function(add) {
                add.stop(0, startColor);
                add.stop(1, endColor);
            }).from(0, 0).to(0, 1);
            break;
        case 'linear-along':
        case 'linear-across':
            gradient = draw.gradient('linear', function(add) {
                add.stop(0, startColor);
                add.stop(1, endColor);
            });
            break;
        default:
            gradient = draw.gradient('linear', function(add) {
                add.stop(0, startColor);
                add.stop(1, endColor);
            });
    }
    return gradient;
}

function drawPolarGraph() {
    if (!draw) {
        console.error('SVG drawing object not initialized');
        return;
    }

    draw.clear();

    const size = parseInt(document.getElementById('canvasSize')?.value || 1500);
    const circles = parseInt(document.getElementById('circles')?.value || 5);
    const spokes = parseInt(document.getElementById('spokes')?.value || 12);
    const circleThicknesses = parseThicknessList(document.getElementById('circleThicknesses')?.value || '1');
    const spokeThicknesses = parseThicknessList(document.getElementById('spokeThicknesses')?.value || '1');
    const startCircles = parseNumberList(document.getElementById('startCircles')?.value || '0');
    const endCircles = parseNumberList(document.getElementById('endCircles')?.value || '');
    const extendCircles = document.getElementById('extendCircles')?.checked || false;
    const showDiagnosticLabels = document.getElementById('showDiagnosticLabels')?.checked || false;
    const circleColorMode = document.getElementById('circleColorMode')?.value || 'solid';
    const spokeColorMode = document.getElementById('spokeColorMode')?.value || 'solid';
    const circleSolidColor = document.getElementById('circleSolidColor')?.value || '#000000';
    const spokeSolidColor = document.getElementById('spokeSolidColor')?.value || '#000000';
    const rainbowStartHue = parseInt(document.getElementById('rainbowStartHue')?.value || 0);
    const rainbowEndHue = parseInt(document.getElementById('rainbowEndHue')?.value || 360);


    draw.size(size, size);
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = Math.min(centerX, centerY) - 10;

    const actualCircles = extendCircles ? Math.ceil(Math.sqrt(2) * circles) : circles;

    // Draw circles
    for (let i = 1; i <= actualCircles; i++) {
        let circleColor;
        switch (circleColorMode) {
            case 'gradient':
                circleColor = createGradient(
                    document.getElementById('circleGradientType').value,
                    document.getElementById('circleGradientStart').value,
                    document.getElementById('circleGradientEnd').value
                );
                break;
            case 'rainbow':
                const circleHue = rainbowStartHue + (rainbowEndHue - rainbowStartHue) * (i / actualCircles);
                circleColor = `hsl(${circleHue}, 100%, 50%)`;
                break;
            case 'gradientPlus':
                const circleProgress = i / actualCircles;
                circleColor = interpolateColor(
                    document.getElementById('circleGradientStart').value,
                    document.getElementById('circleGradientEnd').value,
                    circleProgress
                );
                break;
            case 'solid':
                circleColor = circleSolidColor;
                break;
        }
        const radius = (baseRadius / circles) * i;
        draw.circle(radius * 2)
            .center(centerX, centerY)
            .fill('none')
            .stroke({
                color: circleColor,
                width: circleThicknesses[(i - 1) % circleThicknesses.length],
                opacity: 1
            });
    }

    // Draw spokes
    for (let i = 0; i < spokes; i++) {
        const angle = (i / spokes) * 2 * Math.PI;
        const startCircle = startCircles[i % startCircles.length];
        const endCircle = endCircles.length > 0 ? endCircles[i % endCircles.length] : circles;
        const startRadius = (baseRadius / circles) * startCircle;
        const endRadius = (baseRadius / circles) * endCircle;
        const startX = centerX + startRadius * Math.cos(angle);
        const startY = centerY + startRadius * Math.sin(angle);
        const endX = centerX + endRadius * Math.cos(angle);
        const endY = centerY + endRadius * Math.sin(angle);

       let spokeColor;
        switch (spokeColorMode) {
            case 'gradient':
                spokeColor = createSpokeGradient(
                    document.getElementById('spokeGradientType').value,
                    document.getElementById('spokeGradientStart').value,
                    document.getElementById('spokeGradientEnd').value,
                    startX, startY, endX, endY
                );
                break;
            case 'rainbow':
                const spokeHue = rainbowStartHue + (rainbowEndHue - rainbowStartHue) * (i / spokes);
                spokeColor = `hsl(${spokeHue}, 100%, 50%)`;
                break;
            case 'gradientPlus':
                const spokeProgress = i / spokes;
                spokeColor = interpolateColor(
                    document.getElementById('spokeGradientStart').value,
                    document.getElementById('spokeGradientEnd').value,
                    spokeProgress
                );
                break;
            case 'solid':
                spokeColor = spokeSolidColor;
                break;
        }

        const spokeLine = draw.line(startX, startY, endX, endY)
            .stroke({
                color: spokeColor,
                width: spokeThicknesses[i % spokeThicknesses.length],
                opacity: 1
            });

        if (showDiagnosticLabels) {
            const labelRadius = baseRadius * 0.9;
            const labelX = centerX + labelRadius * Math.cos(angle);
            const labelY = centerY + labelRadius * Math.sin(angle);
            const labelText = `${i}\n${startCircle}->${endCircle}\n${spokeThicknesses[i % spokeThicknesses.length].toFixed(1)}`;
            const label = draw.text(labelText)
                .font({ size: 8, family: 'Arial', anchor: 'middle' })
                .center(labelX, labelY)
                .fill('#000000');
            label.rotate((angle * 180 / Math.PI) + 90, labelX, labelY);

            spokeLine.on('mouseover', function() {
                this.stroke({ width: this.attr('stroke-width') * 2 });
                label.font({ size: 10 }).fill('#FF0000');
            }).on('mouseout', function() {
                this.stroke({ width: this.attr('stroke-width') / 2 });
                label.font({ size: 8 }).fill('#000000');
            });
        }
    }
    // After drawing all spokes
if (showDiagnosticLabels) {
    const firstSpokeAngle = 0;
    const firstSpokeEndX = centerX + baseRadius * Math.cos(firstSpokeAngle);
    const firstSpokeEndY = centerY + baseRadius * Math.sin(firstSpokeAngle);
    draw.circle(10)
        .center(firstSpokeEndX, firstSpokeEndY)
        .fill('#FF0000')
        .stroke({ width: 2, color: '#000000' });
}
}

// Add this new function for color interpolation
function interpolateColor(startColor, endColor, progress) {
    const start = hexToRgb(startColor);
    const end = hexToRgb(endColor);
    const r = Math.round(start.r + (end.r - start.r) * progress);
    const g = Math.round(start.g + (end.g - start.g) * progress);
    const b = Math.round(start.b + (end.b - start.b) * progress);
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function createSpokeGradient(type, startColor, endColor, x1, y1, x2, y2) {
    let gradient;
    switch (type) {
        case 'linear-along':
            gradient = draw.gradient('linear', function(add) {
                add.stop(0, startColor);
                add.stop(1, endColor);
            }).from(x1, y1).to(x2, y2);
            break;
        case 'linear-across':
            if (isAxis) {
                // For axes, use a vertical or horizontal gradient
                gradient = draw.gradient('linear', function(add) {
                    add.stop(0, startColor);
                    add.stop(1, endColor);
                }).from(y2 - y1 === 0 ? 0 : -1, x2 - x1 === 0 ? 0 : -1)
                  .to(y2 - y1 === 0 ? 0 : 1, x2 - x1 === 0 ? 0 : 1);
            } else {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const perpX = -dy;
            const perpY = dx;
            const length = Math.sqrt(perpX * perpX + perpY * perpY);
            const unitPerpX = perpX / length;
            const unitPerpY = perpY / length;
            gradient = draw.gradient('linear', function(add) {
                add.stop(0, startColor);
                add.stop(1, endColor);
            }).from(unitPerpX, unitPerpY).to(-unitPerpX, -unitPerpY);}
            break;
        case 'radial-center':
            gradient = draw.gradient('radial', function(add) {
                add.stop(0, startColor);
                add.stop(1, endColor);
            });
            break;
        case 'radial-edge':
            gradient = draw.gradient('radial', function(add) {
                add.stop(0, endColor);
                add.stop(1, startColor);
            });
            break;
        default:
            gradient = draw.gradient('linear', function(add) {
                add.stop(0, startColor);
                add.stop(1, endColor);
            }).from(x1, y1).to(x2, y2);
    }
    return gradient;
}

function updateGraph() {
    if (!draw) {
        initializeSVG();
    }
    drawPolarGraph();
}

function exportSVG() {
    const svgData = draw.svg();
    const blob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'polar_graph.svg';
    link.click();
    URL.revokeObjectURL(url);
}

function saveConfiguration() {
    const name = document.getElementById('configName').value;
    if (!name) {
        alert('Please enter a name for the configuration');
        return;
    }

    const config = {
        canvasSize: document.getElementById('canvasSize').value,
        circles: document.getElementById('circles').value,
        spokes: document.getElementById('spokes').value,
        circleThicknesses: document.getElementById('circleThicknesses').value,
        spokeThicknesses: document.getElementById('spokeThicknesses').value,
        startCircles: document.getElementById('startCircles').value,
        endCircles: document.getElementById('endCircles').value,
        extendCircles: document.getElementById('extendCircles').checked,
        circleColorMode: document.getElementById('circleColorMode').value,
        spokeColorMode: document.getElementById('spokeColorMode').value,
        circleSolidColor: document.getElementById('circleSolidColor').value,
        spokeSolidColor: document.getElementById('spokeSolidColor').value,
        rainbowStartHue: document.getElementById('rainbowStartHue').value,
        rainbowEndHue: document.getElementById('rainbowEndHue').value,
        circleGradientType: document.getElementById('circleGradientType').value,
        circleGradientStart: document.getElementById('circleGradientStart').value,
        circleGradientEnd: document.getElementById('circleGradientEnd').value,
        spokeGradientType: document.getElementById('spokeGradientType').value,
        spokeGradientStart: document.getElementById('spokeGradientStart').value,
        spokeGradientEnd: document.getElementById('spokeGradientEnd').value,
        showDiagnosticLabels: document.getElementById('showDiagnosticLabels').checked
    };

    savedConfigurations[name] = config;
    updateConfigurationList();
    localStorage.setItem('polarGraphConfigurations', JSON.stringify(savedConfigurations));
}

function loadConfiguration() {
    const select = document.getElementById('loadConfig');
    const name = select.value;
    if (!name) return;

    const config = savedConfigurations[name];
    if (!config) return;

    for (const [key, value] of Object.entries(config)) {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value;
            }
        }
    }

    updateGraph();
}

function updateConfigurationList() {
    const select = document.getElementById('loadConfig');
    select.innerHTML = '<option value="">Select a configuration</option>';
    for (const name in savedConfigurations) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeSVG();
    updateGraph();

    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', updateGraph);
    });

    // Add accordion functionality
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
        });
    });

    const saved = localStorage.getItem('polarGraphConfigurations');
    if (saved) {
        savedConfigurations = JSON.parse(saved);
        updateConfigurationList();
    }
});