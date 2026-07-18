# Local Watermark (`localwatermark`)

Select language / Choisissez la langue :
* [Français (#français)](#français)
* [English (#english)](#english)

---

<a id="français"></a>
# Version Française 🇫🇷

**Local Watermark** est une application pour Nextcloud qui permet d'apposer des filigranes permanents, hautement sécurisés et aplatis sur vos fichiers PDF, directement depuis le navigateur de l'utilisateur.

L'intégralité du traitement étant réalisée **100% côté client**, aucun document ne quitte votre infrastructure ou la machine de l'utilisateur, garantissant une confidentialité absolue des données sensibles.

## ✨ Fonctionnalités Majeures

* **Traitement Client-Side Pur :** Rendu et reconstruction du PDF gérés localement dans le navigateur via `pdfjs-dist` et `pdf-lib`.
* **Protection Avancée Anti-Détourage (IA) :**
  * *Vagues géométriques :* Superposition de lignes sinusoïdales mathématiques pour briser les motifs de reconnaissance des outils d'effacement automatique par IA.
  * *Bruit de grain pixelisé :* Injection de micro-bruit de fond aléatoire sur la structure de la page pour empêcher le détourage propre des textes sacralisés.
* **Performance Multi-threadée :** Utilisation de Web Workers natifs en arrière-plan pour traiter les pages lourdes sans jamais figer ou ralentir l'interface utilisateur.
* **Intégration Nextcloud Native :** Ajout d'une action "Ajouter un filigrane" directement dans le menu contextuel (clic droit) de l'application Fichiers (*Files*).
* **Sauvegarde Directe Cloud :** Possibilité de télécharger le fichier modifié sur sa machine ou de le réinjecter directement dans le dossier Nextcloud d'origine via WebDAV sécurisé.
* **Conformité CSP Stricte :** Le moteur de rendu (`pdf.worker.js`) est embarqué localement dans l'application. Aucun appel vers des CDN externes n'est effectué, respectant ainsi les politiques de sécurité (Content Security Policy) les plus strictes et permettant un fonctionnement en réseau fermé (Intranet).

## 🛠️ Installation et Compilation

### Prérequis
* Nextcloud 31 à 33
* Node.js (v18+) et npm

### Instructions de déploiement

1. Clonez ou placez ce dossier dans le répertoire `apps/` de votre serveur Nextcloud :
   ```bash
   cd /chemin/vers/votre/nextcloud/apps/
   git clone https://github.com/delavigne/local-watermark.git localwatermark
   ```

2. Allez dans le dossier de l'application et installez les dépendances Node.js :
   ```bash
   cd localwatermark
   npm install
   ```

3. Compilez l'application pour la production :
   ```bash
   npm run build
   ```
   *Note : Le script de build compile les composants Vue 3 / TypeScript et copie automatiquement le worker PDF.js au bon endroit pour assurer la conformité CSP.*

4. Activez l'application depuis l'interface d'administration de Nextcloud ou via la ligne de commande *occ* :
   ```bash
   # Depuis la racine de votre serveur Nextcloud
   php occ app:enable localwatermark
   ```

## 🔒 Sécurité et Spécifications

* **Licence :** AGPL
* **Namespace Nextcloud :** `OCA\LocalWatermark`
* **Format d'aplatissement :** Le PDF généré reconstruit chaque page sous forme d'image JPEG compressée haute fidélité fusionnée avec le filigrane. Cela supprime les couches de texte originales (vectorielles), rendant l'extraction ou la suppression du filigrane informatiquement impossible par de simples éditeurs PDF.

---

<a id="english"></a>
# English Version 🇬🇧

**Local Watermark** is a Nextcloud application that allows users to apply permanent, highly secure, and flattened watermarks to PDF files directly within their web browser.

Since the entire processing is performed **100% client-side**, no document ever leaves your infrastructure or the user's machine, ensuring absolute confidentiality for sensitive data.

## ✨ Key Features

* **Pure Client-Side Processing:** PDF rendering and reconstruction are handled locally in the browser using `pdfjs-dist` and `pdf-lib`.
* **Advanced Anti-AI Countermeasures:**
  * *Geometric Waves:* Overlays mathematical sinusoidal wave lines to break the pattern recognition algorithms of automated AI watermark removal tools.
  * *Pixel Grain Noise:* Injects structural micro-noise into the page background to prevent clean segmentation and background healing by AI models.
* **Multi-threaded Performance:** Utilizes native background Web Workers to process heavy documents without freezing or lagging the user interface.
* **Native Nextcloud Integration:** Registers an "Add a watermark" action directly inside the context menu (right-click) of the Files application.
* **Direct Cloud Saving:** Allows users to download the secured file locally or save it directly back to the original Nextcloud directory via secure WebDAV.
* **Strict CSP Compliance:** The rendering engine (`pdf.worker.js`) is hosted completely within the local application assets. No external CDN calls are made, satisfying strict Content Security Policies (CSP) and enabling full operation in air-gapped networks (Intranets).

## 🛠️ Installation and Compilation

### Prerequisites
* Nextcloud 31 to 33
* Node.js (v18+) and npm

### Deployment Instructions

1. Clone or place this folder inside the `apps/` directory of your Nextcloud server:
   ```bash
   cd /path/to/your/nextcloud/apps/
   git clone https://github.com/delavigne/local-watermark.git localwatermark
   ```

2. Navigate to the application folder and install the Node.js dependencies:
   ```bash
   cd localwatermark
   npm install
   ```

3. Compile the application for production:
   ```bash
   npm run build
   ```
   *Note: The build script compiles the Vue 3 / TypeScript components and automatically bundles the local PDF.js worker into place for full CSP compliance.*

4. Enable the application from the Nextcloud administration interface or via the *occ* command line:
   ```bash
   # From the root of your Nextcloud server
   php occ app:enable localwatermark
   ```

## 🔒 Security and Specifications

* **License:** AGPL
* **Nextcloud Namespace:** `OCA\LocalWatermark`
* **Flattening Mechanism:** The generated PDF converts each page into a compressed, high-fidelity JPEG image merged with the protective watermark elements. This completely discards original vector text layers, rendering the extraction or deletion of the watermark technologically impossible via standard PDF editors.
