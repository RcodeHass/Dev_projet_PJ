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
// ==== Définition de la fonction des ckeckbox pour afficher et masquer les couche  ======= 
// ========================================================================================

// Fonctions pour afficher et masquer la couche country 
const checkbox_pt_justice = document.getElementById('checkbox-pt_justice');
checkbox_pt_justice.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    // On fait des trucs quand la checkbox est checkée
    pt_justice.setVisible(true);
    console.log('test');
  } else {
    // On fait des trucs quand la checkbox n’est PAS checkée
    pt_justice.setVisible(false);
  }
});


document.querySelectorAll('input[name="checkbox-group"]').forEach((radio) => {
  radio.addEventListener("change", (event) => {
    if (event.target.id === "checkbox-cour_appel") {
      cour_appel.setVisible(true);
      trib_judiciaire.setVisible(false);
      prudhomme.setVisible(false);
    } else if (event.target.id === "checkbox-trib_judiciaire") {
      trib_judiciaire.setVisible(true);
      cour_appel.setVisible(false);
      prudhomme.setVisible(false);
    } else if (event.target.id === "checkbox-prudhomme") {
      prudhomme.setVisible(true);
      cour_appel.setVisible(false);
      trib_judiciaire.setVisible(false);
    }
  });
});


// ========================================================================================
// ===============================  Fonctions accésoires  =============================== 
// ========================================================================================

// Bouton d'affichage et masquage de l'onglet gestion des couches
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


// Bouton d'affichage et masquage de l'onglet info
const toggleButton = document.getElementById('toggle-size-button');
const ongletInfo = document.getElementById('info-panel-overlay');
const toggleImg = document.getElementById('toggle-img');

// Initialiser l'image en fonction de l'état par défaut
if (ongletInfo.classList.contains('reduit')) {
  toggleImg.src = 'dist/assets/img/prev.png'; // Image pour l'état réduit
} else {
  toggleImg.src = 'dist/assets/img/next.png'; // Image pour l'état normal
}

toggleButton.addEventListener('click', () => {
  if (ongletInfo.style.display === 'none' || ongletInfo.style.display === '') {
    ongletInfo.style.display = 'block';
    toggleImg.src = 'dist/assets/img/prev.png'; // Image pour l'état affiché
  } else {
    ongletInfo.style.display = 'none';
    toggleImg.src = 'dist/assets/img/next.png'; // Image pour l'état masqué
  }
});


function toggleDialog(buttonId, dialogId, otherDialogIds) {
  document.getElementById(buttonId).addEventListener('click', function() {
      const dialog = document.getElementById(dialogId);
      const otherDialogs = otherDialogIds.map(id => document.getElementById(id));
      
      // Fermer les autres dialogues s'ils sont ouverts
      otherDialogs.forEach(otherDialog => {
          if (otherDialog.open) {
              otherDialog.close();
          }
      });
      
      // Ouvrir ou fermer le dialogue actuel
      if (dialog.open) {
      } else {
          dialog.show(); 
      }
  });
}

// Utilisation de la fonction générique pour les boutons
toggleDialog('button-text', 'text-info', ['stat-info', 'stat-list']);
toggleDialog('button-stat', 'stat-info', ['text-info', 'stat-list']);
toggleDialog('button-list', 'stat-list', ['text-info', 'stat-info']);