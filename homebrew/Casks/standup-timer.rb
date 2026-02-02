cask "standup-timer" do
  version "1.0.0"
  sha256 "bf811bec081ff08fc70a758d36da7dfb4766000cd162ee93df574a7987f0c022"

  url "https://github.com/anshprat/standup-timer/releases/download/v#{version}/Standup%20Timer-#{version}-arm64-mac.zip"
  name "Standup Timer"
  desc "Standup meeting timer overlay for team meetings"
  homepage "https://github.com/anshprat/standup-timer"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "Standup Timer.app"

  zap trash: [
    "~/Library/Application Support/standup-timer",
    "~/Library/Preferences/com.standup-timer.app.plist",
  ]
end
