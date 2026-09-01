#include "XuniGdkBridge.h"

#if defined(XUNI_WITH_MICROSOFT_GDK)
#include <XGameRuntimeInit.h>
#endif

namespace xuni::xbox {

bool GdkBridge::Initialize() {
#if defined(XUNI_WITH_MICROSOFT_GDK)
    const auto hr = XGameRuntimeInitialize();
    state_.runtimeReady = SUCCEEDED(hr);
    return state_.runtimeReady;
#else
    state_.runtimeReady = false;
    return false;
#endif
}

bool GdkBridge::SignInDefaultUser() {
    // Implement with XUser on the licensed GDK build. This public source keeps
    // the engine boundary stable without redistributing Microsoft SDK content.
    return false;
}

bool GdkBridge::UnlockAchievement(const char*) {
    // Implement through the XSAPI C achievement surface after XUser sign-in.
    return false;
}

bool GdkBridge::HasStoreEntitlement(const char*) {
    // Implement through XStore entitlement/license queries on the GDK build.
    return false;
}

void GdkBridge::OnSuspend() { state_.suspended = true; }
void GdkBridge::OnResume() { state_.suspended = false; }

void GdkBridge::Shutdown() {
#if defined(XUNI_WITH_MICROSOFT_GDK)
    if (state_.runtimeReady) XGameRuntimeUninitialize();
#endif
    state_ = {};
}

} // namespace xuni::xbox
