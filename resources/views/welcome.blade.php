{{-- resources/views/map.blade.php --}}
@extends('components.layouts.layout')

@section('title', 'Cemetery Map')

@section('content')
    <div class="container-fluid">
        <h4 class="mb-3">Cemetery Map</h4>
        <div id="map" style="height: 80vh; border-radius: 10px;"></div>
    </div>
@endsection

@push('styles')
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <style>
        #map {
            height: 80vh;
            width: 100%;
        }
    </style>
@endpush

@push('scripts')
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const map = L.map('map').setView([14.3095, 120.9367], 18);

            // 🗺️ Add Google Satellite Tiles
            L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            }).addTo(map);

            // 📥 Fetch plots from backend (Laravel route)
            fetch('{{ route('plots.geojson') }}')
                .then(response => response.json())
                .then(data => {
                    L.geoJSON(data, {
                        style: feature => ({
                            fillColor: {
                                'available': '#90EE90',
                                'occupied': '#FFB6C6',
                                'reserved': '#FFE66D'
                            }[feature.properties.status] || '#CCCCCC',
                            weight: 1,
                            color: 'white',
                            fillOpacity: 0.7
                        }),
                        onEachFeature: (feature, layer) => {
                            layer.bindPopup(`
                                        <strong>Plot: ${feature.properties.plot_id}</strong><br>
                                        Section: ${feature.properties.section_id}<br>
                                        Status: ${feature.properties.status}<br>
                                        Area: ${feature.properties.area_sqm} sq.m
                                 `);
                        }
                    }).addTo(map);
                })
                .catch(err => console.error('Error loading GeoJSON:', err));
        });
    </script>
@endpush