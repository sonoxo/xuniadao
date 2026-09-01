#pragma once

#include <cstdint>
#include <string>

namespace xuni::xbox {

struct PlatformUser {
    std::uint64_t xuid{0};
    std::string gamertag;
    bool signedIn{false};
};

struct PlatformState {
    bool runtimeReady{false};
    bool servicesReady{false};
    bool suspended{false};
    PlatformUser user{};
};

// XUNI-owned boundary around the licensed Microsoft GDK. The implementation
// is compiled only on an authorized GDK workstation/private runner.
class GdkBridge {
public:
    bool Initialize();
    bool SignInDefaultUser();
    bool UnlockAchievement(const char* achievementId);
    bool HasStoreEntitlement(const char* storeId);
    void OnSuspend();
    void OnResume();
    void Shutdown();
    const PlatformState& State() const noexcept { return state_; }

private:
    PlatformState state_{};
};

} // namespace xuni::xbox
