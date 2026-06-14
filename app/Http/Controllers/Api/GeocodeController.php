<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class GeocodeController extends Controller
{
    /**
     * Search coordinates by query.
     */
    public function search(Request $request)
    {
        $query = $request->input('q', '');
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $params = http_build_query([
            'q' => $query . ', Indonesia',
            'format' => 'json',
            'limit' => '8',
            'countrycodes' => 'id',
            'addressdetails' => '1',
        ]);

        $url = "https://nominatim.openstreetmap.org/search?{$params}";
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "User-Agent: SIGAPPA/1.0\r\nAccept-Language: id\r\n",
                'timeout' => 10,
            ],
        ]);

        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            return response()->json([]);
        }

        return response($response)->header('Content-Type', 'application/json');
    }

    /**
     * Reverse geocode coordinates to address.
     */
    public function reverse(Request $request)
    {
        $lat = $request->input('lat');
        $lon = $request->input('lon');
        if (!$lat || !$lon) {
            return response()->json([]);
        }

        $params = http_build_query([
            'lat' => $lat,
            'lon' => $lon,
            'format' => 'json',
            'addressdetails' => '1',
        ]);

        $url = "https://nominatim.openstreetmap.org/reverse?{$params}";
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "User-Agent: SIGAPPA/1.0\r\nAccept-Language: id\r\n",
                'timeout' => 10,
            ],
        ]);

        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            return response()->json([]);
        }

        return response($response)->header('Content-Type', 'application/json');
    }
}
