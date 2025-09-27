import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const GAMES_DIR = './core';
const OUTPUT_FILE = './public/map.json';

function getAllFiles(dirPath, relativePath = '') {
    const files = [];
    
    try {
        const items = readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = join(dirPath, item);
            const relativeItemPath = relativePath ? `${relativePath}/${item}` : item;
            
            try {
                const stats = statSync(fullPath);
                
                if (stats.isDirectory()) {
                    files.push(`${relativeItemPath}/`);
                    const subFiles = getAllFiles(fullPath, relativeItemPath);
                    files.push(...subFiles);
                } else {
                    files.push(relativeItemPath);
                }
            } catch (err) {
                console.warn(`Error reading ${fullPath}:`, err.message);
            }
        }
    } catch (err) {
        console.warn(`Error reading directory ${dirPath}:`, err.message);
    }
    
    return files;
}

function createGamesMap() {
    const gamesMap = {
        games: []
    };
    
    try {
        const gameDirectories = readdirSync(GAMES_DIR);
        
        for (const gameDir of gameDirectories) {
            const gamePath = join(GAMES_DIR, gameDir);
            
            try {
                const stats = statSync(gamePath);
                
                if (stats.isDirectory()) {
                    const files = getAllFiles(gamePath);
                    
                    gamesMap.games.push({
                        id: gameDir,
                        files: files.sort()
                    });
                }
            } catch (err) {
                console.warn(`Error processing game directory ${gameDir}:`, err.message);
            }
        }
    } catch (err) {
        console.error(`Error reading games directory: ${err.message}`);
        process.exit(1);
    }
    
    return gamesMap;
}

function main() {
    console.log('Mapping games directory...');
    
    const gamesMap = createGamesMap();
    
    try {
        writeFileSync(OUTPUT_FILE, JSON.stringify(gamesMap, null, 2), 'utf-8');
        console.log(`Found ${gamesMap.games.length} games`);
        
        gamesMap.games.forEach(game => {
            console.log(`   - ${game.id}: ${game.files.length} files`);
        });
    } catch (err) {
        console.error(`Error writing output file: ${err.message}`);
        process.exit(1);
    }
}

main();
