import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import chalk from 'chalk';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');
// Helper to get the absolute path to the snapshot file
function getSnapshotFilePath(componentPath) {
    const relComponentPath = path.join('./.snapshots', componentPath + '.snapshot.json');
    const snapshotDir = path.dirname(relComponentPath);
    if (!fs.existsSync(snapshotDir)) {
        fs.mkdirSync(snapshotDir, { recursive: true });
    }
    return relComponentPath;
}
export function snapshotPlugin() {
    let server;
    return {
        name: 'snapshot-plugin',
        configureServer(_server) {
            server = _server;
            const snapshotDir = path.resolve(server.config.root, '.snapshots');
            console.log(chalk.blue(`[snapshot-plugin] Storing snapshots in: ${snapshotDir}`));
            server.middlewares.use('/@snapshot-api', async (req, res, next) => {
                if (!req.url) {
                    return next();
                }
                const url = new URL(req.url, `http://${req.headers.host}`);
                if (url.pathname === '/version') {
                    if (req.method === 'GET') {
                        res.setHeader('Content-Type', 'application/json');
                        res.statusCode = 200;
                        res.end(JSON.stringify({ version: pkg.version }));
                    }
                    else {
                        res.statusCode = 405;
                        res.end('Method Not Allowed');
                    }
                    return;
                }
                const id = url.searchParams.get('id'); // The component's file path
                if (!id) {
                    res.statusCode = 400;
                    console.error(chalk.red(`Missing component ID (file path)`));
                    res.end('Missing component ID (file path)');
                    return;
                }
                const snapshotPath = getSnapshotFilePath(id);
                if (req.method === 'GET') {
                    if (fs.existsSync(snapshotPath)) {
                        try {
                            const snapshotContent = fs.readFileSync(snapshotPath, 'utf-8');
                            res.setHeader('Content-Type', 'application/json');
                            res.statusCode = 200;
                            console.log(chalk.green(`Geting snapshot for ${snapshotPath}`));
                            res.end(snapshotContent);
                        }
                        catch (error) {
                            console.error(chalk.red(`Failed to read snapshot for ${snapshotPath}:`), error);
                            res.statusCode = 500;
                            res.end(`Failed to read snapshot: ${error}`);
                        }
                    }
                    else {
                        res.statusCode = 404;
                        console.error(chalk.red(`Snapshot not found for ${snapshotPath}.`));
                        res.end('Snapshot not found');
                    }
                    return;
                }
                if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => {
                        body += chunk.toString();
                    });
                    req.on('end', () => {
                        try {
                            const data = JSON.parse(body);
                            fs.writeFileSync(snapshotPath, JSON.stringify(data, null, 2), 'utf-8');
                            res.statusCode = 200;
                            res.end('Snapshot updated');
                            console.log(chalk.green(`Snapshot updated for ${snapshotPath}`));
                            // Trigger a HMR update if desired, though not strictly necessary here
                            // since the component will re-render and re-check on its own.
                            // server.hot.send({ type: 'full-reload' }); // Or a more targeted update
                        }
                        catch (error) {
                            console.error(chalk.red(`Failed to write snapshot for ${id}:`), error);
                            res.statusCode = 500;
                            res.end(`Failed to write snapshot: ${error}`);
                        }
                    });
                    return;
                }
                if (req.method === 'DELETE') {
                    if (fs.existsSync(snapshotPath)) {
                        try {
                            fs.unlinkSync(snapshotPath);
                            res.statusCode = 200;
                            res.end('Snapshot deleted');
                            console.log(chalk.yellow(`Snapshot deleted for ${snapshotPath}`));
                        }
                        catch (error) {
                            console.error(chalk.red(`Failed to delete snapshot for ${snapshotPath}:`), error);
                            res.statusCode = 500;
                            res.end(`Failed to delete snapshot: ${error}`);
                        }
                    }
                    else {
                        res.statusCode = 404;
                        res.end('Snapshot not found');
                    }
                    return;
                }
                next(); // Pass to next middleware if not handled
            });
        },
    };
}
