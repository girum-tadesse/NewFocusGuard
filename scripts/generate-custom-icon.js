const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create directories if they don't exist
const iconDir = path.join(__dirname, '../assets/images');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Function to create a custom FocusGuard icon with a different design
function createCustomIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4CAF50');  // Green
  gradient.addColorStop(1, '#2196F3');  // Blue
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Draw a circular focus element
  ctx.beginPath();
  ctx.arc(size/2, size/2, size * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Draw inner circle
  ctx.beginPath();
  ctx.arc(size/2, size/2, size * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw focus lines
  const lineCount = 8;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.03;
  
  for (let i = 0; i < lineCount; i++) {
    const angle = (i / lineCount) * Math.PI * 2;
    const innerRadius = size * 0.45;
    const outerRadius = size * 0.48;
    
    ctx.beginPath();
    ctx.moveTo(
      size/2 + Math.cos(angle) * innerRadius,
      size/2 + Math.sin(angle) * innerRadius
    );
    ctx.lineTo(
      size/2 + Math.cos(angle) * outerRadius,
      size/2 + Math.sin(angle) * outerRadius
    );
    ctx.stroke();
  }

  // Save the icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconDir, filename), buffer);
  console.log(`Generated ${filename}`);
}

// Generate icons in different sizes
const icons = [
  { size: 1024, name: 'icon.png' },         // Main icon
  { size: 1024, name: 'adaptive-icon.png' }, // Android adaptive icon
  { size: 1024, name: 'splash-icon.png' }    // Splash screen icon
];

icons.forEach(({ size, name }) => {
  createCustomIcon(size, name);
});

console.log('Custom icon generation complete!'); 