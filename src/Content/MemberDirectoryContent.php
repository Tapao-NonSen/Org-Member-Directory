<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

namespace Tapao\OrgMemberDirectory\Content;

use Flarum\Frontend\Document;
use Flarum\Http\RequestUtil;
use Flarum\Http\UrlGenerator;
use Flarum\Locale\Translator;
use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Psr\Http\Message\ServerRequestInterface;
use Tapao\OrgMemberDirectory\Model\MemberRecord;
use Tapao\OrgMemberDirectory\Model\Position;

/**
 * Server-rendered content for the /members page.
 *
 * The directory is fetched over the API after boot, so a crawler that does not
 * run the JS saw an empty page. Flarum renders $document->content inside
 * <noscript>, which is what search engines read, so the member list is built
 * here as plain HTML alongside the meta tags and JSON-LD.
 */
class MemberDirectoryContent
{
    public function __construct(
        protected SettingsRepositoryInterface $settings,
        protected UrlGenerator $url,
        protected Translator $translator,
        protected ViewFactory $view
    ) {
    }

    public function __invoke(Document $document, ServerRequestInterface $request): void
    {
        $actor = RequestUtil::getActor($request);
        $forumTitle = (string) $this->settings->get('forum_title');
        $pageTitle = $this->translator->trans('tapao-org-member-directory.forum.page.title');

        $document->title = $pageTitle;
        $document->canonicalUrl = $this->url->to('forum')->path('members');

        // Guests who cannot view the directory must not be served member names,
        // and that stripped-down page must not be what Google indexes.
        if (! $actor->hasPermission('member-directory.view')) {
            $document->meta['robots'] = 'noindex, follow';

            return;
        }

        $groups = $this->groups();
        $people = $this->people($groups);

        $description = $this->description($pageTitle, $forumTitle, $people);
        $document->meta['description'] = $description;

        $document->head[] = $this->openGraph($pageTitle, $forumTitle, $description, $document->canonicalUrl);
        $document->head[] = $this->jsonLd($pageTitle, $forumTitle, $document->canonicalUrl, $people);

        $document->content = $this->view->make('tapao-org-member-directory::content', [
            'heading' => $pageTitle,
            'groups' => $groups,
            'pastHeading' => $this->translator->trans('tapao-org-member-directory.forum.page.past_members_heading'),
            'presentLabel' => $this->translator->trans('tapao-org-member-directory.forum.page.tenure_present'),
        ]);
    }

    /**
     * Current members by position, then positionless, then past members by
     * cohort — the same order and visibility rules the page itself uses.
     *
     * @return array<int, array{heading: string, isPast: bool, members: array<int, array<string, mixed>>}>
     */
    private function groups(): array
    {
        $groups = [];

        $positions = Position::where('is_visible', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->with(['members' => fn ($query) => $query->current()->with('user')->orderBy('sort_order')->orderBy('id')])
            ->get();

        foreach ($positions as $position) {
            $members = $this->members($position->members);

            if ($members !== []) {
                $groups[] = ['heading' => $position->name, 'isPast' => false, 'members' => $members];
            }
        }

        $positionless = $this->members(
            MemberRecord::current()->whereNull('position_id')->with('user')
                ->orderBy('sort_order')->orderBy('id')->get()
        );

        if ($positionless !== []) {
            $groups[] = ['heading' => '', 'isPast' => false, 'members' => $positionless];
        }

        $past = MemberRecord::past()->with(['user', 'position'])
            ->orderBy('sort_order')->orderBy('id')->get()
            ->groupBy(fn (MemberRecord $record) => (string) $record->cohort);

        foreach ($past as $cohort => $records) {
            $members = $this->members($records);

            if ($members !== []) {
                $groups[] = [
                    'heading' => $cohort === '' ? '' : (string) $cohort,
                    'isPast' => true,
                    'members' => $members,
                ];
            }
        }

        return $groups;
    }

    /**
     * @param iterable<MemberRecord> $records
     * @return array<int, array<string, mixed>>
     */
    private function members(iterable $records): array
    {
        $members = [];

        foreach ($records as $record) {
            if ($record->user === null) {
                continue;
            }

            $members[] = [
                'name' => $record->name ?: $record->user->display_name,
                'username' => $record->user->username,
                'url' => $this->url->to('forum')->route('user', ['username' => $record->user->username]),
                'cohort' => $record->cohort,
                'startedAt' => $record->started_at?->toDateString(),
                'endedAt' => $record->ended_at?->toDateString(),
                'position' => $record->position?->name,
            ];
        }

        return $members;
    }

    /**
     * @param array<int, array{heading: string, isPast: bool, members: array<int, array<string, mixed>>}> $groups
     * @return array<int, array<string, mixed>>
     */
    private function people(array $groups): array
    {
        $people = [];

        foreach ($groups as $group) {
            foreach ($group['members'] as $member) {
                $member['position'] ??= $group['isPast'] ? null : ($group['heading'] ?: null);
                $people[] = $member;
            }
        }

        return $people;
    }

    /**
     * @param array<int, array<string, mixed>> $people
     */
    private function description(string $pageTitle, string $forumTitle, array $people): string
    {
        $names = array_slice(array_column($people, 'name'), 0, 10);
        $summary = $names === []
            ? $pageTitle
            : $pageTitle.': '.implode(', ', $names).(count($people) > count($names) ? ' and more' : '');

        return $this->truncate($forumTitle === '' ? $summary : "{$summary} — {$forumTitle}", 300);
    }

    private function openGraph(string $pageTitle, string $forumTitle, string $description, string $url): string
    {
        $tags = [
            'og:type' => 'website',
            'og:title' => $pageTitle,
            'og:site_name' => $forumTitle,
            'og:description' => $description,
            'og:url' => $url,
            'twitter:card' => 'summary',
            'twitter:title' => $pageTitle,
            'twitter:description' => $description,
        ];

        $html = '';

        foreach ($tags as $property => $content) {
            if ($content === '') {
                continue;
            }

            $attribute = str_starts_with($property, 'og:') ? 'property' : 'name';
            $html .= '<meta '.$attribute.'="'.$this->escape($property).'" content="'.$this->escape($content).'">';
        }

        return $html;
    }

    /**
     * ItemList of Person entries: the shape Google uses to understand a page
     * that lists people, each linked to their own forum profile.
     *
     * @param array<int, array<string, mixed>> $people
     */
    private function jsonLd(string $pageTitle, string $forumTitle, string $url, array $people): string
    {
        $elements = [];

        foreach (array_values($people) as $index => $person) {
            $entry = [
                '@type' => 'Person',
                'name' => $person['name'],
                'alternateName' => $person['username'],
                'url' => $person['url'],
            ];

            if (! empty($person['position'])) {
                $entry['jobTitle'] = $person['position'];
            }

            if ($forumTitle !== '') {
                $entry['memberOf'] = ['@type' => 'Organization', 'name' => $forumTitle];
            }

            $elements[] = [
                '@type' => 'ListItem',
                'position' => $index + 1,
                'item' => $entry,
            ];
        }

        $data = [
            '@context' => 'https://schema.org',
            '@type' => 'ItemList',
            'name' => $pageTitle,
            'url' => $url,
            'numberOfItems' => count($elements),
            'itemListElement' => $elements,
        ];

        $json = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if ($json === false) {
            return '';
        }

        // </script> inside JSON-LD would close the block early.
        return '<script type="application/ld+json">'.str_replace('<', '<', $json).'</script>';
    }

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }

    private function truncate(string $value, int $limit): string
    {
        $value = trim(preg_replace('/\s+/u', ' ', $value) ?? $value);

        return mb_strlen($value) <= $limit ? $value : mb_substr($value, 0, $limit - 1).'…';
    }
}
