/**
 * Detox Configuration for Mobile App Testing
 * Supports both iOS and Android testing
 */

module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'tests/mobile/jest.config.js'
    },
    jest: {
      setupFilesAfterEnv: ['<rootDir>/tests/mobile/setup.js']
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: '../mobile/ios/build/Build/Products/Debug-iphonesimulator/CrybMobile.app',
      build: 'cd ../mobile && xcodebuild -workspace ios/CrybMobile.xcworkspace -scheme CrybMobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: '../mobile/ios/build/Build/Products/Release-iphonesimulator/CrybMobile.app',
      build: 'cd ../mobile && xcodebuild -workspace ios/CrybMobile.xcworkspace -scheme CrybMobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: '../mobile/android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd ../mobile/android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug'
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: '../mobile/android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd ../mobile/android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14 Pro'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_33'
      }
    },
    'ios.sim.debug': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14 Pro'
      }
    },
    'ios.sim.release': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14 Pro'
      }
    },
    'android.emu.debug': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_33'
      }
    },
    'android.emu.release': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_33'
      }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'ios.sim.debug',
      app: 'ios.debug'
    },
    'ios.sim.release': {
      device: 'ios.sim.release',
      app: 'ios.release'
    },
    'android.emu.debug': {
      device: 'android.emu.debug',
      app: 'android.debug'
    },
    'android.emu.release': {
      device: 'android.emu.release',
      app: 'android.release'
    }
  },
  logger: {
    level: process.env.CI ? 'debug' : 'info',
    overrideConsole: true,
    options: {
      showColors: !process.env.CI,
      showPrefix: true,
      showTimestamp: true
    }
  },
  artifacts: {
    rootDir: 'test-results/detox',
    pathBuilder: './tests/mobile/artifacts-path-builder.js',
    plugins: {
      log: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false
      },
      screenshot: {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: false,
        takeWhen: {
          testStart: false,
          testDone: true,
          appNotReady: true
        }
      },
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
        android: {
          bitRate: 4000000,
          timeLimit: 300000,
          verbose: false
        },
        simulator: {
          codec: 'hevc',
          preset: 'medium'
        }
      },
      instruments: {
        enabled: process.env.CI ? false : true,
        keepOnlyFailedTestsArtifacts: false
      },
      timeline: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false
      }
    }
  },
  behavior: {
    init: {
      reinstallApp: true,
      exposeGlobals: false
    },
    launchApp: 'auto',
    cleanup: {
      shutdownDevice: false
    }
  },
  session: {
    server: 'ws://localhost:8099',
    sessionId: 'CrybMobileTestSession',
    debugSynchronization: 10000
  }
};