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
// ================================= Import des point de justice wfs ===========================
// =========================================================================================
// ============== Charger la couche WFS des points de justice ================

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

// Dictionnaire des icônes par type de point de justice
const categorieIcons = {
  "France Service": "img/FS.png",
  "Autre": "img/logo.png",
  "Spécialiste hors FS": "img/S.png",
  "Domaine juridique": "img/D.png",
  "Généraliste hors FS": "img/G.png"
};

// Fonction de style dynamique
const pointJusticeStyleFunction = function (feature) {
  const categorie = feature.get('type_pj'); // Récupère la valeur du champ "categorie"
  const iconSrc = categorieIcons[categorie] || "img/Divers.png"; // Icône par défaut si non définie

  return new ol.style.Style({
    image: new ol.style.Icon({
      src: iconSrc,
      scale: 0.02 // Ajustez la taille des icones
    })
  });
};

// Création de la couche vecteur avec un style dynamique
const vecteur_point_justice = new ol.layer.Vector({
  source: point_justice_vec,
  style: pointJusticeStyleFunction
});

// ========================================================================================
// ============================ Import de mes 3 couches ws ============================== 
// ========================================================================================

// =======================================================================================
// Fonction pour calculer les classes de Jenks 
const calculateJenksClassesForLayer = (source, indicator, numClasses = 5) => {
  const values = source.getFeatures()
    .map(f => parseFloat(f.get(indicator)))
    .filter(v => !isNaN(v))
    .sort((a, b) => a - b);

  if (values.length < numClasses) return values; // Sécurité si peu de valeurs

  const jenksClasses = [];
  for (let i = 1; i <= numClasses; i++) {
    jenksClasses.push(values[Math.floor(i * values.length / numClasses) - 1]);
  }
  return jenksClasses;
};

// Fonction pour appliquer un style dynamique basé sur un indicateur donné
const applyJenksStyleToLayer = (layer, source, indicator, colorScale, threshold = 42) => {
  if (source.getState() !== 'ready') return;

  const jenksClasses = calculateJenksClassesForLayer(source, indicator);

  const getJenksColor = (value) => {
    for (let i = 0; i < jenksClasses.length; i++) {
      if (value <= jenksClasses[i]) return colorScale[i];
    }
    return colorScale[colorScale.length - 1];
  };

  layer.setStyle((feature) => {
    const taux = parseFloat(feature.get(indicator)) || 0;
    return new Style({
      fill: new Fill({ color: getJenksColor(taux) }),
      stroke: new Stroke({ color: 'black', width: 0.2 })
    });
  });
};

// Palettes de couleurs pour chaque indicateur
const colorsPartFmp = [
  'rgba(255, 255, 204, 0.8)', // Jaune clair
  'rgba(255, 204, 153, 0.8)', // Orange clair
  'rgba(255, 153, 102, 0.8)', // Orange moyen
  'rgba(255, 102, 51, 0.8)',  // Rouge clair
  'rgba(204, 0, 0, 0.8)'      // Rouge foncé
];

const colorsnb_victime_1000 = [
  'rgba(255, 204, 255, 0.8)', // Pourpre clair
  'rgba(255, 153, 255, 0.8)', // Pourpre moyen clair
  'rgba(204, 102, 204, 0.8)', // Pourpre moyen
  'rgba(153, 51, 153, 0.8)',  // Pourpre foncé
  'rgba(102, 0, 102, 0.8)'    // Pourpre très foncé
];

const colorstaux_chomage = [
  'rgba(204, 229, 255, 0.8)', // Bleu clair
  'rgba(153, 204, 255, 0.8)', // Bleu moyen clair
  'rgba(102, 178, 255, 0.8)', // Bleu moyen
  'rgba(51, 153, 255, 0.8)',  // Bleu foncé
  'rgba(0, 102, 204, 0.8)'    // Bleu très foncé
];

const colorsMoyenAge = [
  'rgba(255, 182, 193, 0.8)', // Rose clair
  'rgba(255, 105, 180, 0.8)', // Rose moyen
  'rgba(255, 0, 255, 0.8)',   // Magenta
  'rgba(0, 191, 255, 0.8)',   // Bleu clair
  'rgba(0, 0, 255, 0.8)'      // Bleu foncé
];

const colorsTauxPauvrete = [
  'rgba(204, 255, 204, 0.8)', // Vert clair
  'rgba(153, 255, 153, 0.8)', // Vert moyen
  'rgba(102, 204, 102, 0.8)', // Vert plus foncé
  'rgba(51, 153, 51, 0.8)',   // Vert foncé
  'rgba(0, 102, 0, 0.8)'      // Vert très foncé
];

// ========================================================================================
// Source WFS pour la couche cour d'appel
const courAppelSource = new VectorSource({
  format: new GeoJSON(),
  url: geoserversUrl + '/geoserver/data_point_justice/ows?'
    + 'service=WFS&version=1.0.0&request=GetFeature'
    + '&typename=data_point_justice:cour_appel'
    + '&outputFormat=application/json',
  crossOrigin: 'anonymous'
});

// Source WFS pour la couche tribunal judiciaire 
const tibunalJudiciaireSource = new VectorSource({
  format: new GeoJSON(),
  url: geoserversUrl + '/geoserver/data_point_justice/ows?'
    + 'service=WFS&version=1.0.0&request=GetFeature'
    + '&typename=data_point_justice:tribunal_judiciaire'
    + '&outputFormat=application/json',
  crossOrigin: 'anonymous'
});

// Source WFS pour la couche cour d'appel
const PrudhommeSource = new VectorSource({
  format: new GeoJSON(),
  url: geoserversUrl + '/geoserver/data_point_justice/ows?'
    + 'service=WFS&version=1.0.0&request=GetFeature'
    + '&typename=data_point_justice:prudhomme'
    + '&outputFormat=application/json',
  crossOrigin: 'anonymous'
});

// =========================================================================================
// ================================= Import des couche en wfs ===========================
// =========================================================================================

// ============== Impoter la couche commune ================
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
// import des couche en wfs dans le projet
const courAppelLayer = new VectorLayer({
  source: courAppelSource
});

// Couche vectorielle avec style initial
const tribunalJudiciaireLayer = new VectorLayer({
  source: tibunalJudiciaireSource
});

// Couche vectorielle avec style initial
const prudhommeLayer = new VectorLayer({
  source: PrudhommeSource
});

// ========================================================================================
// ===============================  On ajoute ici la carte =============================== 
// ========================================================================================
// Création de l’objet map avec appel aux couches
const map = new Map({
  target: 'map',
  controls: [scaleline], // Pour ajouter l'echelle 
  layers: [ 
    couche_osm,
    positronLayer,
    courAppelLayer,
    tribunalJudiciaireLayer,
    prudhommeLayer,
    commune,
    vecteur_point_justice, 
  ],
  view: new View({
    center: fromLonLat([4.385923767089852, 45.43798463466298]),
    zoom: 6
  })
});

courAppelLayer.setVisible(false);
tribunalJudiciaireLayer.setVisible(false);
prudhommeLayer.setVisible(false);

// ========================================================================================
// ===========================  Fonction  de basse de l'appli ============================ 
// ========================================================================================

// ======   fonction de d'ouverture de l'Onglet couches   ===========

document.getElementById("btn-layer-panel").addEventListener("click", function () {
  let layerContent = document.getElementById("layer-content");
  if (layerContent.style.display === "none" || layerContent.style.display === "") {
    layerContent.style.display = "block";
  } else {
    layerContent.style.display = "none";
  }
});

// ========   fonction de d'ouverture de l'Onglet info   ===========

document.addEventListener("DOMContentLoaded", function () {
  var infoPanel = document.getElementById("infoPanel");
  var toggleButton = document.getElementById("toggleButton");
  var toggleImg = toggleButton.querySelector("img"); // Récupère l'image du bouton

  function updateButton() {
    setTimeout(() => { 
      var panelWidth = infoPanel.offsetWidth;
      var panelOpen = infoPanel.classList.contains("show");

      // Déplacement du bouton
      if (panelOpen) {
        toggleButton.style.right = (panelWidth + 10) + "px";
        toggleImg.src = "img/next.png"; 
      } else {
        toggleButton.style.right = "10px";
        toggleImg.src = "img/prev.png"; 
      }
    }, 3); // Délai pour la transition
  }

  // Met à jour l'image et la position du bouton à l'ouverture/fermeture du panneau
  infoPanel.addEventListener("shown.bs.offcanvas", updateButton);
  infoPanel.addEventListener("hidden.bs.offcanvas", updateButton);

  // Initialisation au chargement
  updateButton();
});

// Fonction pour passer de l'onglet de avancée a l'onglet de basse
const activateBasicButton = () => {
  document.getElementById('list-categorie-panel').style.display = 'none';
  document.getElementById('control-couches').style.display = 'none';
  document.getElementById('tab-stat').style.display = 'none';
  document.getElementById('indicateur-panel').style.display = 'none';
  document.getElementById('tab-indicateur').style.display = 'none';

  // Masquer les couches contenant des indicateurs en mode Basic
  courAppelLayer.setVisible(false);
  tribunalJudiciaireLayer.setVisible(false);
  prudhommeLayer.setVisible(false);
};

// Ajouter l'événement au bouton "basic-button"
document.getElementById('basic-button').addEventListener('click', activateBasicButton);

// Activer le bouton "basic-button" par défaut au chargement du site
window.addEventListener('load', activateBasicButton);
const deactivateBasicButton = () => {
  document.getElementById('list-categorie-panel').style.display = 'block';
  document.getElementById('control-couches').style.display = 'block';
  document.getElementById('indicateur-panel').style.display = 'block';
  document.getElementById('tab-stat').style.display = 'block';
  document.getElementById('tab-indicateur').style.display = 'block';

  // Afficher la couche par défaut
  courAppelLayer.setVisible(true);

  /// Appliquer le style par défaut : "Taux de pauvreté"
  applyJenksStyleToLayer(courAppelLayer, courAppelLayer.getSource(), "taux_pauvrete", colorsTauxPauvrete);
};

// Ajouter l'événement au bouton "advanced-button"
document.getElementById('advanced-button').addEventListener('click', deactivateBasicButton);;

// // ========================================================================================
// // ====================== Fonctions d'intéraction avec les couches  ====================== 
// // ========================================================================================

// Fonction pour mettre à jour le style en fonction des cases cochées
const updateLayerStyles = () => {
  const selectedIndicator = document.querySelector('#list-indic input:checked')?.value || 'taux_pauvrete';

  let colorScale;
  switch (selectedIndicator) {
    case 'part_fmp': colorScale = colorsPartFmp; break;
    case 'nb_victime_1000': colorScale = colorsnb_victime_1000; break;
    case 'taux_chomage': colorScale = colorstaux_chomage; break;
    case 'age_moyen': colorScale = colorsMoyenAge; break;
    case 'taux_pauvrete': colorScale = colorsTauxPauvrete; break;
    default: return;
  }

  // Appliquer le style à la couche visible uniquement
  if (courAppelLayer.getVisible()) {
    applyJenksStyleToLayer(courAppelLayer, courAppelSource, selectedIndicator, colorScale);
  } else if (tribunalJudiciaireLayer.getVisible()) {
    applyJenksStyleToLayer(tribunalJudiciaireLayer, tibunalJudiciaireSource, selectedIndicator, colorScale);
  } else if (prudhommeLayer.getVisible()) {
    applyJenksStyleToLayer(prudhommeLayer, PrudhommeSource, selectedIndicator, colorScale);
  }
};

// Fonction pour afficher et masquer la couche point 
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

// Fonctions pour afficher et masquer la couche Cour d'appel
tribunalJudiciaireLayer.setVisible(false);
prudhommeLayer.setVisible(false);
document.querySelectorAll('input[name="layer-type"]').forEach((radio) => {
  radio.addEventListener("change", (event) => {
    if (event.target.id === "checkbox-cour_appel") {
      courAppelLayer.setVisible(true);
      tribunalJudiciaireLayer.setVisible(false);
      prudhommeLayer.setVisible(false);
    } else if (event.target.id === "checkbox-trib_judiciaire") {
      tribunalJudiciaireLayer.setVisible(true);
      courAppelLayer.setVisible(false);
      prudhommeLayer.setVisible(false);
    } else if (event.target.id === "checkbox-prudhomme") {
      prudhommeLayer.setVisible(true);
      courAppelLayer.setVisible(false);
      tribunalJudiciaireLayer.setVisible(false);
    }
    updateLayerStyles(); 
  });
});

// // ========================================================================================
// // ====================== Fonctions pour gérer les indicateur   ====================== 
// // ========================================================================================

// Récupérer les indicateurs à partir de l'une des sources
const getIndicatorsFromSource = (source) => {
  const features = source.getFeatures();
  if (features.length === 0) return [];

  const properties = features[0].getProperties();
  return Object.keys(properties).slice(3);
};

// Fonction pour créer des boutons radio au lieu de checkboxes
const createRadioList = (indicators) => {
  const list = document.getElementById('list-indic');
  list.innerHTML = '';

  indicators.forEach(indicator => {
    const listItem = document.createElement('li');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.id = indicator;
    radio.name = 'indicator';
    radio.value = indicator;
    radio.classList.add("form-check-input");
    
    if (indicator === 'taux_pauvrete') {
      radio.checked = true;
    }

    radio.addEventListener('change', updateLayerStyles);

    const label = document.createElement('label');
    label.htmlFor = indicator;
    label.appendChild(document.createTextNode(indicator));

    listItem.appendChild(radio);
    listItem.classList.add('form-check');
    listItem.appendChild(label);
    list.appendChild(listItem);
  });

  // Ajout du bouton radio "Aucun"
  const noneItem = document.createElement('li');
  const noneRadio = document.createElement('input');
  noneRadio.type = 'radio';
  noneRadio.id = 'aucun';
  noneRadio.name = 'indicator';
  noneRadio.value = 'aucun';
  noneRadio.classList.add("form-check-input");
  noneRadio.checked = false; // Défini par défaut

  noneRadio.addEventListener('change', updateLayerStyles);

  const noneLabel = document.createElement('label');
  noneLabel.htmlFor = 'aucun';
  noneLabel.appendChild(document.createTextNode('Aucun'));

  noneItem.appendChild(noneRadio);
  noneItem.classList.add('form-check');
  noneItem.appendChild(noneLabel);
  list.appendChild(noneItem);
};

// Initialisation de la liste de boutons radio après chargement de la source
courAppelSource.once('change', () => {
  if (courAppelSource.getState() === 'ready') {
    const indicators = getIndicatorsFromSource(courAppelSource);
    createRadioList(indicators);
    updateLayerStyles();
  }
});

// // ========================================================================================
// // ============ Fonctions gestion des couche de découpage administratif ================== 
// // ========================================================================================

// // ============== Écouteur de clic pour récupérer le code du cours d'appel ================

map.on("singleclick", function (evt) {
  let selectedCode = null;

  // Vérifier sur quelle couche l'utilisateur clique
  map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
    if (layer === courAppelLayer) {
      selectedCode = feature.get("num_ca");
    } else if (layer === tribunalJudiciaireLayer) {
      selectedCode = feature.get("num_tj");
    } else if (layer === prudhommeLayer) {
      selectedCode = feature.get("num_cph");
    }
  });

  if (selectedCode) {
    console.log("Code sélectionné :", selectedCode);

    // Appliquer le filtre CQL sur la couche commune WMS
    const communeSource = commune.getSource();
    communeSource.updateParams({
      "CQL_FILTER": `num_ca=${selectedCode} OR num_tj=${selectedCode} OR num_cph=${selectedCode}`
    });

    console.log("Filtre CQL appliqué :", `num_ca=${selectedCode} OR num_tj=${selectedCode} OR num_cph=${selectedCode}`);
  } else {
  }
});

// ========================== Légende =============================

const geoserverUrl = "http://localhost:8090/geoserver/wms";

// Nom de la couche et du style
const layerName = "data_point_justice:commune";
const styleName = "part_fmp";

// Construction de l'URL de la légende
const legendUrl = `${geoserverUrl}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${layerName}&STYLE=${styleName}`;

// Affectation à l'élément HTML
document.getElementById("legend-image1").src = legendUrl;

// ==========================  Fonctions filtrage des points  =========================== 

// Fonction pour récupérer et afficher les types depuis GeoServer
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
        switchInput.classList.add("form-check-input");

        // Création du label pour le switch
        const switchLabel = document.createElement('label');
        switchLabel.classList.add("form-check-label");
        switchLabel.appendChild(switchInput);
        switchLabel.appendChild(document.createTextNode(value));

        // Création de l'élément <li> (cliquable)
        const li = document.createElement('li');
        li.classList.add("form-check");
        li.dataset.filterValue = value;

        // Ajout des éléments au <li>
        li.appendChild(switchLabel);

        // Rendre tout le <li> cliquable
        li.addEventListener('click', function (event) {
            if (event.target !== switchInput && event.target !== switchLabel) {
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
  const center = ol.extent.getCenter(extent); // Récupère le centre de l'étendue visible
  const features = point_justice_vec.getFeatures(); // Récupère toutes les features de la source
  const listElement = document.getElementById('list-pj');
  listElement.innerHTML = ''; // Vider la liste existante

  const checkedTypes = new Set();
  const checkedCategories = new Set();

  // Récupère les valeurs cochées pour les types
  document.querySelectorAll('#list-type input[type="checkbox"]:checked')
      .forEach(input => checkedTypes.add(input.dataset.filterValue));

  // Récupère les valeurs cochées pour les catégories
  document.querySelectorAll('#list-categorie input[type="checkbox"]:checked')
      .forEach(input => checkedCategories.add(input.dataset.filterValue));

  // Filtrer les points visibles et calculer leur distance au centre
  const pointsVisibles = features
    .filter(feature => {
      const point = feature.getGeometry().getCoordinates();
      const type_pj = feature.get('type_pj');
      const categorie = feature.get('categorie');
      return ol.extent.containsCoordinate(extent, point) && checkedTypes.has(type_pj) && checkedCategories.has(categorie);
    })
    .map(feature => {
      const point = feature.getGeometry().getCoordinates();
      const distance = ol.sphere.getDistance(center, point);
      return { feature, distance };
    });

  // Trier les points par distance et sélectionner les 25 plus proches
  pointsVisibles.sort((a, b) => a.distance - b.distance);
  const pointsAffiches = pointsVisibles.slice(0, 25);

  // Afficher les points sélectionnés
  pointsAffiches.forEach(({ feature }) => {
    const point = feature.getGeometry().getCoordinates();
    const intitule = feature.get('intitule') || 'Sans intitulé'; // Vérifie que l'attribut existe

    // Création de l'élément de la liste
    const listItem = document.createElement('li');
    listItem.textContent = `📍 ${intitule}`;
    listItem.style.cursor = 'pointer'; // Curseur en pointeur pour indiquer qu'il est cliquable

    // Ajout d'un événement de clic pour zoomer et afficher le popup
    listItem.addEventListener('click', function () {
      map.getView().animate({ center: point, zoom: 14, duration: 800 }); // Zoom sur le point
      
      // Récupération des infos du point
      const adresse = feature.get('adresse') || 'Adresse inconnue';
      const codgeo = feature.get('codgeo') || '';
      const telephone = feature.get('telephone') || 'Non disponible';

      // Mise à jour du popup
      document.getElementById('info-pj').innerHTML = `
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
  });

  // Afficher ou masquer la liste en fonction des points visibles
  document.getElementById('list-pj').style.display = pointsAffiches.length > 0 ? 'block' : 'none';
}

// Mise à jour dynamique lors des interactions de la carte
map.on('moveend', afficherPointsJusticeDansEmpriseEcran);
map.on('loadend', afficherPointsJusticeDansEmpriseEcran);

// ===============================  Fonctions accésoires  =============================== 

// =======================  Création du popup  ================================

const popupElement = document.createElement('div');
popupElement.id = 'popup';
popupElement.style.position = 'absolute';
popupElement.style.width = 'auto';
popupElement.style.background = 'white';
popupElement.style.padding = '5px';
popupElement.style.border = '1px solid black';
popupElement.style.borderRadius = '5px';
popupElement.style.display = 'none';
popupElement.style.fontSize = '10px';
document.body.appendChild(popupElement);

const popup = new ol.Overlay({
  element: popupElement,
  positioning: 'bottom-center', // Positionnement du popup
  stopEvent: false,
  offset: [0, -40] // Décalage pour ne pas masquer le point
});
map.addOverlay(popup);

// Gestion du clic sur la carte
map.on('click', function (event) {
  const feature = map.forEachFeatureAtPixel(event.pixel, function (feat) {
    return feat;
  });

  if (feature) {
    const intitule = feature.get('intitule');
    const categorie = feature.get('categorie');
    const adresse = feature.get('adresse'); 
    const codgeo = feature.get('codgeo');
    const telephone = feature.get('telephone'); 
    if (intitule) {

      document.getElementById('info-pj').innerHTML = `
        <div class="info-item"><b>Intitulé:</b> ${intitule}</div>
        <div class="info-item"><b>Catégorie:</b> ${categorie}</div>
        <div class="info-item"><b>Adresse:</b> ${adresse} ${codgeo} </div>
        <div class="info-item"><b>Téléphone:</b> ${telephone}</div>
      `;
      
      popupElement.innerHTML = `<b>${intitule}</b>`;
      popup.setPosition(event.coordinate);
      popupElement.style.display = 'block';
    }
  } else {
    popupElement.style.display = 'none';
  }
});

// ========================================================================================
// ============ Fonctions gestion les graphes et infrormation statistique  ================ 
// ========================================================================================

// Fonction pour compter le nombre de tribunaux par type_pj
let tribunalChart; // Variable pour stocker le graphique

// Fonction pour compter les tribunaux par type dans une zone spécifique
function countTribunalsByTypeInZone(geometry) {
  const counts = {}; // Stocke le nombre d'occurrences par type

  point_justice_vec.forEachFeature(function (feature) {
    const type = feature.get('type_pj'); // Récupère la valeur du champ type_pj
    if (type && geometry.intersectsExtent(feature.getGeometry().getExtent())) {
      counts[type] = (counts[type] || 0) + 1;
    }
  });

  return counts;
}

// Fonction pour mettre à jour le graphe
function updateChart(counts) {
  const labels = Object.keys(counts); // Les types de tribunaux
  const data = Object.values(counts); // Nombre d'occurrences par type

  const ctx = document.getElementById('tribunalChart').getContext('2d');

  // Détruire l'ancien graphique s'il existe
  if (tribunalChart) {
    tribunalChart.destroy();
  }

  // Créer un nouveau graphique
  tribunalChart = new Chart(ctx, {
    type: 'bar', // Type de graphe (barres)
    data: {
      labels: labels,
      datasets: [{
        label: 'Nombre de tribunaux par type',
        data: data,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Attendre le chargement des données et afficher le graphe initial
point_justice_vec.once('change', function () {
  if (point_justice_vec.getState() === 'ready') {
    const counts = countTribunalsByTypeInZone(map.getView().calculateExtent(map.getSize()));
    updateChart(counts);
  }
});

map.on("click", function (evt) {
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    if (layer === courAppelLayer || layer === tribunalJudiciaireLayer || layer === prudhommeLayer) {
      const geom = feature.getGeometry(); // Géométrie de l'entité sélectionnée
      const counts = countTribunalsByTypeInZone(geom); // Compter les tribunaux dans la zone cliquée
      updateChart(counts); // Mettre à jour le graphe avec les nouvelles données

      let count = 0;
      vecteur_point_justice.getSource().forEachFeature(function (pointFeature) {
        if (geom.intersectsExtent(pointFeature.getGeometry().getExtent())) {
          count++;
        }
      });
    }
  });
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

// ====================== Intégration du widget d'adressage  ==============================
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
      name: properties.libelle|| "Inconnu",  // Assurez-vous que la propriété 'name' existe
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