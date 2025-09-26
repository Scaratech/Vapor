# ama2
ama2 is a games website focused on providing a high quality experience and high quality games. What makes ama2 different is its offline support, you can download games to the browers built-in storage (OPFS) and play all the games available fully offline (sometimes this can even work to bypass web-filters). ama2 also provides a high quality selection of games, mainly WASM ports, not the regular slop you would find on game websites. 
>[!WARNING]
> ama2 does **NOT** provide an official demo nor does it provide the games itself. This is because most WASM ports do not provide a way to verify you own the game, which leads to piracy, and to avoid DMCAs this is a precaution that has to be taken.

## Setup
```sh
# Requirements: Linux or MacOS (WSL works fine, you just need bash or a UNIX-like shell), NodeJS, PNPM (npm i -g pnpm)
$ git clone https://github.com/scaratech/ama2
$ cd ama2
$ pnpm i
$ pnpm build
$ pnpm serve
```