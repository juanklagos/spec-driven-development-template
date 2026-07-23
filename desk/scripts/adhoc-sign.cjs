// Ad-hoc signs the macOS bundle after packaging — spec 023 R8.
//
// Apple Silicon does not accept an unsigned bundle at all. Every arm64 binary
// must carry at least an ad-hoc signature, and a .app whose seal is missing or
// broken is reported to the user as "«SDD Desk» is damaged and can't be opened.
// You should move it to the Trash." — which reads like a corrupted download,
// not like a missing certificate, and sends people to delete the file.
//
// That is exactly what 0.1.1 shipped. `CSC_IDENTITY_AUTO_DISCOVERY=false` was
// set in CI to stop electron-builder from failing when it found no Developer ID
// in the keychain, and it also skipped the ad-hoc signing that makes an
// unsigned app runnable at all. The binary kept only the linker's own ad-hoc
// signature (`Identifier=Electron`, `Sealed Resources=none`), so the bundle had
// no valid seal.
//
// Ad-hoc signing does NOT replace a Developer ID: Gatekeeper still shows
// "unidentified developer" and the right-click-Open flow is still needed. What
// it fixes is the difference between "macOS wants you to confirm" and "macOS
// tells you the app is broken".

const { execFileSync } = require("node:child_process");

exports.default = async function adhocSign(context) {
  if (context.electronPlatformName !== "darwin") return;

  // A real identity means electron-builder already signed it properly; re-signing
  // ad-hoc on top would throw away the certificate.
  if (process.env.CSC_LINK || process.env.CSC_NAME) return;

  const appPath = `${context.appOutDir}/${context.packager.appInfo.productFilename}.app`;

  // --deep is deprecated for distribution signing, but it is still the way to
  // seal every nested helper and framework in one call for an ad-hoc identity,
  // and there is no certificate here for the deprecation to matter to.
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", appPath], { stdio: "inherit" });

  // Verify rather than trust: a signature that did not take would ship the very
  // bug this hook exists to prevent, and silently.
  execFileSync("codesign", ["--verify", "--deep", "--strict", appPath], { stdio: "inherit" });

  console.log(`[desk] ad-hoc signed ${appPath}`);
};
