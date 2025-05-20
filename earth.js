// earth.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("globe-container").appendChild(renderer.domElement);

// Efecto de partículas
const starsGeometry = new THREE.BufferGeometry();
const starsVertices = [];
for (let i = 0; i < 10000; i++) {
  const x = THREE.MathUtils.randFloatSpread(2000);
  const y = THREE.MathUtils.randFloatSpread(2000);
  const z = THREE.MathUtils.randFloatSpread(2000);
  starsVertices.push(x, y, z);
}
starsGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starsVertices, 3)
);
const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
const starField = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starField);

// Globo con efecto de brillo
const globeGeometry = new THREE.SphereGeometry(5, 64, 64);
const globeTexture = new THREE.TextureLoader().load(
  "/assets/textures/globo1.jpg"
);
const glowMaterial = new THREE.ShaderMaterial({
  uniforms: {
    c: { value: 1.0 },
    p: { value: 1.4 },
    glowColor: { value: new THREE.Color(0x00ffff) },
    viewVector: { value: camera.position },
  },
  vertexShader: `
    uniform vec3 viewVector;
    varying float intensity;
    void main() {
      vec3 vNormal = normalize( normalMatrix * normal );
      vec3 vNormel = normalize( normalMatrix * viewVector );
      intensity = pow( 0.6 - dot(vNormal, vNormel), 6.0 );
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    uniform vec3 glowColor;
    varying float intensity;
    void main() {
      vec3 glow = glowColor * intensity;
      gl_FragColor = vec4( glow, 1.0 );
    }
  `,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true,
});

const globe = new THREE.Mesh(
  globeGeometry,
  new THREE.MeshPhongMaterial({
    map: globeTexture,
    bumpScale: 0.05,
    specular: new THREE.Color("grey"),
    shininess: 5,
  })
);

const glow = new THREE.Mesh(globeGeometry, glowMaterial);
glow.scale.multiplyScalar(1.1);
scene.add(glow);
scene.add(globe);

// Iluminación
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

camera.position.z = 15;

// Animación
function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.002;
  glow.rotation.y = globe.rotation.y;
  renderer.render(scene, camera);
}
animate();

// === Carga de archivo Excel y transición ===
document.getElementById("fileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    console.log("Archivo Excel cargado:", json);

    // Transición suave
    document.getElementById("globe-container").style.transition =
      "opacity 1s ease";
    document.getElementById("controls").style.transition = "opacity 1s ease";
    document.getElementById("globe-container").style.opacity = "0";
    document.getElementById("controls").style.opacity = "0";

    setTimeout(() => {
      // Ocultar globo y controles
      document.getElementById("globe-container").style.display = "none";
      document.getElementById("controls").style.display = "none";

      // Mostrar mapa y activar transición
      const dataView = document.getElementById("dataView");
      dataView.classList.add("active");

      const mapContainer = document.getElementById("map-container");
      mapContainer.style.display = "block";
      setTimeout(() => {
        mapContainer.style.opacity = "1";
      }, 100);

      // Mostrar marcadores
      showMapMarkers(json);
    }, 1000);
  };
  reader.readAsArrayBuffer(file);
});


// === Mostrar el botón solo después de hacer clic en la pantalla ===
function showImportButton() {
  const fileInputButton = document.getElementById("importButton");
  const fileInput = document.getElementById("fileInput");

  // Mostrar el botón de importar y el campo de archivo al hacer clic
  fileInputButton.style.visibility = "visible"; // Cambiar a visible
  fileInput.style.visibility = "visible"; // Cambiar a visible
}

// Añadir el event listener de clic solo una vez
document.body.addEventListener("click", function() {
  showImportButton();
  // Remover el event listener después de que se haga clic
  document.body.removeEventListener("click", arguments.callee);
});

// Ajustar automáticamente el tamaño del renderer cuando se cambia el tamaño de la pantalla
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});


// Añadir partículas
function addParticles() {
  const particleGeometry = new THREE.BufferGeometry();
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 0.5,
  });

  const particleCount = 10000;
  const positions = [];
  for (let i = 0; i < particleCount; i++) {
    positions.push(
      THREE.MathUtils.randFloatSpread(2000),
      THREE.MathUtils.randFloatSpread(2000),
      THREE.MathUtils.randFloatSpread(2000)
    );
  }

  particleGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
}

addParticles(); // Llamar a la función para crear partículas
