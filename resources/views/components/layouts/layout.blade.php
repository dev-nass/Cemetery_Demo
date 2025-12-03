<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', config('app.name', 'Laravel'))</title>

    @vite(['resources/css/app.css', 'resources/js/app.js'])

    {{-- Extra page-specific styles --}}
    @stack('styles')
</head>

<body class="bg-gray-50 text-gray-900">

    {{-- Navbar or header can go here if needed --}}
    <main class="py-4">
        @yield('content')
    </main>

    {{-- Extra page-specific scripts --}}
    @stack('scripts')
    @routes
</body>

</html>