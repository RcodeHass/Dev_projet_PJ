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
// ============== Charger la couche WFS des points de justice ================
const source_pj = new VectorSource({
  format: new GeoJSON(),
  url: 'http://localhost:8090/geoserver/data_point_justice/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=data_point_justice:point_justice&outputFormat=application/json',
  crossOrigin: 'anonymous' // Pour éviter les erreurs CORS
});

const vecteur_pj = new VectorLayer({
  source: source_pj
});


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

// // =========== Impoter la couche Point de justice en vecteur ================
// const vecteur_pj = new VectorSource({
//   format: new GeoJSON(),
//   url: 'http://localhost:8090/geoserver/data_point_justice/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=data_point_justice:point_justice&maxFeatures=50&outputFormat=application/json',
//   crossOrigin: 'anonymous' // Permet d'éviter des erreurs CORS si nécessaire
// });

// // On peux maintenant configurer le style de la couche 
// function getStyleCentroid(feature) {
//   const style = new Style({
//     image: new Circle({
//       fill: new Fill({ color: '#fac460da'}),
//     }),
//   });
//   return style;
// }

// // On configure ici la couche vecteur 
// const vecteur_point_justice = new VectorLayer({
//   source: vecteur_pj,
//   style: getStyleCentroid  
// });


// ============== Impoter la couche Cour d'appel ================
const cour_appel = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8090/geoserver/data_point_justice/wms',
    params: {
      'LAYERS' : 'data_point_justice:cour_appel',
      'TILED': true
    },
    serverType: 'geoserver',
    crossOrigin: 'anonymous'

  }),
});

// ================= Impoter la couche Prudhomme =================
const prudhomme = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8090/geoserver/data_point_justice/wms',
    params: {
      'LAYERS' : 'data_point_justice:prudhomme',
      'TILED': true
    },
    serverType: 'geoserver',
    crossOrigin: 'anonymous'
  }),
});

// ============== Impoter la couche trib_judiciaire ================
const trib_judiciaire = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8090/geoserver/data_point_justice/wms',
    params: {
      'LAYERS' : 'data_point_justice:tribunal_judiciaire',
      'TILED': true
    },
    serverType: 'geoserver',
    crossOrigin: 'anonymous'
  }),
});


// ============== Impoter la couche trib_judiciaire ================
const commune = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8090/geoserver/data_point_justice/wms',
    params: {
      'LAYERS' : 'data_point_justice:commune',
      'TILED': true
    },
    serverType: 'geoserver',
    crossOrigin: 'anonymous'
  }),
});



// ========================================================================================
// ===============================  On ajoute ici la carte =============================== 
// ========================================================================================
// Création de l’objet map avec appel de mes deux couches "couche_osm" et "ma_couche" dans layers

const map = new Map({
  target: 'map',
  controls: [scaleline], // Pour ajouter l'echelle 
  layers: [ couche_osm, commune, prudhomme, trib_judiciaire, cour_appel,vecteur_pj],
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

commune.setVisible(false);
// Fonctions pour afficher et masquer la couche commune
const checkbox_commune = document.getElementById('checkbox-commune');
checkbox_commune.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    // On fait des trucs quand la checkbox est checkée
    commune.setVisible(true);
  } else {
    // On fait des trucs quand la checkbox n’est PAS checkée
    commune.setVisible(false);
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
// ====================== Fonctions d'intéraction avec les couches  ====================== 
// ========================================================================================

// ============== Écouteur de clic pour récupérer le code du cours d'appel ================
// map.on('singleclick', function (evt) {
//   const viewResolution = map.getView().getResolution();
//   const wmsSource = cour_appel.getSource();
//   const url = wmsSource.getFeatureInfoUrl(
//     evt.coordinate,
//     viewResolution,
//     'EPSG:3857',
//     { 'INFO_FORMAT': 'application/json' }
//   );

//   if (url) {
//     fetch(url)
//       .then(response => response.json())
//       .then(data => {
//         if (data.features.length > 0) {
//           const cour_appel = data.features[0].properties.num_ca;
//           console.log("Code du cours d'appel sélectionné :", cour_appel);

//           // Mise à jour du filtre sur la couche commune
//           const communeSource = commune.getSource();
//           communeSource.updateParams({
//             'CQL_FILTER': `n_ca='${cour_appel}'`
//           });
//         }
//       })
//       .catch(error => console.error('Erreur lors de la récupération des données:', error));
//   }
// });


// // ============== Gestion de l'événement survol pour filtrer les communes ================
map.on('pointermove', function (evt) {
  const viewResolution = map.getView().getResolution();
  const wmsSource = cour_appel.getSource();
  const url = wmsSource.getFeatureInfoUrl(
    evt.coordinate,
    viewResolution,
    'EPSG:3857',
    { 'INFO_FORMAT': 'application/json' }
  );

  if (url) {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.features.length > 0) {
          const courAppelCode = data.features[0].properties.num_ca;
          console.log("Survol de la cour d'appel :", courAppelCode);

          // Mise à jour du filtre pour afficher uniquement les communes dans la cour d'appel
          const communeSource = commune.getSource();
          communeSource.updateParams({
            'CQL_FILTER': `n_ca='${courAppelCode}'`
          });

          commune.setVisible(true); // S'assurer que la couche est bien visible
        } else {
          commune.setVisible(false); // Masquer la couche si aucune cour d'appel n'est détectée
        }
      })
      .catch(error => console.error('Erreur lors de la récupération des données:', error));
  }
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

// document.getElementById('btn-close-layer-panel').addEventListener('click', function() {
//   document.getElementById('content-layer-panel').style.display = 'none';
// });


// Bouton d'affichage et masquage de l'onglet info
const toggleButton = document.getElementById('toggle-size-button');
const ongletInfo = document.getElementById('info-panel-overlay');
const toggleImg = document.getElementById('toggle-img');

// Initialiser l'image en fonction de l'état par défaut
if (ongletInfo.classList.contains('reduit')) {
  toggleImg.src = 'img/prev.png'; // Image pour l'état réduit
} else {
  toggleImg.src = 'img/next.png'; // Image pour l'état normal
}

toggleButton.addEventListener('click', () => {
  if (ongletInfo.style.display === 'none' || ongletInfo.style.display === '') {
    ongletInfo.style.display = 'block';
    toggleImg.src = 'img/prev.png'; // Image pour l'état affiché
  } else {
    ongletInfo.style.display = 'none';
    toggleImg.src = 'img/next.png'; // Image pour l'état masqué
  }
});


// Afficher les onglet d'information 
function toggleDiv(buttonId, divId, otherDivIds) {
  document.getElementById(buttonId).addEventListener('click', function() {
      const div = document.getElementById(divId);
      const otherDivs = otherDivIds.map(id => document.getElementById(id));
      
      // Fermer les autres divs
      otherDivs.forEach(otherDiv => {
          otherDiv.style.display = 'none';
      });
      
      // Ouvrir la div actuelle
      div.style.display = 'block';
  });
}

// Utilisation de la fonction générique pour les boutons
toggleDiv('button-text', 'text-info', ['stat-info', 'stat-list']);
toggleDiv('button-stat', 'stat-info', ['text-info', 'stat-list']);
toggleDiv('button-list', 'stat-list', ['text-info', 'stat-info'])

document.addEventListener("DOMContentLoaded", function () {
  const buttons = document.querySelectorAll(".button-info");
  const sections = document.querySelectorAll(".view-info");

  buttons.forEach((button, index) => {
    button.addEventListener("click", function () {
      // Supprimer la classe active de tous les boutons
      buttons.forEach(btn => btn.classList.remove("active"));
      
      // Ajouter la classe active au bouton cliqué
      this.classList.add("active");

      // Masquer toutes les sections
      sections.forEach(section => section.style.display = "none");

      // Afficher la section correspondante
      sections[index].style.display = "block";
    });
  });
});


// ========================================================================================
// ====================== Intégration du widget IGN de recherche  ========================= 
// ========================================================================================

// Creation du controle
var searchControl = new ol.control.SearchEngine({
});

// Ajout à la carte
map.addControl(searchControl);
var title_layer_panel = document.getElementById("title-layer-panel");
title_layer_panel.innerHTML = "<p> Extension OL version " + Gp.olExtVersion + " (" + Gp.olExtDate + ")</p>";