import UIKit
import WebKit
import XCTest
@testable import SplashScreenPlugin

final class SplashScreenGeometryTests: XCTestCase {
    @MainActor
    func testStatusBarOffsetsKeepSplashInWindowCoordinates() {
        let fixture = SplashFixture(size: CGSize(width: 375, height: 812))
        defer { fixture.close() }
        let initialFrame = fixture.splashFrameInWindow
        XCTAssertEqual(initialFrame.origin, .zero)
        XCTAssertGreaterThan(initialFrame.width, 0)
        XCTAssertGreaterThan(initialFrame.height, 0)

        for offset in [20, 44, 59, 0] as [CGFloat] {
            let parentFrame = CGRect(x: 0, y: offset, width: 375, height: 812 - offset)
            fixture.parent.frame = parentFrame

            assertSplashFrame(fixture, equals: initialFrame)
            XCTAssertEqual(fixture.parent.frame, parentFrame)
        }
    }

    @MainActor
    func testWindowResizesUpdateSplashSize() {
        let fixture = SplashFixture(size: CGSize(width: 768, height: 1024))
        defer { fixture.close() }

        for size in [
            CGSize(width: 1024, height: 768),
            CGSize(width: 507, height: 768),
            CGSize(width: 768, height: 1024),
        ] {
            fixture.window.frame.size = size
            XCTAssertEqual(fixture.window.bounds.size, size)
            let parentFrame = CGRect(x: 0, y: 24, width: size.width, height: size.height - 24)
            fixture.parent.frame = parentFrame

            assertSplashCoversWindow(fixture)
            XCTAssertEqual(fixture.parent.frame, parentFrame)
        }
    }

    @MainActor
    func testFrameChangeAfterWindowAttachmentCorrectsSplash() {
        let fixture = SplashFixture(size: CGSize(width: 375, height: 812), attached: false)
        defer { fixture.close() }
        XCTAssertNil(fixture.parent.window)

        fixture.window.addSubview(fixture.parent)
        fixture.parent.frame = CGRect(x: 0, y: 44, width: 375, height: 768)

        XCTAssertTrue(fixture.parent.window === fixture.window)
        assertSplashCoversWindow(fixture)
    }

    @MainActor
    private func assertSplashCoversWindow(
        _ fixture: SplashFixture,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        assertSplashFrame(fixture, equals: fixture.window.bounds, file: file, line: line)
    }

    @MainActor
    private func assertSplashFrame(
        _ fixture: SplashFixture,
        equals expected: CGRect,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        let frame = fixture.splashFrameInWindow
        XCTAssertEqual(frame.origin.x, expected.origin.x, accuracy: 0.01, file: file, line: line)
        XCTAssertEqual(frame.origin.y, expected.origin.y, accuracy: 0.01, file: file, line: line)
        XCTAssertEqual(frame.width, expected.width, accuracy: 0.01, file: file, line: line)
        XCTAssertEqual(frame.height, expected.height, accuracy: 0.01, file: file, line: line)
    }
}

@MainActor
private final class SplashFixture {
    let window: UIWindow
    let parent: WKWebView
    let splash: SplashScreen

    var splashFrameInWindow: CGRect {
        let view = splash.viewController.view!
        return view.convert(view.bounds, to: window)
    }

    init(size: CGSize, attached: Bool = true) {
        window = UIWindow(frame: CGRect(origin: .zero, size: size))
        parent = WKWebView(frame: window.bounds)
        splash = SplashScreen(parentView: parent, config: SplashScreenConfig())
        if attached {
            window.addSubview(parent)
        }
        splash.viewController.view.frame = window.bounds
        parent.addSubview(splash.viewController.view)

        // Match the production observers without loading an app-only LaunchScreen storyboard.
        parent.addObserver(splash, forKeyPath: "frame", options: .new, context: nil)
        parent.addObserver(splash, forKeyPath: "bounds", options: .new, context: nil)
        splash.observeValue(forKeyPath: "frame", of: parent, change: nil, context: nil)
    }

    func close() {
        parent.removeObserver(splash, forKeyPath: "frame")
        parent.removeObserver(splash, forKeyPath: "bounds")
        splash.viewController.view.removeFromSuperview()
        parent.removeFromSuperview()
    }
}
