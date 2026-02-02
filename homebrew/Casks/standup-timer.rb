cask "standup-timer" do
  version "2.0.0"
  sha256 "ef11d19705b448344a5bced45ae9d2e5b78556022ae6c4f7548a951a1b4b62b6"

  url "https://github.com/anshprat/standup-timer/releases/download/v#{version}/Standup.Timer-#{version}-arm64-mac.zip"
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
