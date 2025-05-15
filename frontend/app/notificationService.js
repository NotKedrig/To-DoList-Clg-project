(function () {
  var app = angular.module("toDoList");

  app.service("notificationService", [
    "$http",
    "$interval",
    "soundService",
    function ($http, $interval, soundService) {
      var service = this;
      var notifications = [];
      var checkInterval = 30000; // Check every 30 seconds
      var previousNotificationCount = 0;

      this.getNotifications = function () {
        return notifications;
      };

      this.checkForNotifications = function () {
        $http({
          method: "GET",
          url: "/api/v1/notes/notifications",
          headers: this.getAuthHeader(),
        })
          .then(function (response) {
            if (response.data.data && response.data.data.notifications) {
              var newNotifications = response.data.data.notifications;

              // Check if there are new notifications
              if (newNotifications.length > previousNotificationCount) {
                soundService.playNotificationSound();
              }

              notifications = newNotifications;
              previousNotificationCount = newNotifications.length;
            }
          })
          .catch(function (error) {
            console.error("Error checking notifications:", error);
          });
      };

      this.getAuthHeader = function () {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
      };

      // Start checking for notifications
      $interval(function () {
        service.checkForNotifications();
      }, checkInterval);

      // Initial check
      this.checkForNotifications();

      // Request notification permission when service starts
      if ("Notification" in window) {
        Notification.requestPermission();
      }

      // Show browser notification
      service.showNotification = function (task) {
        if ("Notification" in window && Notification.permission === "granted") {
          var notification = new Notification("Task Overdue!", {
            body:
              task.itemDescription +
              "\nDue: " +
              new Date(task.deadline).toLocaleString(),
            icon: "https://cdn-icons-png.flaticon.com/512/1584/1584942.png",
            tag: "overdue-" + task.itemId, // Prevent duplicate notifications
          });

          // Close notification after 5 seconds
          setTimeout(function () {
            notification.close();
          }, 5000);
        }
      };

      // Check for overdue tasks
      service.checkOverdueTasks = function (tasks) {
        var now = new Date();
        tasks.forEach(function (task) {
          if (task.deadline && !task.done) {
            var deadline = new Date(task.deadline);
            if (deadline < now) {
              service.showNotification(task);
            }
          }
        });
      };
    },
  ]);
})();
