//
//  AppUsageModule.swift
//  PMKChildMobileApp
//
//  iOS App Usage Tracking Module
//  Note: iOS has strict privacy restrictions - we can only track our own app's usage
//

import Foundation
import React

@objc(AppUsageModule)
class AppUsageModule: NSObject {

  // iOS Limitation: Cannot access other apps' usage data due to privacy restrictions
  // We can only track:
  // 1. Our app's foreground/background time
  // 2. App state changes (for pickup count)
  // 3. Notification count (if permission granted)

  private var appLaunchTime: Date?
  private var lastForegroundTime: Date?
  private var totalForegroundTime: TimeInterval = 0

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc
  func constantsToExport() -> [AnyHashable : Any]! {
    return [
      "platform": "ios",
      "limitation": "iOS privacy restrictions prevent tracking other apps"
    ]
  }

  // MARK: - Permission Methods

  @objc
  func hasUsageStatsPermission(_ resolve: @escaping RCTPromiseResolveBlock,
                                reject: @escaping RCTPromiseRejectBlock) {
    // iOS doesn't have usage stats permission like Android
    // We return false to indicate limited tracking capability
    resolve(false)
  }

  @objc
  func requestUsageStatsPermission(_ resolve: @escaping RCTPromiseResolveBlock,
                                    reject: @escaping RCTPromiseRejectBlock) {
    // Cannot request permission on iOS - not available
    resolve(false)
  }

  // MARK: - App Usage Methods

  @objc
  func getAppUsageStats(_ startTimeMs: Double,
                        endTimeMs: Double,
                        resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {
    // iOS limitation: Can only return data about our own app
    let appName = Bundle.main.infoDictionary?["CFBundleName"] as? String ?? "PMK Child Monitor"

    let usageData: [[String: Any]] = [
      [
        "packageName": Bundle.main.bundleIdentifier ?? "com.pmk.childapp",
        "appName": appName,
        "totalTimeInForeground": totalForegroundTime * 1000, // Convert to milliseconds
        "lastTimeUsed": Date().timeIntervalSince1970 * 1000,
        "firstTimeStamp": (appLaunchTime ?? Date()).timeIntervalSince1970 * 1000,
        "lastTimeStamp": Date().timeIntervalSince1970 * 1000
      ]
    ]

    resolve(usageData)
  }

  @objc
  func getInstalledApps(_ resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {
    // iOS limitation: Cannot access list of installed apps due to privacy
    let appName = Bundle.main.infoDictionary?["CFBundleName"] as? String ?? "PMK Child Monitor"

    let apps: [[String: Any]] = [
      [
        "packageName": Bundle.main.bundleIdentifier ?? "com.pmk.childapp",
        "appName": appName
      ]
    ]

    resolve(apps)
  }

  @objc
  func getCurrentForegroundApp(_ resolve: @escaping RCTPromiseResolveBlock,
                                reject: @escaping RCTPromiseRejectBlock) {
    // iOS limitation: Can only detect our own app
    let appName = Bundle.main.infoDictionary?["CFBundleName"] as? String ?? "PMK Child Monitor"

    let currentApp: [String: Any] = [
      "packageName": Bundle.main.bundleIdentifier ?? "com.pmk.childapp",
      "appName": appName
    ]

    resolve(currentApp)
  }

  @objc
  func getTodayUsageStats(_ resolve: @escaping RCTPromiseResolveBlock,
                          reject: @escaping RCTPromiseRejectBlock) {
    // Get usage stats for today
    let calendar = Calendar.current
    let startOfDay = calendar.startOfDay(for: Date())
    let startTimeMs = startOfDay.timeIntervalSince1970 * 1000
    let endTimeMs = Date().timeIntervalSince1970 * 1000

    getAppUsageStats(startTimeMs, endTimeMs: endTimeMs, resolve: resolve, reject: reject)
  }

  // MARK: - Internal Tracking

  func trackAppLaunch() {
    appLaunchTime = Date()
    lastForegroundTime = Date()
  }

  func trackAppForeground() {
    lastForegroundTime = Date()
  }

  func trackAppBackground() {
    if let foregroundTime = lastForegroundTime {
      let sessionDuration = Date().timeIntervalSince(foregroundTime)
      totalForegroundTime += sessionDuration
    }
    lastForegroundTime = nil
  }
}
