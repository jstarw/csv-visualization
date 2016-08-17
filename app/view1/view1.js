'use strict';

var view1 = angular.module('myApp.view1', ['ngRoute','ngMaterial','ngMessages'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}]);

var view1Ctrl = view1.controller(
  'View1Ctrl', ['$scope', '$timeout', '$mdSidenav', '$log', '$http', 'columnDataService',
  function ($scope, $timeout, $mdSidenav, $log, $http, data) {

  $http.get('data/small2.json').then(parseData)
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
    // send signal to child scopes, ordering them to aggregate all the 
    // column data and send it back up to the parent scope
    $scope.$broadcast('retrieve_category_data'); 
  }
  $scope.$on('column_change', updateOutputData);

  function updateOutputData(event, obj) {
    // find and replace current element in array with new element
    // var index = -1;
    // $scope.outputData.columns.forEach(function(d, i) {
    //   if (obj.name==d.name) index = i;
    // });
    // if (index != -1) {
    //   $scope.outputData.columns.splice(index, 1); 
    // }
    $scope.outputData.columns.push(obj);

    // once all columns have been updated, validate and sent POST request
    if ($scope.outputData.columns.length == $scope.columns.length) {
      sendPOSTRequest();
      $scope.outputData = {}; // reset data
    }
  }

  function sendPOSTRequest() {
    validateData($scope.outputData);
    var jsonSerializedData = JSON.stringify($scope.outputData);
    $http.post(url, jsonSerializedData);
  }

  function parseData(res) {
    // var data = res.data;
    data.setColumnData(res.data);
    $scope.columns = data.getColumnData().columns;
    $scope.whichActive = $scope.columns[0].name;
    // update outputData
    $scope.outputData.numberOfColumns = data.getColumnData().numberOfColumns;
    $scope.outputData.dataSize = data.getColumnData().dataSize;
    $scope.outputData.columns = [];
  }

  function validateData(data) {
    
  }
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