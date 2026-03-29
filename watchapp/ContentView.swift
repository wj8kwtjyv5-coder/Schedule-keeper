// ContentView.swift — Feliz Dias Watch UI
// Shows: Recovery ring · Next session · Manual sync button

import SwiftUI
import WatchKit

struct ContentView: View {
    @StateObject private var vm = WatchViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {

                // ── Recovery ring ─────────────────────────────
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.1), lineWidth: 6)
                    Circle()
                        .trim(from: 0, to: vm.recoveryPct)
                        .stroke(vm.recoveryColor, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 0) {
                        Text(vm.recoveryLabel)
                            .font(.system(size: 22, weight: .bold, design: .rounded))
                            .foregroundColor(vm.recoveryColor)
                        Text("recovery")
                            .font(.system(size: 9, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                }
                .frame(width: 90, height: 90)
                .padding(.top, 4)

                // ── Next session ──────────────────────────────
                if let next = vm.nextSession {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("NEXT")
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundColor(.secondary)
                        Text(next.title)
                            .font(.system(size: 13, weight: .semibold))
                            .lineLimit(2)
                        if let time = next.time {
                            Text(time)
                                .font(.system(size: 11))
                                .foregroundColor(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 4)
                } else {
                    Text("All clear today")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }

                // ── Sync button ───────────────────────────────
                Button(action: { vm.syncNow() }) {
                    HStack(spacing: 6) {
                        if vm.syncing {
                            ProgressView().scaleEffect(0.7)
                        } else {
                            Image(systemName: "arrow.triangle.2.circlepath")
                                .font(.system(size: 11))
                        }
                        Text(vm.syncing ? "Syncing…" : "Sync now")
                            .font(.system(size: 12, weight: .medium))
                    }
                    .padding(.vertical, 7)
                    .frame(maxWidth: .infinity)
                    .background(Color.purple.opacity(0.3))
                    .cornerRadius(20)
                }
                .disabled(vm.syncing)

                if let msg = vm.statusMessage {
                    Text(msg)
                        .font(.system(size: 10))
                        .foregroundColor(vm.syncSuccess ? .green : .orange)
                        .multilineTextAlignment(.center)
                }
            }
            .padding(.horizontal, 8)
            .padding(.bottom, 8)
        }
    }
}

// MARK: - ViewModel

@MainActor
class WatchViewModel: ObservableObject {
    @Published var recoveryPct: CGFloat = 0
    @Published var recoveryLabel: String = "--"
    @Published var recoveryColor: Color = .gray
    @Published var nextSession: NextSession? = nil
    @Published var syncing = false
    @Published var statusMessage: String? = nil
    @Published var syncSuccess = false

    private let syncManager = HealthSyncManager()

    init() {
        Task { await loadRecovery() }
        Task { await loadNextSession() }
    }

    func syncNow() {
        Task {
            syncing = true
            statusMessage = nil
            do {
                try await syncManager.sync(to: FelizDiasWatchApp.healthURL)
                syncSuccess = true
                statusMessage = "Synced ✓"
                await loadRecovery()
            } catch {
                syncSuccess = false
                statusMessage = "Sync failed — try again"
            }
            syncing = false
        }
    }

    private func loadRecovery() async {
        // Fetch latest readiness from API
        guard let url = URL(string: "\(FelizDiasWatchApp.apiBase)/api/health") else { return }
        guard let (data, _) = try? await URLSession.shared.data(from: url),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let r = json["readiness"] as? Int else { return }
        recoveryPct = CGFloat(r) / 100
        recoveryLabel = "\(r)%"
        recoveryColor = r >= 67 ? .green : r >= 34 ? .yellow : .red
    }

    private func loadNextSession() async {
        // Fetch schedule from sync endpoint
        guard let url = URL(string: "\(FelizDiasWatchApp.apiBase)/api/sync") else { return }
        guard let (data, _) = try? await URLSession.shared.data(from: url),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let tasks = json["tasks"] as? [[String: Any]] else { return }
        let today = DateFormatter.isoDate.string(from: Date())
        let now = DateFormatter.shortTime.string(from: Date())
        nextSession = tasks
            .filter { ($0["date"] as? String) == today }
            .filter { !($0["completed"] as? Bool ?? false) }
            .filter { ($0["category"] as? String) != "work" }
            .filter { ($0["time"] as? String ?? "99:99") >= now }
            .sorted { ($0["time"] as? String ?? "") < ($1["time"] as? String ?? "") }
            .first.map { NextSession(title: $0["title"] as? String ?? "", time: $0["time"] as? String) }
    }
}

struct NextSession {
    let title: String
    let time: String?
}

extension DateFormatter {
    static let isoDate: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f
    }()
    static let shortTime: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "HH:mm"; return f
    }()
}
