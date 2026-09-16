{{-- Crawler-visible copy of the directory. Flarum renders this inside
     <noscript>, so it is what a search engine reads when it does not run the
     page's JS. Keep it plain: headings, names, links to each profile. --}}
<div class="MemberDirectory-seo">
    <h1>{{ $heading }}</h1>

    @foreach ($groups as $group)
        <section>
            @if ($group['heading'] !== '')
                <h2>{{ $group['isPast'] ? $pastHeading . ' — ' . $group['heading'] : $group['heading'] }}</h2>
            @elseif ($group['isPast'])
                <h2>{{ $pastHeading }}</h2>
            @endif

            <ul>
                @foreach ($group['members'] as $member)
                    <li>
                        <a href="{{ $member['url'] }}">{{ $member['name'] }}</a>
                        (&#64;{{ $member['username'] }})@if ($member['position'] !== null) — {{ $member['position'] }}@endif
                        @if ($member['startedAt'] !== null)
                            <time datetime="{{ $member['startedAt'] }}">{{ $member['startedAt'] }}</time>
                            &ndash;
                            @if ($member['endedAt'] !== null)
                                <time datetime="{{ $member['endedAt'] }}">{{ $member['endedAt'] }}</time>
                            @else
                                {{ $presentLabel }}
                            @endif
                        @endif
                    </li>
                @endforeach
            </ul>
        </section>
    @endforeach
</div>
