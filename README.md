# Vapor
Vapor is a games website focused on providing a high quality experience and high quality games. What makes Vapor different is its offline support, you can download games to the browers built-in storage (OPFS) and play all the games available fully offline (sometimes this can even work to bypass web-filters). Vapor also provides a high quality selection of games, mainly WASM ports, not the regular slop you would find on game websites. 
>[!WARNING]
> Vapor does **NOT** provide an official demo nor does it provide the games itself. This is because most WASM ports do not provide a way to verify you own the game, which leads to piracy, and to avoid DMCAs this is a precaution that has to be taken.

## Setup
```sh
# Requirements: Linux or MacOS (WSL works fine, you just need bash or a UNIX-like shell), NodeJS, PNPM (npm i -g pnpm)
$ git clone https://github.com/scaratech/Vapor
$ cd Vapor
$ pnpm i
# Make sure all your games are in the `games/` folder (Formatted like `games/<game_id>/`) and yes index.html has to be the entry point
# To generate proper metadata you can manually edit `public/metadata.json` or:
$ mkdir build
$ node scripts/update.js --name="Game Name" --id="game_id" --desc="Optional description"
$ node scripts/mapper.js
$ pnpm build
$ pnpm serve
# Or pnpm dev
```