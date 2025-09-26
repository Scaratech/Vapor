export class FileSystem {
    private root: FileSystemDirectoryHandle;
    private cwd: string = "/";

    async init() {
        this.root = await navigator.storage.getDirectory();
    }

    private normalizePath(path: string): string {
        if (path.startsWith("/")) {
            return path;
        }
        
        const parts = [...this.cwd.split("/"), ...path.split("/")]
            .filter(p => p.length > 0);
        
        const normalized: string[] = [];
        
        for (const part of parts) {
            if (part === ".") {
                continue;
            } else if (part === "..") {
                normalized.pop();
            } else {
                normalized.push(part);
            }
        }
        
        return "/" + normalized.join("/");
    }

    pwd(): string {
        return this.cwd;
    }

    cd(path: string): void {
        this.cwd = this.normalizePath(path);
    }

    async ls(path?: string): Promise<string[]> {
        const target = path ? this.normalizePath(path) : this.cwd;
        const parts = target.split("/").filter(p => p.length > 0);
        
        let current = this.root;
        
        for (const part of parts) {
            try {
                current = await current.getDirectoryHandle(part);
            } catch {
                throw new Error(`Directory not found: ${target}`);
            }
        }
        
        const entries: string[] = [];

        // @ts-ignore why is `.entries()` not typed :sob:
        for await (const [name, handle] of current.entries()) {
            if (handle.kind === 'directory') {
                entries.push(name + "/");
            } else {
                entries.push(name);
            }
        }
        
        return entries.sort();
    }

    async mkdir(path: string): Promise<void> {
        const target = this.normalizePath(path);
        const parts = target.split("/").filter(p => p.length > 0);
        
        let current = this.root;
        
        for (const part of parts) {
            try {
                current = await current.getDirectoryHandle(part, { create: true });
            } catch (err) {
                if (err.name === "TypeMismatchError") {
                    await current.removeEntry(part, { recursive: true });
                    current = await current.getDirectoryHandle(part, { create: true });
                } else {
                    throw err;
                }
            }
        }
    }

    async rm(path: string): Promise<void> {
        const target = this.normalizePath(path);
        const parts = target.split("/").filter(p => p.length > 0);
        
        if (parts.length === 0) {
            throw new Error("Cannot remove root directory");
        }
        
        const fileName = parts.pop()!;
        let current = this.root;
        
        for (const part of parts) {
            try {
                current = await current.getDirectoryHandle(part);
            } catch {
                throw new Error(`Directory not found: ${target}`);
            }
        }
        
        try {
            await current.removeEntry(fileName, { recursive: true });
        } catch {
            throw new Error(`File or directory not found: ${target}`);
        }
    }

    async exists(path: string): Promise<boolean> {
        try {
            const target = this.normalizePath(path);
            const parts = target.split("/").filter(p => p.length > 0);
            
            if (parts.length === 0) {
                return true;
            }
            
            const fileName = parts.pop()!;
            let current = this.root;
            
            for (const part of parts) {
                current = await current.getDirectoryHandle(part);
            }

            try {
                await current.getFileHandle(fileName);
                return true;
            } catch {
                try {
                    await current.getDirectoryHandle(fileName);
                    return true;
                } catch {
                    return false;
                }
            }
        } catch {
            return false;
        }
    }

    async read(path: string): Promise<ArrayBuffer> {
        const target = this.normalizePath(path);
        const parts = target.split("/").filter(p => p.length > 0);
        
        if (parts.length === 0) {
            throw new Error("Cannot read root directory");
        }
        
        const fileName = parts.pop()!;
        let current = this.root;
        
        for (const part of parts) {
            try {
                current = await current.getDirectoryHandle(part);
            } catch {
                throw new Error(`Directory not found: ${target}`);
            }
        }
        
        try {
            const fileHandle = await current.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            return await file.arrayBuffer();
        } catch {
            throw new Error(`File not found: ${target}`);
        }
    }

    async write(path: string, content: ArrayBuffer): Promise<void> {
        const target = this.normalizePath(path);
        const parts = target.split("/").filter(p => p.length > 0);
        
        if (parts.length === 0) {
            throw new Error("Cannot write to root directory");
        }
        
        const fileName = parts.pop()!;
        let current = this.root;
        
        for (const part of parts) {
            try {
                current = await current.getDirectoryHandle(part, { create: true });
            } catch (err) {
                if (err.name === "TypeMismatchError") {
                    await current.removeEntry(part, { recursive: true });
                    current = await current.getDirectoryHandle(part, { create: true });
                } else {
                    throw err;
                }
            }
        }
        
        try {
            const fileHandle = await current.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();

            await writable.write(content);
            await writable.close();
        } catch (err) {
            if (err.name === "TypeMismatchError") {
                await current.removeEntry(fileName, { recursive: true });

                const fileHandle = await current.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();

                await writable.write(content);
                await writable.close();
            } else {
                throw err;
            }
        }
    }

    async fetch(url: string, path: string): Promise<void> {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
            }
            
            const content = await response.arrayBuffer();
            await this.write(path, content);
        } catch (err) {
            throw new Error(`Failed to fetch ${url}: ${err.message}`);
        }
    }
}
