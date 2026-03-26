# Welcome to your Expo app 👋

review my code at /Users/calebboluwade/Downloads/Dev/RuralPay excluding native ios and android folders, node_modules as both a senior product specalitist and senior engineering manager, give a score btw 0 and 100 in terms of production user readiness, security checking for performance bottlenecks, product drop-offs and give a full implementation outline

bunx expo prebuild --clean
bunx expo prebuild --clean --platform android

rm -rf android/.gradle
rm -rf ~/.gradle/caches
rm -rf ~/.gradle/daemon
rm -rf ~/.gradle/buildOutputCleanup

cd android
./gradlew clean
cd ..
expo run:android --device --no-build-cache

NODE_ENV=production bunx expo run:android --device --variant debug

chmod -R u+rw node_modules

cd ios
rm -rf Pods
rm -rf Podfile.lock
rm -rf ~/Library/Caches/CocoaPods
rm -rf ~/.cocoapods/repos
pod repo update
cd ..
