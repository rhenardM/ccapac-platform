<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Sert les fichiers uploadés (images, PDF) stockés dans public/uploads/media.
 * Portable quel que soit le document root (le fichier transite par l'app),
 * avec cache long. Le motif de route interdit tout slash → pas de path traversal.
 */
class MediaFileController extends AbstractController
{
    #[Route('/uploads/media/{filename}', name: 'media_file', methods: ['GET'], requirements: ['filename' => '[A-Za-z0-9._-]+'])]
    public function serve(
        string $filename,
        #[Autowire('%kernel.project_dir%/public/uploads/media')] string $mediaDir,
    ): Response {
        $path = $mediaDir . '/' . basename($filename);
        if (!is_file($path)) {
            throw new NotFoundHttpException('Fichier introuvable.');
        }

        $response = new BinaryFileResponse($path);
        $response->setPublic();
        $response->setMaxAge(31536000); // 1 an (les noms de fichiers sont uniques)
        $response->setImmutable();

        return $response;
    }
}
