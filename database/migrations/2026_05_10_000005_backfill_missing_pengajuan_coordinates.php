<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Make restored PKM rows visible on the map by filling missing coordinates.
     */
    public function up(): void
    {
        if (
            ! Schema::hasTable('pengajuan')
            || ! Schema::hasColumn('pengajuan', 'latitude')
            || ! Schema::hasColumn('pengajuan', 'longitude')
        ) {
            return;
        }

        $rows = DB::table('pengajuan')
            ->whereNull('latitude')
            ->orWhereNull('longitude')
            ->orderBy('id_pengajuan')
            ->get(['id_pengajuan', 'provinsi', 'kota_kabupaten']);

        foreach ($rows as $row) {
            [$lat, $lng] = $this->coordinatesFor($row->kota_kabupaten, $row->provinsi);
            [$lat, $lng] = $this->jitter($lat, $lng, (int) $row->id_pengajuan);

            DB::table('pengajuan')
                ->where('id_pengajuan', $row->id_pengajuan)
                ->update([
                    'latitude' => $lat,
                    'longitude' => $lng,
                ]);
        }
    }

    public function down(): void
    {
        // Repair migration: keep restored coordinates intact.
    }

    private function coordinatesFor(?string $city, ?string $province): array
    {
        $map = [
            'ambon' => [-3.6954, 128.1814],
            'bantaeng' => [-5.5480, 119.9490],
            'barru' => [-4.4173, 119.6730],
            'bone' => [-4.5388, 120.3279],
            'bulukumba' => [-5.5586, 120.1900],
            'enrekang' => [-3.5631, 119.7612],
            'gorontalo' => [0.5435, 123.0568],
            'gowa' => [-5.3103, 119.7426],
            'jeneponto' => [-5.6765, 119.7450],
            'kubu' => [-8.2516, 115.5669],
            'labuan bajo' => [-8.4964, 119.8877],
            'likupang' => [1.6765, 125.0547],
            'lombok tengah' => [-8.7054, 116.2706],
            'luwu' => [-3.3052, 120.2516],
            'luwu timur' => [-2.5826, 121.1710],
            'luwu utara' => [-2.6000, 120.2500],
            'makassar' => [-5.1477, 119.4327],
            'mamasa' => [-2.9426, 119.3777],
            'manado' => [1.4748, 124.8421],
            'maros' => [-5.0060, 119.5723],
            'minahasa utara' => [1.5328, 124.9948],
            'palopo' => [-3.0016, 120.1985],
            'pangkep' => [-4.8057, 119.5572],
            'parepare' => [-4.0096, 119.6291],
            'penajam paser utara' => [-1.2917, 116.5150],
            'pinrang' => [-3.7931, 119.6408],
            'polewali mandar' => [-3.4324, 119.3435],
            'raja ampat' => [-0.2333, 130.5167],
            'selayar' => [-6.1214, 120.4596],
            'sidrap' => [-3.7739, 119.6522],
            'sinjai' => [-5.1241, 120.2530],
            'soppeng' => [-4.3519, 119.9278],
            'takalar' => [-5.4162, 119.4876],
            'tana toraja' => [-3.0753, 119.7426],
            'toraja utara' => [-2.8622, 119.8352],
            'wajo' => [-4.0035, 120.0665],
            'wakatobi' => [-5.3193, 123.5948],
        ];

        $provinceMap = [
            'kalimantan timur' => [-0.5022, 117.1536],
            'maluku' => [-3.6954, 128.1814],
            'papua barat' => [-0.8762, 131.2558],
            'sulawesi selatan' => [-5.1477, 119.4327],
            'sulawesi tenggara' => [-5.3193, 123.5948],
            'sulawesi utara' => [1.4748, 124.8421],
        ];

        $cityKey = $this->normalizeLocation($city);
        $provinceKey = $this->normalizeLocation($province);

        foreach ($map as $key => $coordinates) {
            if ($cityKey === $key || Str::contains($cityKey, $key)) {
                return $coordinates;
            }
        }

        return $provinceMap[$provinceKey] ?? [-5.1477, 119.4327];
    }

    private function normalizeLocation(?string $value): string
    {
        $value = Str::of((string) $value)
            ->lower()
            ->replace(['kabupaten ', 'kab. ', 'kota ', '&'], ['', '', '', ' '])
            ->replaceMatches('/[^a-z0-9 ]+/', ' ')
            ->squish()
            ->toString();

        return $value === '-' ? '' : $value;
    }

    private function jitter(float $lat, float $lng, int $id): array
    {
        $latOffset = (($id % 9) - 4) * 0.006;
        $lngOffset = ((intdiv($id, 9) % 9) - 4) * 0.006;

        return [
            round($lat + $latOffset, 7),
            round($lng + $lngOffset, 7),
        ];
    }
};
