(function () {
  var app = angular.module("toDoList");

  app.service("soundService", [
    function () {
      var service = this;
      var audio = new Audio("/assets/mixkit-correct-answer-tone-2870.mp3");
      var isPlaying = false;
      var isLoaded = false;
      audio.volume = 0.5;

      audio.addEventListener("canplaythrough", function () {
        isLoaded = true;
        console.log("Notification sound loaded successfully");
      });

      audio.addEventListener("error", function (e) {
        console.error("Error loading notification sound:", e);
        isLoaded = false;
      });

      this.playNotificationSound = function () {
        if (!isLoaded) {
          console.warn("Notification sound not loaded yet");
          return;
        }

        if (!isPlaying) {
          isPlaying = true;
          audio.currentTime = 0; 
          audio
            .play()
            .then(() => {
              isPlaying = false;
            })
            .catch((error) => {
              console.error("Error playing sound:", error);
              isPlaying = false;
            });
        }
      };

      this.setVolume = function (volume) {
        if (volume >= 0 && volume <= 1) {
          audio.volume = volume;
        }
      };
      audio.load();
    },
  ]);
})();
