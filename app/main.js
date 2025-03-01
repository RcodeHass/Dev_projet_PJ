// Les imports pour lui dire j'ai besoin de cette app de cette objet ect. 
import './style.css';
import {Map, View} from 'ol';
import { fromLonLat } from 'ol/proj';
import { ImageWMS } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style.js';
import ScaleLine from 'ol/control/ScaleLine.js' //pour ajouter l'echelle 


// Je sors la couche OSM de l’objet Map pour la stocker dans une variable
const scaleline = new ScaleLine(); //On appelle ici le scale 
const couche_osm = new TileLayer({ source: new OSM() });

const positronLayer = new TileLayer({
  source: new XYZ({
    url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
  })
});

// =========================================================================================
// ================================= Import de mes 3 couches wms ===========================
// =========================================================================================
// ============== Charger la couche WFS des points de justice ================
// const point_justice_vec = new VectorSource({
//   format: new GeoJSON(),
//   url: 'http://localhost:8090/geoserver/data_point_justice/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=data_point_justice:point_justice&outputFormat=application/json',
//   crossOrigin: 'anonymous' // Pour éviter les erreurs CORS
// });

// const vecteur_pj = new VectorLayer({
//   source: point_justice_vec
// });
var geoserversUrl = 'http://localhost:8090'

const point_justice_vec = new ol.source.Vector({
  format: new ol.format.GeoJSON(),
  url: function(extent) {
    return geoserversUrl + '/geoserver/data_point_justice/ows?' + 
           'service=WFS&version=1.0.0&request=GetFeature&typeName=data_point_justice:point_justice' +
           '&outputFormat=application/json&bbox=' + extent.join(',') + ',EPSG:3857';
  },
  strategy: ol.loadingstrategy.bbox, // Charge les données par tuiles
  crossOrigin: 'anonymous' // Évite les erreurs CORS
});

const categorieColors = {
  "Pérmanences": "red",
  "Autre": "gray",
  "Maisons": "blue",
  "Mairie": "green",
  "Etablissement": "purple",
  "Associations": "orange"
};

// Fonction de style dynamique
const pointJusticeStyleFunction = function (feature) {
  const categorie = feature.get('categorie'); // Récupère la valeur du champ "categorie"
  const color = categorieColors[categorie] || "black"; // Couleur par défaut si non définie

  return new ol.style.Style({
    image: new ol.style.Circle({
      radius: 4,//Taille du point
      fill: new ol.style.Fill({ color: color }),
      stroke: new ol.style.Stroke({ color: 'white', width: 2 }) // Contour blanc pour bien voir le point
    })
  });
};

// Création de la couche vecteur avec un style dynamique
const vecteur_point_justice = new ol.layer.Vector({
  source: point_justice_vec,
  style: pointJusticeStyleFunction
});


// =========================================================================================
// ================================= Import de mes 3 couches wms ===========================
// =========================================================================================

// =========== Impoter la couche Point de justice ================
const pt_justice = new ImageLayer({
  source: new ImageWMS({
    url: geoserversUrl + '/geoserver/data_point_justice/wms',
    params: {'LAYERS' : 'data_point_justice:point_justice'
    },
    serverType: 'geoserver',
  }),
});

// // =========== Impoter la couche Point de justice en vecteur ================
// const vecteur_pj = new VectorSource({
//   format: new GeoJSON(),
//   url: geoserversUrl + '/geoserver/data_point_justice/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=data_point_justice:point_justice&maxFeatures=50&outputFormat=application/json',
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
    url: geoserversUrl + '/geoserver/data_point_justice/wms',
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
    url: geoserversUrl + '/geoserver/data_point_justice/wms',
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
    url: geoserversUrl + '/geoserver/data_point_justice/wms',
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
    url: geoserversUrl + '/geoserver/data_point_justice/wms',
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
// commune, prudhomme, trib_judiciaire, cour_appel,
const map = new Map({
  target: 'map',
  controls: [scaleline], // Pour ajouter l'echelle 
  layers: [ 
    couche_osm,
    positronLayer,
    commune,
    prudhomme,
    trib_judiciaire,
    cour_appel,
    vecteur_point_justice, 
  ],
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
    vecteur_point_justice.setVisible(true);
  } else {
    // On fait des trucs quand la checkbox n’est PAS checkée
    vecteur_point_justice.setVisible(false);
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

// Fonction pour passer de l'onglet de base à l'onglet avancé
document.getElementById('basic-button').addEventListener('click', function() {
  document.getElementById('list-indicateur-panel').style.display = 'none';
  document.getElementById('control-couches').style.display = 'none';
  document.getElementById('button-stat').style.display = 'none';
  document.getElementById('stat-info').style.display = 'none';
});

document.getElementById('advanced-button').addEventListener('click', function() {
  document.getElementById('list-indicateur-panel').style.display = 'block';
  document.getElementById('control-couches').style.display = 'block';
  document.getElementById('button-stat').style.display = 'block';
});


// ========================================================================================
// ============ Fonctions gestion des couche de découpage administratif ================== 
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
// map.on('pointermove', function (evt) {
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
//           const courAppelCode = data.features[0].properties.num_ca;
//           console.log("Survol de la cour d'appel :", courAppelCode);

//           // Mise à jour du filtre pour afficher uniquement les communes dans la cour d'appel
//           const communeSource = commune.getSource();
//           communeSource.updateParams({
//             'CQL_FILTER': `n_ca='${courAppelCode}'`
//           });

//           commune.setVisible(true); // S'assurer que la couche est bien visible
//         } else {
//           commune.setVisible(false); // Masquer la couche si aucune cour d'appel n'est détectée
//         }
//       })
//       .catch(error => console.error('Erreur lors de la récupération des données:', error));
//   }
// });

// ========================================================================================
// ==========================  Fonctions filtrage des points  =========================== 
// ========================================================================================

// Fonction pour récupérer et afficher les types depuis GeoServer
// Sélection des listes où afficher les types et catégories
const Listtype = document.querySelector('ul#list-type');
const Listcategorie = document.querySelector('ul#list-categorie');

const equipementsType = new Set();
const equipementsCategorie = new Set();

const fragType = document.createDocumentFragment();
const fragCategorie = document.createDocumentFragment();

// Fonction générique pour créer un switch dans une liste donnée
function createFilterItem(value, listSet, frag) {
    if (!listSet.has(value)) {
        listSet.add(value);

        // Création du switch (checkbox)
        const switchInput = document.createElement('input');
        switchInput.type = 'checkbox';
        switchInput.checked = true; // Par défaut, activé
        switchInput.dataset.filterValue = value;
        switchInput.classList.add("switch-checkbox");

        // Conteneur du switch stylisé
        const switchLabel = document.createElement('label');
        switchLabel.classList.add("switch");
        switchLabel.appendChild(switchInput);
        const switchSlider = document.createElement('span');
        switchSlider.classList.add("slider");
        switchLabel.appendChild(switchSlider);

        // Création de l'élément texte
        const textEl = document.createElement('span');
        textEl.innerText = value;
        textEl.classList.add("filter-text");

        // Création de l'élément <li> (cliquable)
        const li = document.createElement('li');
        li.classList.add("filter-item");
        li.dataset.filterValue = value;

        // Ajout des éléments au <li>
        li.appendChild(switchLabel);
        li.appendChild(textEl);

        // Rendre tout le <li> cliquable
        li.addEventListener('click', function (event) {
            if (event.target !== switchInput && event.target !== switchLabel && event.target !== switchSlider) {
                switchInput.checked = !switchInput.checked;
                switchInput.dispatchEvent(new Event('change')); // Déclencher l'événement de changement
            }
        });

        // Gestion du filtrage
        switchInput.addEventListener('change', debounce(() => {
            filterPointsJustice();
            afficherPointsJusticeDansEmpriseEcran();
        }, 300));

        // Ajout au fragment
        frag.appendChild(li);
    }
}

// Récupération et affichage des types et catégories
point_justice_vec.on('change', function () {
    if (point_justice_vec.getState() === 'ready') {
        const features = point_justice_vec.getFeatures();

        features.forEach((feature) => {
            const type_pj = feature.get('type_pj'); // Récupération du champ type
            const categorie = feature.get('categorie'); // Récupération du champ catégorie

            if (type_pj) {
                createFilterItem(type_pj, equipementsType, fragType);
            }
            if (categorie) {
                createFilterItem(categorie, equipementsCategorie, fragCategorie);
            }
        });

        // Ajout des listes complètes aux éléments <ul>
        Listtype.appendChild(fragType);
        Listcategorie.appendChild(fragCategorie);
    }
});

// Fonction pour filtrer les points affichés
function filterPointsJustice() {
    const checkedTypes = new Set();
    const checkedCategories = new Set();

    // Récupère les valeurs cochées pour les types
    document.querySelectorAll('#list-type input[type="checkbox"]:checked')
        .forEach(input => checkedTypes.add(input.dataset.filterValue));

    // Récupère les valeurs cochées pour les catégories
    document.querySelectorAll('#list-categorie input[type="checkbox"]:checked')
        .forEach(input => checkedCategories.add(input.dataset.filterValue));

    // Applique le filtre sur les points de la carte
    point_justice_vec.getFeatures().forEach((feature) => {
        const type_pj = feature.get('type_pj');
        const categorie = feature.get('categorie');

        // Vérifie si le type et la catégorie sont sélectionnés
        const visible = checkedTypes.has(type_pj) && checkedCategories.has(categorie);
        feature.setStyle(visible ? null : new ol.style.Style({ display: 'none' }));
    });
}

// Fonction de debounce pour limiter la fréquence des appels
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Appeler la fonction de filtrage initialement
filterPointsJustice();

// Fonction pour afficher dynamiquement les points visibles sur la carte
function afficherPointsJusticeDansEmpriseEcran() {
  const extent = map.getView().calculateExtent(map.getSize()); // Récupère l'étendue visible
  const features = point_justice_vec.getFeatures(); // Récupère toutes les features de la source
  const listElement = document.getElementById('list-pj');
  listElement.innerHTML = ''; // Vider la liste existante

  let pointsAffiches = 0;

  const checkedTypes = new Set();
  const checkedCategories = new Set();

  // Récupère les valeurs cochées pour les types
  document.querySelectorAll('#list-type input[type="checkbox"]:checked')
      .forEach(input => checkedTypes.add(input.dataset.filterValue));

  // Récupère les valeurs cochées pour les catégories
  document.querySelectorAll('#list-categorie input[type="checkbox"]:checked')
      .forEach(input => checkedCategories.add(input.dataset.filterValue));

  features.forEach(feature => {
    const point = feature.getGeometry().getCoordinates();
    const type_pj = feature.get('type_pj');
    const categorie = feature.get('categorie');

    if (ol.extent.containsCoordinate(extent, point) && checkedTypes.has(type_pj) && checkedCategories.has(categorie)) {
      const intitule = feature.get('intitule') || 'Sans intitulé'; // Vérifie que l'attribut existe

      // Création de l'élément de la liste
      const listItem = document.createElement('li');
      listItem.textContent = `📍 ${intitule}`;
      listItem.style.cursor = 'pointer'; // Curseur en pointeur pour indiquer qu'il est cliquable

      // Ajout d'un événement de clic pour zoomer et afficher le popup
      listItem.addEventListener('click', function () {
        map.getView().animate({ center: point, zoom: 10, duration: 800 }); // Zoom sur le point
        
        // Récupération des infos du point
        const adresse = feature.get('adresse') || 'Adresse inconnue';
        const codgeo = feature.get('codgeo') || '';
        const telephone = feature.get('telephone') || 'Non disponible';

        // Mise à jour du popup
        document.getElementById('text-info').innerHTML = `
          <div class="info-item"><b>Intitulé:</b> ${intitule}</div>
          <div class="info-item"><b>Catégorie:</b> ${categorie}</div>
          <div class="info-item"><b>Adresse:</b> ${adresse} ${codgeo}</div>
          <div class="info-item"><b>Téléphone:</b> ${telephone}</div>
        `;
        
        popupElement.innerHTML = `<b>${intitule}</b>`;
        popup.setPosition(point);
        popupElement.style.display = 'block';
      });

      listElement.appendChild(listItem);
      pointsAffiches++;
    }
  });

  // Afficher ou masquer la liste en fonction des points visibles
  document.getElementById('list-pj').style.display = pointsAffiches > 0 ? 'block' : 'none';
}

// Mise à jour dynamique lors des interactions de la carte
map.on('moveend', afficherPointsJusticeDansEmpriseEcran);
map.on('loadend', afficherPointsJusticeDansEmpriseEcran); // Exécute aussi au chargement initial
// ========================================================================================
// ===============================  Fonctions accésoires  =============================== 
// ========================================================================================

// Bouton d'affichage et masquage de l'onglet gestion des couches
document.getElementById('btn-layer-panel').addEventListener('click', function() {
  var contentPanel = document.getElementById('content-layer-panel');
  if (contentPanel.style.display === 'none' || contentPanel.style.display === '') {
      contentPanel.style.display = 'block';
      contentPanel.style.zIndex = '1';
  } else {
      contentPanel.style.display = 'none';
      contentPanel.style.zIndex = '';
  }
});

document.getElementById('btn-close-layer-panel').addEventListener('click', function() {
  var contentPanel = document.getElementById('content-layer-panel');
  contentPanel.style.display = 'none';
  contentPanel.style.zIndex = '';
});

// document.getElementById('btn-close-layer-panel').addEventListener('click', function() {
//   document.getElementById('content-layer-panel').style.display = 'none';
// });


// Bouton d'affichage et masquage de l'onglet info
const toggleButton = document.getElementById('toggle-size-button');
const ongletInfo = document.getElementById('info-panel-overlay');
const toggleImg = document.getElementById('toggle-img');
const onglettext = document.getElementById('text-info');
const ongletstat = document.getElementById('stat-info');
const ongletlist = document.getElementById('list-info');

// Initialiser l'image en fonction de l'état par défaut
if (ongletInfo.classList.contains('reduit')) {
  toggleImg.src = 'img/next.png'; // Image pour l'état réduit
} else {
  toggleImg.src = 'img/prev.png'; // Image pour l'état normal
}

toggleButton.addEventListener('click', () => {
  if (ongletInfo.style.display === 'none' || ongletInfo.style.display === '') {
    ongletInfo.style.display = 'block';
    onglettext.style.display = 'block';
    ongletstat.style.display = 'none';
    ongletlist.style.display = 'none';

    toggleImg.src = 'img/next.png'; // Image pour l'état affiché
  } else {
    ongletInfo.style.display = 'none';
    toggleImg.src = 'img/prev.png'; // Image pour l'état masqué
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
// ===============================  Fonctions onglet information  =============================== 
// ========================================================================================

// Création du popup
const popupElement = document.createElement('div');
popupElement.id = 'popup';
popupElement.style.position = 'absolute';
popupElement.style.background = 'white';
popupElement.style.padding = '5px';
popupElement.style.border = '1px solid black';
popupElement.style.borderRadius = '5px';
popupElement.style.display = 'none';
document.body.appendChild(popupElement);

const popup = new ol.Overlay({
  element: popupElement,
  positioning: 'bottom-center', // Positionnement du popup
  stopEvent: false,
  offset: [0, -10] // Décalage pour ne pas masquer le point
});
map.addOverlay(popup);

// Gestion du clic sur la carte
map.on('click', function (event) {
  const feature = map.forEachFeatureAtPixel(event.pixel, function (feat) {
    return feat;
  });

  if (feature) {
    const intitule = feature.get('intitule'); // Récupère l'intitulé du point
    const categorie = feature.get('categorie'); // Récupère la catégorie du point
    const adresse = feature.get('adresse'); // Récupère l'adresse du point
    const codgeo = feature.get('codgeo'); // Récupère le téléphone du point
    const telephone = feature.get('telephone'); // Récupère le téléphone du point
    if (intitule) {

      document.getElementById('text-info').innerHTML = `
        <div class="info-item"><b>Intitulé:</b> ${intitule}</div>
        <div class="info-item"><b>Catégorie:</b> ${categorie}</div>
        <div class="info-item"><b>Adresse:</b> ${adresse} ${codgeo} </div>
        <div class="info-item"><b>Téléphone:</b> ${telephone}</div>
      `;
      
      popupElement.innerHTML = `<b>${intitule}</b>`;
      popup.setPosition(event.coordinate);
      popupElement.style.display = 'block';
      popupElement.style.border = '';
    }
  } else {
    popupElement.style.display = 'none';
  }
});

// ========================================================================================
// ====================== Intégration du widget d'adressage  ==============================
//  =====================   Intégration des 5 plus proches   ==============================
// ========================================================================================
// Déclare locationLayer globalement afin de pouvoir supprimer les points de anciennes recherches
let locationLayer = null; 

function displayClosestPoints(closestPoints) {
  const tableBody = $('#closest-points-table tbody');
  tableBody.empty(); // Supprimer les anciennes lignes

  if (closestPoints.length === 0) {
    tableBody.append('<tr><td colspan="2">Aucun point trouvé</td></tr>');
    return;
  }

  closestPoints.forEach(point => {
    const row = $('<tr>').append(
      $('<td>').text(point.name),
      $('<td>').text(point.distance + ' km')
    );
    tableBody.append(row);
  });
}

// Déclarez la fonction calculateDistance
function calculateDistance(point1, point2) {
  // Vérifiez que les points sont des tableaux avec deux éléments
  if (!Array.isArray(point1) || point1.length !== 2 ||
      !Array.isArray(point2) || point2.length !== 2) {
    console.error("Coordonnées invalides:", point1, point2);
    return Infinity; // retourne une distance infinie en cas d'erreur
  }

  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;

  // Utilisation de la formule de Haversine pour une meilleure précision
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance.toFixed(1); // Formater à une décimale
}

// Assurez-vous que la source est chargée avant de l'utiliser
point_justice_vec.on('featuresloadend', function() {
  console.log("Données POI chargées:", point_justice_vec.getFeatures().length);
});

function findClosestPoints(targetCoordinates, n) {
  const features = point_justice_vec.getFeatures(); // Récupérer les entités depuis la source
  
  const distances = features.map(feature => {
    const coords = feature.getGeometry().getCoordinates();

    // Vérifie le format des coordonnées
    if (!Array.isArray(coords) || coords.length < 2) {
      console.error("Coordonnées de géométrie invalides:", coords);
      return null; // Ignore les entités invalides
    }

    // Récupérer les valeurs attributaires
    const properties = feature.getProperties();
    
    return {
      name: properties.name || "Inconnu",  // Assurez-vous que la propriété 'name' existe
      coordinates: coords,
      distance: calculateDistance(targetCoordinates, ol.proj.toLonLat(coords)) // Correction ici
    };
  }).filter(item => item !== null); // Filtrer les éléments invalides

  // Trier les distances par ordre croissant
  distances.sort((a, b) => a.distance - b.distance);

  // Retourner les n points les plus proches
  return distances.slice(0, n);
}

// Exemple d'utilisation après avoir recherché un lieu
function searchLocation(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

  $.get(url, function(data) {
    if (data.length > 0) {
      const firstResult = data[0];
      const coordinates = [parseFloat(firstResult.lon), parseFloat(firstResult.lat)];

      // Centrer la carte sur le lieu trouvé
      map.getView().setCenter(ol.proj.fromLonLat(coordinates));
      map.getView().setZoom(15);

      // Mettre à jour le marqueur existant ou en créer un nouveau
      if (locationLayer === null) {
        locationLayer = new ol.layer.Vector({
          source: new ol.source.Vector()
        });
        map.addLayer(locationLayer);
      } else {
        locationLayer.getSource().clear();
      }

      // Ajouter un marqueur
      const location = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat(coordinates))
      });

      // Créer un style pour le marqueur avec un fichier local
      const locationStyle = new ol.style.Style({
        image: new ol.style.Icon({
          src: './img/localisation.png',
          scale: 0.1,
          anchor: [0.5, 1]
        })
      });

      // Appliquer le style au marqueur
      location.setStyle(locationStyle);

      // Ajouter le marqueur à la source de la couche
      locationLayer.getSource().addFeature(location);

      // Trouver les 5 points les plus proches
      const closestPoints = findClosestPoints(coordinates, 5);
      console.log("5 points les plus proches :", closestPoints);

      // Afficher les points les plus proches dans la div
      displayClosestPoints(closestPoints);


    } else {
      alert("Aucun résultat trouvé.");
    }
  }).fail(function() {
    alert("Erreur lors de la recherche du lieu. Veuillez réessayer.");
  });
}


// Événement sur le bouton de recherche
$('#searchButton').on('click', function() {
  const query = $('#search').val();
  if (query) {
    searchLocation(query);
    } else {
    alert("Veuillez entrer un lieu à rechercher.");
    }
});

      // Événement sur la barre de recherche pour valider avec Entrée
$('#search').on('keypress', function(e) {
 if (e.which === 13) { // Touche Entrée
  const query = $(this).val();
  if (query) {
    searchLocation(query);
    }
  }
});

