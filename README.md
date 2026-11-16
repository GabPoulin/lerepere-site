# lerepere.info — site du Repère

Site d'une page, sans outil à installer : `index.html` + le dossier `assets/`.

## Mettre en ligne avec GitHub Pages (gratuit)

1. Sur github.com, créez un dépôt public nommé `lerepere-site`.
2. Cliquez **Add file → Upload files** et glissez `index.html`, `README.md` et le dossier `assets` (en gardant le dossier tel quel). Cliquez **Commit changes**.
3. Allez dans **Settings → Pages**. Sous *Build and deployment*, choisissez **Deploy from a branch**, branche `main`, dossier `/ (root)`, puis **Save**.
4. Après 1 ou 2 minutes, le site est en ligne à `https://VOTRE-NOM.github.io/lerepere-site/`. Testez-le là d'abord.

## Brancher lerepere.info (quand le site vous plaît)

1. Dans GitHub, **Settings → Pages → Custom domain** : entrez `lerepere.info` et cliquez **Save** (GitHub ajoute un fichier `CNAME`).
2. Dans Squarespace (**Domaines → lerepere.info → Paramètres DNS**) : retirez la redirection vers le Bio Site, puis ajoutez :
   - 4 enregistrements **A** sur `@` : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - 1 enregistrement **CNAME** sur `www` : `VOTRE-NOM.github.io`
3. Attendez la propagation (de quelques minutes à quelques heures), puis cochez **Enforce HTTPS** dans GitHub Pages.

Le Bio Site reste accessible à `bio.site/lereperesono` comme page de secours.

## Modifier un texte ou un prix

Tout est dans `index.html`. Sur GitHub, ouvrez le fichier, cliquez le crayon, modifiez, puis **Commit changes**. Le site se met à jour en environ une minute.
