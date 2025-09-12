# ==============================================
# CRYB MOBILE BUILD ENVIRONMENT - DOCKERFILE
# ==============================================

# Use Ubuntu for better Android/iOS toolchain support
FROM ubuntu:22.04 AS base

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=20.11.1
ENV JAVA_VERSION=17
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    zip \
    openjdk-${JAVA_VERSION}-jdk \
    python3 \
    python3-pip \
    build-essential \
    file \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Install Android SDK
RUN mkdir -p $ANDROID_SDK_ROOT \
    && cd $ANDROID_SDK_ROOT \
    && wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip \
    && unzip commandlinetools-linux-9477386_latest.zip \
    && mkdir -p cmdline-tools/latest \
    && mv cmdline-tools/* cmdline-tools/latest/ \
    && rm commandlinetools-linux-9477386_latest.zip

# Accept Android SDK licenses
RUN yes | sdkmanager --licenses

# Install Android SDK components
RUN sdkmanager --update \
    && sdkmanager "platforms;android-34" \
    && sdkmanager "build-tools;34.0.0" \
    && sdkmanager "platform-tools" \
    && sdkmanager "cmdline-tools;latest"

# ==============================================
# EXPO BUILD STAGE
# ==============================================
FROM base AS expo-builder

# Install Expo CLI and EAS CLI
RUN npm install -g @expo/cli@latest eas-cli@latest

# Create app user
RUN useradd -m -s /bin/bash builder
RUN chown -R builder:builder /opt/android-sdk

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ../../

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .
COPY ../../packages ./../../packages

# Switch to builder user
USER builder

# Prebuild for production
RUN npx expo prebuild --platform all --clear

# ==============================================
# ANDROID BUILD STAGE
# ==============================================
FROM expo-builder AS android-builder

# Switch back to root for build operations
USER root

# Copy Android signing configuration (will be mounted as secret in CI/CD)
RUN mkdir -p /app/android/app
VOLUME ["/app/android/app/keystore"]

# Build Android APK/AAB
RUN cd android && ./gradlew assembleRelease bundleRelease

# ==============================================
# IOS BUILD PREPARATION
# ==============================================
FROM expo-builder AS ios-builder

# Note: iOS builds require macOS, this stage prepares the iOS project
# Actual iOS building would happen on macOS runners in CI/CD

# Generate iOS project structure
RUN npx expo prebuild --platform ios

# Create artifacts directory
RUN mkdir -p /app/artifacts

# Copy build artifacts
COPY --from=android-builder /app/android/app/build/outputs/apk/release/app-release.apk /app/artifacts/
COPY --from=android-builder /app/android/app/build/outputs/bundle/release/app-release.aab /app/artifacts/

# ==============================================
# FINAL STAGE - ARTIFACTS
# ==============================================
FROM alpine:latest AS artifacts

RUN apk add --no-cache curl

# Copy build artifacts
COPY --from=ios-builder /app/artifacts/ /artifacts/
COPY --from=ios-builder /app/ios/ /ios-project/

WORKDIR /artifacts

# Add health check for the container
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD ls -la /artifacts/ || exit 1

CMD ["sh", "-c", "echo 'Mobile build artifacts ready' && tail -f /dev/null"]

# ==============================================
# BUILD ARGUMENTS AND LABELS
# ==============================================
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.title="CRYB Mobile Build Environment"
LABEL org.opencontainers.image.description="React Native build environment for CRYB mobile apps"
LABEL org.opencontainers.image.version=${VERSION}
LABEL org.opencontainers.image.created=${BUILD_DATE}
LABEL org.opencontainers.image.source="https://github.com/cryb-ai/platform"
LABEL org.opencontainers.image.revision=${VCS_REF}
LABEL org.opencontainers.image.vendor="CRYB AI"
LABEL org.opencontainers.image.licenses="MIT"