let mapInitialized = false; // Asegúrate de declarar esta variable antes de usarla
let map;
let globalMarkers = [];

// === 🗺️ Inicializar el mapa ===
function initMap() {
  if (!mapInitialized) {
    // Inicializar el mapa
    map = L.map("map-container").setView([7.0, -66.0], 6);

    // Capa base estilo Google Maps (calles)
    const googleStreets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    });

    // Capa satelital (estilo Google Satellite)
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri World Imagery',
      maxZoom: 19
    });

    // Capa oscura alternativa
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CARTO'
    });

    // Añadir capa predeterminada
    googleStreets.addTo(map);

    // Control para cambiar capas
    const baseLayers = {
      "Calles": googleStreets,
      "Satélite": satellite,
      "Oscuro": darkLayer
    };

    L.control.layers(baseLayers).addTo(map);

    // Plugin para búsqueda de lugares (Geocoder)
    L.Control.geocoder({
      defaultMarkGeocode: false
    })
    .on('markgeocode', function(e) {
      map.fitBounds(e.geocode.bbox);
    })
    .addTo(map);

    mapInitialized = true;
  }
}


function addDarkOverlay() {
  const container = document.getElementById("map-container");
  if (container.querySelector('.dark-overlay')) return;

  const overlay = document.createElement("div");
  overlay.className = 'dark-overlay';
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.2);
    pointer-events: none;
    z-index: 400; // Z-index adecuado para Leaflet
  `;
  container.appendChild(overlay);
}

// === 📍 Mostrar marcadores co gráficos y botón de cámara ===
function showMapMarkers(data) {
  initMap();
  globalMarkers.forEach((marker) => map.removeLayer(marker));
  globalMarkers = [];

  // Configuración del icono personalizado
  const customIcon = L.divIcon({
    className: 'p-marker', // Clase CSS para estilos
    html: '<div style="font-size:20px">P</div>',  // Texto del marcador
    iconSize: [32, 32], // Tamaño del icono
    iconAnchor: [16, 16], // Punto de anclaje (centro)
    popupAnchor: [0, -16] // Posición del popup
  });

  data.forEach((item, index) => {
    if (!item.Latitud || !item.Longitud) {
        console.error('Item sin coordenadas:', item);
        return;
    }
    
    const lat = parseFloat(item.Latitud);
    const lon = parseFloat(item.Longitud);
    
    if (isNaN(lat)) {
        console.error('Latitud inválida en item:', item);
        return;
    }
    
    if (isNaN(lon)) {
        console.error('Longitud inválida en item:', item);
        return;
    }


    if (!isNaN(lat) && !isNaN(lon)) {
      // Crear marcador con el icono personalizado
      const marker = L.marker([lat, lon], {
        icon: customIcon // Aplicar el icono redondeado
      }).addTo(map);
      
      globalMarkers.push(marker);

      const uniqueId = `chart-${index}-${Date.now()}`;

      const nombre = item["Nombre del P.A.I.M"] || "P.A.I.M Desconocido";
      marker.bindTooltip(nombre, {
        permanent: true,
        direction: "top",
        className: "pai-tooltip",
        offset: [0, -9],
      });
      
      const coordinador = item["Coordinadores"] || "Sin coordinador";

      const popupContent = `
        <div style="min-width:250px">
          <strong>${nombre}</strong><br>
          <em>${coordinador}</em><br><br>
          <canvas id="${uniqueId}" width="220" height="200"></canvas><br>
          <button onclick="openCameraModal('${nombre.replace(/'/g, "'")}')">Cámara</button>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Manejador del popup
      marker.on("popupopen", function() {
        const cleanupChart = () => {
          if (this._chart) {
            this._chart.destroy();
            this._chart = null;
          }
        };

        cleanupChart();

        requestAnimationFrame(() => {
          const canvas = document.getElementById(uniqueId);
          if (!canvas) return;

          const ctx = canvas.getContext("2d");
          this._chart = new Chart(ctx, {
            type: "bar",
            data: {
              labels: ["Retenciones", "Comisos", "Reporte", "Servicio"],
              datasets: [{
                label: "Indicadores",
                backgroundColor: ["#ff6384", "#36a2eb", "#ffcd56", "#4bc0c0"],
                data: [
                  parseInt(item.retenciones || 0),
                  parseInt(item.comisos || 0),
                  parseInt(item.reporte || 0),
                  parseInt(item.servicio || 0)
                ]
              }]
            },
            options: {
              responsive: false,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } }
            }
          });
        });

        marker.on("popupclose", cleanupChart);
      });

      // Evento click para zoom
      marker.on("click", () => {
        map.setView([lat, lon], 9);
        marker.openPopup();
      });
    }
  });
}

// === 🔄 Centrar el mapa e Venezuela ===
function resetMapView() {
  if (!map) return;
  // Coordenadas aproximadas para Venezuela
  const venezuelaBounds = L.latLngBounds(
    [0.6, -73.4], // Suroeste
    [12.2, -59.8] // Noreste
  );
  map.fitBounds(venezuelaBounds, { padding: [50, 50] });
}


// === 🎯 FUNCIÓN CORREGIDA PARA MOSTRAR TODOS LOS MARCADORES ===
// === 🎯 FUNCIÓN CORREGIDA Y MEJORADA ===
function showAllIndicators() {
  // 1. Verificar inicialización del mapa
  if (!mapInitialized) {
    initMap();
    addDarkOverlay();
    console.log('Mapa inicializado desde showAllIndicators');
  }

  // 2. Mostrar contenedor del mapa
  const mapContainer = document.getElementById('map-container');
  mapContainer.style.display = 'block';
  mapContainer.style.opacity = '1';
  console.log('Contenedor del mapa mostrado');

  // 3. Esperar a la actualización del layout
  setTimeout(() => {
    // 4. Actualizar dimensiones CRÍTICO
    try {
      map.invalidateSize(true);
      console.log('Tamaño del mapa actualizado');
    } catch (error) {
      console.error('Error al actualizar tamaño:', error);
      return;
    }

    // 5. Verificar existencia de marcadores
    console.log('Total de marcadores:', globalMarkers.length);
    
    // 6. Filtrar coordenadas válidas
    const validCoords = globalMarkers
      .filter(marker => {
        try {
          return marker && marker.getLatLng;
        } catch (e) {
          return false;
        }
      })
      .map(marker => {
        const latlng = marker.getLatLng();
        return [latlng.lat, latlng.lng];
      })
      .filter(coord => {
        const [lat, lng] = coord;
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      });

    console.log('Coordenadas válidas:', validCoords);

    // 7. Manejar caso sin coordenadas
    if (validCoords.length === 0) {
      console.warn('No hay coordenadas válidas, centrando en Venezuela');
      map.flyTo([6.4238, -66.5897], 6, { duration: 1 });
      return;
    }

    // 8. Crear bounds con protección
    const bounds = L.latLngBounds(validCoords);
    
    // 9. Añadir punto de Venezuela como fallback
    if (!bounds.isValid()) {
      console.warn('Bounds inválido, usando fallback');
      bounds.extend([6.4238, -66.5897]);
    }

    // 10. Ajustar vista con parámetros optimizados
    try {
      map.flyToBounds(bounds, {
        padding: [30, 30],
        maxZoom: 12,
        duration: 1.5,
        easeLinearity: 0.25
      });
      console.log('Animación de zoom ejecutada');
    } catch (error) {
      console.error('Error en flyToBounds:', error);
      map.setView([6.4238, -66.5897], 6);
    }
  }, 150); // Tiempo ajustado
}

// === 🌍 Volver a la vista del globo (versión optimizada) ===
function returnToGlobe() {
  const dataView = document.getElementById("dataView");
  const mapContainer = document.getElementById("map-container");
  const globeContainer = document.getElementById("globe-container");
  const controls = document.getElementById("controls");
  const fileInput = document.getElementById("fileInput");

  // Configurar transición CSS en lugar de timeout
  mapContainer.style.transition = "opacity 0.3s ease";
  mapContainer.style.opacity = "0";

  // Usar evento de fin de transición
  mapContainer.addEventListener("transitionend", () => {
    // Ocultar elementos del mapa
    mapContainer.style.display = "none";
    dataView.classList.remove("active");

    // Mostrar elementos del globo con transición
    globeContainer.style.display = "block";
    controls.style.display = "block";
    setTimeout(() => {
      globeContainer.style.opacity = "1";
      controls.style.opacity = "1";
    }, 10); // Pequeño delay para activar transición

    // Resetear input de archivo
    fileInput.value = "";

    // Limpiar recursos del mapa
    cleanupMapResources();
  }, { once: true }); // Ejecutar solo una vez
}

// Función auxiliar para limpieza de recursos
function cleanupMapResources() {
  // Eliminar marcadores
  globalMarkers.forEach(marker => {
    if (map.hasLayer(marker)) {
      map.removeLayer(marker);
    }
  });
  globalMarkers = [];

  // Destruir mapa
  if (map) {
    map.off();
    map.remove();
    map = null;
    mapInitialized = false;
  }
}

// === 🎥 Abrir modal de cámar ===
function openCameraModal(nombreSede) {
  const modal = document.getElementById("cameraModal");
  const title = document.getElementById("cameraModalTitle");
  const video = document.getElementById("cameraFeed");

  if (!modal || !title || !video) {
    console.warn("Elementos del modal de cámara no encontrados.");
    return;
  }

  title.textContent = `Cámara - ${nombreSede}`;
  modal.style.display = "flex";

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
    })
    .catch((err) => {
      alert("No se pudo acceder a la cámara: " + err);
    });
}

// === ❌ Cerrar modal de cámara ===
function closeCameraModal() {
  const modal = document.getElementById("cameraModal");
  const video = document.getElementById("cameraFeed");

  if (modal) modal.style.display = "none";
  if (video?.srcObject) {
    video.srcObject.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }
}
