<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PlotController extends Controller
{
    public function geoJson(): JsonResponse
    {
        $plots = Plot::with('section')->get();

        $features = $plots->map(function ($plot) {
            return [
                'type' => 'Feature',
                'properties' => [
                    'plot_id' => $plot->id,
                    'plot_num' => $plot->plot_num,
                    'section_id' => $plot->section->name ?? 'N/A',
                    'status' => $plot->status,
                    'area_sqm' => $plot->area_sqm,
                ],
                'geometry' => json_decode($plot->geometry, true),
            ];
        });

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $features,
        ]);
}
