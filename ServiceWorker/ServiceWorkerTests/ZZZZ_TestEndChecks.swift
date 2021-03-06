import JavaScriptCore
import PromiseKit
@testable import ServiceWorker
import XCTest

class ZZZZ_TestEndChecks: XCTestCase {
    /// A wrap-up test we always want to run last, that double-checks all of our JSContexts
    /// have been garbage collected. If they haven't, it means we have a memory leak somewhere.
    func testShouldDeinitSuccessfully() {
        let queues = ServiceWorkerExecutionEnvironment.contexts

        Promise.value
            .then { () -> Promise<Void> in

                let allContexts = ServiceWorkerExecutionEnvironment.contexts.keyEnumerator().allObjects as! [JSContext]

                allContexts.forEach { context in
                    print("Still active context: \(context.name)")
                }
                if allContexts.count > 0 {
                    throw ErrorMessage("Contexts still exist")
                }

                let worker = ServiceWorker.createTestWorker(id: self.name)
                return worker.getExecutionEnvironment()
                    .map { _ -> Void in
                        XCTAssertEqual(ServiceWorkerExecutionEnvironment.contexts.keyEnumerator().allObjects.count, 1)
                    }

            }.then { _ -> Promise<Void> in

                Promise<Void> { resolver in
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                        print("Performing check")

                        queues.objectEnumerator()!.forEach { _ in
                            print("valll")
                        }

                        queues.keyEnumerator().forEach { key in
                            let val = queues.object(forKey: key as! JSContext)
                            print("WHAAT")
                        }

                        XCTAssertEqual(ServiceWorkerExecutionEnvironment.contexts.keyEnumerator().allObjects.count, 0)
                        resolver.fulfill(())
                    }
                }
            }
            .assertResolves()
    }
}
