<?php

declare(strict_types=1);

/*
 * Bare-PHP self-check for the locale files: `php tests/LocaleTest.php`.
 *
 * A malformed locale file is not a cosmetic bug — Flarum loads them on every
 * request, so one stray quote returns HTTP 500 for the whole forum. This runs
 * without ext-yaml or a vendor autoloader so it can be run anywhere.
 *
 * These files use one-line "key: value" pairs only, so a line scan is enough;
 * if block scalars (|, >) are ever introduced this needs a real parser.
 */

$files = [__DIR__.'/../locale/en.yml', __DIR__.'/../locale/th.yml'];
$keysPerFile = [];
$failures = [];

foreach ($files as $file) {
    $name = basename($file);
    $keys = [];

    foreach (file($file, FILE_IGNORE_NEW_LINES) as $i => $line) {
        $lineNo = $i + 1;

        if (trim($line) === '' || str_starts_with(trim($line), '#')) {
            continue;
        }

        if (str_contains($line, "\t")) {
            $failures[] = "{$name}:{$lineNo}: tab indentation (YAML forbids tabs)";
        }

        if (! preg_match('/^(\s*)([A-Za-z0-9_.-]+):(.*)$/', $line, $m)) {
            $failures[] = "{$name}:{$lineNo}: not a 'key: value' line";
            continue;
        }

        [, $indent, $key, $value] = $m;
        $value = trim($value);

        if ($value !== '') {
            $keys[$indent.$key] = true;
        }

        if (! str_starts_with($value, '"')) {
            continue;
        }

        // The failure that took the forum down: a double-quoted scalar with an
        // unescaped " inside it, e.g. key: "uses the "sort" number".
        if (! preg_match('/^"(?:[^"\\\\]|\\\\.)*"$/', $value)) {
            $failures[] = "{$name}:{$lineNo}: unbalanced or unescaped quote in value for '{$key}'";
        }
    }

    $keysPerFile[$name] = $keys;
}

// Every string must exist in both languages, or one locale falls back silently.
[$en, $th] = array_values($keysPerFile);
[$enName, $thName] = array_keys($keysPerFile);

foreach (array_diff_key($en, $th) as $key => $_) {
    $failures[] = "present in {$enName} but missing from {$thName}: ".trim($key);
}

foreach (array_diff_key($th, $en) as $key => $_) {
    $failures[] = "present in {$thName} but missing from {$enName}: ".trim($key);
}

if ($failures !== []) {
    echo "LocaleTest FAILED:\n";
    foreach ($failures as $f) {
        echo "  {$f}\n";
    }
    exit(1);
}

echo 'LocaleTest: '.count($en)." keys, both locales well-formed and in sync\n";
