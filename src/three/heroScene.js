/* ============================================================
   HERO SCENE — tactical harvest-operations map (Three.js)
   Low-poly, hard-edged, grid-based: field blocks with crop rows,
   a right-angled harvest route with bins moving to the packhouse,
   crew + QC markers, and a dashed shipment route with a dispatch
   truck. Falls back to a 2D canvas sketch when Three.js (CDN) or
   WebGL is unavailable. Respects prefers-reduced-motion.
   ============================================================ */

const INK = 0x16160f;
const PAPER = 0xe9dfc4;
const AMBER = 0xd4830a;
const WHEAT = 0xf1c453;
const BLUE = 0x2563a8;
const RED = 0xc5221f;
const SOIL = 0x7a5227;
const SOIL_DEEP = 0x4a3218;
const GREENS = [0x0f6e56, 0x1a8a6c, 0x2f5f42, 0x77a345, 0x88b04b];

/* ---------- 2D canvas fallback (no Three.js / no WebGL) ---------- */
function drawCanvasFallback(canvas) {
  const context = canvas.getContext('2d');
  if (!context) return;

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  canvas.width = width;
  canvas.height = height;

  context.fillStyle = '#E9DFC4';
  context.fillRect(0, 0, width, height);

  // tactical grid
  context.strokeStyle = 'rgba(22,22,15,.08)';
  context.lineWidth = 1;
  for (let x = 0.5; x < width; x += 22) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
  }
  for (let y = 0.5; y < height; y += 22) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
  }

  // field blocks with crop rows
  const greens = ['#0F6E56', '#1A8A6C', '#2F5F42', '#77A345', '#88B04B'];
  const bw = Math.min(64, width / 8);
  const bh = bw * 0.62;
  const gap = 10;
  const originX = width * 0.07;
  const originY = height * 0.16;
  let i = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const x = originX + col * (bw + gap);
      const y = originY + row * (bh + gap);
      context.fillStyle = (i === 7 || i === 11) ? '#D4830A' : greens[(i * 3 + row) % greens.length];
      context.fillRect(x, y, bw, bh);
      context.strokeStyle = '#16160F';
      context.lineWidth = 2;
      context.strokeRect(x, y, bw, bh);
      context.strokeStyle = 'rgba(22,22,15,.35)';
      context.lineWidth = 1;
      for (let k = 1; k <= 2; k++) {
        context.beginPath();
        context.moveTo(x + 4, y + (bh / 3) * k);
        context.lineTo(x + bw - 4, y + (bh / 3) * k);
        context.stroke();
      }
      i += 1;
    }
  }

  // packhouse
  const px = width * 0.78;
  const py = height * 0.42;
  const pw = bw * 1.15;
  const ph = bh * 1.15;
  context.fillStyle = '#7A5227';
  context.fillRect(px, py, pw, ph);
  context.strokeStyle = '#16160F';
  context.lineWidth = 2;
  context.strokeRect(px, py, pw, ph);

  // right-angled harvest route
  const routeY = originY + 3 * (bh + gap) + 6;
  context.strokeStyle = '#16160F';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(originX + bw * 0.5, routeY);
  context.lineTo(width * 0.5, routeY);
  context.lineTo(width * 0.5, py + ph * 0.5);
  context.lineTo(px, py + ph * 0.5);
  context.stroke();

  // bins on route
  [[width * 0.28, routeY], [width * 0.5, (routeY + py + ph * 0.5) / 2], [width * 0.66, py + ph * 0.5]].forEach(([bx, by], k) => {
    context.fillStyle = k === 1 ? '#D4830A' : '#F1C453';
    context.fillRect(bx - 5, by - 5, 10, 10);
    context.strokeRect(bx - 5, by - 5, 10, 10);
  });
}

function useFallback(canvas) {
  const draw = () => drawCanvasFallback(canvas);
  draw();
  window.addEventListener('resize', draw);
}

/* ---------- right-angled route sampler ---------- */
function makeRoutePath(THREE, pts) {
  const points = pts.map(p => new THREE.Vector3(...p));
  const seg = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const l = points[i].distanceTo(points[i + 1]);
    seg.push(l);
    total += l;
  }
  return {
    points,
    at(t, out) {
      let d = Math.min(Math.max(t, 0), 1) * total;
      for (let i = 0; i < seg.length; i++) {
        if (d <= seg[i] || i === seg.length - 1) {
          const k = seg[i] ? Math.min(d / seg[i], 1) : 0;
          return out.copy(points[i]).lerp(points[i + 1], k);
        }
        d -= seg[i];
      }
      return out.copy(points[points.length - 1]);
    }
  };
}

export async function initHeroScene({ reduceMotion }) {
  const canvas = document.getElementById('heroScene');
  if (!canvas) return;

  let THREE;
  try {
    THREE = await import('three');
  } catch (error) {
    useFallback(canvas);
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
  } catch (error) {
    useFallback(canvas);
    return;
  }

  try {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
    camera.position.set(7.0, 8.4, 9.4);
    // aim slightly below ground so the map sits high in the wide panel,
    // clear of the console strip overlaid along the bottom
    camera.lookAt(0.55, -0.55, 0.35);

    scene.add(new THREE.AmbientLight(0xfaf6e8, 1.55));
    const sun = new THREE.DirectionalLight(0xfff2c8, 2.1);
    sun.position.set(4, 9, 5);
    scene.add(sun);

    const world = new THREE.Group();
    world.rotation.y = -0.16;
    // nudge the map up-left in frame so the packhouse and shipment
    // route clear the console strip overlaid along the panel bottom
    world.position.set(-0.2, 0, -0.85);
    scene.add(world);

    // ground + tactical grid
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 15),
      new THREE.MeshLambertMaterial({ color: PAPER })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    world.add(ground);

    const grid = new THREE.GridHelper(15, 30, INK, INK);
    grid.material.transparent = true;
    grid.material.opacity = 0.12;
    grid.position.y = -0.02;
    world.add(grid);

    const edgeMat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.5 });
    const edgeMatSolid = new THREE.LineBasicMaterial({ color: INK });

    // field blocks (grid layout, a couple flagged harvest-ready in amber)
    const blockGeo = new THREE.BoxGeometry(1.45, 1, 1.05);
    const blockEdges = new THREE.EdgesGeometry(blockGeo);
    const READY = new Set([9, 16]);
    const blocks = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const i = row * 6 + col;
        const h = 0.12 + ((i * 7) % 4) * 0.05;
        const color = READY.has(i) ? AMBER : GREENS[(i * 3 + row) % GREENS.length];
        const mesh = new THREE.Mesh(blockGeo, new THREE.MeshLambertMaterial({ color }));
        mesh.scale.y = h;
        mesh.position.set((col - 2.5) * 1.78, h / 2, (row - 1.5) * 1.34);
        mesh.add(new THREE.LineSegments(blockEdges, edgeMat));
        world.add(mesh);
        blocks.push({ x: mesh.position.x, z: mesh.position.z, h, color });
      }
    }

    // instanced crop rows on every block
    const rowGeo = new THREE.BoxGeometry(1.15, 0.05, 0.14);
    const rows = new THREE.InstancedMesh(
      rowGeo,
      new THREE.MeshLambertMaterial({ color: 0xffffff }),
      blocks.length * 3
    );
    const m4 = new THREE.Matrix4();
    const rowColor = new THREE.Color();
    let idx = 0;
    blocks.forEach(b => {
      for (let k = -1; k <= 1; k++) {
        m4.makeTranslation(b.x, b.h + 0.03, b.z + k * 0.31);
        rows.setMatrixAt(idx, m4);
        rows.setColorAt(idx, rowColor.set(b.color).multiplyScalar(0.72));
        idx += 1;
      }
    });
    rows.instanceMatrix.needsUpdate = true;
    if (rows.instanceColor) rows.instanceColor.needsUpdate = true;
    world.add(rows);

    // packhouse with loading dock
    const pack = new THREE.Group();
    const packBase = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 1.15), new THREE.MeshLambertMaterial({ color: SOIL }));
    packBase.position.y = 0.3;
    packBase.add(new THREE.LineSegments(new THREE.EdgesGeometry(packBase.geometry), edgeMatSolid));
    const packRoof = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.14, 1.3), new THREE.MeshLambertMaterial({ color: SOIL_DEEP }));
    packRoof.position.y = 0.67;
    packRoof.add(new THREE.LineSegments(new THREE.EdgesGeometry(packRoof.geometry), edgeMatSolid));
    const dock = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.55), new THREE.MeshLambertMaterial({ color: WHEAT }));
    dock.position.set(0, 0.04, 0.85);
    dock.add(new THREE.LineSegments(new THREE.EdgesGeometry(dock.geometry), edgeMatSolid));
    pack.add(packBase, packRoof, dock);
    pack.position.set(5.15, 0, -0.35);
    world.add(pack);

    // harvest route: field → packhouse (hard right angles, gap lanes)
    const harvestRoute = makeRoutePath(THREE, [
      [-4.45, 0.34, -1.65], [-2.7, 0.34, -1.65], [-2.7, 0.34, 0.12],
      [0.15, 0.34, 0.12], [0.15, 0.34, 1.18], [3.56, 0.34, 1.18],
      [3.56, 0.34, -0.35], [4.25, 0.34, -0.35]
    ]);
    world.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(harvestRoute.points),
      new THREE.LineBasicMaterial({ color: INK })
    ));

    // shipment route: packhouse → map edge (dashed = scheduled dispatch)
    const shipRoute = makeRoutePath(THREE, [
      [5.15, 0.07, 0.6], [5.15, 0.07, 1.25], [7.05, 0.07, 1.25]
    ]);
    const shipLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(shipRoute.points),
      new THREE.LineDashedMaterial({ color: INK, dashSize: 0.22, gapSize: 0.16 })
    );
    shipLine.computeLineDistances();
    world.add(shipLine);

    // harvest bins moving along the route
    const binGeo = new THREE.BoxGeometry(0.26, 0.26, 0.26);
    const binEdges = new THREE.EdgesGeometry(binGeo);
    const bins = [0, 0.38, 0.72].map((offset, i) => {
      const bin = new THREE.Mesh(binGeo, new THREE.MeshLambertMaterial({ color: i === 1 ? AMBER : WHEAT }));
      bin.add(new THREE.LineSegments(binEdges, edgeMatSolid));
      bin.userData.offset = offset;
      world.add(bin);
      return bin;
    });

    // dispatch truck on the shipment route
    const truck = new THREE.Group();
    const truckBody = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.66), new THREE.MeshLambertMaterial({ color: 0xf6f1e4 }));
    truckBody.position.set(0, 0.22, -0.08);
    truckBody.add(new THREE.LineSegments(new THREE.EdgesGeometry(truckBody.geometry), edgeMatSolid));
    const truckCab = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.26), new THREE.MeshLambertMaterial({ color: AMBER }));
    truckCab.position.set(0, 0.19, 0.38);
    truckCab.add(new THREE.LineSegments(new THREE.EdgesGeometry(truckCab.geometry), edgeMatSolid));
    truck.add(truckBody, truckCab);
    world.add(truck);

    // crew markers (sky blue) + QC exception marker (red, over an amber block)
    const markerGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    const markerEdges = new THREE.EdgesGeometry(markerGeo);
    const crewMarkers = [[-2.67, 0.68, 0.67], [0.89, 0.68, -2.01]].map(pos => {
      const m = new THREE.Mesh(markerGeo, new THREE.MeshLambertMaterial({ color: BLUE }));
      m.add(new THREE.LineSegments(markerEdges, edgeMatSolid));
      m.position.set(...pos);
      m.userData.baseY = pos[1];
      world.add(m);
      return m;
    });
    const qcMarker = new THREE.Mesh(markerGeo, new THREE.MeshLambertMaterial({ color: RED }));
    qcMarker.add(new THREE.LineSegments(markerEdges, edgeMatSolid));
    qcMarker.position.set(0.89, 0.68, -0.67);
    world.add(qcMarker);

    /* ---------- animation + rendering ---------- */
    const tmp = new THREE.Vector3();
    const ahead = new THREE.Vector3();

    function setActors(time) {
      bins.forEach(bin => {
        harvestRoute.at((time * 0.055 + bin.userData.offset) % 1, tmp);
        bin.position.copy(tmp);
      });

      const tp = (time * 0.075) % 1.35; // pause between dispatch runs
      truck.visible = tp <= 1;
      if (truck.visible) {
        shipRoute.at(tp, tmp);
        truck.position.copy(tmp);
        shipRoute.at(Math.min(tp + 0.02, 1), ahead);
        if (ahead.distanceToSquared(tmp) > 1e-6) truck.lookAt(ahead);
      }

      crewMarkers.forEach((m, i) => {
        m.position.y = m.userData.baseY + Math.sin(time * 2.1 + i * 2) * 0.07;
      });
      qcMarker.scale.setScalar(1 + Math.sin(time * 3.2) * 0.12);
      world.rotation.y = -0.16 + Math.sin(time * 0.22) * 0.02;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const pr = renderer.getPixelRatio();
      if (canvas.width !== Math.floor(width * pr) || canvas.height !== Math.floor(height * pr)) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    }

    const render = () => renderer.render(scene, camera);

    if (reduceMotion) {
      // static tactical map, frozen mid-cycle; re-render only on resize
      setActors(4.2);
      resize();
      render();
      if ('ResizeObserver' in window) {
        new ResizeObserver(() => { resize(); render(); }).observe(canvas);
      } else {
        window.addEventListener('resize', () => { resize(); render(); });
      }
      return;
    }

    let t = 0;
    let frameId = 0;
    let running = false;
    let inView = true;
    const clock = new THREE.Clock();

    function loop() {
      if (!running) return;
      t += Math.min(clock.getDelta(), 0.05);
      resize();
      setActors(t);
      render();
      frameId = requestAnimationFrame(loop);
    }
    function start() {
      if (running || !inView || document.hidden) return;
      running = true;
      clock.getDelta(); // reset delta after a pause
      frameId = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(frameId);
    }

    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start(); else stop();
      }, { threshold: 0.05 }).observe(canvas);
    }

    // guarantee a first paint even before the loop starts
    resize();
    setActors(0);
    render();
    start();
  } catch (error) {
    useFallback(canvas);
  }
}
