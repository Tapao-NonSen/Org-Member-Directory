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
            'positionId' => $value('positionId'),
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
    'positionId' => 1,
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
assert($rows[2]['positionId'] === '', 'trailing empty cells are empty strings');

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

echo "CsvHeaderTest: all assertions passed\n";
