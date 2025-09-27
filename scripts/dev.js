import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import express from "express";

const app = express();
const PORT = 5500;


let building = false;
let buildQueue = false;

function build() {
    if (building) {
        buildQueue = true;
        return;
    }

    building = true;
    buildQueue = false;

    // console.log('Building...');

    const proc = spawn('bash', ['./scripts/build.sh'], {
        stdio: 'pipe',
        cwd: process.cwd()
    });

    // let output = '';

    /*
    proc.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
    });

    proc.stderr.on('data', (data) => {
        output += data.toString();
        process.stderr.write(data);
    });
    */

    proc.on('close', (code) => {
        building = false;

        if (code === 0) {
            console.log('Build complete');
        } else {
            console.log('Build failed with code:', code);
            // console.log('Output:', output.slice(-500));
        }

        if (buildQueue) {
            setTimeout(build, 5000);
        }
    });

    proc.on('error', (err) => {
        building = false;
        console.log('Error while building:', err.message);
    });
}

const dirs = ['src', 'public'];

dirs.forEach((dir) => {
    try {
        watch(dir, { recursive: true }, (_, file) => {
            if (file) {
                // console.log(`File changed: ${dir}/${file}`);
                setTimeout(build, 100);
            }
        })
    } catch (err) {
        console.error(`Error watching ${dir}:`, err.message);
    }
});

build();

app.use(express.static("build"));

app.listen(PORT, () => {
    console.log(`Port: ${PORT}`);
});
