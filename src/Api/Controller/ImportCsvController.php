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
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Http\Message\UploadedFileInterface;
use Tapao\OrgMemberDirectory\Api\MemberRecordValidator;
use Tapao\OrgMemberDirectory\Model\MemberRecord;

class ImportCsvController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $files = $request->getUploadedFiles();
        $file = Arr::get($files, 'csv');

        if (! $file instanceof UploadedFileInterface || $file->getError() !== UPLOAD_ERR_OK) {
            throw new ValidationException(['csv' => 'Please upload a valid CSV file.']);
        }

        $stream = $file->getStream();
        $stream->rewind();
        
        $content = $stream->getContents();
        if (empty(trim($content))) {
            throw new ValidationException(['csv' => 'The uploaded file is empty.']);
        }

        $lines = explode("\n", trim($content));
        
        // Remove and parse header
        $header = str_getcsv(array_shift($lines));
        $expectedHeader = ['username', 'name', 'position_id', 'cohort', 'started_at', 'ended_at', 'sort_order'];
        
        // Basic check for headers
        if (count($header) < 1 || strtolower(trim($header[0])) !== 'username') {
            throw new ValidationException(['csv' => 'Invalid CSV format. The header must be: username, name, position_id, cohort, started_at, ended_at, sort_order']);
        }

        $created = 0;
        $updated = 0;
        $errors = [];

        foreach ($lines as $index => $line) {
            $rowNum = $index + 2; // +1 for header, +1 for 0-index
            $line = trim($line);
            if (empty($line)) continue;

            $data = str_getcsv($line);
            $username = trim($data[0] ?? '');
            
            if (empty($username)) {
                $errors[] = "Row {$rowNum}: Username is required.";
                continue;
            }

            $user = User::where('username', $username)->first();
            if (! $user) {
                $errors[] = "Row {$rowNum}: User '{$username}' not found.";
                continue;
            }

            // Map the row array into an associative array for the validator
            $body = [
                'userId' => $user->id,
                'name' => trim($data[1] ?? ''),
                'positionId' => trim($data[2] ?? ''),
                'cohort' => trim($data[3] ?? ''),
                'startedAt' => trim($data[4] ?? ''),
                'endedAt' => trim($data[5] ?? ''),
                'sortOrder' => trim($data[6] ?? '0'),
            ];

            // Normalize empty strings to null for optional fields
            foreach (['name', 'positionId', 'cohort', 'startedAt', 'endedAt'] as $field) {
                if ($body[$field] === '') {
                    unset($body[$field]);
                }
            }

            try {
                $validated = MemberRecordValidator::validate($body, true);
                
                // See if user already has a record (we will update if there is exactly one, or maybe just create?)
                // Actually, an import might create multiple records for the same user if they have multiple positions over time.
                // For simplicity, CSV import creates new records, or updates an existing one if the user only has one active position.
                // A better logic: if a record exists with the same position and cohort, update it.
                // We'll just create new ones unless an exact match for user+position exists.
                
                $query = MemberRecord::where('user_id', $user->id);
                if (isset($validated['position_id'])) {
                    $query->where('position_id', $validated['position_id']);
                } else {
                    $query->whereNull('position_id');
                }
                
                $existing = $query->first();

                if ($existing) {
                    $existing->fill($validated);
                    
                    if ($existing->started_at !== null && $existing->ended_at !== null && $existing->ended_at->lt($existing->started_at)) {
                        $errors[] = "Row {$rowNum}: endedAt must not be before startedAt.";
                        continue;
                    }
                    
                    $existing->save();
                    $updated++;
                } else {
                    MemberRecord::create($validated);
                    $created++;
                }
            } catch (ValidationException $e) {
                $fieldErrors = implode(", ", array_map(function($msgs) { return implode(" ", (array) $msgs); }, $e->getMessages()));
                $errors[] = "Row {$rowNum}: Validation failed - {$fieldErrors}";
            } catch (\Exception $e) {
                $errors[] = "Row {$rowNum}: Error - " . $e->getMessage();
            }
        }

        if (count($errors) > 0 && $created === 0 && $updated === 0) {
            throw new ValidationException(['csv' => implode("\n", $errors)]);
        }

        return new JsonResponse([
            'created' => $created,
            'updated' => $updated,
            'errors' => $errors,
        ]);
    }
}
