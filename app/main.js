// Les imports pour lui dire j'ai besoin de cette app de cette objet ect. 
import './style.css';
import {Map, View} from 'ol';
import { fromLonLat } from 'ol/proj';
import { ImageWMS } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style.js';
import ScaleLine from 'ol/control/ScaleLine.js' //pour ajouter l'echelle 


// Je sors la couche OSM de l’objet Map pour la stocker dans une variable
const scaleline = new ScaleLine(); //On appelle ici le scale 
const couche_osm = new TileLayer({ source: new OSM() });

// =========================================================================================
// ================================= Import de mes 3 couches wms ===========================
// =========================================================================================


// =========================================================================================
// ================================= Import de mes 3 couches wms ===========================
// =========================================================================================

// =========== Impoter la couche Point de justice ================
const pt_justice = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8090/geoserver/data_point_justice/wms',
    params: {'LAYERS' : 'data_point_justice:point_justice'
    },
    serverType: 'geoserver',
  }),
});



// ============== Impoter la couche Cour d'appel ================
const cour_appel = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8090/geoserver/data_point_justice/wms',
    params: {'LAYERS' : 'data_point_justice:cour_appel'
    },
    serverType: 'geoserver',
  }),
});

// ================= Impoter la couche Prudhomme =================
const prudhomme = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8090/geoserver/data_point_justice/wms',
    params: {'LAYERS' : 'data_point_justice:prudhomme'
    },
    serverType: 'geoserver',
  }),
});

// ============== Impoter la couche trib_judiciaire ================
const trib_judiciaire = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8090/geoserver/data_point_justice/wms',
    params: {'LAYERS' : 'data_point_justice:tribunal judiciaire'
    },
    serverType: 'geoserver',
  }),
});


// ========================================================================================
// ===============================  On ajoute ici la carte =============================== 
// ========================================================================================
// Création de l’objet map avec appel de mes deux couches "couche_osm" et "ma_couche" dans layers

const map = new Map({
  target: 'map',
  controls: [scaleline], // Pour ajouter l'echelle 
  layers: [ couche_osm, prudhomme, trib_judiciaire, cour_appel,pt_justice ],
  view: new View({
    center: fromLonLat([4.385923767089852, 45.43798463466298]),
    zoom: 6
  })
});




// ========================================================================================
// ===============================  Fonctions accésoires  =============================== 
// ========================================================================================

document.getElementById('btn-layer-panel').addEventListener('click', function() {
  var contentPanel = document.getElementById('content-layer-panel');
  if (contentPanel.style.display === 'none' || contentPanel.style.display === '') {
      contentPanel.style.display = 'block';
  } else {
      contentPanel.style.display = 'none';
  }
});

document.getElementById('btn-close-layer-panel').addEventListener('click', function() {
  document.getElementById('content-layer-panel').style.display = 'none';
});