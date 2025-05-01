"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
describe('StorageProvider Interface', () => {
    // Mock implementation of StorageProvider for testing interface
    class MockStorageProvider {
        constructor() {
            this.mockStorage = new Map();
            this.mockMetadata = new Map();
        }
        writeFile(path, data) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, data_1, data_1_1;
                var _b, e_1, _c, _d;
                var _e;
                if (Buffer.isBuffer(data)) {
                    this.mockStorage.set(path, data);
                }
                else {
                    // Convert stream to buffer for testing
                    const chunks = [];
                    try {
                        for (_a = true, data_1 = __asyncValues(data); data_1_1 = yield data_1.next(), _b = data_1_1.done, !_b; _a = true) {
                            _d = data_1_1.value;
                            _a = false;
                            const chunk = _d;
                            chunks.push(Buffer.from(chunk));
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (!_a && !_b && (_c = data_1.return)) yield _c.call(data_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    this.mockStorage.set(path, Buffer.concat(chunks));
                }
                // Add default metadata if none exists
                if (!this.mockMetadata.has(path)) {
                    this.mockMetadata.set(path, {
                        name: path.split('/').pop() || '',
                        path,
                        size: ((_e = this.mockStorage.get(path)) === null || _e === void 0 ? void 0 : _e.length) || 0,
                        contentType: 'application/octet-stream',
                        lastModified: new Date(),
                        createdAt: new Date()
                    });
                }
            });
        }
        readFile(path) {
            return __awaiter(this, void 0, void 0, function* () {
                const data = this.mockStorage.get(path);
                if (!data) {
                    throw new Error(`File not found: ${path}`);
                }
                return data;
            });
        }
        createReadStream(path) {
            const data = this.mockStorage.get(path);
            if (!data) {
                throw new Error(`File not found: ${path}`);
            }
            return stream_1.Readable.from(data);
        }
        createWriteStream(path) {
            const chunks = [];
            const writable = new stream_1.Writable({
                write(chunk, encoding, callback) {
                    chunks.push(Buffer.from(chunk));
                    callback();
                }
            });
            writable.on('finish', () => {
                this.mockStorage.set(path, Buffer.concat(chunks));
            });
            return writable;
        }
        deleteFile(path) {
            return __awaiter(this, void 0, void 0, function* () {
                this.mockStorage.delete(path);
                this.mockMetadata.delete(path);
            });
        }
        fileExists(path) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.mockStorage.has(path);
            });
        }
        createDirectory(path) {
            return __awaiter(this, void 0, void 0, function* () {
                // For testing, just mark it as an empty file
                this.mockStorage.set(`${path}/.directory`, Buffer.from(''));
            });
        }
        listDirectory(path) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = [];
                for (const key of this.mockStorage.keys()) {
                    if (key.startsWith(path) && key !== path) {
                        const relativePath = key.slice(path.length + 1).split('/')[0];
                        if (relativePath && !result.includes(relativePath)) {
                            result.push(relativePath);
                        }
                    }
                }
                return result;
            });
        }
        deleteDirectory(path, recursive) {
            return __awaiter(this, void 0, void 0, function* () {
                if (recursive) {
                    for (const key of [...this.mockStorage.keys()]) {
                        if (key === path || key.startsWith(`${path}/`)) {
                            this.mockStorage.delete(key);
                            this.mockMetadata.delete(key);
                        }
                    }
                }
                else {
                    // Only delete if directory is empty
                    const contents = yield this.listDirectory(path);
                    if (contents.length === 0) {
                        this.mockStorage.delete(`${path}/.directory`);
                    }
                    else {
                        throw new Error('Directory not empty');
                    }
                }
            });
        }
        getMetadata(path) {
            return __awaiter(this, void 0, void 0, function* () {
                const metadata = this.mockMetadata.get(path);
                if (!metadata) {
                    throw new Error(`File not found: ${path}`);
                }
                return metadata;
            });
        }
        updateMetadata(path, metadata) {
            return __awaiter(this, void 0, void 0, function* () {
                const existing = this.mockMetadata.get(path);
                if (!existing) {
                    throw new Error(`File not found: ${path}`);
                }
                this.mockMetadata.set(path, Object.assign(Object.assign({}, existing), metadata));
            });
        }
        getPublicUrl(path) {
            return __awaiter(this, void 0, void 0, function* () {
                return `https://example.com/public/${path}`;
            });
        }
        getSignedUrl(path, expiry) {
            return __awaiter(this, void 0, void 0, function* () {
                return `https://example.com/signed/${path}?token=mock&expires=${Date.now() + expiry * 1000}`;
            });
        }
        getBasePath() {
            return '/test/storage/path';
        }
    }
    let provider;
    beforeEach(() => {
        provider = new MockStorageProvider();
    });
    describe('Basic file operations', () => {
        it('should write and read file content', () => __awaiter(void 0, void 0, void 0, function* () {
            const filePath = 'test/file.txt';
            const content = Buffer.from('Hello, world!');
            yield provider.writeFile(filePath, content);
            const result = yield provider.readFile(filePath);
            expect(result.toString()).toBe('Hello, world!');
        }));
        it('should write from stream and read file content', () => __awaiter(void 0, void 0, void 0, function* () {
            const filePath = 'test/stream-file.txt';
            const content = 'Hello from stream!';
            const stream = stream_1.Readable.from([content]);
            yield provider.writeFile(filePath, stream);
            const result = yield provider.readFile(filePath);
            expect(result.toString()).toBe(content);
        }));
        it('should check if file exists', () => __awaiter(void 0, void 0, void 0, function* () {
            const filePath = 'test/exists.txt';
            const nonExistentPath = 'test/does-not-exist.txt';
            yield provider.writeFile(filePath, Buffer.from('test'));
            expect(yield provider.fileExists(filePath)).toBe(true);
            expect(yield provider.fileExists(nonExistentPath)).toBe(false);
        }));
        it('should delete a file', () => __awaiter(void 0, void 0, void 0, function* () {
            const filePath = 'test/to-delete.txt';
            yield provider.writeFile(filePath, Buffer.from('delete me'));
            expect(yield provider.fileExists(filePath)).toBe(true);
            yield provider.deleteFile(filePath);
            expect(yield provider.fileExists(filePath)).toBe(false);
        }));
    });
    describe('Stream operations', () => {
        it('should create readable stream from file', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, e_2, _b, _c;
            const filePath = 'test/stream-read.txt';
            const content = 'Stream content';
            yield provider.writeFile(filePath, Buffer.from(content));
            const stream = provider.createReadStream(filePath);
            const chunks = [];
            try {
                for (var _d = true, stream_2 = __asyncValues(stream), stream_2_1; stream_2_1 = yield stream_2.next(), _a = stream_2_1.done, !_a; _d = true) {
                    _c = stream_2_1.value;
                    _d = false;
                    const chunk = _c;
                    chunks.push(Buffer.from(chunk));
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = stream_2.return)) yield _b.call(stream_2);
                }
                finally { if (e_2) throw e_2.error; }
            }
            const result = Buffer.concat(chunks).toString();
            expect(result).toBe(content);
        }));
        it('should write to file using writable stream', () => __awaiter(void 0, void 0, void 0, function* () {
            const filePath = 'test/stream-write.txt';
            const content = 'Written via stream';
            const writeStream = provider.createWriteStream(filePath);
            writeStream.write(content);
            writeStream.end();
            // Wait for stream to finish
            yield new Promise(resolve => writeStream.on('finish', resolve));
            const result = yield provider.readFile(filePath);
            expect(result.toString()).toBe(content);
        }));
    });
    describe('Directory operations', () => {
        it('should create directory', () => __awaiter(void 0, void 0, void 0, function* () {
            const dirPath = 'test/new-dir';
            yield provider.createDirectory(dirPath);
            // Check if directory marker exists
            expect(yield provider.fileExists(`${dirPath}/.directory`)).toBe(true);
        }));
        it('should list directory contents', () => __awaiter(void 0, void 0, void 0, function* () {
            const dirPath = 'test/list-dir';
            yield provider.createDirectory(dirPath);
            yield provider.writeFile(`${dirPath}/file1.txt`, Buffer.from('file1'));
            yield provider.writeFile(`${dirPath}/file2.txt`, Buffer.from('file2'));
            yield provider.writeFile(`${dirPath}/subdir/file3.txt`, Buffer.from('file3'));
            const files = yield provider.listDirectory(dirPath);
            expect(files).toContain('file1.txt');
            expect(files).toContain('file2.txt');
            expect(files).toContain('subdir');
            // Don't strictly check the length as implementation details might vary,
            // just ensure the expected items are in the list
            expect(files.length).toBeGreaterThanOrEqual(3);
        }));
        it('should delete directory recursively', () => __awaiter(void 0, void 0, void 0, function* () {
            const dirPath = 'test/delete-dir';
            yield provider.createDirectory(dirPath);
            yield provider.writeFile(`${dirPath}/file1.txt`, Buffer.from('file1'));
            yield provider.writeFile(`${dirPath}/subdir/file2.txt`, Buffer.from('file2'));
            yield provider.deleteDirectory(dirPath, true);
            expect(yield provider.fileExists(`${dirPath}/.directory`)).toBe(false);
            expect(yield provider.fileExists(`${dirPath}/file1.txt`)).toBe(false);
            expect(yield provider.fileExists(`${dirPath}/subdir/file2.txt`)).toBe(false);
        }));
        it('should fail to delete non-empty directory without recursive flag', () => __awaiter(void 0, void 0, void 0, function* () {
            const dirPath = 'test/non-empty-dir';
            yield provider.createDirectory(dirPath);
            yield provider.writeFile(`${dirPath}/file1.txt`, Buffer.from('file1'));
            yield expect(provider.deleteDirectory(dirPath, false)).rejects.toThrow('Directory not empty');
            expect(yield provider.fileExists(`${dirPath}/file1.txt`)).toBe(true);
        }));
    });
    describe('Metadata operations', () => {
        it('should get file metadata', () => __awaiter(void 0, void 0, void 0, function* () {
            const filePath = 'test/metadata.txt';
            const content = Buffer.from('metadata test');
            yield provider.writeFile(filePath, content);
            const metadata = yield provider.getMetadata(filePath);
            expect(metadata.name).toBe('metadata.txt');
            expect(metadata.path).toBe(filePath);
            expect(metadata.size).toBe(content.length);
            expect(metadata.lastModified).toBeInstanceOf(Date);
            expect(metadata.createdAt).toBeInstanceOf(Date);
        }));
        it('should update file metadata', () => __awaiter(void 0, void 0, void 0, function* () {
            const filePath = 'test/update-metadata.txt';
            yield provider.writeFile(filePath, Buffer.from('test'));
            const newLastModified = new Date('2023-01-01');
            yield provider.updateMetadata(filePath, {
                lastModified: newLastModified,
                contentType: 'text/plain',
            });
            const metadata = yield provider.getMetadata(filePath);
            expect(metadata.lastModified).toEqual(newLastModified);
            expect(metadata.contentType).toBe('text/plain');
        }));
    });
    describe('URL operations', () => {
        it('should generate public URL for file', () => __awaiter(void 0, void 0, void 0, function* () {
            const filePath = 'test/public.txt';
            yield provider.writeFile(filePath, Buffer.from('public'));
            const url = yield provider.getPublicUrl(filePath);
            expect(url).toContain(filePath);
            expect(url).toMatch(/^https?:\/\//);
        }));
        it('should generate signed URL with expiration', () => __awaiter(void 0, void 0, void 0, function* () {
            const filePath = 'test/signed.txt';
            const expiry = 3600; // 1 hour
            yield provider.writeFile(filePath, Buffer.from('signed'));
            const url = yield provider.getSignedUrl(filePath, expiry);
            expect(url).toContain(filePath);
            expect(url).toContain('token=');
            expect(url).toContain('expires=');
        }));
    });
});
//# sourceMappingURL=provider.interface.test.js.map