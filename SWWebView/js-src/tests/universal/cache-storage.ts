import { execInWorker } from "../util/exec-in-worker";
import { waitUntilWorkerIsActivated } from "../util/sw-lifecycle";
import { assert } from "chai";
import { unregisterEverything } from "../util/unregister-everything";

describe("CacheStorage", () => {
    afterEach(() => {
        return navigator.serviceWorker
            .getRegistration("/fixtures/")
            .then(reg => {
                return execInWorker(
                    reg.active!,
                    `
                return caches.keys().then(keys => {
                    return Promise.all(keys.map(k => caches.delete(k)));
                });
            `
                );
            })
            .then(() => {
                return unregisterEverything();
            });
    });

    it("should open a cache and record it in list of keys", () => {
        return navigator.serviceWorker
            .register("/fixtures/exec-worker.js")
            .then(reg => {
                return waitUntilWorkerIsActivated(reg.installing!);
            })
            .then(worker => {
                return execInWorker(
                    worker,
                    `
                return caches.open("test-cache")
                .then(() => {
                    return caches.keys()
                })
            `
                );
            })
            .then((response: string[]) => {
                assert.equal(response.length, 1);
                assert.equal(response[0], "test-cache");
            });
    });

    it("should return correct values for has()", () => {
        return navigator.serviceWorker
            .register("/fixtures/exec-worker.js")
            .then(reg => {
                return waitUntilWorkerIsActivated(reg.installing!);
            })
            .then(worker => {
                return execInWorker(
                    worker,
                    "return caches.has('test-cache')"
                ).then(response => {
                    assert.equal(response, false);
                    return execInWorker(
                        worker,
                        "return caches.open('test-cache').then(() => caches.has('test-cache'))"
                    );
                });
            })
            .then(response2 => {
                assert.equal(response2, true);
            });
    });

    it("should delete() successfully", () => {
        return navigator.serviceWorker
            .register("/fixtures/exec-worker.js")
            .then(reg => {
                return waitUntilWorkerIsActivated(reg.installing!);
            })
            .then(worker => {
                return execInWorker(
                    worker,
                    `return caches.open('test-cache')
                        .then(() => caches.delete('test-cache'))
                        .then(() => caches.has('test-cache'))`
                );
            })
            .then(response2 => {
                assert.equal(response2, false);
            });
    });
});
