<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

namespace Tapao\OrgMemberDirectory\Api;

/**
 * Header handling for CSV import. Deliberately free of Flarum/Laravel
 * dependencies so tests/CsvHeaderTest.php can run it with bare PHP.
 */
final class CsvHeader
{
    /**
     * Header aliases -> canonical payload key. Headers are normalised by
     * lowercasing and stripping everything but a-z0-9, so "Position ID",
     * "position_id" and "positionId" all collapse to "positionid".
     */
    private const ALIASES = [
        'username' => 'username',
        'user' => 'username',
        'name' => 'name',
        'displayname' => 'name',
        // A number here is the ลำดับ / sort number the admin screen shows
        // against each position — that is the only position number admins can
        // actually see, so it is what ends up in hand-built sheets. Text here
        // is matched against the position name instead.
        'position' => 'position',
        'positionid' => 'position',
        'positionname' => 'position',
        'positionorder' => 'position',
        'positionsort' => 'position',
        'positionsortorder' => 'position',
        // Escape hatch for the actual database id, for anyone who wants it.
        'positiondbid' => 'positionDbId',
        'positiondatabaseid' => 'positionDbId',
        'cohort' => 'cohort',
        'startedat' => 'startedAt',
        'startdate' => 'startedAt',
        'endedat' => 'endedAt',
        'enddate' => 'endedAt',
        'sortorder' => 'sortOrder',
        'sort' => 'sortOrder',
    ];

    /**
     * Excel and Google Sheets prepend a UTF-8 BOM, which glues itself onto the
     * first header cell and made every such export fail header validation.
     */
    public static function stripBom(string $content): string
    {
        return preg_replace('/^\xEF\xBB\xBF/', '', $content) ?? $content;
    }

    /**
     * Maps a header row to canonical key => column index. Column order is
     * irrelevant and unrecognised columns are ignored.
     *
     * @param array<int, string|null> $headerRow
     * @return array<string, int>
     */
    public static function map(array $headerRow): array
    {
        $columns = [];

        foreach ($headerRow as $index => $label) {
            $key = preg_replace('/[^a-z0-9]/', '', mb_strtolower(trim((string) $label)));

            if (isset(self::ALIASES[$key]) && ! isset($columns[self::ALIASES[$key]])) {
                $columns[self::ALIASES[$key]] = (int) $index;
            }
        }

        return $columns;
    }

    /**
     * Normalises a spreadsheet date cell to Y-m-d, or null if unparseable.
     *
     * Slash/dot/dash dates are read DAY-first (14/08/2024 = 14 Aug), matching
     * Thai and EU spreadsheet exports. Years above 2400 are treated as
     * Buddhist era and converted, since no real CE date reaches that.
     */
    public static function normalizeDate(string $value): ?string
    {
        $value = trim($value);

        if ($value === '') {
            return null;
        }

        // Drop a trailing time component, e.g. "2024-08-14 00:00:00".
        $value = preg_split('/[ T]/', $value)[0];

        if (preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})$/', $value, $m)) {
            [, $year, $month, $day] = $m;
        } elseif (preg_match('/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/', $value, $m)) {
            [, $day, $month, $year] = $m;
        } else {
            return null;
        }

        $year = (int) $year;
        $month = (int) $month;
        $day = (int) $day;

        if ($year > 2400) {
            $year -= 543;
        }

        if (! checkdate($month, $day, $year)) {
            return null;
        }

        return sprintf('%04d-%02d-%02d', $year, $month, $day);
    }

    /**
     * @param array<int, string|null> $row
     */
    public static function isBlankRow(array $row): bool
    {
        foreach ($row as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }
}
