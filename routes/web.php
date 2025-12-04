<?php

use App\Http\Controllers\PlotController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn() => view('welcome'));


Route::controller(PlotController::class)
    ->prefix('plots')
    ->group(function () {
        Route::get('/geojson', 'geoJson')->name('plots.geojson');
        Route::post('/plots', 'store')->name('plot.store');
        Route::put('/plots/update', 'update')->name('plot.update');
    });

