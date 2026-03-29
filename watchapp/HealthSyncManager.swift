// HealthSyncManager.swift — Feliz Dias Apple Watch
// Reads HealthKit directly from the watch → POSTs to /api/health
// No Shortcuts. No Scriptable. Straight from the wrist.

import HealthKit
import Foundation

class HealthSyncManager {
    private let store = HKHealthStore()

    // MARK: - Permissions (call once on first launch)

    func requestPermissions() async throws {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        let types: Set<HKObjectType> = [
            HKQuantityType(.heartRateVariabilitySDNN),
            HKQuantityType(.restingHeartRate),
            HKCategoryType(.sleepAnalysis),
            HKObjectType.workoutType()
        ]
        try await store.requestAuthorization(toShare: [], read: types)
    }

    // MARK: - Main Sync

    func sync(to apiURL: URL) async throws {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let today = formatter.string(from: Date())

        var payload: [String: Any] = ["date": today]

        // HRV (ms) — measured by Watch overnight
        if let hrv = await queryLatestQuantity(
            type: .heartRateVariabilitySDNN,
            unit: HKUnit.secondUnit(with: .milli),
            lookback: 2
        ) {
            payload["hrv"] = (hrv * 10).rounded() / 10
        }

        // Resting HR (bpm) — Watch measures during sleep/rest
        if let rhr = await queryLatestQuantity(
            type: .restingHeartRate,
            unit: HKUnit.count().unitDivided(by: .minute()),
            lookback: 2
        ) {
            payload["resting_hr"] = Int(rhr.rounded())
        }

        // Sleep
        if let sleep = await querySleep() {
            payload["sleep_hours"] = (sleep * 10).rounded() / 10
            payload["sleep_quality"] = sleep >= 7.5 ? "good" : sleep >= 6.0 ? "ok" : "poor"
        }

        // Workouts from past 24h
        let workouts = await queryWorkouts()
        if !workouts.isEmpty {
            payload["workouts"] = workouts
        }

        // POST to API
        var request = URLRequest(url: apiURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 20
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
    }

    // MARK: - HealthKit Queries

    private func queryLatestQuantity(type identifier: HKQuantityTypeIdentifier,
                                     unit: HKUnit,
                                     lookback days: Int) async -> Double? {
        let qtype = HKQuantityType(identifier)
        let start = Calendar.current.date(byAdding: .day, value: -days, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: Date())
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.quantitySample(type: qtype, predicate: predicate)],
            sortDescriptors: [SortDescriptor(\.endDate, order: .reverse)],
            limit: 1
        )
        guard let results = try? await descriptor.result(for: store),
              let sample = results.first as? HKQuantitySample else { return nil }
        return sample.quantity.doubleValue(for: unit)
    }

    private func querySleep() async -> Double? {
        let sleepType = HKCategoryType(.sleepAnalysis)
        let start = Calendar.current.date(byAdding: .day, value: -1, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: Date())
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.categorySample(type: sleepType, predicate: predicate)],
            sortDescriptors: [SortDescriptor(\.startDate)]
        )
        guard let samples = try? await descriptor.result(for: store) else { return nil }
        // Sum all asleep stages (Core=1, Deep=2, REM=3)
        let totalSeconds = samples
            .compactMap { $0 as? HKCategorySample }
            .filter { $0.value >= HKCategoryValueSleepAnalysis.asleepCore.rawValue }
            .reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }
        return totalSeconds > 0 ? totalSeconds / 3600 : nil
    }

    private func queryWorkouts() async -> [[String: Any]] {
        let start = Calendar.current.date(byAdding: .day, value: -1, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: Date())
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.workout(predicate: predicate)],
            sortDescriptors: [SortDescriptor(\.startDate, order: .reverse)]
        )
        guard let workouts = try? await descriptor.result(for: store) else { return [] }

        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm"

        return workouts.compactMap { sample -> [String: Any]? in
            guard let workout = sample as? HKWorkout else { return nil }
            var w: [String: Any] = [
                "type": workout.workoutActivityType.name,
                "start_time": timeFormatter.string(from: workout.startDate),
                "duration_min": Int((workout.duration / 60).rounded())
            ]
            if let cal = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                w["calories"] = Int(cal.rounded())
            }
            return w
        }
    }
}

// MARK: - Workout name helper
extension HKWorkoutActivityType {
    var name: String {
        switch self {
        case .running, .trackAndField: return "Running"
        case .cycling, .cycling: return "Cycling"
        case .soccer: return "Soccer"
        case .swimming: return "Swimming"
        case .yoga: return "Yoga"
        case .pilates: return "Pilates"
        case .traditionalStrengthTraining, .functionalStrengthTraining, .crossTraining: return "TraditionalStrengthTraining"
        case .walking, .hiking: return "Walking"
        default: return "Other"
        }
    }
}
