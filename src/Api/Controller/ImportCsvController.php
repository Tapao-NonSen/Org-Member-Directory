<?php

declare(strict_types=1);

/*
 * This file is part of tapao/org-member-directory.
 */

namespace Tapao\OrgMemberDirectory\Api\Controller;

use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Flarum\User\User;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Tapao\OrgMemberDirectory\Api\CsvHeader;
use Tapao\OrgMemberDirectory\Api\MemberRecordValidator;
use Tapao\OrgMemberDirectory\Model\MemberRecord;
use Tapao\OrgMemberDirectory\Model\Position;

class ImportCsvController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $file = Arr::get($request->getUploadedFiles(), 'csv');

        if (! $file instanceof UploadedFileInterface || $file->getError() !== UPLOAD_ERR_OK) {
            throw new ValidationException(['csv' => 'Please upload a valid CSV file.']);
        }

        $stream = $file->getStream();
        $stream->rewind();
        $content = $stream->getContents();

        $content = CsvHeader::stripBom($content);

        if (trim($content) === '') {
            throw new ValidationException(['csv' => 'The uploaded file is empty.']);
        }

        // fgetcsv over a real stream handles CRLF line endings, quoted commas
        // and quoted newlines, none of which explode("\n") survived.
        $handle = fopen('php://temp', 'r+');
        fwrite($handle, $content);
        rewind($handle);

        $headerRow = fgetcsv($handle);

        if (! is_array($headerRow)) {
            fclose($handle);

            throw new ValidationException(['csv' => 'The uploaded file is empty.']);
        }

        $columns = CsvHeader::map($headerRow);

        if (! isset($columns['username'])) {
            fclose($handle);

            throw new ValidationException(['csv' => sprintf(
                'The CSV needs a "username" column. Columns found: %s. Recognised columns, in any order: username, name, position_id, cohort, started_at, ended_at, sort_order.',
                implode(', ', array_map(fn ($h) => trim((string) $h), $headerRow))
            )]);
        }

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $errors = [];
        $rowNum = 1;

        while (($row = fgetcsv($handle)) !== false) {
            $rowNum++;

            if (! is_array($row) || CsvHeader::isBlankRow($row)) {
                continue;
            }

            $value = fn (string $key): string => isset($columns[$key])
                ? trim((string) ($row[$columns[$key]] ?? ''))
                : '';

            $username = ltrim($value('username'), '@');

            if ($username === '') {
                $skipped++;
                $errors[] = "Row {$rowNum}: no username, skipped.";
                continue;
            }

            $user = User::where('username', $username)->first();

            if (! $user) {
                $skipped++;
                $errors[] = "Row {$rowNum}: user '{$username}' not found, skipped.";
                continue;
            }

            $body = ['userId' => $user->id];

            foreach (['name', 'cohort', 'sortOrder'] as $key) {
                if ($value($key) !== '') {
                    $body[$key] = $value($key);
                }
            }

            $badDate = null;

            foreach (['startedAt', 'endedAt'] as $key) {
                if ($value($key) === '') {
                    continue;
                }

                $date = CsvHeader::normalizeDate($value($key));

                if ($date === null) {
                    $badDate = "Row {$rowNum}: {$key} '{$value($key)}' is not a date, skipped.";
                    break;
                }

                $body[$key] = $date;
            }

            if ($badDate !== null) {
                $skipped++;
                $errors[] = $badDate;
                continue;
            }

            $byDbId = $value('positionDbId') !== '';
            $position = $byDbId ? $value('positionDbId') : $value('position');

            if ($position !== '') {
                $resolved = $this->resolvePosition($position, $byDbId);

                if ($resolved === null) {
                    $skipped++;
                    $errors[] = $byDbId
                        ? "Row {$rowNum}: no position with database ID '{$position}', skipped."
                        : "Row {$rowNum}: no position with sort number or name '{$position}', skipped.";
                    continue;
                }

                $body['positionId'] = $resolved;
            }

            try {
                $validated = MemberRecordValidator::validate($body, true);

                // The sheet is authoritative per username: an existing member is
                // overwritten in place (position included), a new one is created.
                // Keyed on the user alone, so correcting a column and re-uploading
                // fixes the existing rows instead of doubling them.
                $existing = MemberRecord::where('user_id', $user->id)
                    ->orderBy('id')
                    ->get();

                if ($existing->isNotEmpty()) {
                    $existing->first()->fill($validated)->save();
                    $updated++;

                    if ($existing->count() > 1) {
                        $errors[] = "Row {$rowNum}: '{$username}' has {$existing->count()} records; "
                            ."updated the earliest one, the other(s) were left untouched.";
                    }
                } else {
                    MemberRecord::create($validated);
                    $created++;
                }
            } catch (ValidationException $e) {
                $skipped++;
                $errors[] = "Row {$rowNum}: ".implode(' ', Arr::flatten($e->getMessages()));
            } catch (\Exception $e) {
                $skipped++;
                $errors[] = "Row {$rowNum}: ".$e->getMessage();
            }
        }

        fclose($handle);

        // Row-level problems never fail the whole file: good rows import, bad
        // rows come back in `errors` so the admin only has to fix those.
        return new JsonResponse([
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }

    /**
     * Resolves a CSV position cell to a position id.
     *
     * A number means the ลำดับ / sort number shown in the admin's position
     * table, NOT the database id — that is the number admins can see, so it is
     * the one their sheets carry. Text means the position name. The database id
     * is only used when the sheet asks for it with a position_db_id column.
     */
    private function resolvePosition(string $value, bool $byDatabaseId): ?int
    {
        if (! is_numeric($value)) {
            $id = Position::where('name', $value)->orderBy('id')->value('id');

            return $id === null ? null : (int) $id;
        }

        if ($byDatabaseId) {
            return Position::whereKey((int) $value)->exists() ? (int) $value : null;
        }

        // ponytail: sort_order is not unique; lowest id wins on a tie. Fine
        // until someone deliberately gives two positions the same ลำดับ.
        $id = Position::where('sort_order', (int) $value)->orderBy('id')->value('id');

        return $id === null ? null : (int) $id;
    }
}
