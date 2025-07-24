# Vite Plugin Snapshot

A Vite plugin for snapshot testing.

## Features

-   **Zero-config setup:** Add the plugin to your Vite config and you're ready to go.
-   **Server-side API:** Provides a simple API for loading and saving snapshots on the server.
-   **Client-side utilities:** Includes helper functions for comparing, loading, and saving snapshots from the browser.
-   **Flexible:** Can be used with any testing framework that runs in the browser.

## Installation

```bash
npm install vite-plugin-snapshot --save-dev
```

or

```bash
yarn add vite-plugin-snapshot --dev
```

## Usage

Add the plugin to your `vite.config.ts` file:

```typescript
import { defineConfig } from 'vite'
import { snapshotPlugin } from 'vite-plugin-snapshot'

export default defineConfig({
  plugins: [
   snapshotPlugin(),
  ],
})
```

## Client-side Usage

The plugin exposes a server-side API that can be accessed from the browser. Here's an example of how to use it:

```typescript
/**
 * @file This file contains the logic for handling browser-based snapshot testing.
 * It includes functions for comparing, loading, and saving snapshots.
 */

/**
 * Represents the result of a snapshot comparison.
 */
export interface SnapshotResult {
    /** Indicates whether the actual output matched the expected snapshot. */
    match: boolean
    /** Optional: A string representing the difference between the expected and actual output, if they don't match. */
    diff?: string
    /** Optional: The expected snapshot content, if available and a mismatch occurred. */
    expected?: string
    /** Optional: The actual output content, if a mismatch occurred. */
    actual?: string
}

/**
 * Compares an actual output with an expected snapshot and returns a `SnapshotResult`.
 * @param expected The expected snapshot content.
 * @param actual The actual output to compare.
 * @returns A `SnapshotResult` object indicating whether the snapshot matched and providing diff information if it didn't.
 */
export function compareSnapshot(expected: string, actual: string): SnapshotResult {
    if (expected === actual) return { match: true }
    // For now, just a simple diff (could use a real diff lib later)
    return {
        match: false,
        expected,
        actual,
        diff: `Expected and actual output differ.`
    }
}

/**
 * Loads a snapshot from the server using the Vite dev server.
 * @param id The unique identifier for the snapshot.
 * @returns A promise that resolves to the snapshot content, or `undefined` if the snapshot could not be loaded.
 */
export async function loadSnapshot(id: string): Promise<{ props: string, html: string } | undefined> {
    try {
        const res = await fetch(`/@snapshot-api?id=${encodeURIComponent(id)}`)
        if (!res.ok) {
            return undefined
        }
        const text = await res.text()
        try {
            const json = JSON.parse(text)
            return json
        } catch (e) {
            return undefined
        }
    } catch (e) {
        return undefined
    }
}

/**
 * Saves a snapshot to the server using the Vite dev server.
 * @param id The unique identifier for the snapshot.
 * @param props The props associated with the snapshot.
 * @param html The HTML content of the snapshot.
 */
export async function saveSnapshot(id: string, props: string, html: string): Promise<void> {
    try {
        // console.log('[browserSnapshot] saveSnapshot: saving', { id, props, html })
        await fetch(`/@snapshot-api?id=${encodeURIComponent(id)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ props, html })
        })
    } catch (e) {
        console.error('[browserSnapshot] saveSnapshot: error', e)
    }
}
```

## API

The plugin exposes the following API endpoints:

-   `GET /@snapshot-api?id=<snapshot-id>`: Loads a snapshot from the server.
-   `POST /@snapshot-api?id=<snapshot-id>`: Saves a snapshot to the server. The body of the request should be a JSON object with the following properties:
    -   `props`: The props associated with the snapshot.
    -   `html`: The HTML content of the snapshot.

## Diagnosing

### Snapshot Folder Location

The plugin stores snapshots in a `.snapshots` directory at the root of your project. When the Vite development server starts, the exact physical path to this directory is logged to the console for your convenience.

### Server Status

After configuring the plugin, you can check if the snapshot server at the host app is running by visiting the following URL in your browser:

[http://localhost:5174/@snapshot-api/version](http://localhost:5174/@snapshot-api/version)

If the server is running correctly, you should see a version number displayed.

## License

This project is licensed under the MIT License.