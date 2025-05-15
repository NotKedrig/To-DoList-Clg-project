(function () {
  var app = angular.module("toDoList");

  var items = [];
  var nextId = 0;
  var itemChangeCallbacks = [];

  app.service("itemsApi", [
    "$http",
    function ($http) {
      this.items = items;

      this.getAuthHeader = function () {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
      };

      this.onItemsChanged = function (callback) {
        itemChangeCallbacks.push(callback);
      };

      function notifyItemsChanged() {
        itemChangeCallbacks.forEach(function (callback) {
          callback();
        });
      }

      this.loadItems = function () {
        return $http({
          method: "GET",
          url: "/api/v1/notes",
          headers: this.getAuthHeader(),
        })
          .then(function (response) {
            items.length = 0; 
            response.data.data.notes.forEach(function (element) {
              items.push({
                itemId: element._id,
                itemDescription: element.description,
                done: element.done,
                deadline: element.deadline ? new Date(element.deadline) : null,
              });
            });
            notifyItemsChanged();
            return response;
          })
          .catch(function (error) {
            console.error("Error loading items:", error);
            if (error.status === 401) {
              window.location.href = "/login.html";
            }
            throw error;
          });
      };

      this.addItem = function (itemDescription, deadline) {
        return $http({
          method: "POST",
          url: "/api/v1/notes",
          headers: this.getAuthHeader(),
          data: {
            description: itemDescription,
            done: false,
            deadline: deadline,
          },
        })
          .then(function (response) {
            items.push({
              itemId: response.data.data.note._id,
              itemDescription: response.data.data.note.description,
              done: response.data.data.note.done,
              deadline: response.data.data.note.deadline
                ? new Date(response.data.data.note.deadline)
                : null,
            });
            notifyItemsChanged();
            return response;
          })
          .catch(function (error) {
            console.error("Error adding item:", error);
            if (error.status === 401) {
              window.location.href = "/login.html";
            }
            throw error;
          });
      };

      this.deleteItem = function (item) {
        return $http({
          method: "DELETE",
          url: `/api/v1/notes/${item.itemId}`,
          headers: this.getAuthHeader(),
        })
          .then(function (response) {
            var index = items.findIndex(function (element) {
              return element.itemId === item.itemId;
            });
            if (index !== -1) {
              items.splice(index, 1);
            }
            notifyItemsChanged();
            return response;
          })
          .catch(function (error) {
            console.error("Error deleting item:", error);
            if (error.status === 401) {
              window.location.href = "/login.html";
            }
            throw error;
          });
      };

      this.updateItem = function (item) {
        return $http({
          method: "PATCH",
          url: `/api/v1/notes/${item.itemId}`,
          headers: this.getAuthHeader(),
          data: {
            description: item.itemDescription,
            done: item.done,
            deadline: item.deadline,
          },
        })
          .then(function (response) {
            notifyItemsChanged();
            return response;
          })
          .catch(function (error) {
            console.error("Error updating item:", error);
            if (error.status === 401) {
              window.location.href = "/login.html";
            }
            throw error;
          });
      };
      this.loadItems();
    },
  ]);
})();
