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
  const iconSrc = categorieIcons[categorie] || "img/Divers.svg"; // Icône par défaut si non définie

  return new ol.style.Style({
    image: new ol.style.Icon({
      src: iconSrc,
      scale: 0.03 // Ajustez la taille des icones
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
const calculateJenksClassesForLayer = (source, indicator, numClasses = 6) => {
  const values = source.getFeatures()
    .map(f => parseFloat(f.get(indicator)))
    .filter(v => !isNaN(v))
    .sort((a, b) => a - b);

  if (values.length < numClasses) return values; // Sécurité si peu de valeurs

  const jenksClasses = [values[0]]; // On commence par la valeur minimale

  for (let i = 1; i < numClasses - 1; i++) {
    const index = Math.round(i * (values.length - 1) / (numClasses - 1)); 
    jenksClasses.push(values[index]); 
  }

  jenksClasses.push(values[values.length - 1]); // Ajouter la valeur max

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
      stroke: new Stroke({ color: 'white', width: 0.4 })
    });
  });
};

// Palettes de couleurs pour chaque indicateur (6 couleurs)
const colorsPartFmp = [
  'rgba(255, 255, 204, 0.8)', // Jaune clair
  'rgba(255, 230, 153, 0.8)', // Jaune intermédiaire
  'rgba(255, 204, 102, 0.8)', // Orange clair
  'rgba(255, 153, 51, 0.8)',  // Orange foncé
  'rgba(204, 51, 0, 0.8)',    // Rouge clair
  'rgba(153, 0, 0, 0.8)'      // Rouge foncé
];

const colorsnb_victime_1000 = [
  'rgba(255, 230, 255, 0.8)', // Pourpre très clair
  'rgba(255, 204, 255, 0.8)', // Pourpre clair
  'rgba(255, 153, 255, 0.8)', // Pourpre moyen clair
  'rgba(204, 102, 204, 0.8)', // Pourpre moyen
  'rgba(153, 51, 153, 0.8)',  // Pourpre foncé
  'rgba(102, 0, 102, 0.8)'    // Pourpre très foncé
];

const colorstaux_chomage = [
  'rgba(230, 243, 255, 0.8)', // Bleu très clair
  'rgba(204, 229, 255, 0.8)', // Bleu clair
  'rgba(153, 204, 255, 0.8)', // Bleu moyen clair
  'rgba(102, 178, 255, 0.8)', // Bleu moyen
  'rgba(51, 153, 255, 0.8)',  // Bleu foncé
  'rgba(0, 102, 204, 0.8)'    // Bleu très foncé
];

const colorsMoyenAge = [
  'rgba(141, 211, 199, 0.8)', // Bleu-vert clair
  'rgba(31, 120, 180, 0.8)',  // Rose clair
  'rgba(51, 160, 44, 0.8)',   // Rose moyen
  'rgba(182, 181, 181, 0.8)', // Magenta
  'rgba(227, 26, 28, 0.8)',   // Rouge foncé
  'rgba(177, 0, 38, 0.8)'     // Bleu foncé
];

const colorsTauxPauvrete = [
  'rgba(230, 255, 230, 0.8)', // Vert très clair
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

//déclaration du style pour mettre en surbrilliance la zone cliquée 
const highlightStyle = new Style({
  stroke: new Stroke({
    color: "yellow", // Contour jaune vif pour la surbrillance
    width: 4
  }),
  fill: new Fill({
    color: "rgba(255, 255, 0, 0.3)" // Jaune semi-transparent
  })
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

// Gestion du changement de couche de fond
document.getElementById('basemap-select').addEventListener('change', function() {
  const selectedBasemap = this.value;
  
  // Masquer toutes les couches de fond
  couche_osm.setVisible(false);
  positronLayer.setVisible(false);
  
  // Afficher la couche de fond sélectionnée
  if (selectedBasemap === 'osm') {
    couche_osm.setVisible(true);
  } else if (selectedBasemap === 'positron') {
    positronLayer.setVisible(true);
  }
});

// Récupération des boutons
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');

// Ajout des événements de clic
zoomInButton.addEventListener('click', () => {
    let view = map.getView();
    view.setZoom(view.getZoom() + 1);
});

zoomOutButton.addEventListener('click', () => {
    let view = map.getView();
    view.setZoom(view.getZoom() - 1);
});

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
  var toggleImg = toggleButton.querySelector("img");
  var legende = document.getElementById("legende");

  function updateButton() {
    setTimeout(() => { 
      var panelWidth = infoPanel.offsetWidth;
      var panelOpen = infoPanel.classList.contains("show");

      // Déplacement du bouton
      if (panelOpen) {
        toggleButton.style.right = (panelWidth + 10) + "px";
        toggleImg.src = "img/next.png"; 
        legende.style.right = (panelWidth + 10) + "px"; 
      } else {
        toggleButton.style.right = "10px";
        toggleImg.src = "img/prev.png"; 
        legende.style.right = "10px";
      }
    }, 1); // Délai pour la transition
  }

  // Met à jour l'image et la position du bouton à l'ouverture/fermeture du panneau
  infoPanel.addEventListener("shown.bs.offcanvas", updateButton);
  infoPanel.addEventListener("hidden.bs.offcanvas", updateButton);

  // Initialisation au chargement
  infoPanel.classList.add("show"); 

  // Initialisation au chargement
  updateButton();
});

// =====  Fonction pour passer de l'onglet de avancée a l'onglet de base ======
const activateBasicButton = () => {
  document.getElementById('list-categorie-panel').style.display = 'none';
  document.getElementById('control-couches').style.display = 'none';
  document.getElementById('tab-stat').style.display = 'none';
  document.getElementById('indicateur-panel').style.display = 'none';
  document.getElementById('tab-indicateur').style.display = 'none';
  document.getElementById('legende').style.display = 'none';
  vecteur_point_justice.setVisible(true);

  // Masquer les couches contenant des indicateurs en mode basique
  courAppelLayer.setVisible(false);
  tribunalJudiciaireLayer.setVisible(false);
  prudhommeLayer.setVisible(false);
  
  // Cocher le checkbox-pt_justice
  document.getElementById('checkbox-pt_justice').checked = true;
};

// Ajouter l'événement au bouton "basic-button"
document.getElementById('basic-button').addEventListener('click', activateBasicButton);

// =====  Fonction pour passer de l'onglet de de base au mode avancée =====
window.addEventListener('load', activateBasicButton);
const deactivateBasicButton = () => {
  document.getElementById('list-categorie-panel').style.display = 'block';
  document.getElementById('control-couches').style.display = 'block';
  document.getElementById('indicateur-panel').style.display = 'block';
  document.getElementById('tab-stat').style.display = 'block';
  document.getElementById('tab-indicateur').style.display = 'block';
  document.getElementById('legende').style.display = 'block';

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
//mettre en surbrilliance la zone sélectionnée
// Supposons que vous avez une liste d'indicateurs
const indicatorSelected = ['part_fmp', 'nb_victime_1000', 'taux_chomage', 'age_moyen', 'taux_pauvrete'];

// Fonction pour obtenir l'indicateur sélectionné par l'utilisateur
function getSelectedIndicator() {
  for (const indicator of indicatorSelected) {
    if (document.getElementById(indicator).checked) {
      return indicator;
    }
  }
  return null;
}

let selectedFeature = null; // Stocke l'entité actuellement surlignée

map.on('singleclick', function (evt) {
  let newSelectedFeature = null;
  let selectedCode = null;
  let indicatorValue = null; // Utilisez let pour permettre la réaffectation

  map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
    if (layer === courAppelLayer) {
      selectedCode = feature.get("lib_ca");
      newSelectedFeature = feature;
    } else if (layer === tribunalJudiciaireLayer) {
      selectedCode = feature.get("lib_tj");
      newSelectedFeature = feature;
    } else if (layer === prudhommeLayer) {
      selectedCode = feature.get("lib_cph");
      newSelectedFeature = feature;
    }
  });

  if (selectedFeature) {
    selectedFeature.setStyle(null);
  }

  if (newSelectedFeature) {
    newSelectedFeature.setStyle(highlightStyle);
    selectedFeature = newSelectedFeature;

    // Récupérer l'indicateur sélectionné
    const selectedIndicator = getSelectedIndicator();
    if (selectedIndicator) {
      indicatorValue = newSelectedFeature.get(selectedIndicator);
      // Limiter le nombre de décimales à deux
      indicatorValue = parseFloat(indicatorValue).toFixed(2);
    }

    // Récupérer les informations de l'entité sélectionnée
    const featureInfo = {
      nom: selectedCode, // Ajoute le code spécifique à la couche
      indicateur: indicatorValue
    };

    // Mettre à jour l'interface utilisateur avec les informations récupérées
    updateUIWithFeatureInfo(featureInfo);
  } else {
    selectedFeature = null;
  }
});

function updateUIWithFeatureInfo(info) {
  const dynamicInfoDiv1 = document.getElementById('dynamic-info');
  const dynamicInfoDiv2 = document.getElementById('dynamic-info2');

  // Nettoyer les deux divs avant d'ajouter de nouvelles infos
  dynamicInfoDiv1.innerHTML = '<p>Informations de l\'entité sélectionnée :</p>';
  dynamicInfoDiv2.innerHTML = '<p>Informations complémentaires :</p>';

  const ul1 = document.createElement('ul');
  const ul2 = document.createElement('ul');

  // Ajouter les mêmes informations dans les deux listes
  for (const key in info) {
    const li = document.createElement('li');
    li.textContent = `${key}: ${info[key]}`;

    // Ajouter dans la première liste (dynamic-info)
    ul1.appendChild(li);

    // Ajouter dans la deuxième liste (dynamic-info2)
    ul2.appendChild(li.cloneNode(true)); // Utiliser cloneNode pour éviter de créer une nouvelle instance de l'élément
  }

  // Ajouter les listes dans les divs
  dynamicInfoDiv1.appendChild(ul1);
  dynamicInfoDiv2.appendChild(ul2);
}


// ============== Changer ici le titre des indicateurs =================
const indicatorTitles = {
  'part_fmp': "Part des familles monoparentales",
  'nb_victime_1000': "Nombre de victimes pour 1000 habitants",
  'taux_chomage': "Taux de chômage",
  'age_moyen': "Âge moyen",
  'taux_pauvrete': "Taux de pauvreté (%)",
};

// ============== Fontion de mise a jour de la légende =================
const updateLegend = (indicator, source, colorScale) => {
  const legendContainer = document.querySelector('.legend-container');
  if (!legendContainer) return;

  legendContainer.innerHTML = ''; // Nettoyage de la légende précédente

  if (indicator === 'aucun' || !colorScale || !source) {
    document.getElementById('legende').style.display = 'none';
    return;
  }

  document.getElementById('legende').style.display = 'block';

  // Ajout du titre correspondant à l’indicateur
  const title = document.createElement('h6');
  title.textContent = indicatorTitles[indicator] || "Indicateur";
  title.style.marginBottom = "8px"; // Espacement avec la légende
  legendContainer.appendChild(title);

  // Calcul des classes de Jenks
  const jenksClasses = calculateJenksClassesForLayer(source, indicator);
  if (!jenksClasses || jenksClasses.length < 2) return;

  for (let i = 0; i < jenksClasses.length - 1; i++) {
    const legendItem = document.createElement('div');
    legendItem.classList.add('square');
    legendItem.style.backgroundColor = colorScale[i]; // Appliquer la couleur

    const label = document.createElement('span');
    label.classList.add('label');
    label.textContent = `${jenksClasses[i].toFixed(1)} - ${jenksClasses[i + 1].toFixed(1)}`;

    legendItem.appendChild(label);
    legendContainer.appendChild(legendItem);
  }
};

// ======= Fonction pour mettre à jour le style en fonction des cases cochées ===========
const waitForSourceReady = (source, callback) => {
  if (source.getState() === 'ready') {
    callback();
  } else {
    source.once('change', () => {
      if (source.getState() === 'ready') {
        callback();
      }
    });
  }
};

// =================== Fonction pour mettre à jour le style d'indicateur  =================
const updateLayerStyles = () => {
  const selectedIndicator = document.querySelector('#list-indic input:checked')?.value || 'taux_pauvrete';

  if (selectedIndicator === 'aucun') {
    // Appliquer un style transparent
    const outlineStyle = new Style({
      fill: new Fill({ color: 'rgba(0, 0, 0, 0)' }),
      stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.31)', width: 0.8 })
    });

    [courAppelLayer, tribunalJudiciaireLayer, prudhommeLayer].forEach(layer => {
      if (layer.getVisible()) {
        layer.setStyle(outlineStyle);
      }
    });

    updateLegend('aucun', null);
    return;
  }

  let colorScale;
  switch (selectedIndicator) {
    case 'part_fmp': colorScale = colorsPartFmp; break;
    case 'nb_victime_1000': colorScale = colorsnb_victime_1000; break;
    case 'taux_chomage': colorScale = colorstaux_chomage; break;
    case 'age_moyen': colorScale = colorsMoyenAge; break;
    case 'taux_pauvrete': colorScale = colorsTauxPauvrete; break;
    default: return;
  }

  let source = null;
  let activeLayer = null;

  if (courAppelLayer.getVisible()) {
    source = courAppelSource;
    activeLayer = courAppelLayer;
  } else if (tribunalJudiciaireLayer.getVisible()) {
    source = tibunalJudiciaireSource;
    activeLayer = tribunalJudiciaireLayer;
  } else if (prudhommeLayer.getVisible()) {
    source = PrudhommeSource;
    activeLayer = prudhommeLayer;
  }

  if (activeLayer && source) {
    waitForSourceReady(source, () => {
      applyJenksStyleToLayer(activeLayer, source, selectedIndicator, colorScale);
      updateLegend(selectedIndicator, source, colorScale);
    });
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

// Fonctions pour afficher et masquer les couches de découpage administratif 
tribunalJudiciaireLayer.setVisible(false);
prudhommeLayer.setVisible(false);

document.querySelectorAll('input[name="layer-type"]').forEach((radio) => {
  radio.addEventListener("change", (event) => {
    courAppelLayer.setVisible(event.target.id === "checkbox-cour_appel");
    tribunalJudiciaireLayer.setVisible(event.target.id === "checkbox-trib_judiciaire");
    prudhommeLayer.setVisible(event.target.id === "checkbox-prudhomme");

    let activeLayer = null;
    let activeSource = null;

    if (courAppelLayer.getVisible()) {
      activeLayer = courAppelLayer;
      activeSource = courAppelSource;
    } else if (tribunalJudiciaireLayer.getVisible()) {
      activeLayer = tribunalJudiciaireLayer;
      activeSource = tibunalJudiciaireSource;
    } else if (prudhommeLayer.getVisible()) {
      activeLayer = prudhommeLayer;
      activeSource = PrudhommeSource;
    }

    if (activeLayer && activeSource) {
      // Attendre que la source soit prête avant d'appliquer le style
      activeSource.once('change', () => {
        if (activeSource.getState() === 'ready') {
          updateLayerStyles();
        }
      });

      // Si la source est déjà prête, appliquer immédiatement
      if (activeSource.getState() === 'ready') {
        updateLayerStyles();
      }
    }
  });
});

// // ======================================================================================
// // ====================== Fonctions pour gérer les indicateur   ====================== 
// // ======================================================================================
// déclaration des titres pour les sélections d'indicateurs 
const indicatorLabels = {
  part_fmp: "Part des familles monoparentales (%)",
  nb_victime_1000: "Nombre de victimes pour 1000 habitants (°/00)",
  taux_chomage: "Taux de chômage (%)",
  age_moyen: "Âge moyen (année)",
  taux_pauvrete: "Taux de pauvreté (%)",
};

const indicatorDescriptions = {
  part_fmp: "Cet indicateur permet de visualiser la part de ménages monoparentaux dans chaque limite administrative que vous souhaitez consulter. La part des familles monoparentales est un indicateur pertinent pour analyser et essayer de prévoir les besoins juridiques d’un territoire. En effet, une famille monoparentale suppose des besoins juridiques spécifiques (divorce). De plus, les familles monoparentales sont plus susceptibles d’être exposées à des difficultés socio-économiques, qui peuvent nécessiter des conseils juridiques précis.",
  nb_victime_1000: "Nous avons utilisé les données issues des enregistrements par la police et la gendarmerie, cela permet de mesurer la délinquance présente sur chaque territoire. Cette donnée représente la moyenne des victimes de 2016 à 2024 pour 1000 habitants par communes. L’indicateur porte sur les crimes et les délits (à l’exclusion des contraventions et des délits routiers), enregistrés pour la première fois par les forces de sécurité et portés à la connaissance de l’institution judiciaire.",
  taux_chomage: "Le taux de chômage d’un territoire apparaît comme un indicateur socio-économique intéressant pour mesurer les besoins juridiques d’un territoire. Un taux de chômage plus élevé, en plus de traduire les difficultés sociales d’un territoire, ce qui implique des besoins juridiques différents, va aussi traduire les difficultés économiques d’un territoire. Elles peuvent alors se répercuter sur le nombre de décisions rendues par les Conseils des Prud’hommes, par exemple sur les contentieux de licenciement.",
  age_moyen: "L’âge moyen d’un territoire apparaît comme un indicateur intéressant pour anticiper les besoins judiciaires d’une population résidente.",
  taux_pauvrete: "Le taux de pauvreté d’un territoire est un indicateur important pour comprendre les enjeux judiciaires d’un territoire. En France, l’INSEE définit le seuil de pauvreté comme 60 % du revenu médian, soit environ 1 158 euros par mois en 2021. Une population plus exposée à la précarité peut faire face à des problématiques judiciaires spécifiques, que ce soit en tant que victime ou auteur d’infractions. Les délits liés aux conditions de vie, comme les vols de nécessité, peuvent être plus fréquents dans les zones où le taux de pauvreté est élevé. À l’inverse, ces populations sont aussi plus vulnérables aux arnaques financières, aux marchands de sommeil ou aux abus de faiblesse.",
};
// Récupérer les indicateurs à partir de l'une des sources
const getindicatorSelectedFromSource = (source) => {
  const features = source.getFeatures();
  if (features.length === 0) return [];

  const properties = features[0].getProperties();
  return Object.keys(properties).slice(3);
};

// Fonction pour mettre à jour le titre et la description de l'indicateur sélectionné
const updateIndicatorText = (selectedIndicator) => {
  const titleContainer = document.getElementById('titre_indicateur');
  const textContainer = document.getElementById('txt-indicateur');

  // Réinitialiser les contenus
  titleContainer.innerHTML = '';
  textContainer.innerHTML = '';

  if (selectedIndicator && selectedIndicator !== 'aucun') {
    // Ajouter le titre
    const title = document.createElement('h5');
    title.textContent = indicatorLabels[selectedIndicator] || 'Indicateur sélectionné';
    titleContainer.appendChild(title);

    // Ajouter la description
    textContainer.textContent = indicatorDescriptions[selectedIndicator] || 'Aucune description disponible.';
  }
};

// Fonction pour créer des boutons radio au lieu de checkboxes
const createRadioList = (indicatorSelected) => {
  const list = document.getElementById('list-indic');
  list.innerHTML = '';

  indicatorSelected.forEach(indicator => {
    const listItem = document.createElement('li');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.id = indicator;
    radio.name = 'indicator';
    radio.value = indicator;
    radio.classList.add("form-check-input");
    
    if (indicator === 'taux_pauvrete') {
      radio.checked = true;
      updateIndicatorText(indicator);
    }

    radio.addEventListener('change', (event) => {
      updateLayerStyles();
      updateIndicatorText(event.target.value);
    });

    const label = document.createElement('label');
    label.htmlFor = indicator;
    label.appendChild(
      document.createTextNode(indicatorLabels[indicator] || indicator)
    );

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

  noneRadio.addEventListener('change', () => {
    updateLayerStyles();
    updateIndicatorText('');
  });

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
    const indicatorSelected = getindicatorSelectedFromSource(courAppelSource);
    createRadioList(indicatorSelected);
    updateLayerStyles();
  }
});


// // ========================================================================================
// // ============ Fonctions gestion des couche de découpage administratif ================== 
// // ========================================================================================

// // ============== Écouteur de clic pour récupérer les communes ================

map.on("singleclick", function (evt) {
  let selectedCode = null;

  // Vérifier sur quelle couche l'utilisateur a cliqué
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
    // Appliquer le filtre CQL sur la couche commune WMS
    const communeSource = commune.getSource();
    communeSource.updateParams({
      "CQL_FILTER": `num_ca=${selectedCode} OR num_tj=${selectedCode} OR num_cph=${selectedCode}`
    });

    // Récupérer l'indicateur sélectionné (par exemple, depuis un bouton radio ou un autre mécanisme)
    const selectedIndicator = document.querySelector('#list-indic input:checked')?.value || 'taux_pauvrete';

    // Définir le style à appliquer en fonction de l'indicateur sélectionné
    let selectedStyle;
    switch (selectedIndicator) {
      case 'part_fmp':
        selectedStyle = 'data_point_justice:part_fmp';
        break;
      case 'nb_victime_1000':
        selectedStyle = 'data_point_justice:nb_victime_1000';
        break;
      case 'taux_chomage':
        selectedStyle = 'data_point_justice:taux_chomage';
        break;
      case 'age_moyen':
        selectedStyle = 'data_point_justice:age_moyen';
        break;
      case 'taux_pauvrete':
        selectedStyle = 'data_point_justice:taux_pauvrete';
        break;
      default:
        selectedStyle = 'data_point_justice:taux_pauvrete'; // Par défaut
    }

    // Mettre à jour les paramètres WMS pour appliquer le style sélectionné
    communeSource.updateParams({
      "STYLES": selectedStyle
    });

  } else {
    // Si aucun code n'est sélectionné, réinitialiser la couche à son style par défaut
    const communeSource = commune.getSource();
    communeSource.updateParams({
      "STYLES": '' // ou "defaultStyle" si vous avez un style par défaut configuré
    });
  }
});

// =======================================================================================
// ====================  Fonctions filtrage des points de justice  ======================= 
// =======================================================================================

// Ajouter un indicateur de chargement (engrenage)
const loadingImage = document.createElement('img');
loadingImage.src = 'img/delai.gif';
loadingImage.id = 'loadingIndicator';
loadingImage.style.position = 'absolute';
loadingImage.style.top = '50%';
loadingImage.style.left = '50%';
loadingImage.style.transform = 'translate(-50%, -50%)';
loadingImage.style.zIndex = 9999; // S'assurer que l'image est au-dessus des autres éléments
loadingImage.style.display = 'none'; // Initialement caché
loadingImage.style.width = '50px'; // Ajouter une taille fixe pour l'image
loadingImage.style.height = '50px';
document.body.appendChild(loadingImage);

// Fonction pour afficher l'indicateur de chargement
async function showLoadingIndicator() {
  loadingImage.style.display = 'block'; // Afficher l'image de chargement
}

// Fonction pour masquer l'indicateur de chargement
async function hideLoadingIndicator() {
  loadingImage.style.display = 'none'; // Masquer l'image de chargement
}

// Fonction pour récupérer et afficher les types depuis GeoServer
const Listtype = document.querySelector('ul#list-type');
const Listcategorie = document.querySelector('ul#list-categorie');

const equipementsType = new Set();
const equipementsCategorie = new Set();

const fragType = document.createDocumentFragment();
const fragCategorie = document.createDocumentFragment();

// Fonction générique pour créer un switch dans une liste donnée
function createFilterItem(value, listSet, frag, isTypeList) {
  if (!listSet.has(value)) {
    listSet.add(value);

    // Création du <li> conteneur
    const li = document.createElement('li');
    li.classList.add("form-check", "d-flex", "align-items-center");
    li.dataset.filterValue = value;
    
    // Création du conteneur global pour tout aligner
    const container = document.createElement('div');
    container.classList.add("d-flex", "align-items-center", "w-100", "py-1");

    // Création du switch (checkbox)
    const switchInput = document.createElement('input');
    switchInput.type = 'checkbox';
    switchInput.checked = true; // Par défaut, activé
    switchInput.dataset.filterValue = value;
    switchInput.classList.add("form-check-input");
    switchInput.style.marginRight = "0.5rem";

    // Création du label pour le switch
    const switchLabel = document.createElement('label');
    switchLabel.classList.add("form-check-label", "d-flex", "align-items-center");
    switchLabel.setAttribute('for', value); // Associer le label au switch

    // Ajout de l'image uniquement si l'élément est ajouté à la liste des types
    if (isTypeList) {
      const iconImg = document.createElement('img');
      iconImg.src = categorieIcons[value] || "img/Divers.png"; 
      iconImg.alt = value;
      iconImg.style.width = "20px"; // Taille de l'icône
      iconImg.style.height = "100%";
      iconImg.style.marginRight = "0.5rem"; // Marge à droite uniquement
      switchLabel.appendChild(iconImg); // Icône à gauche du texte dans le label
    }

    // Ajouter le texte au label
    switchLabel.appendChild(document.createTextNode(value));

    // Créer l'élément <i> pour l'icône d'information
    const infoIcon = document.createElement('i');
    infoIcon.classList.add('bi', 'bi-info-circle', 'ms-2', 'text-info');  // Classe Bootstrap pour l'icône d'info
    infoIcon.setAttribute('data-bs-toggle', 'tooltip');  // Activer le tooltip
    infoIcon.setAttribute('data-bs-placement', 'left');  // Position du tooltip
    infoIcon.setAttribute('title', `Information sur le type: ${value}`);  // Le texte du tooltip

    // Personnaliser le texte du tooltip (ici, un texte dynamique selon la valeur)
    const tooltipText = value === 'Domaine juridique'
    ? 'Lieu ou service où les citoyens peuvent obtenir des informations, des conseils ou un accompagnement concernant leurs droits et obligations, ainsi que l\'accès à des services juridiques dans diverses branches du droit, comme le droit civil, pénal ou administratif.' 
    : value === 'Spécialiste hors FS'
    ? 'Professionnel du droit, comme un avocat ou un notaire, qui fournit des services juridiques spécialisés en dehors du réseau France Service.'
    : value === 'Généraliste hors FS'
    ? 'Professionnel du droit qui offre des conseils juridiques sur une gamme large de sujets, mais hors du cadre du réseau France Service.'
    : value === 'France Service'
    ? 'Réseau de points d\'accueil physiques qui offrent des services administratifs et juridiques de proximité pour faciliter l\'accès aux droits des citoyens en France.'
    : value === 'Pérmanences'
    ? 'NSP'
    : value === 'Maisons'
    ? 'Maison du droit'
    : value === 'Autre'
    ? 'Point-Justice non catégorisé'
    : value === 'Mairie'
    ? 'Point-Justice situé dans une mairie, appartenant généralement au Type France-Service'
    : value === 'Etablissement'
    ? 'Tous les points-justices qui se situe ou sont liés dans un bâtiment appartenant au Ministère de la Justice'
    : value === 'Associations'
    ? 'Tous les points-justices qui sont situé ou sont liés à une association'
    : `Informations sur le filtre: ${value} - Description non disponible.`;

    // Ajouter le texte personnalisé au tooltip
    infoIcon.setAttribute('title', tooltipText);  // Le texte du tooltip

    // Ajouter l'icône à la fin du label
    switchLabel.appendChild(infoIcon);

    // Ajout du switch et du texte dans le conteneur
    container.appendChild(switchInput); // Switch à gauche
    container.appendChild(switchLabel); // Texte et icônes à droite

    // Ajout du conteneur dans le <li>
    li.appendChild(container);

    // Rendre tout le <li> cliquable
    li.addEventListener('click', function (event) {
      if (event.target !== switchInput && event.target !== switchLabel) {
        switchInput.checked = !switchInput.checked;
        switchInput.dispatchEvent(new Event('change')); // Déclencher l'événement de changement
      }
    });

    // Gestion du image
    switchInput.addEventListener('change', debounce(() => {
      showLoadingIndicator(); // Afficher le chargement avant de filtrer
  }, 10));


    // Gestion du filtrage
    switchInput.addEventListener('change', debounce(() => {
        filterPointsJustice();
        afficherPointsJusticeDansEmpriseEcran();
        hideLoadingIndicator(); // Masquer le chargement après le filtrage
    }, 20));

    // Ajout au fragment
    frag.appendChild(li);
  }
}

// Initialiser tous les tooltips dans la page
const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
tooltips.forEach(function (tooltip) {
  new bootstrap.Tooltip(tooltip);  // Crée et initialise le tooltip pour chaque élément
});

// Récupération et affichage des types et catégories
point_justice_vec.on('change', function () {
    if (point_justice_vec.getState() === 'ready') {
        const features = point_justice_vec.getFeatures();

        features.forEach((feature) => {
            const type_pj = feature.get('type_pj'); // Récupération du champ type
            const categorie = feature.get('categorie'); // Récupération du champ catégorie

            if (type_pj) {
                createFilterItem(type_pj, equipementsType, fragType, true); // true pour Listtype
            }
            if (categorie) {
                createFilterItem(categorie, equipementsCategorie, fragCategorie, false); // false pour Listcategorie
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
//rajouter les informations pour les Types de PJ lors du filtrage par l'utilisateur 


//========================================================================================
// ============ Fonction pour afficher la liste des points de justicevisibles ==========
//========================================================================================

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
  const pointsAffiches = pointsVisibles.slice(0, 20);

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

//========================================================================================
// ==============================  Création du popup  ===================================
//========================================================================================
const popupElement = document.createElement('div');
popupElement.id = 'popup';
popupElement.style.position = 'absolute';
popupElement.style.width = 'auto';
popupElement.style.background = 'white';
popupElement.style.padding = '5px';
popupElement.style.border = '1px solid black';
popupElement.style.borderRadius = '5px';
popupElement.style.display = 'none';
popupElement.style.fontSize = '13px';
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
    const classe = feature.get('classe'); 
    const ratio = feature.get('ratio'); 
    const ecart_moy = feature.get('ecart_moy'); 
    if (intitule) {

      document.getElementById('info-pj').innerHTML = `
        <div class="info-item"><b>Intitulé:</b> ${intitule}</div>
        <div class="info-item"><b>Catégorie:</b> ${categorie}</div>
        <div class="info-item"><b>Adresse:</b> ${adresse} ${codgeo} </div>
        <div class="info-item"><b>Téléphone:</b> ${telephone}</div>
      `;
      
      document.getElementById('indice-access').innerHTML = `
        <div class="info-item"><b>Classe:</b> ${classe}</div>
        <div class="info-item"><b>Ratio:</b> ${ratio}</div>
        <div class="info-item"><b>Ecart moyen:</b> ${ecart_moy}</div>
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

let tribunalChart; 
let visitorChart;

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

// Fonction pour calculer la somme des visiteurs par type de point de justice dans une zone spécifique
function countVisitorsByTypeInZone(geometry) {
  const counts = {}; // Stocke la somme des visiteurs par type

  point_justice_vec.forEachFeature(function (feature) {
    const type = feature.get('type_pj'); // Récupère la valeur du champ type_pj
    const nbVisites = feature.get('nb_visite'); // Récupère la valeur du nombre de visiteurs
    if (type && nbVisites && geometry.intersectsExtent(feature.getGeometry().getExtent())) {
      counts[type] = (counts[type] || 0) + nbVisites; // Ajoute le nombre de visiteurs
    }
  });

  return counts;
}

// Fonction pour mettre à jour le graphique des tribunaux
function updateTribunalChart(counts) {
  const labels = Object.keys(counts); // Les types de tribunaux
  const data = Object.values(counts); // Nombre d'occurrences par type

  const ctx = document.getElementById('tribunalChart').getContext('2d');

  // Détruire l'ancien graphique s'il existe
  if (tribunalChart) {
    tribunalChart.destroy();
  }

  // Créer un nouveau graphique pour les tribunaux
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

// Fonction pour mettre à jour le graphique des visiteurs
function updateVisitorChart(counts) {
  const labels = Object.keys(counts); // Les types de tribunaux
  const data = Object.values(counts); // Somme des visiteurs par type

  const ctx = document.getElementById('visitorChart').getContext('2d');

  // Détruire l'ancien graphique s'il existe
  if (visitorChart) {
    visitorChart.destroy();
  }

  // Créer un nouveau graphique pour les visiteurs
  visitorChart = new Chart(ctx, {
    type: 'bar', // Type de graphe (barres)
    data: {
      labels: labels,
      datasets: [{
        label: 'Nombre de visiteurs par type',
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
    updateTribunalChart(counts);
  }
});

// Écouteur de clic pour la mise à jour des graphiques
map.on("click", function (evt) {
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    if (layer === courAppelLayer || layer === tribunalJudiciaireLayer || layer === prudhommeLayer) {
      const geom = feature.getGeometry(); // Géométrie de l'entité sélectionnée
      const tribunalCounts = countTribunalsByTypeInZone(geom); // Compter les tribunaux dans la zone cliquée
      const visitorCounts = countVisitorsByTypeInZone(geom); // Compter les visiteurs dans la zone cliquée

      updateTribunalChart(tribunalCounts); // Mettre à jour le graphe des tribunaux
      updateVisitorChart(visitorCounts); // Mettre à jour le graphe des visiteurs
    }
  });
});

// Fonction pour basculer entre les graphiques
document.getElementById('graph-select').addEventListener('change', function (e) {
  const selectedGraph = e.target.value;

  if (selectedGraph === 'tribunalChart') {
    document.getElementById('tribunalChart').style.display = 'block';
    document.getElementById('visitorChart').style.display = 'none';
  } else if (selectedGraph === 'visitorChart') {
    document.getElementById('tribunalChart').style.display = 'none';
    document.getElementById('visitorChart').style.display = 'block';
  }
});


// ========================================================================================
// ====================== Intégration du widget d'adressage  ===============================
// ========================================================================================
// Déclare locationLayer globalement afin de pouvoir supprimer les points des anciennes recherches
// Déclaration de la couche pour le marqueur sélectionné
let locationLayer = null;

// Récupérer les éléments HTML
const searchInput = document.getElementById('search');
const suggestionsList = document.getElementById('suggestions');
const searchButton = document.getElementById('searchButton');

// Fonction pour rechercher une adresse via Nominatim
async function fetchSuggestions(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=fr`;
  try {
      const response = await fetch(url);
      return await response.json();
  } catch (error) {
      console.error('Erreur lors de la récupération des suggestions :', error);
      return [];
  }
}

// Fonction pour exécuter la recherche sur la première suggestion trouvée
async function executeSearch(query) {
  const results = await fetchSuggestions(query);
  if (results.length > 0) {
      selectSuggestion(results[0]);
  } else {
      alert("Aucun résultat trouvé.");
  }
}

// Fonction pour mettre à jour les suggestions
async function updateSuggestions() {
  const query = searchInput.value.trim();
  if (query.length < 3) {
      suggestionsList.style.display = 'none';
      return;
  }

  const results = await fetchSuggestions(query);
  suggestionsList.innerHTML = '';

  if (results.length === 0) {
      suggestionsList.style.display = 'none';
      return;
  }

  results.forEach((place) => {
      const li = document.createElement('li');
      li.textContent = place.display_name;
      li.dataset.lat = place.lat;
      li.dataset.lon = place.lon;
      li.addEventListener('click', () => selectSuggestion(place));
      suggestionsList.appendChild(li);
  });

  suggestionsList.style.display = 'block';
}

// Fonction pour sélectionner une suggestion
function selectSuggestion(place) {
  const lat = parseFloat(place.lat);
  const lon = parseFloat(place.lon);
  const coordinates = ol.proj.fromLonLat([lon, lat]);

  // Mettre à jour le champ de recherche
  searchInput.value = place.display_name;
  suggestionsList.style.display = 'none';

  // Centrer et zoomer sur la sélection
  map.getView().setCenter(coordinates);
  map.getView().setZoom(15);

  // Ajouter un marqueur
  addCustomMarker(coordinates);
  // Trouver et afficher les points les plus proches
  const closestPoints = findClosestPoints([lon, lat], 5);
  displayClosestPoints(closestPoints);
}

// Ajout d'un calque pour afficher la position de l'utilisateur
const userPositionLayer = new ol.layer.Vector({
  source: new ol.source.Vector()
});
map.addLayer(userPositionLayer);

// Récupération du bouton de localisation et de l'image à l'intérieur
const locateButton = document.getElementById('locate');
const locateImg = locateButton.querySelector('img'); 

// Variables pour gérer l'état de la localisation
let isLocated = false;
let userFeature = null;

// Fonction de géolocalisation
locateButton.addEventListener('click', () => {
  if (isLocated) {
      // Si déjà localisé, on supprime le marqueur et réinitialise l'image
      userPositionLayer.getSource().clear();
      locateImg.src = "./img/localisation.svg"; // Remettre l'icône par défaut
      isLocated = false;
  } else {
      // Sinon, obtenir la position de l'utilisateur
      if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  const userCoords = [position.coords.longitude, position.coords.latitude];
                  const userLocation = ol.proj.fromLonLat(userCoords);

                  // Centrer la carte sur la position de l'utilisateur
                  map.getView().setCenter(userLocation);
                  map.getView().setZoom(15);

                  // Créer ou mettre à jour le marqueur
                  userFeature = new ol.Feature({
                      geometry: new ol.geom.Point(userLocation)
                  });

                  // Style du marqueur
                  userFeature.setStyle(new ol.style.Style({
                      image: new ol.style.Circle({
                          radius: 6,
                          fill: new ol.style.Fill({ color: 'blue' }),
                          stroke: new ol.style.Stroke({ color: 'white', width: 2 })
                      })
                  }));

                  // Mise à jour de la couche de marqueur
                  userPositionLayer.getSource().clear();
                  userPositionLayer.getSource().addFeature(userFeature);

                  // Changer l’image du bouton pour indiquer que la localisation est active
                  locateImg.src = "./img/croix.png"; 

                  isLocated = true;

                  // Trouver et afficher les points les plus proches
                  const closestPoints = findClosestPoints(userCoords, 5);
                  displayClosestPoints(closestPoints);
              },
              (error) => {
                  alert("Impossible d'accéder à votre position : " + error.message);
              }
          );
      } else {
          alert("La géolocalisation n'est pas prise en charge par votre navigateur.");
      }
  }
});

// Fonction pour ajouter un marqueur sur la carte
function addCustomMarker(coordinates) {
  if (locationLayer === null) {
      locationLayer = new ol.layer.Vector({ source: new ol.source.Vector() });
      map.addLayer(locationLayer);
  } else {
      locationLayer.getSource().clear();
  }

  const location = new ol.Feature({
      geometry: new ol.geom.Point(coordinates)
  });

  const iconStyle = new ol.style.Style({
      image: new ol.style.Icon({
          src: './img/localisation.png',
          scale: 0.1,
          anchor: [0.5, 1]
      })
  });

  location.setStyle(iconStyle);

  locationLayer.getSource().addFeature(location);

  // Ajouter un écouteur d'événement pour supprimer le marqueur au premier clic
  map.once('click', function (event) {
      // Supprimer le marqueur dès le premier clic
      locationLayer.getSource().clear();
  });
}

// Fonction pour calculer la distance entre deux points
function calculateDistance(point1, point2) {
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = (point2[1] - point1[1]) * Math.PI / 180;
  const dLon = (point2[0] - point1[0]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1[1] * Math.PI / 180) * Math.cos(point2[1] * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Fonction pour trouver les points les plus proches
function findClosestPoints(targetCoordinates, n) {
  const features = point_justice_vec.getFeatures().filter(feature => feature.getStyle() === null);

  const distances = features.map(feature => {
      const coords = feature.getGeometry().getCoordinates();
      return {
          name: feature.get('intitule') || 'Inconnu',
          coordinates: coords,
          distance: calculateDistance(targetCoordinates, ol.proj.toLonLat(coords)),
          feature: feature
      };
  });

  distances.sort((a, b) => a.distance - b.distance);
  return distances.slice(0, n);
}

// Fonction pour afficher les points les plus proches
function displayClosestPoints(closestPoints) {
  const tableBody = document.querySelector('#closest-points-table tbody');
  tableBody.innerHTML = '';

  if (closestPoints.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="2">Aucun point trouvé</td></tr>';
      return;
  }

  closestPoints.forEach(point => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = point.name;
    nameCell.style.cursor = 'pointer';

    // Ajout de l'événement de clic pour afficher le popup
    nameCell.addEventListener('click', () => {
      // Zoomer sur le point sélectionné
      zoomToFeature(point.feature);

      // Afficher un popup avec le nom du point
      const intitule = point.feature.get('intitule') || 'Sans intitulé';
      const coordinates = point.feature.getGeometry().getCoordinates();
      
      // Définir la position et le contenu du popup
      popupElement.innerHTML = `<b>${intitule}</b>`;
      popup.setPosition(coordinates);
      popupElement.style.display = 'block';
    });

    const distanceCell = document.createElement('td');
    distanceCell.textContent = point.distance + ' m';

    row.appendChild(nameCell);
    row.appendChild(distanceCell);
    tableBody.appendChild(row);
});
}

// Fonction pour zoomer sur un point sélectionné
function zoomToFeature(feature) {
  const coordinates = feature.getGeometry().getCoordinates();
  map.getView().animate({ center: coordinates, zoom: 14, duration: 800 });

  const intitule = feature.get('intitule') || 'Sans intitulé';
  const categorie = feature.get('categorie') || 'Non classé';
  const adresse = feature.get('adresse') || 'Adresse inconnue';
  const codgeo = feature.get('codgeo') || '';
  const telephone = feature.get('telephone') || 'Non disponible';

  document.getElementById('info-pj').innerHTML = `
      <div class="info-item"><b>Intitulé:</b> ${intitule}</div>
      <div class="info-item"><b>Catégorie:</b> ${categorie}</div>
      <div class="info-item"><b>Adresse:</b> ${adresse} ${codgeo}</div>
      <div class="info-item"><b>Téléphone:</b> ${telephone}</div>
  `;
}

// Écouteur sur le champ de recherche avec délai pour limiter les requêtes
let searchTimeout = null;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const query = searchInput.value.trim();
  if (query.length > 2) {
      searchTimeout = setTimeout(updateSuggestions, 300);
  }
});

// Écouteur sur le bouton de recherche
searchButton.addEventListener('click', () => {
  const query = searchInput.value;
  if (query) {
      executeSearch(query);
  } else {
      alert("Veuillez entrer un lieu à rechercher.");
  }
});

// Écouteur sur la touche "Entrée" pour lancer la recherche
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
      const query = searchInput.value;
      if (query) {
          executeSearch(query);
      }
  }
});
