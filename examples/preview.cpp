#include <iostream>
#include <string_view>

enum class Sky { Afternoon, PlumEvening };

struct Horizon {
    std::string_view label;
    int brightness;
};

constexpr auto soften(int value) noexcept -> int {
    return value > 84 ? 84 : value;
}

int main() {
    const Horizon sunset{"Afterglow", soften(100)};
    std::cout << sunset.label << ": " << sunset.brightness << "%\n";
}
