<?php

namespace Tests\Feature;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Tests\TestCase;

class FrontendSubmitRoutesTest extends TestCase
{
    public function test_frontend_state_changing_routes_are_registered(): void
    {
        $endpoints = [
            ['POST', '/login'],
            ['POST', '/register'],
            ['POST', '/check-nip'],
            ['POST', '/logout'],
            ['POST', '/email/verification-notification'],
            ['POST', '/evaluasi-sistem'],
            ['POST', '/testimoni/public'],
            ['POST', '/testimoni/KODE123'],
            ['POST', '/kumpul-arsip'],
            ['POST', '/kumpul-arsip/KODE123'],
            ['PUT', '/profile/edit'],
            ['POST', '/pengajuan'],
            ['PUT', '/pengajuan/KODE123'],
            ['POST', '/pengajuan/KODE123/resubmit'],

            ['POST', '/direktur/pengajuan/1/approve'],
            ['POST', '/direktur/pengajuan/1/decline'],
            ['POST', '/direktur/pengajuan/1/revise'],

            ['POST', '/secret/appreciation/dev'],
            ['PUT', '/secret/appreciation/dev/1'],
            ['DELETE', '/secret/appreciation/dev/1'],
            ['POST', '/secret/appreciation/doc'],
            ['PUT', '/secret/appreciation/doc/1'],
            ['DELETE', '/secret/appreciation/doc/1'],
            ['PUT', '/secret/settings'],

            ['POST', '/admin/historis/manual'],
            ['POST', '/admin/historis/preview'],
            ['POST', '/admin/historis/excel'],
            ['DELETE', '/admin/pengajuan/bulk'],
            ['PUT', '/admin/pengajuan/1'],
            ['DELETE', '/admin/pengajuan/1'],
            ['PUT', '/admin/pengajuan/1/status'],
            ['PUT', '/admin/pengajuan/1/lokasi'],
            ['PUT', '/admin/pengajuan/1/tanggal-pengajuan'],
            ['POST', '/admin/pengajuan/1/tim'],
            ['PUT', '/admin/pengajuan/1/tim'],
            ['DELETE', '/admin/pengajuan/1/tim/2'],
            ['PUT', '/admin/pengajuan-logs/1'],
            ['DELETE', '/admin/pengajuan-logs/1'],

            ['POST', '/admin/pegawai'],
            ['POST', '/admin/pegawai/import'],
            ['PUT', '/admin/pegawai/1'],
            ['DELETE', '/admin/pegawai/1'],
            ['DELETE', '/admin/pegawai/bulk'],
            ['POST', '/admin/users'],
            ['PUT', '/admin/users/1'],
            ['DELETE', '/admin/users/1'],
            ['DELETE', '/admin/users/bulk'],
            ['POST', '/admin/aktivitas/send-undangan'],
            ['PUT', '/admin/aktivitas/1'],
            ['DELETE', '/admin/aktivitas/1'],
            ['DELETE', '/admin/aktivitas/bulk'],
            ['POST', '/admin/testimoni'],
            ['PUT', '/admin/testimoni/1'],
            ['DELETE', '/admin/testimoni/1'],
            ['DELETE', '/admin/testimoni/bulk'],
            ['POST', '/admin/master/jenis-pkm'],
            ['PUT', '/admin/master/jenis-pkm/1'],
            ['DELETE', '/admin/master/jenis-pkm/1'],
            ['DELETE', '/admin/master/jenis-pkm/bulk'],
            ['POST', '/admin/templates'],
            ['DELETE', '/admin/templates/panduan'],
            ['POST', '/admin/arsip'],
            ['PUT', '/admin/arsip/1'],
            ['DELETE', '/admin/arsip/1'],
            ['DELETE', '/admin/arsip/bulk'],
            ['POST', '/admin/kontak'],
            ['PUT', '/admin/kontak/1'],
            ['DELETE', '/admin/kontak/1'],
            ['DELETE', '/admin/kontak/bulk'],
            ['PUT', '/admin/kontak/visitor-offset'],
            ['PATCH', '/admin/evaluasi-sistem/1/date'],
            ['DELETE', '/admin/evaluasi-sistem/1'],
            ['DELETE', '/admin/evaluasi-sistem/bulk'],
            ['POST', '/admin/api/notifications/mark-read'],
            ['POST', '/admin/api/notifications/mark-all-read'],
        ];

        foreach ($endpoints as [$method, $uri]) {
            try {
                $route = Route::getRoutes()->match(Request::create($uri, $method));
            } catch (NotFoundHttpException|MethodNotAllowedHttpException $exception) {
                $this->fail("Frontend submit endpoint is not registered: {$method} {$uri}");
            }

            $this->assertNotNull($route->getActionName(), "Endpoint did not resolve an action: {$method} {$uri}");
        }
    }
}
