# Pilote V2 · Ton cocon

Application statique pensée pour les moments de crise : respiration guidée, mode autonomie et invitation familiale sans collecte ni mesure.

## Philosophie
- Priorité à la stabilité : fond bleu, interface minimale, ton neutre.
- Respiration guidée de 60 à 90 secondes, sans texte pendant le cycle.
- Aucun suivi, aucune récompense, aucun historique.
- Le lien familial n’apparaît qu’à la demande via le mode "Inviter".

## Structure
```
index.html      # point d’entrée (cocon par défaut)
styles.css      # design mobile-first, sphère animée, contrastes doux
app.js          # logique des modes, minuteries, sorties douces
manifest.json   # déclaration PWA (optionnelle)
service-worker.js (optionnel) # cache offline des actifs statiques
assets/, icons/ # visuels supplémentaires
```

## Utilisation
1. Ouvrir `index.html` dans un navigateur moderne pour accéder immédiatement au cocon.
2. Boutons disponibles : `Encore` relance la respiration, `Inviter` ouvre le rituel commun, `Mode autonomie` lance le timer libre.
3. Aucun stockage sauf sauvegarde locale facultative des réponses au rituel (localStorage).

## Mode hors-ligne (PWA)
La PWA fonctionne uniquement via un serveur local (les service workers ne s’activent pas avec le protocole `file://`).

```bash
# Exemple avec serve (installé via npm)
npx serve .
# ou tout autre serveur statique (python -m http.server, etc.)
```
Ensuite, ouvrir `http://localhost:3000` (ou le port indiqué), accepter l’installation si proposée.

## Accessibilité
- Animation de respiration adoucie pour `prefers-reduced-motion`.
- Boutons larges (≥44px), contraste suffisant, focus visibles.
