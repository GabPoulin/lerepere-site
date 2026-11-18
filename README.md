# lerepere.info — site du Repère

Site d'une page de **Le Repère** (sonorisation et services audiovisuels, Québec et Lévis), publié
avec GitHub Pages à https://lerepere.info.

Aucun outil à installer pour publier : le site est fait de fichiers statiques. Les outils Node
(`package.json`) servent seulement aux tests automatiques.

## Contenu du dépôt

| Fichier ou dossier | Rôle |
|---|---|
| `index.html` | La page : textes, forfaits, « Bon à savoir », formulaire et styles |
| `assets/site.js` | Le comportement du formulaire : prix estimé, durées par forfait, validation, envoi |
| `assets/` | Logos et images |
| `pdf/` | Fiches PDF des forfaits (version écran et version impression) et code QR |
| `CNAME` | Domaine personnalisé `lerepere.info` (ne pas supprimer) |
| `tests/site.spec.js` | Tests automatiques du site |
| `.github/workflows/tests.yml` | Lance les tests dans GitHub Actions |
| `.github/dependabot.yml` | Mises à jour de sécurité automatiques des outils de test |

## Faire une modification

Toute modification passe par une **pull request** (PR) : `main` est protégée, et une PR ne peut
être fusionnée que si les tests sont au vert.

Sur github.com : ouvrez le fichier, cliquez le crayon, modifiez, puis **Commit changes** en
choisissant **Create a new branch… and start a pull request**. Attendez que le test
**Tests du site** soit vert, puis cliquez **Merge pull request**. Le site se met à jour en environ
une minute.

### Changer un prix

Un prix apparaît à **quatre endroits**, à garder identiques :

1. `index.html` : les cartes des forfaits (section « Forfaits ») ;
2. `assets/site.js` : la table `PRIX` (prix estimé du formulaire) et, au besoin, la table
   `DUREES` (durées offertes selon le forfait) ;
3. `tests/site.spec.js` : la `grille` des prix testés ;
4. `pdf/` : les deux fiches PDF.

Si seulement une partie est changée, les tests échouent : c'est voulu, pour ne jamais afficher un
mauvais prix.

## Formulaire de soumission

- Les demandes sont envoyées par **[Web3Forms](https://web3forms.com)** vers `contact@lerepere.info`.
  La clé `access_key` dans `index.html` est publique par conception : elle permet seulement
  d'envoyer des demandes vers ce courriel.
- Le sujet du courriel, le nom de l'expéditeur et la durée de conservation se règlent dans le
  tableau de bord Web3Forms, pas dans le site.
- Dans Web3Forms, laisser **Captcha Protection** désactivé : le site n'affiche pas de captcha, et
  les envois seraient refusés. Garder **Advanced Spam Filter** activé (le site a aussi un champ
  piège anti-robots).
- Règles du formulaire : date au moins 5 jours à l'avance (samedi suivant par défaut, 19 h),
  durées selon le forfait, prix « sur soumission » au-delà de 150 personnes, option entreprise et
  événement extérieur. Le prix affiché au client est inclus dans le courriel.

## Sécurité

- **Politique de sécurité du contenu (CSP)** dans `index.html` : le navigateur n'accepte que les
  scripts du site, les polices Google et les envois vers Web3Forms. Pour ajouter un service
  externe (carte, vidéo, statistiques…), il faut l'autoriser dans la balise
  `Content-Security-Policy`, sinon il sera bloqué (et les tests échoueront).
- Aucun script directement dans la page : le code va dans `assets/site.js`.
- Le numéro de téléphone n'est jamais affiché en clair : seulement derrière les liens texto et
  appel.
- À garder activé : double authentification (2FA) sur GitHub, Squarespace, Web3Forms et le
  courriel ; verrouillage de transfert du domaine chez Squarespace ; **Enforce HTTPS** dans
  GitHub Pages ; protection de la branche `main`.

## Tests automatiques

Chaque pull request et chaque mise à jour de `main` lancent les tests dans GitHub Actions (onglet
**Actions**, workflow **Tests**, job **Tests du site**). Ils vérifient la page et le formulaire
dans Chrome (ordinateur et iPhone) et dans Safari/WebKit (iPhone) :

- la page se charge sans erreur, sans défilement horizontal, sans numéro de téléphone en clair ;
- la politique de sécurité (CSP) ne bloque rien et les liens « nouvel onglet » sont protégés ;
- le bouton PDF pointe vers un fichier présent dans le dépôt ;
- les valeurs par défaut du formulaire (samedi, 19 h, 1 journée, 150 personnes et moins) ;
- le délai minimum de 5 jours et les liens texto, appel et courriel ;
- les durées offertes et les prix estimés pour chaque forfait ;
- l'audience de plus de 150 personnes, l'option entreprise et l'événement extérieur ;
- l'envoi : tous les champs attendus sont transmis (l'envoi réel vers Web3Forms est simulé, aucun
  courriel n'est envoyé).

Pour les lancer sur un ordinateur (Node.js et Python 3 requis) :

```bash
npm install
npx playwright install
npm test
```

## Hébergement et domaine (référence)

- **GitHub Pages** : Settings → Pages → *Deploy from a branch*, branche `main`, dossier `/ (root)`,
  domaine personnalisé `lerepere.info`, **Enforce HTTPS** coché.
- **DNS chez Squarespace** (Domaines → lerepere.info → Paramètres DNS) :
  - 4 enregistrements **A** sur `@` : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
    `185.199.111.153`
  - 1 enregistrement **CNAME** sur `www` vers l'adresse `github.io` du compte GitHub
- Le Bio Site reste accessible à `bio.site/lereperesono` comme page de secours.
