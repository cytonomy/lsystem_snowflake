// Single radial L-system
let radialLSystem;

// L-system parameters
const L_SYSTEM_CONFIG = {
  axiom: "F",
  // Modified rule for wider branching
  rules: { 
    "F": "FF[+++F][---F][+F][-F]F"  // Added stronger angles (+++ and ---)
  },
  angle: 20, // Reduced angle for wider spread
  iterations: 4,
  initialLength: 5, // Increased initial length
  branches: 6
};

// Colors - adjusted to be deeper orange
const COLORS = {
  lightOrange: [230, 120, 30],  // Deeper light orange
  deepOrange: [160, 30, 10]     // Very deep orange/rust
};

// Global rotation
let globalRotation = 0;
const rotationSpeed = 0.003; // Faster rotation

// Secondary slow rotation for added complexity
let secondaryRotation = 0;
const secondaryRotationSpeed = 0.0005; // Very slow secondary rotation

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  frameRate(30);
  
  // Create the radial L-system at the center of the screen
  radialLSystem = new RadialLSystem(
    L_SYSTEM_CONFIG,
    width / 2,
    height / 2
  );
}

function draw() {
  // Clear the background completely to avoid streaks
  background(0);
  
  // Update rotations
  globalRotation += rotationSpeed;
  secondaryRotation += secondaryRotationSpeed;
  
  // Update and draw the L-system
  radialLSystem.update();
  radialLSystem.draw(globalRotation, secondaryRotation);
}

class RadialLSystem {
  constructor(config, x, y) {
    this.config = config;
    this.x = x;
    this.y = y;
    
    // Generate the L-system string
    this.sentence = this.generate(config.axiom, config.rules, config.iterations);
    
    // Animation properties
    this.drawLength = 0;
    this.maxLength = this.sentence.length;
    this.growthRate = 5;
    this.branches = [];
    
    // Initialize branches
    for (let i = 0; i < config.branches; i++) {
      this.branches.push({
        angle: (TWO_PI / config.branches) * i,
        progress: 0,
        rotationOffset: 0 // Store rotation offset for growth path
      });
    }
  }
  
  // Generate the L-system string based on rules and iterations
  generate(axiom, rules, iterations) {
    let result = axiom;
    
    for (let i = 0; i < iterations; i++) {
      let newResult = '';
      for (let j = 0; j < result.length; j++) {
        const current = result[j];
        if (rules[current]) {
          newResult += rules[current];
        } else {
          newResult += current;
        }
      }
      result = newResult;
    }
    
    return result;
  }
  
  // Update the L-system animation
  update() {
    // Grow the drawing length
    if (this.drawLength < this.maxLength) {
      this.drawLength += this.growthRate;
      this.drawLength = min(this.drawLength, this.maxLength);
    }
    
    // Update branch progress and rotation offset
    for (let branch of this.branches) {
      if (branch.progress < 1) {
        branch.progress = min(branch.progress + 0.001, 1);
      }
      // Update rotation offset based on secondary rotation
      branch.rotationOffset = sin(secondaryRotation) * 0.2;
    }
  }
  
  // Draw the L-system
  draw(globalRotation, secondaryRotation) {
    push();
    // Apply global rotation to the entire system
    translate(this.x, this.y);
    rotate(globalRotation);
    
    // Draw each branch
    for (let i = 0; i < this.branches.length; i++) {
      const branch = this.branches[i];
      
      // Calculate color based on branch position in the circle
      // Map from light orange to deep orange
      const colorRatio = i / this.branches.length;
      const r = lerp(COLORS.lightOrange[0], COLORS.deepOrange[0], colorRatio);
      const g = lerp(COLORS.lightOrange[1], COLORS.deepOrange[1], colorRatio);
      const b = lerp(COLORS.lightOrange[2], COLORS.deepOrange[2], colorRatio);
      
      push();
      // Apply branch angle with rotation offset
      rotate(branch.angle + branch.rotationOffset);
      
      // Set the color with reduced brightness
      const strokeColor = color(r, g, b, 180); // Slightly increased opacity
      stroke(strokeColor);
      strokeWeight(1.2);
      
      // Draw the L-system branch with additional branches
      this.drawBranchWithExtras(branch.progress, strokeColor, secondaryRotation + i * 0.5);
      
      pop();
    }
    pop();
  }
  
  // Draw a single branch of the L-system with additional branches
  drawBranchWithExtras(progress, baseColor, branchRotation) {
    let length = this.config.initialLength;
    let angle = radians(this.config.angle);
    
    // Use a stack to keep track of positions and angles
    let stack = [];
    let currentX = 0;
    let currentY = 0;
    let currentAngle = 0; // Start pointing right
    
    // Calculate how much of the sentence to draw based on progress
    const drawUpTo = floor(this.sentence.length * progress);
    
    // Counter for adding extra branches
    let stepCounter = 0;
    
    // Only draw up to the current drawLength and progress
    for (let i = 0; i < min(this.drawLength, drawUpTo); i++) {
      const char = this.sentence[i];
      
      switch (char) {
        case 'F':
          // Draw a line
          const nextX = currentX + cos(currentAngle) * length;
          const nextY = currentY + sin(currentAngle) * length;
          
          // Fade the stroke weight and opacity as we get further from center
          const distFromCenter = dist(0, 0, currentX, currentY);
          const maxDist = 500; // Increased max distance for wider spread
          const fadeRatio = constrain(1 - (distFromCenter / maxDist), 0.1, 1);
          strokeWeight(fadeRatio * 1.2);
          
          // Create a new color with adjusted alpha
          const fadedColor = color(
            red(baseColor), 
            green(baseColor), 
            blue(baseColor), 
            200 * fadeRatio
          );
          stroke(fadedColor);
          
          line(currentX, currentY, nextX, nextY);
          currentX = nextX;
          currentY = nextY;
          
          // Add extra branches every few steps
          stepCounter++;
          if (stepCounter % 6 === 0 && distFromCenter > 50) { // More frequent branches (6 instead of 8)
            // Save current state
            stack.push({x: currentX, y: currentY, angle: currentAngle, len: length});
            
            // Create a wider angle for these special branches
            const specialAngle = angle * 2.0; // Increased angle multiplier for wider spread
            
            // Draw extra branch to the right
            currentAngle += specialAngle;
            let branchX = currentX + cos(currentAngle) * (length * 0.9); // Longer branches (0.9 vs 0.8)
            let branchY = currentY + sin(currentAngle) * (length * 0.9);
            
            // Draw with a slightly different color
            const specialColor = color(
              min(red(baseColor) * 1.1, 255), 
              green(baseColor) * 0.9, 
              blue(baseColor) * 0.8, 
              180 * fadeRatio
            );
            stroke(specialColor);
            line(currentX, currentY, branchX, branchY);
            
            // Draw extra branch to the left
            const state = stack.pop();
            currentX = state.x;
            currentY = state.y;
            currentAngle = state.angle - specialAngle;
            
            branchX = currentX + cos(currentAngle) * (length * 0.9);
            branchY = currentY + sin(currentAngle) * (length * 0.9);
            
            line(currentX, currentY, branchX, branchY);
            
            // Restore original state
            currentX = state.x;
            currentY = state.y;
            currentAngle = state.angle;
          }
          break;
        case '+':
          // Turn right with slight variation based on rotation
          currentAngle += angle + sin(branchRotation * 0.1) * 0.05;
          break;
        case '-':
          // Turn left with slight variation based on rotation
          currentAngle -= angle + sin(branchRotation * 0.1) * 0.05;
          break;
        case '[':
          // Save current state
          stack.push({x: currentX, y: currentY, angle: currentAngle, len: length});
          // Reduce length for branches to create depth effect
          // Less significant reduction for wider branching
          length *= 0.8; // Changed from 0.7 to 0.8 for less depth reduction
          break;
        case ']':
          // Restore previous state
          if (stack.length > 0) {
            const state = stack.pop();
            currentX = state.x;
            currentY = state.y;
            currentAngle = state.angle;
            length = state.len; // Restore original length
          }
          break;
      }
    }
  }
}

// Resize canvas when window is resized
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0);
  
  // Reposition the L-system at the center
  if (radialLSystem) {
    radialLSystem.x = width / 2;
    radialLSystem.y = height / 2;
  }
}

// Add mouse interaction to adjust growth rate
function mouseMoved() {
  if (radialLSystem) {
    // Map mouse position to growth rate
    const newGrowthRate = map(mouseX, 0, width, 1, 15);
    radialLSystem.growthRate = newGrowthRate;
  }
} 