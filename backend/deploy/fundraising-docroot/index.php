<?php

use App\Kernel;

/*
 * Front controller pour le déploiement Hostinger mutualisé.
 *
 * Ce fichier vit dans   public_html/fundraising/   (= document root du sous-domaine
 * api-fundraising.centreculturel.cd), tandis que le code complet du projet vit en
 * dehors de public_html, dans   <home>/domains/centreculturel.cd/fundraising-api/.
 *
 * Arborescence attendue sur le serveur :
 *   domains/centreculturel.cd/
 *   ├── fundraising-api/          (projet complet : vendor/, src/, config/, var/, .env.local)
 *   └── public_html/
 *       └── fundraising/          (CE dossier — document root du sous-domaine)
 *           ├── index.php         (ce fichier)
 *           └── .htaccess
 *
 * dirname(__DIR__, 2) = .../domains/centreculturel.cd  →  on rejoint le projet hors web root.
 * Le Kernel résout tout seul son project_dir (var/, config/, .env) vers le vrai dossier projet.
 */
require_once dirname(__DIR__, 2).'/fundraising-api/vendor/autoload_runtime.php';

return static function (array $context) {
    return new Kernel($context['APP_ENV'], (bool) $context['APP_DEBUG']);
};
