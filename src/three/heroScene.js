function resizeRenderer(renderer, camera, canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const needsResize = canvas.width !== width || canvas.height !== height;

  if (needsResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function makeBlock(THREE, { x, z, color, height }) {
  const geometry = new THREE.BoxGeometry(1.55, height, 1.15);
  const material = new THREE.MeshLambertMaterial({ color });
  const block = new THREE.Mesh(geometry, material);
  block.position.set(x, height / 2, z);
  block.castShadow = true;
  block.receiveShadow = true;
  return block;
}

function drawCanvasFallback(canvas) {
  const context = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  canvas.width = width;
  canvas.height = height;

  context.fillStyle = '#E6F4EA';
  context.fillRect(0, 0, width, height);
  context.strokeStyle = '#111111';
  context.lineWidth = 2;

  const cell = Math.max(28, Math.floor(width / 8));
  for (let y = cell; y < height - cell; y += cell) {
    for (let x = cell; x < width - cell; x += cell) {
      context.fillStyle = (x + y) % (cell * 3) === 0 ? '#D4830A' : '#0F6E56';
      context.fillRect(x, y, cell * 0.72, cell * 0.44);
      context.strokeRect(x, y, cell * 0.72, cell * 0.44);
    }
  }

  context.beginPath();
  context.moveTo(width * 0.12, height * 0.72);
  context.lineTo(width * 0.34, height * 0.55);
  context.lineTo(width * 0.56, height * 0.62);
  context.lineTo(width * 0.83, height * 0.36);
  context.stroke();
}

export async function initHeroScene({ reduceMotion }) {
  const canvas = document.getElementById('heroScene');
  if (!canvas) return;

  let THREE;
  try {
    THREE = await import('three');
  } catch (error) {
    drawCanvasFallback(canvas);
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(5.8, 6.5, 7.8);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xfafaf8, 1.7);
  const sun = new THREE.DirectionalLight(0xfff1c1, 2.2);
  sun.position.set(4, 8, 5);
  sun.castShadow = true;
  scene.add(ambient, sun);

  const field = new THREE.Group();
  const blockColors = [0x0f6e56, 0x1a8a6c, 0x77a345, 0xd4830a, 0x2f5f42, 0x88b04b];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const i = row * 6 + col;
      field.add(makeBlock(THREE, {
        x: (col - 2.5) * 1.85,
        z: (row - 1.5) * 1.35,
        color: blockColors[i % blockColors.length],
        height: 0.1 + ((i % 4) * 0.05)
      }));
    }
  }
  field.rotation.y = -0.18;
  scene.add(field);

  const routeMaterial = new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 2 });
  const routePoints = [
    new THREE.Vector3(-4.7, 0.24, -1.9),
    new THREE.Vector3(-2.2, 0.26, -0.6),
    new THREE.Vector3(0.4, 0.28, -0.9),
    new THREE.Vector3(2.5, 0.3, 0.45),
    new THREE.Vector3(4.6, 0.32, 1.8)
  ];
  const route = new THREE.Line(new THREE.BufferGeometry().setFromPoints(routePoints), routeMaterial);
  scene.add(route);

  const markers = new THREE.Group();
  const markerGeometry = new THREE.BoxGeometry(0.28, 0.28, 0.28);
  const markerMaterials = [
    new THREE.MeshBasicMaterial({ color: 0xf1c453 }),
    new THREE.MeshBasicMaterial({ color: 0x1a73e8 }),
    new THREE.MeshBasicMaterial({ color: 0xc5221f })
  ];

  routePoints.forEach((point, index) => {
    const marker = new THREE.Mesh(markerGeometry, markerMaterials[index % markerMaterials.length]);
    marker.position.copy(point);
    marker.position.y += 0.22;
    markers.add(marker);
  });
  scene.add(markers);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 9),
    new THREE.MeshLambertMaterial({ color: 0xf5edd6 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.04;
  floor.receiveShadow = true;
  scene.add(floor);

  let frameId;
  const clock = new THREE.Clock();

  function render() {
    resizeRenderer(renderer, camera, canvas);

    if (!reduceMotion) {
      const elapsed = clock.getElapsedTime();
      field.rotation.y = -0.18 + Math.sin(elapsed * 0.28) * 0.035;
      markers.children.forEach((marker, index) => {
        marker.position.y = routePoints[index].y + 0.22 + Math.sin(elapsed * 2.2 + index) * 0.08;
      });
    }

    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  }

  render();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(frameId);
    else render();
  });
}
