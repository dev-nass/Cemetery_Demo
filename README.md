# Cemetery Demo

-   Colorized plots added

# Packages Use

-   Ziggy
-   Leaflet and Leaflet Draw (Through CDN)

# Learnings

-   It's more efficient to use blade layout thorugh template inheritance (https://laravel.com/docs/12.x/blade#extending-a-layout)

```php
// instead of
<x-layout>Something here</x-layout>

// Use
@extends('layouts.app') @section('title', 'Title here')

@section('content')
    <p>This is my body content.</p>
@endsection
```

-   Leaflet Draw is only available through CDN
