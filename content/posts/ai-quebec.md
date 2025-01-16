---
title: "AI - Chansons du Vieux Québec"
date: 2025-01-16T09:46:58Z
tags: ["music", "ai", "projects"]
draft: true
---

### Breathing New Life into Traditional Quebecois Songs with AI

In late 2024, I stumbled upon a delightful book titled _Chansons du Vieux Québec_ at the Last Bookshop Jericho in Oxford. Published in 1946, this book is a treasure trove of traditional Quebecois songs, complete with music scores. The idea of using AI to revive these songs struck me as a fascinating project.

#### Step 1: Digitizing the Book

The first step was to photograph all 250 pages of the book. Armed with my Android phone, I captured each page, and thanks to auto-sync with Google Photos, I quickly transferred the images to my computer. The photos were in HEIC format, Android’s default for saving space, so I converted them to JPEG. Some images needed rotation corrections, which I accomplished using the `convert` command from the ImageMagick library.

#### Step 2: Extracting Text and Lyrics

To extract text and song lyrics, I turned to Google Cloud’s Vision API. Using a simple Go script, I iterated over the images, requested OCR responses in JSON format, and saved the results to disk. This process efficiently converted the photographed text into a machine-readable format.

#### Step 3: Setting Up AI for Sheet Music Recognition

The heart of the project involved converting sheet music to a usable digital format. For this, I leveraged a modest yet capable 2016 NVIDIA GTX 1070 GPU with 8 GB of GDDR5 memory, running CUDA 16.6. After exploring GitHub, I found two promising tools: [BreezeWhite/oemer](https://github.com/BreezeWhite/oemer) and [liebharc/homr](https://github.com/liebharc/homr). Both tools process sheet music images into MusicXML files, but _homr_ emerged as the better fit because it supports scores with more than two staves per group—a common feature in _Chansons du Vieux Québec_.

#### Step 4: Converting Sheet Music with AI

Setting up CUDA and _homr_ was a bit challenging, but I appreciated _homr_’s use of Python’s Poetry dependency manager, which streamlined the installation. Once configured, processing the sheet music was straightforward. I wrote a simple bash script to process images asynchronously, which completed in a few hours. A nice bonus: _homr_ generates a `_teaser.png` for each successful detection, overlaying the original image with color-highlighted staff lines.

#### Step 5: Creating Audio and Visual Outputs

With the MusicXML files ready, I needed to generate audio (MP3) and visual (PNG/PDF) outputs. Enter [MuseScore](https://musescore.org), a free and open-source tool perfect for this task. Another bash script handled the batch conversion efficiently.

#### Building the Web Experience

To present the results, I created a web app hosted on S3 using RemixJS and DaisyUI. A Go script traversed the generated files and produced a JSON representation baked into the app. The UI allows users to browse by chapter, theme, or song, view scanned pages, read extracted text, and listen to audio recordings.

#### Future Directions

The project is far from complete. A logical next step is aggregating a song’s MusicXML files into a single file using tools like _Relieur_. This would allow generating a cohesive MP3 for each song, accommodating musical nuances like repeat signs and first/second endings programmatically.

Another exciting prospect involves overlaying the music with AI-generated singing. Research led me to tools like VidnozAI for generating Quebecois-accented speech and kit.ai for converting speech to singing. This idea remains a hypothesis, but it’s an avenue I’m eager to explore.

#### Conclusion

The _Chansons du Vieux Québec_ project has been a rewarding journey, blending traditional culture with modern technology. The current results are available at [ndelor.me/projects/quebec](https://www.ndelor.me/projects/quebec). This intersection of history, AI, and creativity has immense potential, and I’m excited about where it might lead next.

---

### Faire revivre les chansons traditionnelles québécoises grâce à l’IA

Fin 2024, j’ai découvert un livre merveilleux intitulé _Chansons du Vieux Québec_ à la librairie Last Bookshop Jericho à Oxford. Publié en 1946, ce livre est un véritable trésor de chansons traditionnelles québécoises accompagnées de partitions musicales. L’idée d’utiliser l’IA pour faire revivre ces chansons m’a semblé être un projet fascinant.

#### Étape 1 : Numériser le livre

La première étape consistait à photographier les 250 pages du livre. Munis de mon téléphone Android, j’ai capturé chaque page. Grâce à la synchronisation automatique avec Google Photos, j’ai rapidement transféré les images sur mon ordinateur. Les photos étaient au format HEIC, le format par défaut d’Android pour économiser de l’espace, alors je les ai converties au format JPEG. Certaines images nécessitaient des corrections de rotation, que j’ai réalisées avec la commande `convert` de la bibliothèque ImageMagick.

#### Étape 2 : Extraire les textes et les paroles

Pour extraire les textes et les paroles des chansons, j’ai utilisé l’API Vision de Google Cloud. Avec un script Go simple, j’ai parcouru les images, demandé des réponses OCR au format JSON et enregistré les résultats sur disque. Ce processus a permis de convertir efficacement les textes photographiés en un format lisible par machine.

#### Étape 3 : Configurer l’IA pour la reconnaissance des partitions

Le cœur du projet était de convertir les partitions en un format numérique utilisable. Pour cela, j’ai utilisé un GPU NVIDIA GTX 1070 de 2016, modeste mais performant, avec 8 Go de mémoire GDDR5, fonctionnant sous CUDA 16.6. En explorant GitHub, j’ai trouvé deux outils prometteurs : [BreezeWhite/oemer](https://github.com/BreezeWhite/oemer) et [liebharc/homr](https://github.com/liebharc/homr). Ces outils traitent les images de partitions en fichiers MusicXML, mais _homr_ s’est avéré plus adapté car il prend en charge les partitions contenant plus de deux portées par groupe—une caractéristique fréquente dans _Chansons du Vieux Québec_.

#### Étape 4 : Conversion des partitions avec l’IA

Configurer CUDA et _homr_ n’était pas une mince affaire, mais j’ai apprécié l’utilisation de l’outil de gestion des dépendances Poetry par _homr_, ce qui a facilité l’installation. Une fois configuré, le traitement des partitions était simple. J’ai écrit un script bash pour traiter les images de manière asynchrone, terminant en quelques heures. Un bonus : _homr_ génère un fichier `_teaser.png` pour chaque détection réussie, superposant des lignes de portées colorées à l’image originale.

#### Étape 5 : Créer des sorties audio et visuelles

Avec les fichiers MusicXML prêts, il fallait générer des sorties audio (MP3) et visuelles (PNG/PDF). J’ai découvert [MuseScore](https://musescore.org), un outil gratuit et open-source parfait pour cette tâche. Un autre script bash a permis d’effectuer la conversion par lots sans problème.

#### Construire l’expérience web

Pour présenter les résultats, j’ai créé une application web hébergée sur S3 utilisant RemixJS et DaisyUI. Un script Go a parcouru les fichiers générés et produit une représentation JSON intégrée à l’application. L’interface utilisateur permet de naviguer par chapitre, thème ou chanson, de visualiser les pages scannées, de lire le texte extrait et d’écouter les enregistrements audio.

#### Perspectives d’avenir

Le projet est loin d’être terminé. Une étape logique serait d’agréger les fichiers MusicXML d’une chanson en un seul fichier à l’aide d’outils comme _Relieur_. Cela permettrait de générer un MP3 cohérent pour chaque chanson, en intégrant des nuances musicales comme les signes de reprise et les premières/deuxièmes fins de manière programmatique.

Une autre perspective passionnante est de superposer la musique avec des voix générées par l’IA. Mes recherches m’ont conduit à des outils comme VidnozAI pour générer un discours avec un accent québécois, et kit.ai pour transformer le discours en chant. Cette idée reste une hypothèse, mais c’est une piste que j’ai hâte d’explorer.

#### Conclusion

Le projet _Chansons du Vieux Québec_ a été une aventure enrichissante, mélangeant culture traditionnelle et technologie moderne. Les résultats actuels sont disponibles sur [ndelor.me/projects/quebec](https://www.ndelor.me/projects/quebec). L’intersection entre histoire, IA et créativité offre un potentiel immense, et je suis enthousiaste quant à l’avenir de ce projet.
