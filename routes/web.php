<?php

use App\Http\Controllers\PlotController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn() => view('welcome'));


Route::get('/plots/geojson', [PlotController::class, 'geoJson'])->name('plots.geojson');

