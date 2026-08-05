/* ============================================================
   Three.js 宇宙背景
   - 深邃星海（两层粒子 + 闪烁）
   - 彩色星云粒子
   - 随机流星
   - 中心旋转的线框行星 + 内发光
   - 鼠标视差
   ============================================================ */

import * as THREE from 'three';

const canvas = document.getElementById('cosmos');

// 如果浏览器不支持 WebGL，安静降级（保留纯 CSS 背景）
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  canvas.remove();
  throw e;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 130);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dpr = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(dpr);
renderer.setSize(window.innerWidth, window.innerHeight);

/* ---------- 1. 星海：两层静态星点 ---------- */
function createStarLayer(count, size, spread, alpha) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // 均匀分布在球壳上
    const r = spread * (0.55 + Math.random() * 0.45);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xdfe8ff,
    size,
    transparent: true,
    opacity: alpha,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  return points;
}

const starCount = reduceMotion ? 900 : 2600;
const starLayerA = createStarLayer(starCount, 1.1, 260, 0.9);
const starLayerB = createStarLayer(Math.floor(starCount / 2.2), 1.7, 320, 0.55);

/* ---------- 2. 星云粒子（大尺寸、彩色、漂浮） ---------- */
const nebulaCount = reduceMotion ? 40 : 90;
const nebulaGeo = new THREE.BufferGeometry();
const nebulaPos = new Float32Array(nebulaCount * 3);
const nebulaColor = new Float32Array(nebulaCount * 3);
const nebulaScale = new Float32Array(nebulaCount);

const palette = [
  new THREE.Color(0x7c3aed), // 紫
  new THREE.Color(0x22d3ee), // 青
  new THREE.Color(0xf472b6), // 粉
  new THREE.Color(0x3b82f6), // 蓝
];

for (let i = 0; i < nebulaCount; i++) {
  nebulaPos[i * 3] = (Math.random() - 0.5) * 480;
  nebulaPos[i * 3 + 1] = (Math.random() - 0.5) * 300;
  nebulaPos[i * 3 + 2] = -60 - Math.random() * 240;

  const c = palette[Math.floor(Math.random() * palette.length)];
  nebulaColor[i * 3] = c.r;
  nebulaColor[i * 3 + 1] = c.g;
  nebulaColor[i * 3 + 2] = c.b;

  nebulaScale[i] = 14 + Math.random() * 30;
}

nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
nebulaGeo.setAttribute('color', new THREE.BufferAttribute(nebulaColor, 3));
nebulaGeo.setAttribute('size', new THREE.BufferAttribute(nebulaScale, 1));

// 圆斑贴图（Canvas 绘制，避免外部图片依赖）
function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

// 星云：使用完整 ShaderMaterial，支持逐粒子大小、颜色与呼吸
const nebulaMat = new THREE.ShaderMaterial({
  uniforms: {
    uTexture: { value: makeGlowTexture() },
    uTime: { value: 0 },
    uOpacity: { value: reduceMotion ? 0.4 : 0.7 },
  },
  vertexShader: `
    attribute float size;
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uOpacity;
    varying vec3 vColor;
    void main() {
      vec4 tex = texture2D(uTexture, gl_PointCoord);
      float pulse = 0.8 + 0.2 * sin(uTime * 1.2 + gl_PointCoord.y * 24.0);
      gl_FragColor = vec4(vColor * pulse, tex.a * uOpacity);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const nebulaParticles = new THREE.Points(nebulaGeo, nebulaMat);
scene.add(nebulaParticles);

/* ---------- 3. 流星 ---------- */
const meteors = [];
const METEOR_COUNT = reduceMotion ? 2 : 4;
const meteorGeo = new THREE.BufferGeometry();
const meteorPos = new Float32Array(METEOR_COUNT * 2 * 3); // 每条 2 个顶点
meteorGeo.setAttribute('position', new THREE.BufferAttribute(meteorPos, 3));
const meteorMat = new THREE.LineBasicMaterial({
  color: 0xa5f3fc,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
});
const meteorLines = new THREE.LineSegments(meteorGeo, meteorMat);
scene.add(meteorLines);

for (let i = 0; i < METEOR_COUNT; i++) {
  meteors.push({
    offset: Math.random() * 20,
    speed: 30 + Math.random() * 25,
    life: 0,
    dir: new THREE.Vector3(1, -0.4 - Math.random() * 0.4, 0).normalize(),
    len: 30 + Math.random() * 40,
  });
}

/* ---------- 4. 中心行星（线框 + 发光内球） ---------- */
const planetGroup = new THREE.Group();
const planetRadius = 34;

const wire = new THREE.Mesh(
  new THREE.IcosahedronGeometry(planetRadius, 1),
  new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
  })
);
const wire2 = new THREE.Mesh(
  new THREE.IcosahedronGeometry(planetRadius * 1.25, 1),
  new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    wireframe: true,
    transparent: true,
    opacity: 0.08,
  })
);
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(planetRadius * 0.62, 2),
  new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    wireframe: false,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
  })
);
const glowSprite = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    color: 0x7c3aed,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
glowSprite.scale.set(planetRadius * 6, planetRadius * 6, 1);

planetGroup.add(wire, wire2, core, glowSprite);
planetGroup.position.set(0, -6, -60);
scene.add(planetGroup);

/* ---------- 鼠标视差目标 ---------- */
const parallax = { x: 0, y: 0 };
const target = { x: 0, y: 0 };
let mouseX = 0;
let mouseY = 0;

window.addEventListener('pointermove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = (e.clientY / window.innerHeight) * 2 - 1;
});

/* ---------- 动画循环 ---------- */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 星云呼吸
  nebulaMat.uniforms.uTime.value = t;
  nebulaParticles.rotation.y = t * 0.008;

  // 星层缓慢旋转
  starLayerA.rotation.y = t * 0.004;
  starLayerB.rotation.y = -t * 0.003;

  // 中心行星
  wire.rotation.y = t * 0.12;
  wire.rotation.x = t * 0.05;
  wire2.rotation.y = -t * 0.08;
  core.rotation.y = t * 0.2;

  // 流星
  let idx = 0;
  for (let i = 0; i < METEOR_COUNT; i++) {
    const m = meteors[i];
    m.life -= dt;
    if (m.life <= 0) {
      // 重置：随机起点在右上
      const start = new THREE.Vector3(
        90 + Math.random() * 120,
        60 + Math.random() * 60,
        -40 - Math.random() * 60
      );
      const end = start.clone().add(m.dir.clone().multiplyScalar(m.len));
      meteorPos[idx * 6] = start.x; meteorPos[idx * 6 + 1] = start.y; meteorPos[idx * 6 + 2] = start.z;
      meteorPos[idx * 6 + 3] = end.x; meteorPos[idx * 6 + 4] = end.y; meteorPos[idx * 6 + 5] = end.z;
      m.life = 3 + Math.random() * 3;
      m.alpha = 0;
      m.phase = 'in';
    }
    // 淡入淡出
    if (m.phase === 'in') {
      m.alpha += dt * 2.5;
      if (m.alpha >= 0.9) m.phase = 'hold';
    } else if (m.phase === 'hold') {
      if (m.life < 0.6) { m.phase = 'out'; }
    } else if (m.phase === 'out') {
      m.alpha -= dt * 3;
      if (m.alpha <= 0) m.alpha = 0;
    }
    m.alpha = Math.max(0, Math.min(0.9, m.alpha));
    idx++;
  }
  meteorGeo.attributes.position.needsUpdate = true;
  meteorMat.opacity = meteors.reduce((s, m) => Math.max(s, m.alpha), 0) * 0.85;

  // 鼠标视差（平滑插值）
  target.x = mouseX * 16;
  target.y = mouseY * 10;
  parallax.x += (target.x - parallax.x) * 0.04;
  parallax.y += (target.y - parallax.y) * 0.04;

  camera.position.x = parallax.x;
  camera.position.y = -parallax.y;
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}

/* ---------- 尺寸自适应 ---------- */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

animate();
