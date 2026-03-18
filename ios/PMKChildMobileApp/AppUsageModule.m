//
//  AppUsageModule.m
//  PMKChildMobileApp
//
//  Bridge file for React Native module
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppUsageModule, NSObject)

RCT_EXTERN_METHOD(hasUsageStatsPermission:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(requestUsageStatsPermission:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAppUsageStats:(double)startTimeMs
                  endTimeMs:(double)endTimeMs
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getInstalledApps:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getCurrentForegroundApp:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getTodayUsageStats:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
