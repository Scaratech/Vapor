import { readFileSync, writeFileSync } from "node:fs";

const metadata = JSON.parse(readFileSync('./public/metadata.json', 'utf-8'));

function createTemplate(name, id) {
    return {
        title: name,
        id: id,
        description: "",
        image: `/assets/images/${id}.png`,
        url: `/assets/games/${id}/index.html`
    };
}

function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {};
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--name=')) {
            parsed.title = arg.substring(7);
        } else if (arg.startsWith('--id=')) {
            parsed.id = arg.substring(5);
        } else if (arg.startsWith('--desc=')) {
            parsed.desc = arg.substring(7);
        }
    }
    
    return parsed;
}

const input = parseArgs();
input.desc = input.desc || "";

if (!input.title || !input.id) {
    console.log('Usage: node update.js --name="Game Title" --id="game-id" --desc="Optional description"');
    process.exit(1);
}

metadata.games.push(createTemplate(input.title, input.id, input.desc));
writeFileSync('./public/metadata.json', JSON.stringify(metadata, null, 4), 'utf-8');
