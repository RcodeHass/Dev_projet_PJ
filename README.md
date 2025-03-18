# README - Cartographie Interactive de l'Accès à la Justice

## Introduction
Ce projet vise à développer une application cartographique interactive permettant de visualiser et d'analyser l'accès à la justice sur un territoire donné. Destinée aux justiciables et aux décideurs, l'application propose divers outils facilitant l'exploration des points de justice et des indicateurs socio-économiques associés.

## Fonctionnalités
L'application distingue deux types d'utilisateurs : les justiciables et les décideurs. Cette distinction structure les fonctionnalités intégrées :

### Justiciables
- **Recherche par lieu/adresse** : Permet d'identifier rapidement les points de justice autour de soi.
- **Mode basique (Onglet Carte)** : Interface simplifiée pour un accès rapide aux informations essentielles.
- **Liste des points de justice visibles** : Permet de localiser rapidement un point de justice et de centrer la carte dessus.

### Décideurs
- **Mode avancé (Onglet Carte)** : Accès à des outils plus détaillés pour l'analyse.
- **Filtrage par type et catégorie** : Possibilité d'afficher uniquement certains types de points de justice.
- **Sélecteur d'indicateurs** : Exploration des indicateurs sous forme de couches cartographiques.
- **Onglet Infographie** : Représentations graphiques et statistiques sur les points de justice et les territoires.
- **Onglet Indicateurs** : Affichage en aplat de couleur des indicateurs pré-calculés pour visualiser les zones où la demande de justice est la plus importante.
- **Graphiques interactifs** : Analyse complémentaire avec des diagrammes et statistiques.

## UX/UI Design
L'interface est conçue pour être intuitive et adaptée à ses différents publics. Deux modes sont disponibles :
- **Un mode basique** inspiré de Google Maps pour une prise en main rapide des justiciables.
- **Un mode avancé** avec des options supplémentaires pour les décideurs.

Le passage d'un mode à l'autre se fait via un sélecteur, et l'information est structurée en panneaux pour éviter toute surcharge cognitive.

## Charte Graphique
L'application adopte une palette sobre avec des nuances de gris clair et de bleu sombre, s'inspirant des sites gouvernementaux pour renforcer sa crédibilité et son aspect institutionnel. Les dégradés de couleurs facilitent la lecture des indicateurs cartographiques.

## Technologie
L'application repose sur un **GeoServer** pour la gestion et la diffusion des données spatiales. L'interface cartographique est développée en **JavaScript**, avec des interactions dynamiques permettant une exploration fluide et efficace.

## Conclusion
Ce projet propose une solution robuste et dynamique pour améliorer l'accès à la justice. Il répond aux besoins des justiciables en facilitant la localisation des points de justice, tout en fournissant aux décideurs des outils d'analyse avancés pour une meilleure gestion des ressources juridiques.
