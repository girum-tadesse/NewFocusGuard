const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create directories if they don't exist
const iconDir = path.join(__dirname, '../assets/icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Function to create a simple FocusGuard icon
function createFocusGuardIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#00C853'; // Green background
  ctx.fillRect(0, 0, size, size);

  // Draw a shield shape
  ctx.fillStyle = '#ffffff';
  const shieldWidth = size * 0.7;
  const shieldHeight = size * 0.8;
  const shieldX = (size - shieldWidth) / 2;
  const shieldY = (size - shieldHeight) / 2;

  // Shield path
  ctx.beginPath();
  ctx.moveTo(shieldX, shieldY);
  ctx.lineTo(shieldX + shieldWidth, shieldY);
  ctx.lineTo(shieldX + shieldWidth, shieldY + shieldHeight * 0.7);
  ctx.quadraticCurveTo(
    shieldX + shieldWidth / 2, 
    shieldY + shieldHeight * 1.1, 
    shieldX, 
    shieldY + shieldHeight * 0.7
  );
  ctx.closePath();
  ctx.fill();

  // Draw a lock symbol
  ctx.fillStyle = '#00C853';
  const lockWidth = size * 0.35;
  const lockHeight = size * 0.35;
  const lockX = (size - lockWidth) / 2;
  const lockY = (size - lockHeight) / 2 + size * 0.05;

  // Lock body
  ctx.fillRect(
    lockX,
    lockY,
    lockWidth,
    lockHeight
  );

  // Lock shackle
  ctx.strokeStyle = '#00C853';
  ctx.lineWidth = size * 0.08;
  ctx.beginPath();
  ctx.arc(
    size / 2,
    lockY - size * 0.05,
    lockWidth * 0.4,
    Math.PI,
    0,
    true
  );
  ctx.stroke();

  // Save the icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconDir, filename), buffer);
  console.log(`Generated ${filename}`);
}

// Generate icons in different sizes
const sizes = [
  { size: 1024, name: 'icon.png' },         // Main icon
  { size: 1024, name: 'adaptive-icon.png' }, // Android adaptive icon
  { size: 1024, name: 'splash-icon.png' }    // Splash screen icon
];

sizes.forEach(({ size, name }) => {
  createFocusGuardIcon(size, name);
});

console.log('Icon generation complete!'); 