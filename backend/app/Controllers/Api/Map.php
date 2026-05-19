<?php

namespace App\Controllers\Api;

use App\Models\SiteModel;

class Map extends BaseApiController
{
    public function sites()
    {
        $model = new SiteModel();
        $sites = $model->withCounts();

        // Time-in-shaft data (from movement events / sensor data in a real system)
        $shaftData = [
            ['shaft' => 'Mponeng 4-shaft',        'hours' => 14.2],
            ['shaft' => 'Mponeng 1-shaft',         'hours' => 12.6],
            ['shaft' => 'Tau Tona main decline',   'hours' => 11.5],
            ['shaft' => 'South Deep twin',         'hours' => 10.2],
            ['shaft' => 'Driefontein 5-shaft',     'hours' => 9.0],
            ['shaft' => 'Kusasalethu main',        'hours' => 7.7],
            ['shaft' => 'Kloof 7-shaft',           'hours' => 6.0],
        ];

        return $this->ok([
            'sites'      => $sites,
            'shaft_data' => $shaftData,
        ]);
    }
}
