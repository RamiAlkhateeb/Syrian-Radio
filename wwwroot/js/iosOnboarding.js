const onboardingKey = "syrian-radio-ios-onboarding-seen";

export function claimFirstVisit() {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isStandalone = window.navigator.standalone === true
        || window.matchMedia("(display-mode: standalone)").matches;

    if (!isIos || isStandalone || localStorage.getItem(onboardingKey)) {
        return false;
    }

    localStorage.setItem(onboardingKey, "true");
    return true;
}
