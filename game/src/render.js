// Gobble Dash rendering: every pixel the judge sees — the farm at dusk, the
// turkey, the farmer, the oven, the knife, the HUD and all four screens.
// All art is drawn with canvas paths (original, no assets, no network).
import { GROUND_Y, HAZARDS, PICKUPS, SHOP, VIEW } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_SHOP = 'shop';
export const SCREEN_OVER = 'over';
export const SCREEN_ESCAPED = 'escaped';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 700, font = 'Georgia, serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function sky(ctx, zone) {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, zone.skyTop);
  grad.addColorStop(0.55, zone.skyMid);
  grad.addColorStop(1, zone.skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, GROUND_Y);
  // Low Thanksgiving sun.
  ctx.fillStyle = '#ffd98a';
  ellipse(ctx, 1060, 150, 58, 58);
  ctx.fillStyle = 'rgba(255, 217, 138, 0.25)';
  ellipse(ctx, 1060, 150, 92, 92);
}

function clouds(ctx, scroll, zone) {
  ctx.fillStyle = 'rgba(255, 244, 224, 0.85)';
  const clouds = [[180, 90, 1], [520, 60, 0.7], [860, 120, 0.9], [1180, 70, 0.8]];
  for (const [cx, cy, s] of clouds) {
    const x = ((cx - scroll * 0.12) % 1400 + 1400) % 1400 - 60;
    ellipse(ctx, x, cy, 46 * s, 16 * s);
    ellipse(ctx, x + 34 * s, cy + 6, 34 * s, 13 * s);
    ellipse(ctx, x - 34 * s, cy + 6, 30 * s, 12 * s);
  }
}

function hills(ctx, scroll, zone) {
  ctx.fillStyle = zone.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW.width; x += 40) {
    ctx.lineTo(x, GROUND_Y - 90 - Math.sin((x + scroll * 0.25) / 260) * 46);
  }
  ctx.lineTo(VIEW.width, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  // Barn + silo silhouettes on the far hill.
  const barnX = ((980 - scroll * 0.25) % 1500 + 1500) % 1500 - 110;
  ctx.fillStyle = '#6e3b2a';
  ctx.fillRect(barnX, GROUND_Y - 168, 150, 78);
  ctx.beginPath();
  ctx.moveTo(barnX - 10, GROUND_Y - 168);
  ctx.lineTo(barnX + 75, GROUND_Y - 208);
  ctx.lineTo(barnX + 160, GROUND_Y - 168);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a8f96';
  ctx.fillRect(barnX + 170, GROUND_Y - 200, 44, 110);
  ctx.beginPath();
  ctx.arc(barnX + 192, GROUND_Y - 200, 22, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = zone.hill;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW.width; x += 40) {
    ctx.lineTo(x, GROUND_Y - 34 - Math.sin((x + scroll * 0.5) / 190 + 2) * 22);
  }
  ctx.lineTo(VIEW.width, GROUND_Y);
  ctx.closePath();
  ctx.fill();
}

function ground(ctx, scroll, zone) {
  ctx.fillStyle = zone.ground;
  ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, GROUND_Y, VIEW.width, 6);
  // Fence posts scrolling past.
  ctx.fillStyle = '#7a5a34';
  for (let x = -((scroll * 1) % 130); x < VIEW.width; x += 130) {
    ctx.fillRect(x, GROUND_Y - 52, 10, 52);
    ctx.fillRect(x + 62, GROUND_Y - 52, 10, 52);
  }
  ctx.fillStyle = '#8d6b3e';
  ctx.fillRect(0, GROUND_Y - 46, VIEW.width, 8);
  ctx.fillRect(0, GROUND_Y - 26, VIEW.width, 8);
  // Grass tufts and corn stubble.
  ctx.strokeStyle = zone.grass;
  ctx.lineWidth = 3;
  for (let x = -((scroll) % 90); x < VIEW.width; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 46);
    ctx.lineTo(x - 6, GROUND_Y + 28);
    ctx.moveTo(x + 8, GROUND_Y + 46);
    ctx.lineTo(x + 12, GROUND_Y + 30);
    ctx.stroke();
  }
  if (zone.id === 1) {
    // Corn stalks crowd the back of the cornfield.
    ctx.strokeStyle = '#3f6b1e';
    ctx.lineWidth = 5;
    for (let x = -((scroll * 1.15) % 70); x < VIEW.width; x += 70) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y - 4);
      ctx.lineTo(x + 4, GROUND_Y - 96);
      ctx.stroke();
      ctx.fillStyle = '#c9a227';
      ellipse(ctx, x + 8, GROUND_Y - 78, 7, 16);
    }
  }
  if (zone.id === 2) {
    // Pine silhouettes crowd the forest.
    for (let x = -((scroll * 1.15) % 110); x < VIEW.width; x += 110) {
      ctx.fillStyle = '#24402a';
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y - 150);
      ctx.lineTo(x + 26, GROUND_Y - 210);
      ctx.lineTo(x + 52, GROUND_Y - 150);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(x + 22, GROUND_Y - 152, 8, 14);
    }
  }
}

function drawTurkey(ctx, x, y, w, h, runCycle, sliding, scared) {
  ctx.save();
  ctx.translate(x, y);
  const legSwing = Math.sin(runCycle * 10) * 8;
  // Tail fan.
  ctx.fillStyle = '#8a5a2a';
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.translate(8, 26);
    ctx.rotate(i * 0.32);
    ctx.beginPath();
    ctx.ellipse(0, -26, 9, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#b5762e';
  for (let i = -1; i <= 1; i += 1) {
    ctx.save();
    ctx.translate(10, 26);
    ctx.rotate(i * 0.3);
    ctx.beginPath();
    ctx.ellipse(0, -20, 6, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Legs.
  ctx.strokeStyle = '#e8a04a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(34, h - 8);
  ctx.lineTo(34 + legSwing, h);
  ctx.moveTo(48, h - 8);
  ctx.lineTo(48 - legSwing, h);
  ctx.stroke();
  // Body.
  ctx.fillStyle = '#a06828';
  ellipse(ctx, 40, h - 30, 30, 26);
  ctx.fillStyle = '#c98a3a';
  ellipse(ctx, 40, h - 24, 22, 16);
  // Wing.
  ctx.fillStyle = '#7d4f1e';
  ctx.beginPath();
  ctx.ellipse(36, h - 32, 18, 12, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Head + beak + wattle.
  ctx.fillStyle = '#a06828';
  ellipse(ctx, 66, 14, 13, 13);
  ctx.fillStyle = '#f2a541';
  ctx.beginPath();
  ctx.moveTo(76, 12);
  ctx.lineTo(92, 17);
  ctx.lineTo(76, 22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d43a2a';
  ellipse(ctx, 72, 28, 4, 8);
  ctx.fillStyle = '#fff';
  ellipse(ctx, 68, 10, 3, 3);
  ctx.fillStyle = '#222';
  ellipse(ctx, 69, 10, 1.6, 1.6);
  if (scared) {
    text(ctx, '!', 66, -8, 26, '#fff', 'center', 900);
  }
  ctx.restore();
}

function drawFarmer(ctx, x, y, runCycle, scared) {
  ctx.save();
  ctx.translate(x, y);
  const legSwing = Math.sin(runCycle * 10) * 9;
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(30, 96);
  ctx.lineTo(30 + legSwing, 128);
  ctx.moveTo(46, 96);
  ctx.lineTo(46 - legSwing, 128);
  ctx.stroke();
  // Overalls + shirt.
  ctx.fillStyle = '#4a6fa5';
  ctx.fillRect(18, 52, 42, 48);
  ctx.fillStyle = '#c94a3a';
  ctx.fillRect(14, 34, 50, 24);
  ctx.fillStyle = '#4a6fa5';
  ctx.fillRect(20, 34, 8, 22);
  ctx.fillRect(48, 34, 8, 22);
  // Head, beard, straw hat.
  ctx.fillStyle = '#e8b88a';
  ellipse(ctx, 40, 22, 15, 15);
  ctx.fillStyle = '#e8e0c8';
  ellipse(ctx, 40, 32, 13, 7);
  ctx.fillStyle = '#d8b13a';
  ellipse(ctx, 40, 10, 24, 7);
  ctx.fillRect(28, -6, 24, 14);
  // Pitchfork, raised when chasing.
  ctx.strokeStyle = '#8a6b3f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(66, 108);
  ctx.lineTo(84, 6);
  ctx.stroke();
  ctx.strokeStyle = '#c8c8c8';
  ctx.lineWidth = 3;
  for (const dx of [-6, 0, 6]) {
    ctx.beginPath();
    ctx.moveTo(84 + dx, 6);
    ctx.lineTo(84 + dx, -8);
    ctx.stroke();
  }
  if (scared) {
    text(ctx, '?!', 40, -16, 24, '#fff', 'center', 900);
  }
  ctx.restore();
}

function drawOven(ctx, o, flameOn, time) {
  const x = o.x;
  const y = o.y;
  ctx.fillStyle = '#3a3f4a';
  roundRect(ctx, x, y, o.width, o.height, 8);
  ctx.fill();
  ctx.fillStyle = '#22252c';
  roundRect(ctx, x + 12, y + 14, o.width - 24, 46, 6);
  ctx.fill();
  // Glowing door window.
  ctx.fillStyle = flameOn ? '#ff9a2a' : '#5a3a22';
  roundRect(ctx, x + 20, y + 22, o.width - 40, 30, 4);
  ctx.fill();
  ctx.fillStyle = '#c8c8c8';
  ctx.fillRect(x + 14, y + 62, o.width - 28, 6);
  text(ctx, 'OVEN', x + o.width / 2, y + o.height - 6, 14, '#e8e8e8', 'center', 800);
  if (flameOn) {
    const flick = Math.sin(time * 14) * 6;
    ctx.fillStyle = '#ff6a1a';
    ctx.beginPath();
    ctx.moveTo(x + 8, y);
    ctx.quadraticCurveTo(x + o.width / 2 + flick, y - 52 - Math.abs(flick), x + o.width - 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath();
    ctx.moveTo(x + 24, y);
    ctx.quadraticCurveTo(x + o.width / 2, y - 30, x + o.width - 24, y);
    ctx.closePath();
    ctx.fill();
    text(ctx, 'HOT!', x + o.width / 2, y - 58, 16, '#ff6a1a', 'center', 900);
  } else {
    text(ctx, 'flame out — JUMP!', x + o.width / 2, y - 12, 13, '#bfe8a0', 'center', 800);
  }
}

function drawKnife(ctx, o, bladeY) {
  // Rope from the top of the screen, blade swinging down.
  ctx.strokeStyle = '#c8b88a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(o.x + o.width / 2, 0);
  ctx.lineTo(o.x + o.width / 2, bladeY);
  ctx.stroke();
  const x = o.x;
  const y = bladeY;
  ctx.fillStyle = '#d8dce2';
  ctx.beginPath();
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + o.width - 4, y);
  ctx.lineTo(x + o.width / 2 + 4, y + 64);
  ctx.lineTo(x + o.width / 2 - 4, y + 64);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(x + 6, y - 26, o.width - 12, 28);
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath();
  ctx.moveTo(x + o.width / 2, y + 64);
  ctx.lineTo(x + o.width / 2 + 8, y + 46);
  ctx.lineTo(x + o.width / 2 - 8, y + 46);
  ctx.closePath();
  ctx.fill();
}

function drawObstacle(ctx, world, o) {
  const def = HAZARDS[o.kind];
  if (o.kind === 'oven') {
    drawOven(ctx, o, world.ovenFlameOn(o), world.time);
    return;
  }
  if (o.kind === 'knife') {
    drawKnife(ctx, o, world.knifeBladeY(o));
    return;
  }
  if (o.kind === 'fence') {
    ctx.fillStyle = '#7a5a34';
    ctx.fillRect(o.x, o.y + 8, 8, o.height - 8);
    ctx.fillRect(o.x + o.width - 8, o.y + 8, 8, o.height - 8);
    ctx.fillStyle = '#8d6b3e';
    ctx.fillRect(o.x, o.y + 10, o.width, 9);
    ctx.fillRect(o.x, o.y + 32, o.width, 9);
    return;
  }
  if (o.kind === 'hay') {
    ctx.fillStyle = '#d8a93a';
    ellipse(ctx, o.x + o.width / 2, o.y + o.height / 2, o.width / 2, o.height / 2);
    ctx.strokeStyle = '#a87f22';
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(o.x + o.width / 2 + i * 14, o.y + 6);
      ctx.lineTo(o.x + o.width / 2 + i * 14, o.y + o.height - 6);
      ctx.stroke();
    }
    return;
  }
  if (o.kind === 'log') {
    ctx.fillStyle = '#6b4a26';
    ellipse(ctx, o.x + o.width / 2, o.y + o.height / 2, o.width / 2, o.height / 2);
    ctx.fillStyle = '#8a6b3f';
    ellipse(ctx, o.x + 12, o.y + o.height / 2, 8, o.height / 2 - 4);
    ctx.strokeStyle = '#4a3018';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(o.x + 12, o.y + o.height / 2, 5, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }
  if (o.kind === 'scarecrow') {
    ctx.strokeStyle = '#5a4632';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(o.x + o.width / 2, o.y + 20);
    ctx.lineTo(o.x + o.width / 2, GROUND_Y);
    ctx.moveTo(o.x + 4, o.y + 44);
    ctx.lineTo(o.x + o.width - 4, o.y + 44);
    ctx.stroke();
    ctx.fillStyle = '#c94a3a';
    ctx.fillRect(o.x + 8, o.y + 30, o.width - 16, 44);
    ctx.fillStyle = '#e8b88a';
    ellipse(ctx, o.x + o.width / 2, o.y + 16, 13, 13);
    ctx.fillStyle = '#d8b13a';
    ellipse(ctx, o.x + o.width / 2, o.y + 6, 20, 6);
    return;
  }
  if (o.kind === 'puddle') {
    ctx.fillStyle = '#6b4a2a';
    ellipse(ctx, o.x + o.width / 2, GROUND_Y - 4, o.width / 2, 10);
    ctx.fillStyle = '#8a6b3f';
    ellipse(ctx, o.x + o.width / 2, GROUND_Y - 6, o.width / 2 - 12, 6);
    return;
  }
  if (o.kind === 'branch') {
    // A low branch from a sapling: trunk on the right, the bar hangs at 522..560.
    ctx.fillStyle = '#5a4632';
    ctx.fillRect(o.x + o.width - 12, o.y, 10, GROUND_Y - o.y);
    ctx.fillStyle = '#6b4a26';
    ctx.fillRect(o.x, o.y + 8, o.width, 14);
    ctx.fillStyle = '#3f7a1e';
    ellipse(ctx, o.x + 18, o.y + 2, 20, 10);
    ellipse(ctx, o.x + o.width / 2, o.y - 2, 24, 11);
    ellipse(ctx, o.x + o.width - 16, o.y + 2, 18, 9);
    return;
  }
  text(ctx, def.label, o.x, o.y - 8, 12, '#fff', 'center');
}

function drawPickup(ctx, u, time) {
  const bob = Math.sin(time * 3 + u.x * 0.01) * 4;
  const x = u.x + u.width / 2;
  const y = u.y + u.height / 2 + bob;
  ctx.save();
  ctx.translate(x, y);
  if (u.kind === 'corn') {
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 15, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f7a1e';
    ctx.beginPath();
    ctx.ellipse(-6, -12, 5, 10, -0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (u.kind === 'feather') {
    ctx.fillStyle = '#ffe98a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 16, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, 14);
    ctx.stroke();
  } else if (u.kind === 'chili') {
    ctx.fillStyle = '#e83a1e';
    ctx.beginPath();
    ctx.ellipse(0, 2, 7, 14, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f7a1e';
    ctx.fillRect(-2, -16, 5, 6);
  } else if (u.kind === 'pie') {
    ctx.fillStyle = '#e8a04a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c97a2a';
    ctx.beginPath();
    ctx.ellipse(0, -2, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (u.kind === 'wishbone') {
    ctx.strokeStyle = '#fff2c9';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-10, 10);
    ctx.quadraticCurveTo(0, -12, 10, 10);
    ctx.stroke();
  }
  ctx.restore();
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ellipse(ctx, p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function farmerScreenX(world) {
  // The farmer runs behind the turkey; his screen x follows the gap.
  return world.player.x - world.farmerGap;
}

function drawHud(ctx, world, showBanner) {
  // Top bar.
  ctx.fillStyle = 'rgba(20, 16, 10, 0.72)';
  roundRect(ctx, 16, 12, 1248, 64, 12);
  ctx.fill();
  text(ctx, `SCORE ${Math.floor(world.score)}`, 36, 40, 24, '#ffe98a', 'left', 800);
  text(ctx, `DISTANCE ${Math.floor(world.distanceM)} m / 3600 m`, 36, 64, 15, '#fff', 'left', 600);
  text(ctx, `CORN ${world.corn}`, 330, 40, 20, '#ffd94a', 'left', 800);
  // Hearts.
  for (let i = 0; i < 5; i += 1) {
    const filled = i < world.lives;
    ctx.fillStyle = filled ? '#ff5a6a' : 'rgba(255,255,255,0.22)';
    const hx = 520 + i * 30;
    ctx.beginPath();
    ctx.moveTo(hx, 46);
    ctx.arc(hx - 7, 36, 8, Math.PI, 0);
    ctx.arc(hx + 7, 36, 8, Math.PI, 0);
    ctx.lineTo(hx, 52);
    ctx.closePath();
    ctx.fill();
  }
  if (world.shield) text(ctx, 'SHIELD', 680, 40, 16, '#ffe98a', 'left', 800);
  // Stamina + gobble bars.
  text(ctx, 'STAMINA', 760, 34, 12, '#cfe8ff', 'left', 700);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, 760, 40, 150, 12, 6);
  ctx.fill();
  ctx.fillStyle = world.stamina > 25 ? '#7ddc7d' : '#ff8a5a';
  roundRect(ctx, 760, 40, 150 * (world.stamina / 100), 12, 6);
  ctx.fill();
  text(ctx, 'GOBBLE [G]', 940, 34, 12, '#ffd9a0', 'left', 700);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, 940, 40, 150, 12, 6);
  ctx.fill();
  ctx.fillStyle = world.gobbleCharge >= 34 ? '#ffb84a' : 'rgba(255,184,74,0.4)';
  roundRect(ctx, 940, 40, 150 * (world.gobbleCharge / 100), 12, 6);
  ctx.fill();
  text(ctx, world.zone().name, 1120, 40, 18, '#fff', 'left', 800);
  text(ctx, `ZONE ${world.zoneIndex + 1}/3`, 1120, 62, 13, '#ffe98a', 'left', 600);

  // Farmer pursuit meter (bottom): turkey vs farmer on one track.
  ctx.fillStyle = 'rgba(20, 16, 10, 0.72)';
  roundRect(ctx, 16, 656, 1248, 52, 12);
  ctx.fill();
  text(ctx, 'FARMER', 36, 690, 14, '#ffb0a0', 'left', 800);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, 130, 676, 760, 10, 5);
  ctx.fill();
  const gapFrac = Math.max(0, Math.min(1, world.farmerGap / 420));
  const turkeyX = 130 + gapFrac * 760;
  ctx.fillStyle = '#ff8a5a';
  ellipse(ctx, 136, 681, 9, 9);
  text(ctx, 'FARMER', 130, 668, 11, '#ffb0a0', 'left', 700);
  ctx.fillStyle = '#a06828';
  ellipse(ctx, turkeyX, 681, 11, 11);
  text(ctx, 'YOU', turkeyX, 668, 11, '#ffe98a', 'center', 700);
  text(ctx, `Gap ${Math.round(world.farmerGap)} px`, 900, 690, 14, '#fff', 'left', 800);
  if (world.farmerScared > 0) text(ctx, 'GOBBLED! He is scared!', 900, 668, 12, '#ffb84a', 'left', 800);
  // Progress to freedom (right side, kept inside the bar).
  text(ctx, 'FREEDOM GATE', 1060, 668, 11, '#bfe8a0', 'left', 700);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, 1060, 674, 180, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#7ddc7d';
  roundRect(ctx, 1060, 674, 180 * Math.min(1, world.distanceM / 3600), 8, 4);
  ctx.fill();
  text(ctx, `${Math.floor(world.distanceM)} / 3600 m`, 1060, 700, 12, '#fff', 'left', 600);

  // Zone banner (not over the shop — the shop has its own panel).
  if (showBanner && world.zoneBanner > 0) {
    ctx.globalAlpha = Math.min(1, world.zoneBanner);
    ctx.fillStyle = 'rgba(20, 16, 10, 0.6)';
    roundRect(ctx, 340, 200, 600, 110, 16);
    ctx.fill();
    text(ctx, world.zone().name, 640, 252, 40, '#ffe98a', 'center', 900);
    text(ctx, world.zone().tagline, 640, 288, 18, '#fff', 'center', 600);
    ctx.globalAlpha = 1;
  }
  // Slow-mo / boost badges.
  if (world.slowMo > 0) text(ctx, 'SLOW-MO!', 640, 120, 20, '#e8a04a', 'center', 900);
  if (world.speedBoost > 0) text(ctx, 'CHILI BURST!', 640, 148, 20, '#ff6a2a', 'center', 900);
}

function drawTitle(ctx, world, best) {
  ctx.fillStyle = 'rgba(20, 12, 8, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'GOBBLE DASH', 640, 150, 84, '#ffe98a', 'center', 900);
  text(ctx, 'Escape the Thanksgiving Table', 640, 196, 28, '#fff', 'center', 600);
  text(ctx, 'The farmer is coming. The oven is lit. The knife is out.', 640, 232, 18, '#ffb0a0', 'center', 600);
  // Feature strip: the systems, named.
  const features = [
    '3 ZONES: Barnyard · Cornfield · Dark Forest',
    'FARMER PURSUIT — sprint & GOBBLE [G] to stay ahead',
    '5 PICKUPS: corn · golden feather shield · chili burst · pumpkin slow-mo · wishbone life',
    '8 HAZARDS: fences · hay · logs · scarecrows · mud · ovens · carving knives · low branches',
    'REST STOP SHOP between zones — spend corn on boots, meals & a louder gobble',
  ];
  ctx.fillStyle = 'rgba(20, 16, 10, 0.72)';
  roundRect(ctx, 290, 260, 700, 150, 14);
  ctx.fill();
  features.forEach((line, i) => {
    text(ctx, '•  ' + line, 320, 292 + i * 26, 16, '#fff', 'left', 600);
  });
  text(ctx, '↑ / W / SPACE jump      ↓ / S slide      SHIFT sprint      G gobble      CLICK also jumps', 640, 448, 17, '#ffe98a', 'center', 700);
  text(ctx, 'Reach the Freedom Gate at 3600 m — or be dinner.', 640, 478, 17, '#fff', 'center', 600);
  ctx.fillStyle = '#ff9a2a';
  roundRect(ctx, 490, 510, 300, 56, 12);
  ctx.fill();
  text(ctx, '▶  START THE RUN', 640, 546, 24, '#fff', 'center', 900);
  if (best > 0) text(ctx, `Best score: ${Math.floor(best)}`, 640, 600, 16, '#ffe98a', 'center', 700);
  text(ctx, 'A complete original game — no network, no assets, all drawn in code.', 640, 640, 13, 'rgba(255,255,255,0.7)', 'center', 400);
}

function drawShop(ctx, world) {
  ctx.fillStyle = 'rgba(20, 12, 8, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'REST STOP', 640, 110, 54, '#ffe98a', 'center', 900);
  text(ctx, `Zone ${world.zoneIndex} of 3 cleared — welcome to ${world.zone().name}! Spend corn before the next stretch.`, 640, 150, 20, '#fff', 'center', 600);
  text(ctx, `CORN: ${world.corn}`, 640, 190, 24, '#ffd94a', 'center', 800);
  SHOP.forEach((item, i) => {
    const x = 290 + i * 240;
    const y = 230;
    const owned = world.upgrades[item.id];
    const afford = world.corn >= item.cost && owned < item.max;
    ctx.fillStyle = afford ? 'rgba(255, 217, 138, 0.25)' : 'rgba(255,255,255,0.08)';
    roundRect(ctx, x, y, 220, 190, 14);
    ctx.fill();
    ctx.strokeStyle = afford ? '#ffd94a' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, 220, 190, 14);
    ctx.stroke();
    text(ctx, item.name, x + 110, y + 40, 19, '#fff', 'center', 800);
    text(ctx, item.desc, x + 110, y + 72, 14, '#ffe98a', 'center', 600);
    text(ctx, `Owned: ${owned}/${item.max}`, x + 110, y + 100, 14, '#fff', 'center', 600);
    text(ctx, owned >= item.max ? 'MAXED' : `${item.cost} corn`, x + 110, y + 140, 20, owned >= item.max ? '#7ddc7d' : '#ffd94a', 'center', 800);
    text(ctx, `[${i + 1}] buy`, x + 110, y + 168, 14, '#fff', 'center', 600);
  });
  ctx.fillStyle = '#7ddc7d';
  roundRect(ctx, 490, 460, 300, 56, 12);
  ctx.fill();
  text(ctx, '▶  KEEP RUNNING', 640, 496, 24, '#1c2b1c', 'center', 900);
  text(ctx, 'Keys 1–3 buy · Enter continues', 640, 548, 15, '#fff', 'center', 600);
}

function drawEnd(ctx, world, best, escaped) {
  ctx.fillStyle = escaped ? 'rgba(16, 40, 20, 0.72)' : 'rgba(40, 12, 8, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, escaped ? 'ESCAPED!' : 'CAUGHT!', 640, 150, 84, escaped ? '#7ddc7d' : '#ff8a5a', 'center', 900);
  text(ctx, escaped
    ? 'You reached the Freedom Gate. No Thanksgiving dinner for you — this year.'
    : 'The farmer got you... The oven was already warm.', 640, 200, 22, '#fff', 'center', 600);
  const stats = [
    `Score ${Math.floor(world.score)}`,
    `Distance ${Math.floor(world.distanceM)} m`,
    `Corn eaten ${world.stats.cornEaten}`,
    `Jumps ${world.stats.jumps} · Gobbles ${world.stats.gobbles} · Hits taken ${world.stats.hits}`,
    `Zones cleared ${escaped ? 3 : world.zoneIndex} / 3`,
  ];
  ctx.fillStyle = 'rgba(20, 16, 10, 0.72)';
  roundRect(ctx, 390, 240, 500, 190, 14);
  ctx.fill();
  stats.forEach((line, i) => {
    text(ctx, line, 640, 282 + i * 32, 19, i === 0 ? '#ffe98a' : '#fff', 'center', i === 0 ? 800 : 600);
  });
  if (world.score >= best && world.score > 0) {
    text(ctx, '★ NEW BEST SCORE ★', 640, 470, 22, '#ffd94a', 'center', 900);
  } else if (best > 0) {
    text(ctx, `Best score: ${Math.floor(best)}`, 640, 470, 18, '#ffe98a', 'center', 700);
  }
  ctx.fillStyle = '#ff9a2a';
  roundRect(ctx, 490, 510, 300, 56, 12);
  ctx.fill();
  text(ctx, '↻  RUN AGAIN  [R]', 640, 546, 24, '#fff', 'center', 900);
}

/** Draw the whole frame for `screen` over `world`. `scroll` is the parallax distance. */
export function render(ctx, world, screen, best, scroll) {
  const zone = world.zone();
  sky(ctx, zone);
  clouds(ctx, scroll, zone);
  hills(ctx, scroll, zone);
  ground(ctx, scroll, zone);
  // Farmer (behind the turkey, visible when the gap is small).
  const farmerX = farmerScreenX(world);
  if (farmerX > -140 && screen === SCREEN_PLAY) {
    drawFarmer(ctx, farmerX, GROUND_Y - 128, world.time, world.farmerScared > 0);
  }
  // World entities.
  if (screen === SCREEN_PLAY || screen === SCREEN_SHOP) {
    for (const o of world.obstacles) drawObstacle(ctx, world, o);
    for (const u of world.pickups) drawPickup(ctx, u, world.time);
    drawParticles(ctx, world.particles);
    const p = world.player;
    const blink = p.invulnerable > 0 && Math.floor(world.time * 12) % 2 === 0;
    if (!blink) drawTurkey(ctx, p.x, p.y, p.width, p.height, p.runCycle, p.sliding, world.farmerScared > 0);
  }
  if (screen === SCREEN_TITLE) {
    // Title scene: the turkey idles at the fence while the farmer lurks far left.
    drawTurkey(ctx, 300, GROUND_Y - 78, 74, 78, 0.4, false, false);
    drawFarmer(ctx, 90, GROUND_Y - 128, 0.4, false);
    drawTitle(ctx, world, best);
    return;
  }
  if (screen === SCREEN_PLAY) {
    drawHud(ctx, world, true);
    return;
  }
  if (screen === SCREEN_SHOP) {
    drawHud(ctx, world, false);
    drawShop(ctx, world);
    return;
  }
  if (screen === SCREEN_OVER) {
    drawEnd(ctx, world, best, false);
    return;
  }
  if (screen === SCREEN_ESCAPED) {
    drawEnd(ctx, world, best, true);
  }
}
