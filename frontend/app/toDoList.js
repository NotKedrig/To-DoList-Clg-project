(function () {
  var app = angular.module("toDoList", ["ngRoute"]);
  app.run([
    "$rootScope",
    "$location",
    function ($rootScope, $location) {
      $rootScope.$location = $location;
    },
  ]);
  app.config([
    "$routeProvider",
    "$locationProvider",
    function ($routeProvider, $locationProvider) {
      $locationProvider.hashPrefix("");

      $routeProvider
        .when("/", {
          templateUrl: "views/home.html",
          controller: "HomeController",
          controllerAs: "homeCtrl",
        })
        .when("/all", {
          templateUrl: "views/all-tasks.html",
          controller: "AllTasksController",
          controllerAs: "allTasksCtrl",
        })
        .when("/pending", {
          templateUrl: "views/pending-tasks.html",
          controller: "PendingTasksController",
          controllerAs: "pendingCtrl",
        })
        .when("/overdue", {
          templateUrl: "views/overdue-tasks.html",
          controller: "OverdueTasksController",
          controllerAs: "overdueCtrl",
        })
        .when("/completed", {
          templateUrl: "views/completed-tasks.html",
          controller: "CompletedTasksController",
          controllerAs: "completedCtrl",
        })
        .otherwise({
          redirectTo: "/",
        });
    },
  ]);
  app.controller("HomeController", [
    "itemsApi",
    "notificationService",
    "$interval",
    function (itemsApi, notificationService, $interval) {
      var homeCtrl = this;
      homeCtrl.items = itemsApi.items;
      homeCtrl.itemDescription = "";
      homeCtrl.deadline = null;
      homeCtrl.searchText = "";
      homeCtrl.priority = "";

      homeCtrl.isOverdue = function (item) {
        return (
          item.deadline && new Date(item.deadline) < new Date() && !item.done
        );
      };

      homeCtrl.addItem = function (description) {
        if (description) {
          itemsApi.addItem(description, homeCtrl.deadline, homeCtrl.priority);
          homeCtrl.itemDescription = "";
          homeCtrl.deadline = null;
          homeCtrl.priority = "";
        }
      };

      homeCtrl.deleteItem = function (item) {
        itemsApi.deleteItem(item);
      };

      homeCtrl.updateItem = function (item) {
        itemsApi.updateItem(item);
      };

      var checkInterval = $interval(function () {
        notificationService.checkOverdueTasks(homeCtrl.items);
      }, 60000);

      notificationService.checkOverdueTasks(homeCtrl.items);

      homeCtrl.$onDestroy = function () {
        if (checkInterval) {
          $interval.cancel(checkInterval);
        }
      };

      itemsApi.loadItems();
    },
  ]);

  app.controller("AllTasksController", [
    "itemsApi",
    function (itemsApi) {
      var allTasksCtrl = this;
      allTasksCtrl.items = itemsApi.items;

      allTasksCtrl.isOverdue = function (item) {
        return (
          item.deadline && new Date(item.deadline) < new Date() && !item.done
        );
      };

      allTasksCtrl.updateItem = function (item) {
        itemsApi.updateItem(item);
      };

      allTasksCtrl.deleteItem = function (item) {
        itemsApi.deleteItem(item);
      };

      itemsApi.loadItems();
    },
  ]);
  app.controller("PendingTasksController", [
    "itemsApi",
    function (itemsApi) {
      var pendingCtrl = this;
      pendingCtrl.items = [];

      function updatePendingItems() {
        pendingCtrl.items = itemsApi.items.filter(function (item) {
          return (
            !item.done &&
            (!item.deadline || new Date(item.deadline) > new Date())
          );
        });
      }

      pendingCtrl.updateItem = function (item) {
        itemsApi.updateItem(item).then(updatePendingItems);
      };

      pendingCtrl.deleteItem = function (item) {
        itemsApi.deleteItem(item).then(updatePendingItems);
      };

      itemsApi.loadItems().then(updatePendingItems);
      itemsApi.onItemsChanged(updatePendingItems);
    },
  ]);

  app.controller("OverdueTasksController", [
    "itemsApi",
    function (itemsApi) {
      var overdueCtrl = this;
      overdueCtrl.items = [];

      function updateOverdueItems() {
        overdueCtrl.items = itemsApi.items.filter(function (item) {
          return (
            item.deadline && new Date(item.deadline) < new Date() && !item.done
          );
        });
      }

      overdueCtrl.getOverdueMessage = function (item) {
        if (!item.deadline) return "";

        const now = new Date();
        const deadline = new Date(item.deadline);
        const diffTime = Math.abs(now - deadline);
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffMinutes < 60) {
          return (
            diffMinutes + (diffMinutes === 1 ? " minute ago" : " minutes ago")
          );
        } else if (diffHours < 24) {
          return diffHours + (diffHours === 1 ? " hour ago" : " hours ago");
        } else if (diffDays === 1) {
          return "1 day ago";
        } else if (diffDays < 7) {
          return diffDays + " days ago";
        } else if (diffDays < 30) {
          const weeks = Math.floor(diffDays / 7);
          return weeks + (weeks === 1 ? " week ago" : " weeks ago");
        } else {
          const months = Math.floor(diffDays / 30);
          return months + (months === 1 ? " month ago" : " months ago");
        }
      };

      overdueCtrl.updateItem = function (item) {
        itemsApi.updateItem(item).then(updateOverdueItems);
      };

      overdueCtrl.deleteItem = function (item) {
        itemsApi.deleteItem(item).then(updateOverdueItems);
      };

      itemsApi.loadItems().then(updateOverdueItems);
      itemsApi.onItemsChanged(updateOverdueItems);
    },
  ]);

  app.controller("CompletedTasksController", [
    "itemsApi",
    function (itemsApi) {
      var completedCtrl = this;
      completedCtrl.items = [];

      function updateCompletedItems() {
        completedCtrl.items = itemsApi.items.filter(function (item) {
          return item.done;
        });
      }

      completedCtrl.updateItem = function (item) {
        itemsApi.updateItem(item).then(updateCompletedItems);
      };

      completedCtrl.deleteItem = function (item) {
        itemsApi.deleteItem(item).then(updateCompletedItems);
      };

      itemsApi.loadItems().then(updateCompletedItems);
      itemsApi.onItemsChanged(updateCompletedItems);
    },
  ]);
  app.controller("NotificationController", [
    "notificationService",
    "soundService",
    function (notificationService, soundService) {
      var notificationCtrl = this;
      notificationCtrl.volume = 0.5;

      notificationCtrl.getNotifications = function () {
        return notificationService.getNotifications();
      };

      notificationCtrl.updateVolume = function () {
        soundService.setVolume(notificationCtrl.volume);
      };
    },
  ]);
})();
