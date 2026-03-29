// FelizDiasWatchApp.swift — Apple Watch App Entry Point
// Background task fires at 6:30am daily → reads HealthKit → POSTs to API
// Direct watch-to-cloud sync. No Shortcuts. No iPhone involvement.

import SwiftUI
import WatchKit

@main
struct FelizDiasWatchApp: App {

    // ── CONFIG ─────────────────────────────────────────────────
    // Replace with your Vercel deployment URL before building
    static let apiBase = "https://YOUR-APP.vercel.app"
    static let healthURL = URL(string: "\(apiBase)/api/health")!
    // ───────────────────────────────────────────────────────────

    @WKApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

// MARK: - App Delegate (background task handling)

class AppDelegate: NSObject, WKApplicationDelegate {

    private let syncManager = HealthSyncManager()

    func applicationDidFinishLaunching() {
        // Request HealthKit on first launch, then schedule the first sync
        Task {
            try? await syncManager.requestPermissions()
            scheduleNextSync()
        }
    }

    // Called by watchOS when a background refresh task fires
    func handle(_ backgroundTasks: Set<WKRefreshBackgroundTask>) {
        for task in backgroundTasks {
            switch task {
            case let refreshTask as WKApplicationRefreshBackgroundTask:
                Task {
                    do {
                        try await syncManager.sync(to: FelizDiasWatchApp.healthURL)
                        WKApplication.shared().scheduleBackgroundRefresh(
                            withPreferredDate: nextSyncTime(),
                            userInfo: nil,
                            scheduledCompletion: { _ in }
                        )
                    } catch {
                        // Silent fail — retry at next scheduled time
                        scheduleNextSync()
                    }
                    refreshTask.setTaskCompletedWithSnapshot(false)
                }

            default:
                task.setTaskCompletedWithSnapshot(false)
            }
        }
    }

    // MARK: - Scheduling

    /// Schedules the next background sync for 6:30am
    func scheduleNextSync() {
        WKApplication.shared().scheduleBackgroundRefresh(
            withPreferredDate: nextSyncTime(),
            userInfo: nil,
            scheduledCompletion: { _ in }
        )
    }

    /// Returns the next 6:30am (today if before 6:30, tomorrow otherwise)
    private func nextSyncTime() -> Date {
        var components = Calendar.current.dateComponents([.year, .month, .day], from: Date())
        components.hour = 6
        components.minute = 30
        let today630 = Calendar.current.date(from: components)!
        return today630 > Date() ? today630 : Calendar.current.date(byAdding: .day, value: 1, to: today630)!
    }
}
