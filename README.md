Pour démarrer les containers :
`docker compose up -d`

Pour arrêter les containers :
`docker compose down`

2. Le deuxième fichier du projet et le Canddyfile qui est le fichier de configuration du serveur 
au même titre que Apache ou Nginx elle contient 3 parametre: 
    => le port du localhost 
    => le chemin du /srv 
    => et le type de fichier utiliser (statique par defaut)

3. Créer le docker compose qui vas contenir nos services web 
    => avec les port qui seront utiliser 
    => le nom des conteneurs 

4. On vas également créer notre application OpenLayers: 
    => npm create ol-app app
    => et lancer le serveur avc npm start dans le dossier app
    => et lancer le docker recuper les couches de la carte #

5. Git 

Pour récuperer et initialiser le projet depuis GitHub 

git clone <lien du projet>
git status (pour voir les changements)
git add . (sinon specifier le ficher)
git commit -m "nom_modif"
git push (envoyer notre projet)
git pull (pour recuperer les dernier modification)