<?php

declare(strict_types=1);

/*
 * Bare-PHP self-check for CSV import header handling: `php tests/CsvHeaderTest.php`.
 * No framework, no vendor autoloader — CsvHeader is dependency-free on purpose.
 */

require __DIR__.'/../src/Api/CsvHeader.php';

use Tapao\OrgMemberDirectory\Api\CsvHeader;

function parseCsv(string $content): array
{
    $handle = fopen('php://temp', 'r+');
    fwrite($handle, CsvHeader::stripBom($content));
    rewind($handle);

    $columns = CsvHeader::map(fgetcsv($handle));
    $rows = [];

    while (($row = fgetcsv($handle)) !== false) {
        if (! is_array($row) || CsvHeader::isBlankRow($row)) {
            continue;
        }

        $value = fn (string $key): string => isset($columns[$key])
            ? trim((string) ($row[$columns[$key]] ?? ''))
            : '';

        $rows[] = [
            'username' => $value('username'),
            'name' => $value('name'),
            'position' => $value('position'),
            'cohort' => $value('cohort'),
        ];
    }

    fclose($handle);

    return [$columns, $rows];
}

// A UTF-8 BOM used to break header detection outright (Google Sheets exports).
[$columns] = parseCsv("\xEF\xBB\xBFusername,name\r\nalice,Alice\r\n");
assert($columns['username'] === 0, 'BOM must not hide the username column');

// Column order is irrelevant, spellings vary, unknown columns are ignored.
[$columns] = parseCsv("Sort Order,Position ID,Email,User Name,Cohort\n");
assert($columns === [
    'sortOrder' => 0,
    'position' => 1,
    'username' => 3,
    'cohort' => 4,
], 'header mapping must be order-independent: '.json_encode($columns));

// A file with no username column at all is rejected by the caller.
[$columns] = parseCsv("name,cohort\nAlice,1\n");
assert(! isset($columns['username']), 'missing username column must be detectable');

// CRLF, quoted commas, blank lines, @-prefixed and missing usernames.
[, $rows] = parseCsv(
    "username,name,position_id,cohort\r\n"
    ."alice,\"Smith, Alice\",3,รุ่น 1\r\n"
    ."\r\n"
    .",Nobody,3,รุ่น 1\r\n"
    ."@bob,,,\r\n"
);
assert(count($rows) === 3, 'blank lines are skipped, others kept: '.count($rows));
assert($rows[0]['name'] === 'Smith, Alice', 'quoted commas must survive');
assert($rows[0]['cohort'] === 'รุ่น 1', 'CRLF must not leave \r on the last cell');
assert($rows[1]['username'] === '', 'row missing a username is reported, not fatal');
assert(ltrim($rows[2]['username'], '@') === 'bob', '@-prefixed usernames are accepted');
assert($rows[2]['position'] === '', 'trailing empty cells are empty strings');

// Spreadsheet date cells: day-first slashes, already-correct ISO, BE years, junk.
assert(CsvHeader::normalizeDate('14/08/2024') === '2024-08-14', 'd/m/Y is day-first');
assert(CsvHeader::normalizeDate('02/08/2025') === '2025-08-02', 'ambiguous d/m stays day-first');
assert(CsvHeader::normalizeDate('2024-08-14') === '2024-08-14', 'Y-m-d passes through');
assert(CsvHeader::normalizeDate('2024-8-4') === '2024-08-04', 'unpadded Y-m-d is padded');
assert(CsvHeader::normalizeDate('18-07-2019') === '2019-07-18', 'dashes work like slashes');
assert(CsvHeader::normalizeDate('14/08/2567') === '2024-08-14', 'Buddhist-era year converts');
assert(CsvHeader::normalizeDate('2024-08-14 00:00:00') === '2024-08-14', 'time part dropped');
assert(CsvHeader::normalizeDate('') === null, 'empty is null');
assert(CsvHeader::normalizeDate('31/02/2024') === null, 'impossible date rejected');
assert(CsvHeader::normalizeDate('Aug 14 2024') === null, 'unparseable rejected');

// Every spelling of the position column lands on one canonical key, whose
// numbers mean the admin's sort number. The database id is a separate,
// opt-in column, so a sheet of sort numbers can't be read as ids (that
// shifted every row by one).
foreach (['position_id', 'position', 'Position Order', 'position_sort'] as $label) {
    $columns = CsvHeader::map(['username', $label]);
    assert($columns['position'] === 1, "'{$label}' maps to the position column");
    assert(! isset($columns['positionDbId']), "'{$label}' is not the database id column");
}

$columns = CsvHeader::map(['username', 'position_db_id', 'position_id']);
assert($columns['positionDbId'] === 1, 'position_db_id is its own column');
assert($columns['position'] === 2, 'position_id still maps to the sort-number column');

// A position cell of "0" is a real value (sort number 0 = the first position),
// not a blank. PHP's empty()/falsiness would silently swallow it, which is how
// the top-listed member ended up with no position at all.
[, $rows] = parseCsv("username,position,cohort\nalice,0,Gen 5\n");
assert($rows[0]['position'] === '0', 'a "0" position cell survives as "0"');
assert($rows[0]['position'] !== '', 'a "0" position cell is not treated as empty');
assert(! CsvHeader::isBlankRow(['0', '0']), 'a row of zeroes is not a blank row');
assert(CsvHeader::isBlankRow(['', ' ']), 'a row of empty cells is blank');

echo "CsvHeaderTest: all assertions passed\n";
