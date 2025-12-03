{{-- resources/views/map.blade.php --}}
@extends('components.layouts.layout')

@section('title', 'Cemetery Map')

@section('content')
    <div class="container-fluid">
        <section class="flex justify-around items-center mb-3">
            <h4>Cemetery Map</h4>

            <button command="show-modal" commandfor="drawer"
                class="rounded-md bg-white/10 px-2.5 py-1.5 text-sm font-semibold text-white inset-ring inset-ring-white/5 flex items-center dark:bg-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
                    class="lucide lucide-plus-icon lucide-plus me-2">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                </svg>
                Deceased Record</button>

        </section>

        {{-- Polygon Acton Buttons --}}
        <section>
            <button id="save-plot-btn"
                class="mt-3 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 transition-colors cursor-not-allowed opacity-50"
                disabled>
                <span id="save-plot-text">Draw a Plot to Enable Save</span>
            </button>
        </section>
        <div id="map" style="height: 80vh; border-radius: 10px;"></div>

        <el-dialog>
            <dialog id="drawer" aria-labelledby="drawer-title"
                class="fixed inset-0 size-auto max-h-none max-w-none overflow-hidden bg-transparent not-open:hidden backdrop:bg-transparent">
                <el-dialog-backdrop
                    class="absolute inset-0 bg-gray-900/50 transition-opacity duration-500 ease-in-out data-closed:opacity-0"></el-dialog-backdrop>

                <div tabindex="0" class="absolute inset-0 pl-10 focus:outline-none sm:pl-16">
                    <el-dialog-panel
                        class="group/dialog-panel relative ml-auto block size-full max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700">
                        <!-- Close button, show/hide based on slide-over state. -->
                        <div
                            class="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 duration-500 ease-in-out group-data-closed/dialog-panel:opacity-0 sm:-ml-10 sm:pr-4">
                            <button type="button" command="close" commandfor="drawer"
                                class="relative rounded-md text-gray-400 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                                <span class="absolute -inset-2.5"></span>
                                <span class="sr-only">Close panel</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                                    data-slot="icon" aria-hidden="true" class="size-6">
                                    <path d="M6 18 18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </button>
                        </div>

                        <div
                            class="relative flex h-full flex-col overflow-y-auto bg-gray-800 py-6 shadow-xl after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-white/10">
                            <div class="px-4 sm:px-6">
                                <h2 id="drawer-title" class="text-base font-semibold text-white">Panel title</h2>
                            </div>
                            <div class="relative mt-6 flex-1 px-4 sm:px-6">
                                <!-- Your content -->

                                <pre id="geojson-output"
                                    class="mt-2 p-2 text-xs bg-white rounded-md overflow-x-auto text-red-700">
                                No polygon drawn yet.</pre>
                            </div>
                        </div>
                    </el-dialog-panel>
                </div>
            </dialog>
        </el-dialog>
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
    @routes
@endpush