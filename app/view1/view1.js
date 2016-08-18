'use strict';

var view1 = angular.module('myApp.view1', ['ngRoute','ngMaterial','ngMessages'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}]);

var view1Ctrl = view1.controller(
  'View1Ctrl', ['$scope', '$timeout', '$mdSidenav', '$mdDialog', '$log', '$http', 'columnDataService',
  function ($scope, $timeout, $mdSidenav, $mdDialog, $log, $http, dataSvc) {

  $http.get('data/small2.json').then(parseData); // GET request
  $scope.toggleLeft = buildDelayedToggler('left');
  $scope.toggleRight = buildToggler('right');
  $scope.outputData = {}; // JSON Object to be sent with the POST request

  $scope.isOpenRight = function(){
    return $mdSidenav('right').isOpen();
  }

  $scope.switchView = function(columnName) {
    $scope.whichActive = columnName;
  }

  $scope.submit = function() {
    // get the user preferences from the data service and send through a POST request
    console.log(dataSvc.getPreferencesData());
    var preferences = dataSvc.getPreferencesData();
    $scope.outputData.columns = Object.keys(preferences).map(function(key) {
      return preferences[key];
    });
    sendPOSTRequest();
  }

  function sendPOSTRequest() {
    validateData($scope.outputData);
    var jsonSerializedData = JSON.stringify($scope.outputData);
    var url = 'http://test.com';
    $http.post(url, jsonSerializedData).then(function(response) {
      showAlert('The configurations have been successfully submitted.');
    }, function(error) {
      console.log(error);
      showAlert('Something went wrong... ' + error.statusText);
    });
  }

  function parseData(res) {
    dataSvc.setColumnData(res.data);
    $scope.columns = dataSvc.getColumnData().columns;
    $scope.whichActive = $scope.columns[0].name;
    $scope.outputData.numberOfColumns = dataSvc.getColumnData().numberOfColumns;
    $scope.outputData.dataSize = dataSvc.getColumnData().dataSize;
    $scope.outputData.columns = [];
  }

  function validateData(data) {
    
  }

  function showAlert(message) {
    // Appending dialog to document.body to cover sidenav in docs app
    // Modal dialogs should fully cover application
    // to prevent interaction outside of dialog
    $mdDialog.show(
      $mdDialog.alert()
        .parent(angular.element(document.querySelector('#popupContainer')))
        .clickOutsideToClose(true)
        // .title('Successfully submitted')
        .textContent(message)
        .ariaLabel('Alert Submit')
        .ok('Got it!')
        // .targetEvent(ev)
    );
  };
  /**
   * Supplies a function that will continue to operate until the
   * time is up.
   */
  function debounce(func, wait, context) {
    var timer;
    return function debounced() {
      var context = $scope,
          args = Array.prototype.slice.call(arguments);
      $timeout.cancel(timer);
      timer = $timeout(function() {
        timer = undefined;
        func.apply(context, args);
      }, wait || 10);
    };
  }
  /**
   * Build handler to open/close a SideNav; when animation finishes
   * report completion in console
   */
  function buildDelayedToggler(navID) {
    return debounce(function() {
      // Component lookup should always be available since we are not using `ng-if`
      $mdSidenav(navID)
        .toggle()
        .then(function () {
          $log.debug("toggle " + navID + " is done");
        });
    }, 200);
  }
  function buildToggler(navID) {
    return function() {
      // Component lookup should always be available since we are not using `ng-if`
      $mdSidenav(navID)
        .toggle()
        .then(function () {
          $log.debug("toggle " + navID + " is done");
        });
    }
  }
}]);

var leftCtrl = view1.controller('LeftCtrl', function ($scope, $timeout, $mdSidenav, $log) {
  $scope.close = function () {
    // Component lookup should always be available since we are not using `ng-if`
    $mdSidenav('left').close()
      .then(function () {
        $log.debug("close LEFT is done");
      });
  };
});

var rightCtrl = view1.controller('RightCtrl', function ($scope, $timeout, $mdSidenav, $log) {
  $scope.close = function () {
    // Component lookup should always be available since we are not using `ng-if`
    $mdSidenav('right').close()
      .then(function () {
        $log.debug("close RIGHT is done");
      });
  };
});