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
// const point_justice_vec = new VectorSource({
//   format: new GeoJSON(),
//   url: 'http://localhost:8090/geoserver/data_point_justice/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=data_point_justice:point_justice&outputFormat=application/json',
//   crossOrigin: 'anonymous' // Pour éviter les erreurs CORS
// });

// const vecteur_pj = new VectorLayer({
//   source: point_justice_vec
// });

const point_justice_vec = new ol.source.Vector({
  format: new ol.format.GeoJSON(),
  url: function(extent) {
    return 'http://localhost:8090/geoserver/data_point_justice/ows?' +
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
// commune, prudhomme, trib_judiciaire, cour_appel,
const map = new Map({
  target: 'map',
  controls: [scaleline], // Pour ajouter l'echelle 
  layers: [ couche_osm,  vecteur_point_justice],
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

    // Ajouter une deuxieme filtrage 2  par type 
    // let Listtype = document.querySelector('ul#list-type')
    // const frag1 = document.createDocumentFragment();
    // const equipement = new Set();
    // DataEquipements.forEach((equip) => {
    //     if (!equipement.has(equip.type)){
    //         const liequip = document.createElement('li')
    //         const textEl = document.createElement('span');
    //         // Création de  l'élément switch
    //         const switchInput = document.createElement('input');
    //         switchInput.type = 'checkbox';
    //         switchInput.id = `switch-${equip.type}`;
    //         switchInput.dataset.type = equip.type;
    //         textEl.innerText = equip.type;

    //         const switchLabel = document.createElement('label');
    //         switchLabel.htmlFor = switchInput.id;
    //         switchLabel.appendChild(switchInput);
    //         switchLabel.appendChild(textEl);
            
    //         // Ajouter le switch et le texte à l'élément <li>
    //         liequip.appendChild(switchInput);
    //         liequip.appendChild(switchLabel);
    //         liequip.dataset.lat = equip.lat
    //         liequip.dataset.lon = equip.lon
    //         frag1.appendChild(liequip);
    //         equipement.add(equip.type);

    //     }
    // });
    // Listtype.appendChild(frag1);



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
            if (event.target !== switchInput) {
                switchInput.checked = !switchInput.checked;
                switchInput.dispatchEvent(new Event('change')); // Déclencher l'événement de changement
            }
        });

        // Gestion du filtrage
        switchInput.addEventListener('change', function () {
            filterPointsJustice();
        });

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
  positioning: 'top-center',
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
    if (intitule) {
      popupElement.innerHTML = `<b>${intitule}</b>`;
      popup.setPosition(event.coordinate);
      popupElement.style.display = 'block';
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

// Fonction pour afficher les points les plus proches
function displayClosestPoints(closestPoints) {
  const tableBody = $('#closest-points-table tbody');
  tableBody.empty(); // Vider le contenu précédent

  closestPoints.forEach(point => {
    const row = $('<tr>').append(
      $('<td>').text(point.name),
      $('<td>').text(point.distance + ' km')
    );
    tableBody.append(row); // Ajouter la ligne au corps du tableau
  });
}

//fonction pour le calcul des points les plus proches 
function calculateDistance(point1, point2) {
  // Vérifiez que les points sont des tableaux avec deux éléments
  if (!Array.isArray(point1) || point1.length !== 2 || 
      !Array.isArray(point2) || point2.length !== 2) {
    console.error("Invalid coordinates:", point1, point2);
    return Infinity; // retourne une distance infinie en cas d'erreur
  }
  
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;
  
  // Distance euclidienne (approximation)
  const distanceInMeters = Math.sqrt(Math.pow(lon2 - lon1, 2) + Math.pow(lat2 - lat1, 2));
  
  // Convertir en kilomètres
  return (distanceInMeters * 111) // 1 degré ≈ 111 km
    .toFixed(1); // Formater à une décimale
}

function searchLocation(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
  
  $.get(url, function(data) {
    if (data.length > 0) {
      const firstResult = data[0];
      const coordinates = [parseFloat(firstResult.lon), parseFloat(firstResult.lat)];

      // Centrer la carte sur le lieu trouvé
      map.getView().setCenter(ol.proj.fromLonLat(coordinates));
      map.getView().setZoom(15);

      // Supprimer l'ancien marqueur s'il existe
      if (locationLayer !== null) {
        map.removeLayer(locationLayer);
        console.log("Ancien marqueur supprimé");
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

      // Créer une nouvelle source vectorielle
      const locationSource = new ol.source.Vector({
        features: [location]
      });

      // Affecter la nouvelle couche à la variable globale
      locationLayer = new ol.layer.Vector({
        source: locationSource
      });

      // Ajouter la couche à la carte
      map.addLayer(locationLayer);
      
      // Trouver les 5 points les plus proches
      const closestPoints = findClosestPoints(coordinates, point_justice_vec.getFeatures(), 5);
      console.log("5 points les plus proches :", closestPoints);

      // Afficher les points les plus proches dans la div
      displayClosestPoints(closestPoints);

    } else {
      alert("Aucun résultat trouvé.");
    }
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

function findClosestPoints(targetCoordinates, features, n) {
  const distances = features.map(feature => {
    const coords = feature.getGeometry().getCoordinates();

    // Vérifiez le format des coordonnées
    if (!Array.isArray(coords) || coords.length < 2) {
      console.error("Invalid geometry coordinates:", coords);
      return null; // Ignore les features invalides
    }

    return {
      name: feature.getProperties().name || "Unknown",
      coordinates: coords,
      distance: calculateDistance(targetCoordinates, coords)
    };
  }).filter(item => item !== null); // Filtrer les éléments invalides

  // Trier les distances par distance croissante
  distances.sort((a, b) => a.distance - b.distance);

  // Retourner les n points les plus proches
  return distances.slice(0, n);
}
