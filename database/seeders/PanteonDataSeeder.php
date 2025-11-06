<?php

namespace Database\Seeders;

use App\Models\Plot;
use App\Models\Section;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PanteonDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->seedSections();
        $this->seedPlots();
    }

    private function seedSections()
    {
        $geoJsonPath = public_path('data/panteon_sections.geojson');

        if (!file_exists($geoJsonPath)) {
            $this->command->error("GeoJSON file not found at path: " . $geoJsonPath);
            return;
        }

        $geoJson = json_decode(file_get_contents($geoJsonPath), true);

        if (!isset($geoJson['features'])) {
            $this->command->error("Invalid GeoJSON format: 'features' key not found.");
            return;
        }

        $this->command->info("Importing sections...");

        foreach ($geoJson['features'] as $feature) {
            $properties = $feature['properties'];

            Section::updateOrCreate([
                'id' => $properties['id'] ?? null,
                'name' => $properties['name'] ?? 'Unnamed',
                'geometry' => json_encode($feature['geometry']),
            ]);
        }

        $this->command->info("Sections imported: " . count($geoJson['features']));
    }


    private function seedPlots()
    {
        $geojsonPath = public_path('data/panteon_plots.geojson');

        if (!file_exists($geojsonPath)) {
            $this->command->error("GeoJSON file not found: {$geojsonPath}");
            return;
        }

        $geojson = json_decode(file_get_contents($geojsonPath), true);

        if (!isset($geojson['features'])) {
            $this->command->error("Invalid GeoJSON format");
            return;
        }

        $this->command->info("Importing plots...");

        foreach ($geojson['features'] as $feature) {
            $properties = $feature['properties'];

            Plot::updateOrCreate([
                'id' => $properties['id'] ?? null,
                'section_id' => $properties['section_id'] ?? null,
                'geometry' => json_encode($feature['geometry'])
            ]);
        }

        $this->command->info("Plots imported: " . count($geojson['features']));
    }
}
