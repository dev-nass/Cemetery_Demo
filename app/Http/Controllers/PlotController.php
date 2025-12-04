<?php

namespace App\Http\Controllers;

use App\Models\Plot;
use Illuminate\Http\JsonResponse;
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

    public function store(Request $request)
    {

        $validated = $request->validate([
            'section_id' => 'required',
            'geometry' => 'required|json',
        ]);

        $plot = Plot::create($validated);

        return response()->json($plot, 201);
    }

    public function update(Request $request)
    {
        $plot = Plot::findOrFail($request->plot_id);

        $plot->geometry = $request->geometry;
        $plot->save();

        return response()->json([
            'message' => 'Plot updated successfully!',
            'plot' => $plot
        ]);
    }
}
